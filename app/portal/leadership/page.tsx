import { requireCapability } from "../access";
import { PortalPlaceholderPage } from "../components";

export const dynamic = "force-dynamic";

export default async function LeadershipPage() {
  const session = await requireCapability("leadership.view.all", "/portal/leadership");
  return (
    <PortalPlaceholderPage
      session={session}
      current="/portal/leadership"
      section="Leadership"
      eyebrow="Company oversight"
      title="Leadership"
      subtitle="Company-wide operating evidence for authorized decision-makers."
      cardTitle="Leadership intelligence"
      cardDescription="Verified company metrics, exceptions, and mission priorities."
      emptyTitle="No company data connected"
      emptyBody="Leadership metrics will populate only after CRM, lead, policy, retention, financial, and quality sources are approved, connected, and reconciled."
      icon="⌁"
    />
  );
}
