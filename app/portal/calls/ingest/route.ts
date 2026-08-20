import { sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { appendAuditRow } from "../../../../db/audit";
import {
  DIALER_TRANSFER_STATUSES,
  dialerTransfers,
  type DialerTransferStatus,
} from "../../../../db/schema";
import { sqliteNow } from "../../../../db/time";
import { writeRow } from "../../read-guard";
import { resolveAgentEmail } from "../../signalwire/agent-map";
import { normalizeSignalwireEvent } from "../../signalwire/event";
import { authenticateSignalwireRequest } from "../../signalwire/ingest-auth";
import { SIGNALWIRE_SOURCE_SYSTEM } from "../transfer-id";
import { handleInboundVoiceLifecyclePayload } from "../inbound-lifecycle";

export const dynamic = "force-dynamic";

/**
 * The one door in this portal that opens to a machine.
 *
 * Cloudflare Access fronts the whole domain and turns anonymous requests away
 * at the edge, so a vendor POST never reaches the app — which is why this path
 * gets an Access bypass scoped to exactly itself. That bypass is the only place
 * in the system where the edge stops protecting a route, so nothing but the
 * code below stands between the open internet and a write into
 * `dialer_transfers`. Every decision here is made on that assumption.
 *
 * Order is load-bearing: authenticate, then normalise, then write. Nothing
 * touches D1 before the credential has been checked, and no branch returns a
 * document to anybody.
 *
 * The route stays thin on purpose. Who is calling is `ingest-auth.ts`, what
 * the payload means is `event.ts`, and whose call it is is `agent-map.ts`.
 * What is left here is the part that is genuinely about the write: keeping it
 * idempotent, keeping the status moving one way, and never reporting a success
 * that did not happen.
 */

const PATH = "/portal/calls/ingest";

/**
 * The single refusal. Every way authentication can fail returns these exact
 * bytes: no credential, a credential that matched neither secret, a missing or
 * forged signature, a body that cannot be verified, and — the one that matters
 * — a deployment whose secrets have not been set.
 *
 * The guard classifies each of those and hands back a status for it. That
 * status is deliberately not used. An honest 503 for the unconfigured case
 * would tell an anonymous prober that this path exists, expects a credential,
 * and is not currently holding one; a 403 rather than a 401 would tell it the
 * credential it guessed was the wrong half. Both are a map. The operator reads
 * which factor failed from the audit row the guard writes, and from the deploy
 * checklist; the internet reads one status with no body behind it.
 */
function refused() {
  return new Response(null, { status: 401 });
}

/**
 * Nothing here answers a browser. A GET is not a mistake to be helped along
 * with a page or an error object — this path exists for one POST, and anyone
 * arriving another way gets a status and no body.
 */
function methodNotAllowed() {
  return new Response(null, { status: 405, headers: { allow: "POST" } });
}

export const GET = methodNotAllowed;
export const HEAD = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const OPTIONS = methodNotAllowed;

/**
 * Lifecycle order, for a column that must only ever move forward.
 *
 * Webhooks arrive out of order and are re-delivered on the vendor's schedule
 * rather than ours, so a retried `received` can land after the call is done.
 * Taking the last writer's word for it would walk a finished call back to the
 * start of the queue, and the row would then be wrong in a way nobody watching
 * the inbox could explain.
 *
 * The split in the middle is the point. `received`, `processing`, and `failed`
 * are the three a payload is allowed to assert, and they rank in the order
 * they happen. `ready` and `needs_review` are set by CORE, after its own work:
 * `ready` means a recording actually landed, `needs_review` means a person has
 * to look. Both sit above everything a payload can say, so no arriving event
 * can walk back a decision CORE made — a late `failed` cannot hide a call that
 * is already reviewable, and nothing at all can quietly pull a call out of
 * somebody's review queue.
 */
const STATUS_RANK: Record<DialerTransferStatus, number> = {
  received: 0,
  processing: 1,
  failed: 2,
  ready: 3,
  needs_review: 4,
};

/**
 * `CASE <column> WHEN 'received' THEN 0 ... END`, so the comparison happens
 * inside the statement that writes.
 *
 * Ranking in JavaScript would mean reading the row first, and two deliveries
 * of the same call can be in flight at once — between that read and the write,
 * the other one lands and its status is lost. The status values and column
 * names interpolated here are the compile-time constants above and in
 * `db/schema.ts`, never anything that arrived in a request; the same rule
 * `literalSet` follows in the schema.
 */
function rank(column: string) {
  const arms = DIALER_TRANSFER_STATUSES.map(
    (status) => `WHEN '${status}' THEN ${STATUS_RANK[status]}`,
  ).join(" ");
  // A stored value this build does not recognise ranks below everything, so it
  // loses to any known status rather than freezing the row forever.
  return `(CASE ${column} ${arms} ELSE -1 END)`;
}

/**
 * `coalesce(excluded.<column>, dialer_transfers.<column>)`.
 *
 * Each event carries only what that event knows — a completion webhook may not
 * restate the queue the call arrived on, and `event.ts` returns null for any
 * field it could not read rather than sinking the whole payload. Assigning
 * straight through would let that null erase what an earlier delivery told us,
 * so a new value wins only when there is one.
 */
function keepKnown(column: string) {
  return sql.raw(`coalesce(excluded.${column}, dialer_transfers.${column})`);
}

/**
 * SignalWire posts Twilio-compatible webhooks as form bodies and its own as
 * JSON. `event.ts` reads both spellings of every field it wants, so all this
 * has to do is hand it an object either way.
 *
 * The content type is read the same way the guard reads it, lowercased and by
 * substring. The two must agree: a request the guard verified as a form post
 * and this parsed as JSON would be refused as malformed after passing
 * authentication, which is the confusing kind of failure — authentic traffic
 * rejected for a reason nothing about the payload explains.
 */
async function readPayload(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(await request.text()));
  }

  return await request.json();
}

