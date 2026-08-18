import { recordAudit, requireCapability } from "../access";
import { PortalPageIntro, PortalShell } from "../components";

export const dynamic = "force-dynamic";

const PATH = "/portal/commission";

/**
 * Commission schedule — INSIDE the portal, by owner order ("combine into
 * main platform with no hyperlink"): the member stays in the portal shell,
 * sidebar and radio intact, and the interactive schedule renders in a frame
 * fed by the guarded sibling route /portal/commission/document. Both the
 * page and the frame's route enforce the dashboard.view.self capability —
 * every active member, agents included; the schedule is the whole team's
 * comp reference, not a leadership surface.
 */
export default async function CommissionPage() {
  const session = await requireCapability("dashboard.view.self", "/portal/commission");

  await recordAudit({
    action: "dashboard.view.self",
    decision: "allow",
    reason: "commission_schedule_view",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: "commission",
    requestPath: PATH,
  });

  return (
    <PortalShell session={session} current={PATH} section="Commission">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Compensation"
          title={<>Commission <em>schedule</em></>}
          subtitle="Every carrier's comp grid by contract level — pick a level, open a carrier's ladder, check the promotion guidelines. Live inside CORE; the document never leaves the portal's locks."
          compact
        />
        <iframe
          src="/portal/commission/document"
          title="Thrive commission schedule"
          style={{
            width: "100%",
            height: "78vh",
            border: "1px solid var(--portal-line)",
            borderRadius: "14px",
            background: "#fff",
            display: "block",
          }}
        />
      </main>
    </PortalShell>
  );
}
