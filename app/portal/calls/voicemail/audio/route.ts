import { and, eq, or } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { inboundVoiceCalls, voiceCallbackTasks } from "../../../../../db/schema";
import { isFounder } from "../../../access";
import { getCallRecordingsBucket } from "../../storage";
import { authorizeCallApi, jsonNoStore } from "../../voice-server";

export const dynamic = "force-dynamic";
const PATH = "/portal/calls/voicemail/audio";

export async function GET(request: Request): Promise<Response> {
  const access = await authorizeCallApi(request, PATH, { requireAssignment: true });
  if (!access.ok) return access.response;
  const id = Number.parseInt(new URL(request.url).searchParams.get("id") ?? "", 10);
  if (!Number.isSafeInteger(id) || id <= 0) return jsonNoStore({ error: "Invalid voicemail." }, 400);

  const rows = await getDb()
    .select({ objectKey: voiceCallbackTasks.voicemailObjectKey })
    .from(voiceCallbackTasks)
    .innerJoin(inboundVoiceCalls, eq(voiceCallbackTasks.voiceCallId, inboundVoiceCalls.id))
    .where(
      and(
        eq(voiceCallbackTasks.id, id),
        isFounder(access.session)
          ? undefined
          : or(
              eq(voiceCallbackTasks.assignedMemberId, access.session.memberId),
              eq(voiceCallbackTasks.claimedByMemberId, access.session.memberId),
            ),
      ),
    )
    .limit(1);
  const key = rows[0]?.objectKey;
  if (!key) return jsonNoStore({ error: "Voicemail unavailable." }, 404);

  const object = await getCallRecordingsBucket()?.get(key);
  if (!object) return jsonNoStore({ error: "Voicemail unavailable." }, 404);
  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? "audio/mpeg",
      "content-length": String(object.size),
      etag: object.etag,
      "cache-control": "no-store, private, max-age=0",
      "content-disposition": "inline; filename=voicemail",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; media-src 'self'",
    },
  });
}
