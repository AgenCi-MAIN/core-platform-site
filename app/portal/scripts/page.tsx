import { requireCapability } from "../access";
import { PortalPlaceholderPage } from "../components";

export const dynamic = "force-dynamic";

export default async function ScriptsPage() {
  const session = await requireCapability("scripts.manage", "/portal/scripts");
  return (
    <PortalPlaceholderPage
      session={session}
      current="/portal/scripts"
      section="Script Vault"
      eyebrow="Approved playbooks"
      title="Script Vault"
      subtitle="Versioned conversation guidance grounded in evidence and human approval."
      cardTitle="Script library"
      cardDescription="Approved language, evidence criteria, owners, and effective dates."
      emptyTitle="No governed scripts imported"
      emptyBody="Scripts will populate after CORE approves the source library, assigns owners, records compliance status, and connects version history."
      icon="✦"
    />
  );
}
