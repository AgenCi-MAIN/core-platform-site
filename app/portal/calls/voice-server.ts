import { and, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../db";
import { voiceNumberAssignments } from "../../../db/schema";
import {
  can,
  recordAudit,
  resolvePortalAccess,
  type PortalSession,
} from "../access";
import { normalizeE164, normalizeSignalWireSpace } from "../dialer/outbound";

export const PRESENCE_TTL_MS = 45_000;
export const PRESENCE_HEARTBEAT_MS = 15_000;
export const SUBSCRIBER_TOKEN_TTL_SECONDS = 15 * 60;

export type ActiveVoiceAssignment = {
  id: number;
  memberId: number;
  lineType: "personal" | "shared";
  e164Number: string;
  providerNumberId: string;
  providerSubscriberId: string;
  subscriberReference: string;
  subscriberAddress: string;
};

export type VoiceRuntimeConfig = {
  space: string;
  projectId: string;
  apiToken: string;
  privateMobile: string;
  mainNumber: string;
  teamHuntAddress: string;
};

export function jsonNoStore(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store, private, max-age=0",
      pragma: "no-cache",
      "x-content-type-options": "nosniff",
    },
  });
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function authorizeCallApi(
  request: Request,
  path: string,
  options: { requireSameOrigin?: boolean; requireAssignment?: boolean } = {},
): Promise<{ ok: true; session: PortalSession } | { ok: false; response: Response }> {
  const access = await resolvePortalAccess(path);
  if (!access.ok) {
    return {
      ok: false,
      response: jsonNoStore(
        { error: access.denial.kind === "anonymous" ? "Sign in required." : "Portal access required." },
        access.denial.kind === "anonymous" ? 401 : 403,
      ),
    };
  }

  const { session } = access;
  if (!can(session, "calls.answer")) {
    await recordAudit({
      action: "calls.answer",
      decision: "deny",
      reason: "capability_not_held",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: path,
    });
    return { ok: false, response: jsonNoStore({ error: "Call access required." }, 403) };
  }

  if (options.requireSameOrigin && !isSameOrigin(request)) {
    await recordAudit({
      action: "calls.answer",
      decision: "deny",
      reason: "origin_mismatch",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: path,
    });
    return { ok: false, response: jsonNoStore({ error: "Request origin rejected." }, 403) };
  }

  if (options.requireAssignment) {
    let assignment;
    try {
      assignment = await getActiveVoiceAssignment(session.memberId);
    } catch {
      return {
        ok: false,
        response: jsonNoStore({ error: "Phone assignments are not available." }, 503),
      };
    }
    if (!assignment) {
      await recordAudit({
        action: "calls.answer",
        decision: "deny",
        reason: "active_phone_assignment_required",
        actorEmail: session.email,
        actorSubjectId: session.subjectId,
        actorRole: session.role,
        requestPath: path,
      });
      return {
        ok: false,
        response: jsonNoStore({ error: "An active phone assignment is required." }, 403),
      };
    }
  }

  return { ok: true, session };
}

export async function getActiveVoiceAssignment(
  memberId: number,
): Promise<ActiveVoiceAssignment | null> {
  const rows = await getDb()
    .select({
      id: voiceNumberAssignments.id,
      memberId: voiceNumberAssignments.memberId,
      lineType: voiceNumberAssignments.lineType,
      e164Number: voiceNumberAssignments.e164Number,
      providerNumberId: voiceNumberAssignments.providerNumberId,
      providerSubscriberId: voiceNumberAssignments.providerSubscriberId,
      subscriberReference: voiceNumberAssignments.subscriberReference,
      subscriberAddress: voiceNumberAssignments.subscriberAddress,
    })
    .from(voiceNumberAssignments)
    .where(
      and(
        eq(voiceNumberAssignments.memberId, memberId),
        eq(voiceNumberAssignments.status, "active"),
        eq(voiceNumberAssignments.lineType, "personal"),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export function maskPhone(value: string | null | undefined): string {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (digits.length < 4) return "Caller withheld";
  return `***-***-${digits.slice(-4)}`;
}

export function validBrowserSessionId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);
}

export function validDpopFingerprint(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function subscriberReferenceFor(memberId: number): string {
  return `core-member-${memberId}`;
}

export function voiceRuntimeConfig(): VoiceRuntimeConfig | null {
  const space = normalizeSignalWireSpace(env.SIGNALWIRE_VOICE_SPACE_URL);
  const projectId = env.SIGNALWIRE_VOICE_PROJECT_ID?.trim() ?? "";
  const apiToken = env.SIGNALWIRE_VOICE_API_TOKEN?.trim() ?? "";
  const privateMobile = normalizeE164(env.SIGNALWIRE_PRIVATE_MOBILE_NUMBER);
  const mainNumber = normalizeE164(env.SIGNALWIRE_MAIN_NUMBER);
  const teamHuntAddress = normalizeFabricAddress(env.SIGNALWIRE_TEAM_HUNT_ADDRESS);

  if (
    !space ||
    !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(projectId) ||
    !apiToken ||
    !privateMobile ||
    !mainNumber ||
    !teamHuntAddress
  ) {
    return null;
  }
  return { space, projectId, apiToken, privateMobile, mainNumber, teamHuntAddress };
}

function normalizeFabricAddress(value: string | undefined): string | null {
  const candidate = value?.trim() ?? "";
  if (!candidate || candidate.length > 180) return null;
  return /^(?:\/public\/[A-Za-z0-9._~-]+|swml:[A-Za-z0-9._~-]+)$/.test(candidate)
    ? candidate
    : null;
}
