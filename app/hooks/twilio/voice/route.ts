import { env } from "cloudflare:workers";
import { getDb } from "../../../../db";
import { dialerTransfers } from "../../../../db/schema";
import { recordAudit } from "../../../portal/access";
import { verifyTwilioSignature } from "../signature";
import {
  buildCourtesyTwiml,
  buildDialTwiml,
  maskNumber,
  parseDialTargets,
} from "../twiml";

/**
 * Twilio inbound voice webhook — Phase 1 of the Switchboard transfer system.
 *
 * A caller dials the IMO number; Twilio POSTs here; this route answers with
 * TwiML that greets the caller and rings the roster. First person to answer
 * takes the call. Every call is logged and audited. **No recording** — see
 * `../twiml.ts` (recording is OFF until counsel clears the wording, A29/E7b).
 *
 * Why this lives OUTSIDE `/portal`: a Twilio webhook arrives with no session
 * cookie. It authenticates by HMAC signature (`../signature.ts`), not by the
 * portal's identity/membership model, so it must not sit behind the portal
 * guards. It reads and writes only the `dialer_transfers` index and the audit
 * trail; it touches no member identity data, so a breach of this seam exposes
 * none.
 *
 * TWO THINGS OUTSIDE THIS FILE make it live, and neither is code:
 *  1. The three settings below must be set on the Worker (secret + two vars):
 *       TWILIO_AUTH_TOKEN         (secret) — signs/verifies the webhook
 *       TWILIO_WEBHOOK_VOICE_URL  (var)    — the EXACT public URL Twilio calls,
 *                                            e.g. https://<host>/hooks/twilio/voice
 *       TWILIO_DIAL_TARGETS       (var)    — comma/space-separated E.164 roster,
 *                                            e.g. "+1XXXXXXXXXX,+1YYYYYYYYYY".
 *                                            Kept out of the repo on purpose:
 *                                            personal numbers are not committed.
 *  2. If Cloudflare Access fronts the domain, this path needs an Access
 *     **Bypass** policy (path-scoped, `/hooks/twilio/*`). Service Auth is not
 *     viable — Twilio cannot attach the CF-Access headers it requires. The
 *     route defends itself with the signature check regardless.
 *
 * Until the roster is set, the route fail-safes to a courtesy greeting and a
 * clean hang-up — it answers, never silently drops, never records.
 */

export const dynamic = "force-dynamic";

const PATH = "/hooks/twilio/voice";
const AUDIT_ACTION = "twilio.voice.inbound";

function twiml(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/xml; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

/** Refuse with an empty body — never echo anything the caller sent. */
function refuse(status: number): Response {
  return new Response("", { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request): Promise<Response> {
  const runtime = env as unknown as {
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_WEBHOOK_VOICE_URL?: string;
    TWILIO_DIAL_TARGETS?: string;
  };
  const authToken = runtime.TWILIO_AUTH_TOKEN;
  const webhookUrl = runtime.TWILIO_WEBHOOK_VOICE_URL;

  // Fail closed when unconfigured. An unconfigured webhook must NEVER accept an
  // unauthenticated request — without the token or the signed URL there is no
  // way to verify anyone, so there is no answering.
  if (!authToken || !webhookUrl) {
    await recordAudit({
      action: AUDIT_ACTION,
      decision: "deny",
      reason: "not_configured",
      resource: "dialer_transfers",
      requestPath: PATH,
    });
    return refuse(503);
  }

  // Twilio posts application/x-www-form-urlencoded. Parse to a plain param map
  // for signature verification and field access.
  let params: Record<string, string>;
  try {
    const form = await request.formData();
    params = {};
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") params[key] = value;
    }
  } catch {
    await recordAudit({
      action: AUDIT_ACTION,
      decision: "deny",
      reason: "bad_request",
      resource: "dialer_transfers",
      requestPath: PATH,
    });
    return refuse(400);
  }

  const ok = await verifyTwilioSignature({
    authToken,
    url: webhookUrl,
    params,
    signature: request.headers.get("X-Twilio-Signature"),
  });
  if (!ok) {
    // Same refusal for a missing and a wrong signature; echo nothing.
    await recordAudit({
      action: AUDIT_ACTION,
      decision: "deny",
      reason: "signature_invalid",
      resource: "dialer_transfers",
      requestPath: PATH,
    });
    return refuse(403);
  }

  const callSid = params.CallSid ?? "";
  const from = params.From ?? "";

  // Log the call. A logging failure must never stop us answering
  // (receiving-first), but the gap is surfaced on the server console. The
  // insert is idempotent on CallSid so a Twilio retry does not duplicate the
  // row. consent_status stays `pending` because recording is OFF (A29).
  let logNote = "logged";
  try {
    if (callSid) {
      await getDb()
        .insert(dialerTransfers)
        .values({
          transferId: `twilio:${callSid}`,
          sourceSystem: "twilio",
          externalCallId: callSid,
          direction: "inbound",
          status: "received",
          consentStatus: "pending",
          callerNumberMasked: maskNumber(from),
        })
        .onConflictDoNothing();
    } else {
      logNote = "no_call_sid";
    }
  } catch (error) {
    console.error("[twilio] transfer log failed", error);
    logNote = "log_failed";
  }

  const targets = parseDialTargets(runtime.TWILIO_DIAL_TARGETS);

  await recordAudit({
    action: AUDIT_ACTION,
    decision: "allow",
    reason: targets.length ? "call_received" : "call_received_no_targets",
    resource: "dialer_transfers",
    requestPath: PATH,
    // No caller PII in the detail — the masked number lives only in its own
    // column. CallSid is an opaque Twilio identifier, not personal data.
    detail: JSON.stringify({
      callSid: callSid || null,
      targets: targets.length,
      recording: "off",
      log: logNote,
    }),
  });

  return twiml(targets.length ? buildDialTwiml(targets) : buildCourtesyTwiml());
}

// A GET to a voice webhook is a probe or a misconfiguration, never a real call.
export function GET(): Response {
  return refuse(405);
}
