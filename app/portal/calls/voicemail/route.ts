import { eq, or } from "drizzle-orm";
import { getDb } from "../../../../db";
import { appendAuditRow } from "../../../../db/audit";
import { inboundVoiceCalls, voiceCallbackTasks } from "../../../../db/schema";
import { authenticateSignalwireRequest } from "../../signalwire/ingest-auth";
import { getCallRecordingsBucket } from "../storage";
import { voiceRuntimeConfig } from "../voice-server";

export const dynamic = "force-dynamic";
const PATH = "/portal/calls/voicemail";
const MAX_VOICEMAIL_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request): Promise<Response> {
  const auth = await authenticateSignalwireRequest(request.clone(), {
    path: PATH,
    auditAction: "signalwire.voicemail.auth",
  });
  if (!auth.ok) {
    return new Response(null, { status: auth.denial.kind === "not_recorded" ? 503 : 401 });
  }

  let payload: unknown;
  try {
    payload = await readPayload(request);
  } catch {
    return new Response(null, { status: 400 });
  }
  const event = normalizeRecordEvent(payload);
  if (!event) return new Response(null, { status: 400 });

  const db = getDb();
  const rows = await db
    .select({
      id: inboundVoiceCalls.id,
      lineType: inboundVoiceCalls.lineType,
      assignedMemberId: inboundVoiceCalls.assignedMemberId,
    })
    .from(inboundVoiceCalls)
    .where(
      or(
        eq(inboundVoiceCalls.providerCallId, event.callId),
        eq(inboundVoiceCalls.activeProviderCallId, event.callId),
        eq(inboundVoiceCalls.parentProviderCallId, event.callId),
      ),
    )
    .limit(1);
  const call = rows[0];
  if (!call) return new Response(null, { status: 404 });

  if (event.state === "recording" || event.state === "paused") {
    await db
      .update(inboundVoiceCalls)
      .set({ routingStage: "voicemail", status: "voicemail", voicemailState: event.state, updatedAt: new Date().toISOString() })
      .where(eq(inboundVoiceCalls.id, call.id));
    return new Response(null, { status: 204 });
  }

  if (event.state === "error") {
    await db
      .update(inboundVoiceCalls)
      .set({ routingStage: "voicemail", status: "failed", voicemailState: "error", updatedAt: new Date().toISOString() })
      .where(eq(inboundVoiceCalls.id, call.id));
    return new Response(null, { status: 204 });
  }

  let objectKey: string | null = null;
  if (event.state === "finished") {
    const config = voiceRuntimeConfig();
    const bucket = getCallRecordingsBucket();
    if (!config || !bucket || !event.url || !event.recordingId) {
      return new Response(null, { status: 503 });
    }
    const url = safeRecordingUrl(event.url, config.space);
    if (!url) return new Response(null, { status: 400 });

    let recording: Response;
    try {
      recording = await fetch(url, {
        headers: { authorization: `Basic ${btoa(`${config.projectId}:${config.apiToken}`)}` },
      });
    } catch {
      return new Response(null, { status: 503 });
    }
    const length = Number.parseInt(recording.headers.get("content-length") ?? "", 10);
    if (!recording.ok || !recording.body || (Number.isFinite(length) && length > MAX_VOICEMAIL_BYTES)) {
      return new Response(null, { status: 503 });
    }
    const safeRecordingId = event.recordingId.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 120);
    if (!safeRecordingId) return new Response(null, { status: 400 });
    const extension = event.format === "wav" ? "wav" : "mp3";
    objectKey = `voicemail/${call.id}/${safeRecordingId}.${extension}`;
    await bucket.put(objectKey, recording.body, {
      httpMetadata: { contentType: extension === "wav" ? "audio/wav" : "audio/mpeg" },
      customMetadata: { kind: "voicemail", callId: String(call.id) },
    });
  }

  const now = new Date();
  const dueAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  await db.batch([
    db
      .update(inboundVoiceCalls)
      .set({
        routingStage: "voicemail",
        status: "voicemail",
        voicemailState: event.state,
        voicemailObjectKey: objectKey,
        endedAt: now.toISOString(),
        disposition: event.state === "no_input" ? "voicemail_no_input" : "voicemail_received",
        updatedAt: now.toISOString(),
      })
      .where(eq(inboundVoiceCalls.id, call.id)),
    db
      .insert(voiceCallbackTasks)
      .values({
        voiceCallId: call.id,
        assignedMemberId: call.lineType === "personal" ? call.assignedMemberId : null,
        voicemailObjectKey: objectKey,
        status: "open",
        dueAt,
      })
      .onConflictDoUpdate({
        target: voiceCallbackTasks.voiceCallId,
        set: {
          voicemailObjectKey: objectKey,
          updatedAt: now.toISOString(),
        },
      }),
  ]);

  const audited = await appendAuditRow({
    action: "calls.voicemail.store",
    decision: "allow",
    reason: event.state === "no_input" ? "callback_task_created_without_audio" : "voicemail_stored_and_task_created",
    requestPath: PATH,
    resource: `inbound-call:${call.id}`,
    detail: JSON.stringify({ audio: Boolean(objectKey), duration_seconds: event.duration }),
  });
  return new Response(null, { status: audited ? 204 : 503 });
}

function normalizeRecordEvent(value: unknown): {
  callId: string;
  state: "recording" | "paused" | "finished" | "no_input" | "error";
  url: string | null;
  recordingId: string | null;
  duration: number | null;
  format: "mp3" | "wav";
} | null {
  const root = object(value);
  const params = object(root?.params);
  const record = object(params?.record);
  const audio = object(record?.audio);
  const eventType = text(root?.event_type);
  const callId = text(params?.call_id);
  const state = text(params?.state);
  if (
    eventType !== "calling.call.record"
    || !callId
    || !/^[A-Za-z0-9._:-]{4,200}$/.test(callId)
    || !["recording", "paused", "finished", "no_input", "error"].includes(state ?? "")
  ) return null;
  const duration = typeof params?.duration === "number" && Number.isFinite(params.duration)
    ? Math.max(0, Math.round(params.duration))
    : null;
  return {
    callId,
    state: state as "recording" | "paused" | "finished" | "no_input" | "error",
    url: text(params?.url),
    recordingId: text(params?.recording_id),
    duration,
    format: text(audio?.format) === "wav" ? "wav" : "mp3",
  };
}

function safeRecordingUrl(value: string, expectedHost: string): string | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:"
      || url.hostname.toLowerCase() !== expectedHost.toLowerCase()
      || url.username
      || url.password
      || !/^\/api\/(?:v1\/)?recordings\//.test(url.pathname)
    ) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function readPayload(request: Request): Promise<unknown> {
  const type = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (type.includes("application/json")) return request.json();
  if (type.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(await request.text()));
  }
  throw new Error("Unsupported content type");
}

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : null;
}
