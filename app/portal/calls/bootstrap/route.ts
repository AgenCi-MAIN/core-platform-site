import { and, desc, eq, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  inboundVoiceCalls,
  portalMembers,
  voiceCallOffers,
  voiceCallbackTasks,
  voiceNumberAssignments,
  voicePresence,
} from "../../../../db/schema";
import { isFounder } from "../../access";
import {
  authorizeCallApi,
  getActiveVoiceAssignment,
  jsonNoStore,
  maskPhone,
  PRESENCE_HEARTBEAT_MS,
  PRESENCE_TTL_MS,
} from "../voice-server";

export const dynamic = "force-dynamic";
const PATH = "/portal/calls/bootstrap";

export async function GET(request: Request): Promise<Response> {
  const access = await authorizeCallApi(request, PATH);
  if (!access.ok) return access.response;
  const founder = isFounder(access.session);

  let assignment;
  try {
    assignment = await getActiveVoiceAssignment(access.session.memberId);
  } catch {
    return jsonNoStore({
      phoneEnabled: false,
      setupState: "not_provisioned",
      founder,
      currentMemberId: access.session.memberId,
      presence: { state: "offline", expiresAt: null },
      history: [],
      callbackTasks: [],
      heartbeatMs: PRESENCE_HEARTBEAT_MS,
      presenceTtlMs: PRESENCE_TTL_MS,
    });
  }
  if (!assignment) {
    return jsonNoStore({
      phoneEnabled: false,
      setupState: "unassigned",
      founder,
      currentMemberId: access.session.memberId,
      presence: { state: "offline", expiresAt: null },
      history: [],
      callbackTasks: [],
      callbackCounts: { open: 0, mine: 0 },
      heartbeatMs: PRESENCE_HEARTBEAT_MS,
      presenceTtlMs: PRESENCE_TTL_MS,
    });
  }

  const db = getDb();
  try {
    const nowIso = new Date().toISOString();
    const historySelection = {
      id: inboundVoiceCalls.id,
      providerCallId: inboundVoiceCalls.providerCallId,
      lineType: inboundVoiceCalls.lineType,
      calledLine: inboundVoiceCalls.calledNumberMasked,
      caller: inboundVoiceCalls.callerNumberMasked,
      stage: inboundVoiceCalls.routingStage,
      status: inboundVoiceCalls.status,
      disposition: inboundVoiceCalls.disposition,
      startedAt: inboundVoiceCalls.startedAt,
      answeredAt: inboundVoiceCalls.answeredAt,
      endedAt: inboundVoiceCalls.endedAt,
      voicemailState: inboundVoiceCalls.voicemailState,
    };
    const historyPromise = founder
      ? db
          .select({ ...historySelection, offerStatus: sql<string | null>`NULL` })
          .from(inboundVoiceCalls)
          .orderBy(desc(inboundVoiceCalls.startedAt), desc(inboundVoiceCalls.id))
          .limit(100)
      : db
          .select({ ...historySelection, offerStatus: voiceCallOffers.status })
          .from(inboundVoiceCalls)
          .leftJoin(
            voiceCallOffers,
            and(
              eq(voiceCallOffers.voiceCallId, inboundVoiceCalls.id),
              eq(voiceCallOffers.memberId, access.session.memberId),
              ne(voiceCallOffers.status, "queued"),
            ),
          )
          .where(
            or(
              eq(inboundVoiceCalls.assignedMemberId, access.session.memberId),
              eq(inboundVoiceCalls.acceptedMemberId, access.session.memberId),
              eq(voiceCallOffers.memberId, access.session.memberId),
            ),
          )
          .orderBy(desc(inboundVoiceCalls.startedAt), desc(inboundVoiceCalls.id))
          .limit(50);
    const [presenceRows, historyRows, taskRows, aggregateRows] = await Promise.all([
      db
        .select({ state: voicePresence.readyState, expiresAt: voicePresence.expiresAt })
        .from(voicePresence)
        .where(eq(voicePresence.memberId, access.session.memberId))
        .limit(1),
      historyPromise,
      db
        .select({
          id: voiceCallbackTasks.id,
          callId: voiceCallbackTasks.voiceCallId,
          assignedMemberId: voiceCallbackTasks.assignedMemberId,
          claimedByMemberId: voiceCallbackTasks.claimedByMemberId,
          status: voiceCallbackTasks.status,
          dueAt: voiceCallbackTasks.dueAt,
          disposition: voiceCallbackTasks.disposition,
          voicemailReady: voiceCallbackTasks.voicemailObjectKey,
          caller: inboundVoiceCalls.callerNumberMasked,
          calledLine: inboundVoiceCalls.calledNumberMasked,
          lineType: inboundVoiceCalls.lineType,
          startedAt: inboundVoiceCalls.startedAt,
        })
        .from(voiceCallbackTasks)
        .innerJoin(inboundVoiceCalls, eq(voiceCallbackTasks.voiceCallId, inboundVoiceCalls.id))
        .where(
          founder
            ? undefined
            : or(
                eq(voiceCallbackTasks.assignedMemberId, access.session.memberId),
                eq(voiceCallbackTasks.claimedByMemberId, access.session.memberId),
                and(isNull(voiceCallbackTasks.assignedMemberId), eq(voiceCallbackTasks.status, "open")),
              ),
        )
        .orderBy(desc(voiceCallbackTasks.createdAt))
        .limit(founder ? 100 : 50),
      founder
        ? db
            .select({ state: voicePresence.readyState, memberId: voicePresence.memberId })
            .from(voicePresence)
            .innerJoin(
              voiceNumberAssignments,
              eq(voicePresence.memberId, voiceNumberAssignments.memberId),
            )
            .innerJoin(portalMembers, eq(voicePresence.memberId, portalMembers.id))
            .where(
              and(
                eq(voiceNumberAssignments.status, "active"),
                eq(voiceNumberAssignments.lineType, "personal"),
                eq(portalMembers.status, "active"),
                inArray(voicePresence.readyState, ["available", "busy"]),
                gt(voicePresence.expiresAt, nowIso),
              ),
            )
        : Promise.resolve([]),
    ]);

    const now = Date.now();
    const presence = presenceRows[0];
    const presenceLive = Boolean(
      presence
        && presence.state !== "offline"
        && new Date(presence.expiresAt).getTime() > now,
    );
    const aggregates = founder
      ? {
          availableEmployees: aggregateRows.filter(
            (row) => row.state === "available",
          ).length,
          registeredEmployees: aggregateRows.length,
        }
      : undefined;

    return jsonNoStore({
      phoneEnabled: Boolean(assignment),
      setupState: assignment ? "assigned" : "unassigned",
      personalNumber: assignment ? maskPhone(assignment.e164Number) : null,
      founder,
      currentMemberId: access.session.memberId,
      presence: {
        state: presenceLive ? presence!.state : "offline",
        expiresAt: presenceLive ? presence!.expiresAt : null,
      },
      history: Array.from(
        new Map(historyRows.map((row) => [row.id, {
          ...row,
          activityStatus: row.offerStatus ?? row.disposition ?? row.status,
        }])).values(),
      ),
      callbackTasks: taskRows.map((task) => ({
        ...task,
        voicemailReady: Boolean(task.voicemailReady),
      })),
      callbackCounts: {
        open: taskRows.filter((task) => task.status === "open").length,
        mine: taskRows.filter(
          (task) =>
            task.assignedMemberId === access.session.memberId
            || task.claimedByMemberId === access.session.memberId,
        ).length,
      },
      aggregates,
      heartbeatMs: PRESENCE_HEARTBEAT_MS,
      presenceTtlMs: PRESENCE_TTL_MS,
    });
  } catch {
    return jsonNoStore({ error: "Call records are unavailable." }, 503);
  }
}
