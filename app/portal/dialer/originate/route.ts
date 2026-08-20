import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { appendAuditRow } from "../../../../db/audit";
import { getDb } from "../../../../db";
import { isMissingTableError } from "../../../../db/errors";
import { outboundDialRequests, type OutboundDialStatus } from "../../../../db/schema";
import { isFounder, recordAudit, resolvePortalAccess } from "../../access";
import { TELEPHONY_CONFIG } from "../../telephony-config";
import {
  buildSignalWireDialRequest,
  dialRateBucket,
  isPlatformNumber,
  maskE164,
  normalizeE164,
  normalizeSignalWireSpace,
  type DialMode,
} from "../outbound";

export const dynamic = "force-dynamic";

const PATH = "/portal/dialer/originate";
const ACTION = "calls.dial";

type DialerRuntime = {
  SIGNALWIRE_DIALER_SPACE_URL?: string;
  SIGNALWIRE_DIALER_PROJECT_ID?: string;
  SIGNALWIRE_DIALER_TOKEN?: string;
  SIGNALWIRE_DIALER_AGENT_NUMBER?: string;
};

type DialerConfig = {
  space: string;
  projectId: string;
  token: string;
  agentNumber: string;
};

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function readConfig(): DialerConfig | null {
  const runtime = env as unknown as DialerRuntime;
  const space = normalizeSignalWireSpace(runtime.SIGNALWIRE_DIALER_SPACE_URL);
  const projectId = runtime.SIGNALWIRE_DIALER_PROJECT_ID?.trim() ?? "";
  const token = runtime.SIGNALWIRE_DIALER_TOKEN?.trim() ?? "";
  const agentNumber = normalizeE164(runtime.SIGNALWIRE_DIALER_AGENT_NUMBER);

  if (!space || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(projectId) || !token || !agentNumber) {
    return null;
  }

  return { space, projectId, token, agentNumber };
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function modeFrom(value: unknown): DialMode | null {
  return value === "agent_test" || value === "customer" ? value : null;
}

function isRateConflict(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.message} ${String((error as { cause?: unknown }).cause ?? "")}`
      : String(error);
  return /UNIQUE constraint failed.*rate_bucket|outbound_dial_requests_rate_bucket_idx/i.test(
    message,
  );
}

async function updateRequest(
  requestId: string,
  values: {
    status: OutboundDialStatus;
    externalCallId?: string | null;
    failureCode?: string | null;
  },
) {
  try {
    await getDb()
      .update(outboundDialRequests)
      .set({
        status: values.status,
        externalCallId: values.externalCallId ?? null,
        failureCode: values.failureCode ?? null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(outboundDialRequests.requestId, requestId));
  } catch (error) {
    // The pending row was written before SignalWire was called, so losing this
    // update leaves an honest incomplete record rather than losing the call.
    console.error("[dialer] failed to update outbound request", error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const access = await resolvePortalAccess(PATH);
  if (!access.ok) {
    return json(
      { error: access.denial.kind === "anonymous" ? "Sign in required." : "Portal access required." },
      access.denial.kind === "anonymous" ? 401 : 403,
    );
  }

  const { session } = access;
  if (!isFounder(session)) {
    await recordAudit({
      action: ACTION,
      decision: "deny",
      reason: "founder_only",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      resource: "signalwire-outbound",
      requestPath: PATH,
    });
    return json({ error: "Founder authorization required." }, 403);
  }

  if (!sameOrigin(request)) {
    await recordAudit({
      action: ACTION,
      decision: "deny",
      reason: "origin_mismatch",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      resource: "signalwire-outbound",
      requestPath: PATH,
    });
    return json({ error: "Request origin rejected." }, 403);
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ error: "Expected a JSON body." }, 415);
  }

  let payload: { mode?: unknown; destination?: unknown };
  try {
    payload = (await request.json()) as { mode?: unknown; destination?: unknown };
  } catch {
    return json({ error: "Expected a valid JSON body." }, 400);
  }

  const mode = modeFrom(payload.mode);
  if (!mode) return json({ error: "Unknown dial mode." }, 400);

  const destination = mode === "customer" ? normalizeE164(payload.destination) : null;
  if (mode === "customer" && !destination) {
    return json({ error: "Enter a valid E.164 phone number, including country code." }, 400);
  }
  if (
    destination &&
    isPlatformNumber(
      destination,
      TELEPHONY_CONFIG.platformNumbers.map((number) => number.e164),
    )
  ) {
    return json({ error: "A CORE platform number cannot be used as the customer destination." }, 400);
  }

  const config = readConfig();
  if (!config) {
    await recordAudit({
      action: ACTION,
      decision: "deny",
      reason: "dialer_not_configured",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      resource: "signalwire-outbound",
      requestPath: PATH,
    });
    return json({ error: "The server-side dialer credential is not configured." }, 503);
  }

  if (destination === config.agentNumber) {
    return json({ error: "Use the platform-line test for the private agent destination." }, 400);
  }

  // Fail closed before a billable external action if its authorization cannot
  // be written to the append-only trail.
  const authorized = await appendAuditRow({
    action: ACTION,
    decision: "allow",
    reason: "founder_authorized",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: "signalwire-outbound",
    requestPath: PATH,
    detail: JSON.stringify({
      mode,
      destination: destination ? maskE164(destination) : null,
      recording: "off",
    }),
  });
  if (!authorized) return json({ error: "The call could not be recorded safely." }, 503);

  const requestId = crypto.randomUUID();
  try {
    await getDb().insert(outboundDialRequests).values({
      requestId,
      actorEmail: session.email,
      mode,
      destinationMasked: destination ? maskE164(destination) : null,
      rateBucket: dialRateBucket(Date.now()),
      status: "pending",
    });
  } catch (error) {
    if (isRateConflict(error)) {
      return json(
        { error: "Please wait 30 seconds before starting another call." },
        429,
        { "retry-after": "30" },
      );
    }
    if (isMissingTableError(error)) {
      return json({ error: "The outbound-call migration has not been applied." }, 503);
    }
    console.error("[dialer] failed to reserve outbound request", error);
    return json({ error: "The call could not be reserved safely." }, 503);
  }

  const signalWireRequest = buildSignalWireDialRequest({
    agentNumber: config.agentNumber,
    callerId: TELEPHONY_CONFIG.platformLine.e164,
    destination: destination ?? undefined,
    mode,
  });

  let provider: Response;
  try {
    provider = await fetch(`https://${config.space}/api/calling/calls`, {
      method: "POST",
      headers: {
        authorization: `Basic ${btoa(`${config.projectId}:${config.token}`)}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(signalWireRequest),
    });
  } catch {
    await updateRequest(requestId, { status: "failed", failureCode: "provider_unreachable" });
    await recordAudit({
      action: ACTION,
      decision: "deny",
      reason: "provider_unreachable",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      resource: `outbound:${requestId}`,
      requestPath: PATH,
    });
    return json({ error: "SignalWire could not be reached." }, 502);
  }

  let providerBody: unknown = null;
  try {
    providerBody = await provider.json();
  } catch {
    // A status code is sufficient to classify the response. Never echo a raw
    // provider body because it may contain full phone numbers.
  }

  if (!provider.ok) {
    const failureCode = `provider_${provider.status}`;
    await updateRequest(requestId, { status: "failed", failureCode });
    await recordAudit({
      action: ACTION,
      decision: "deny",
      reason: failureCode,
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      resource: `outbound:${requestId}`,
      requestPath: PATH,
    });

    const message =
      provider.status === 401
        ? "SignalWire rejected the dialer credential."
        : provider.status === 403
          ? "The dialer credential lacks Voice access or the caller ID is not authorized."
          : provider.status === 429
            ? "SignalWire is limiting outbound calls. Please wait and try again."
            : "SignalWire rejected the call request.";
    return json({ error: message }, 502);
  }

  const externalCallId =
    typeof providerBody === "object" && providerBody !== null && "id" in providerBody
      ? String((providerBody as { id: unknown }).id).slice(0, 200)
      : null;
  await updateRequest(requestId, { status: "queued", externalCallId });
  await recordAudit({
    action: ACTION,
    decision: "allow",
    reason: "provider_accepted",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: `outbound:${requestId}`,
    requestPath: PATH,
    detail: JSON.stringify({ mode, provider_status: provider.status }),
  });

  return json(
    {
      ok: true,
      requestId,
      status: "queued",
      message:
        mode === "agent_test"
          ? "SignalWire accepted the platform-line test. Answer the private mobile and press 1."
          : "SignalWire accepted the request. Answer the private mobile and press 1 to ring the customer.",
    },
    202,
  );
}

export function GET(): Response {
  return new Response(null, { status: 405, headers: { allow: "POST" } });
}
