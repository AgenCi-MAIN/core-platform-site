import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { dialerTransfers } from "../../../db/schema";
import { can, isFounder, requireCapability } from "../access";
import { PortalPageIntro, PortalShell, PrototypeNotice } from "../components";
import { readFaultCopy, readRows } from "../read-guard";
import { CallsWorkspace, type LabCall } from "./workspace";

export const dynamic = "force-dynamic";

export default async function CallsPage() {
  const session = await requireCapability("calls.answer", "/portal/calls");
  let labCalls: LabCall[] = [];
  let labFault: { title: string; body: string } | null = null;
  const labAuthorized = can(session, "calls.review");
  if (labAuthorized) {
    const result = await readRows("dialer_transfers", () =>
      getDb()
        .select()
        .from(dialerTransfers)
        .orderBy(desc(dialerTransfers.receivedAt), desc(dialerTransfers.id))
        .limit(100),
    );
    if (result.fault) labFault = readFaultCopy(result.fault, "Call Lab storage");
    labCalls = result.rows.map((call) => ({
      id: call.id,
      transferId: call.transferId,
      receivedAt: call.receivedAt,
      caller: call.callerNumberMasked ?? "Caller withheld",
      agent: call.agentEmail ?? call.queueName ?? "Unassigned",
      status: call.status,
      consent: call.consentStatus,
      reviewHref: `/portal/calls/review/${call.id}`,
      recordingHref: call.status === "ready" && call.consentStatus === "verified" && call.recordingObjectKey
        ? `/portal/calls/recording?id=${call.id}`
        : null,
    }));
  }

  return (
    <PortalShell session={session} current="/portal/calls" section="Calls">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Inbound voice · computer answering"
          title={<>Calls, callbacks, and <em>review</em></>}
          subtitle="One protected workspace for availability, browser calls, personal history, voicemail follow-up, and founder-authorized Call Lab review."
          compact
        />
        <CallsWorkspace
          labCalls={labCalls}
          labAuthorized={labAuthorized}
          labFault={labFault}
          outboundAuthorized={isFounder(session)}
        />
        <PrototypeNotice>
          Only an explicit Available state plus a live primary-tab heartbeat enters the hunt. Live employee and customer conversations are not recorded, transcribed, or joined by AI; only the announced voicemail stage records audio.
        </PrototypeNotice>
      </main>
    </PortalShell>
  );
}