/**
 * One audit row per credentialed request, and none at all for the rest.
 *
 * `audit_events` is append-only and is the view the founder reads to see what
 * happened to this portal. This path is reachable without a session, so a row
 * per arrival is a row anyone with a curl loop can append at will, and enough
 * of them push real security events off the end of that view — the log turned
 * into a denial-of-service surface against its own readers. So nothing is
 * written here for a request the guard refused: this row exists to say what
 * happened to a transfer, and a request that never became one has nothing to
 * say.
 *
 * That leaves forged and probing traffic uncounted by this route, which is a
 * deliberate and stated incompleteness rather than an oversight. What the guard
 * records about authentication is the guard's own decision and lives under its
 * own action name; if unauthenticated volume ever needs bounding, that belongs
 * in edge analytics or a rate limit, not in a second row written from here.
 *
 * Returns whether the row actually landed. `appendAuditRow` reports that rather
 * than swallowing it, and an unattended caller is the case it was built for.
 */
function record(
  decision: "allow" | "deny",
  reason: string,
  detail?: Record<string, unknown>,
): Promise<boolean> {
  return appendAuditRow({
    action: "calls.ingest",
    decision,
    reason,
    resource: "dialer-transfer",
    requestPath: PATH,
    detail: detail ? JSON.stringify(detail) : null,
  });
}

