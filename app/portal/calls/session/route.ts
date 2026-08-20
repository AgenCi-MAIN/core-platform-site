import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { appendAuditRow } from "../../../../db/audit";
import { voicePresence } from "../../../../db/schema";
import {
  authorizeCallApi,
  getActiveVoiceAssignment,
  jsonNoStore,
  PRESENCE_TTL_MS,
  SUBSCRIBER_TOKEN_TTL_SECONDS,
  subscriberReferenceFor,
  validBrowserSessionId,
  validDpopFingerprint,
  voiceRuntimeConfig,
} from "../voice-server";

export const dynamic = "force-dynamic";
const PATH = "/portal/calls/session";

type TokenResponse = { token?: unknown; subscriber_id?: unknown };

export async function POST(request: Request): Promise<Response> {
  const access = await authorizeCallApi(request, PATH, { requireSameOrigin: true });
  if (!access.ok) return access.response;
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return jsonNoStore({ error: "Expected a JSON body." }, 415);
  }

  let payload: {
    browserSessionId?: unknown;
    fingerprint?: unknown;
    purpose?: unknown;
  };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return jsonNoStore({ error: "Expected a valid JSON body." }, 400);
  }
  if (!validBrowserSessionId(payload.browserSessionId)) {
    return jsonNoStore({ error: "Invalid browser session." }, 400);
  }
  if (!validDpopFingerprint(payload.fingerprint)) {
    // No unbound fallback. A browser without Web Crypto is not eligible for
    // this release because the residual outbound-capable SAT risk is accepted
    // only with device binding and short expiry together.
    return jsonNoStore({ error: "This browser cannot create a device-bound phone session." }, 400);
  }
  const purpose = payload.purpose === "register" || payload.purpose === "refresh"
    ? payload.purpose
    : null;
  if (!purpose) return jsonNoStore({ error: "Invalid phone-session purpose." }, 400);

  let assignment;
  try {
    assignment = await getActiveVoiceAssignment(access.session.memberId);
  } catch {
    return jsonNoStore({ error: "Phone assignments are not available." }, 503);
  }
  if (!assignment) return jsonNoStore({ error: "No active phone assignment." }, 403);

  const expectedReference = subscriberReferenceFor(access.session.memberId);
  if (
    assignment.subscriberReference !== expectedReference ||
    !validSubscriberAudioAddress(assignment.subscriberAddress)
  ) {
    await appendAuditRow({
      action: "calls.session.issue",
      decision: "deny",
      reason: "assignment_reference_mismatch",
      actorEmail: access.session.email,
      actorSubjectId: access.session.subjectId,
      actorRole: access.session.role,
      requestPath: PATH,
      resource: `member:${access.session.memberId}`,
    });
    return jsonNoStore({ error: "The phone assignment needs administrator repair." }, 503);
  }

  const config = voiceRuntimeConfig();
  if (!config) return jsonNoStore({ error: "Browser calling is not configured." }, 503);

  const now = new Date();
  const expires = new Date(now.getTime() + PRESENCE_TTL_MS).toISOString();
  const db = getDb();
  try {
    const current = await db
      .select({
        browserSessionId: voicePresence.browserSessionId,
        readyState: voicePresence.readyState,
        expiresAt: voicePresence.expiresAt,
      })
      .from(voicePresence)
      .where(eq(voicePresence.memberId, access.session.memberId))
      .limit(1);
    const active = current[0]
      && current[0].readyState !== "offline"
      && new Date(current[0].expiresAt).getTime() > now.getTime();
    const sameActiveSession = active
      && current[0].browserSessionId === payload.browserSessionId;
    if (purpose === "refresh" && !sameActiveSession) {
      return jsonNoStore(
        { error: "The available phone session expired or went offline." },
        409,
      );
    }
    const occupied = active
      && current[0].browserSessionId !== payload.browserSessionId;
    if (occupied) {
      return jsonNoStore(
        { error: "Calls are already registered in another primary CORE tab." },
        409,
      );
    }

    const readyState = purpose === "refresh" ? current[0].readyState : "offline";
    await db
      .insert(voicePresence)
      .values({
        memberId: access.session.memberId,
        browserSessionId: payload.browserSessionId,
        readyState,
        lastHeartbeatAt: now.toISOString(),
        expiresAt: expires,
        updatedAt: now.toISOString(),
      })
      .onConflictDoUpdate({
        target: voicePresence.memberId,
        set: {
          browserSessionId: payload.browserSessionId,
          readyState,
          lastHeartbeatAt: now.toISOString(),
          expiresAt: expires,
          updatedAt: now.toISOString(),
        },
      });
  } catch {
    return jsonNoStore({ error: "The primary phone session could not be reserved." }, 503);
  }

  const tokenExpiresAtSeconds = Math.floor(Date.now() / 1000) + SUBSCRIBER_TOKEN_TTL_SECONDS;
  let provider: Response;
  try {
    provider = await fetch(`https://${config.space}/api/fabric/subscribers/tokens`, {
      method: "POST",
      headers: {
        authorization: `Basic ${btoa(`${config.projectId}:${config.apiToken}`)}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        reference: expectedReference,
        expire_at: tokenExpiresAtSeconds,
        fingerprint: payload.fingerprint,
      }),
    });
  } catch {
    return jsonNoStore({ error: "SignalWire could not be reached." }, 502);
  }

  let providerBody: TokenResponse = {};
  try {
    providerBody = (await provider.json()) as TokenResponse;
  } catch {
    // Never include or log an unreadable provider response: it can contain a SAT.
  }
  if (
    !provider.ok
    || typeof providerBody.token !== "string"
    || !providerBody.token
    || providerBody.subscriber_id !== assignment.providerSubscriberId
  ) {
    return jsonNoStore({ error: "SignalWire rejected the browser phone session." }, 502);
  }

  const audited = await appendAuditRow({
    action: "calls.session.issue",
    decision: "allow",
    reason: purpose === "refresh"
      ? "active_primary_phone_session_refreshed"
      : "active_member_assignment_and_device_verified",
    actorEmail: access.session.email,
    actorSubjectId: access.session.subjectId,
    actorRole: access.session.role,
    requestPath: PATH,
    resource: `member:${access.session.memberId}`,
    detail: JSON.stringify({
      expires_in_seconds: SUBSCRIBER_TOKEN_TTL_SECONDS,
      device_bound: true,
      purpose,
    }),
  });
  if (!audited) return jsonNoStore({ error: "The phone session could not be audited safely." }, 503);

  return jsonNoStore({
    token: providerBody.token,
    expiresAt: tokenExpiresAtSeconds * 1000,
  });
}

export function GET(): Response {
  return new Response(null, {
    status: 405,
    headers: { allow: "POST", "cache-control": "no-store" },
  });
}

function validSubscriberAudioAddress(value: string): boolean {
  if (value.length > 500) return false;
  try {
    const parsed = new URL(value, "https://fabric.invalid");
    return parsed.origin === "https://fabric.invalid"
      && parsed.pathname.startsWith("/")
      && parsed.pathname.split("/").filter(Boolean).length >= 2
      && parsed.searchParams.get("channel") === "audio";
  } catch {
    return false;
  }
}