export async function POST(request: Request) {
  // The guard reads the raw bytes to rebuild the signed string, and a body can
  // be consumed only once — so it gets the clone and the parse below gets the
  // original, as its own contract asks.
  const auth = await authenticateSignalwireRequest(request.clone());
  if (!auth.ok) {
    /**
     * `not_recorded` is the one denial answered differently, and it is not a
     * leak: it happens only after both factors have verified, so the only
     * caller who can ever provoke it is one already holding both secrets. It
     * means the request was authentic and the log of that fact did not land —
     * a reason to come back, not a reason to be turned away. 401 is not a
     * status any vendor retries, so answering it here would quietly drop a
     * call that nothing was actually wrong with.
     */
    if (auth.denial.kind === "not_recorded") return new Response(null, { status: 503 });
    return refused();
  }

  let payload: unknown;
  try {
    payload = await readPayload(request);
  } catch {
    await record("deny", "payload_unreadable");
    return new Response(null, { status: 400 });
  }

  // The same authenticated carrier door is the source of truth for both the
  // established transfer inbox and the new browser-hunt lifecycle. The
  // lifecycle handler consumes a payload only when its provider call id maps
  // to an existing inbound_voice_calls row; everything else continues through
  // the original transfer normalizer unchanged.
  try {
    if (await handleInboundVoiceLifecyclePayload(payload)) {
      return new Response(null, { status: 204 });
    }
  } catch {
    await record("deny", "inbound_lifecycle_unavailable");
    return new Response(null, { status: 503 });
  }

  const event = normalizeSignalwireEvent(payload);
  if (!event) {
    // 400, not 503. A retry cannot improve a payload we will never accept, and
    // asking for one turns a single malformed event into an endless loop.
    await record("deny", "payload_unusable");
    return new Response(null, { status: 400 });
  }

  /**
   * Never trust identity from the payload. The map turns the line SignalWire
   * connected into an address, and an unmapped line is stored as no agent at
   * all — `agent_email` is a label on this row, and a name we cannot vouch for
   * belongs on it even less than a blank does.
   */
  const agentEmail = resolveAgentEmail(event.connectedNumber);

  const write = await writeRow("dialer_transfers", () =>
    getDb()
      .insert(dialerTransfers)
      .values({
        // Both keys are CORE's, not the payload's: `transfer_id` is derived
        // from the call id in transfer-id.ts, and the source is the constant
        // that module publishes rather than anything the sender claimed to be.
        transferId: event.transferId,
        sourceSystem: SIGNALWIRE_SOURCE_SYSTEM,
        externalCallId: event.externalCallId,
        direction: event.direction,
        status: event.status,
        callerNumberMasked: event.callerNumberMasked,
        agentEmail,
        queueName: event.queueName,
        startedAt: event.startedAt,
        endedAt: event.endedAt,
        durationSeconds: event.durationSeconds,
      })
      .onConflictDoUpdate({
        target: dialerTransfers.transferId,
        /**
         * Everything a later event may restate, and nothing it may invent.
         *
         * `source_system` is the constant above and cannot move. `received_at`
         * is when the call first reached us and must not be pushed forward by a
         * redelivery. `direction` is a property of the call rather than of the
         * event, so the first delivery settles it.
         *
         * `consent_status` is absent from both halves of this statement on
         * purpose. Consent is a claim about what a caller was told, and the
         * recording gate refuses playback until a human verifies it — a sender
         * who could write this column could mark its own call verified and
         * unlock the audio. The recording columns are absent for the same
         * reason: those are written by the pipeline that actually stored the
         * bytes, never from a payload that merely names them.
         */
        set: {
          status: sql.raw(
            `CASE WHEN ${rank("excluded.status")} > ${rank("dialer_transfers.status")}` +
              ` THEN excluded.status ELSE dialer_transfers.status END`,
          ),
          externalCallId: keepKnown("external_call_id"),
          callerNumberMasked: keepKnown("caller_number_masked"),
          agentEmail: keepKnown("agent_email"),
          queueName: keepKnown("queue_name"),
          startedAt: keepKnown("started_at"),
          endedAt: keepKnown("ended_at"),
          durationSeconds: keepKnown("duration_seconds"),
          updatedAt: sqliteNow(),
        },
      }),
  );

  if (!write.ok) {
    /**
     * 503 — never 200, and never 500.
     *
     * A 2xx tells the vendor the event is safely ours and it stops retrying;
     * the call is then gone, with nothing left anywhere to replay it from. The
     * missing-table case makes that concrete: `dialer_transfers` can genuinely
     * be absent on a database that took only one of the two migration paths,
     * and that is a deployment gap fixed in minutes — precisely the situation a
     * retry exists for. 500 would be honest too, but it reads as "we are
     * broken" where 503 reads as "come back", and the retry is the point.
     */
    await record(
      "deny",
      write.fault === "not_provisioned" ? "table_not_provisioned" : "write_unavailable",
      { transferId: event.transferId },
    );
    return new Response(null, { status: 503 });
  }

  const recorded = await record("allow", "transfer_upserted", {
    transferId: event.transferId,
    status: event.status,
  });
  if (!recorded) {
    /**
     * The row landed but the account of it did not, so this delivery is not
     * finished. Asking for the retry costs nothing: the upsert is keyed on
     * `transfer_id`, so a second delivery updates the same row instead of
     * duplicating it, and the audit write gets another attempt. Reporting
     * success would leave a call in the table that the log cannot explain, and
     * that log is the entire basis on which unattended traffic is trusted.
     */
    return new Response(null, { status: 503 });
  }

  return Response.json({ ok: true });
}
