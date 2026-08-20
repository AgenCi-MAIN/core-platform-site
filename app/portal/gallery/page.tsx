import { requireCapability } from "../access";
import { PortalPageIntro, PortalShell } from "../components";
import { OperationsDeck } from "./operations-deck";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const session = await requireCapability("dashboard.view.self", "/portal/gallery");

  return (
    <PortalShell session={session} current="/portal/gallery" section="Operations Deck">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="The Operations Deck"
          title="Ten Agents, Ten Portraits"
          subtitle="Select an agent to inspect their spec, build your own, or publish to Inkbox."
          compact
        />
        <OperationsDeck session={{ name: session.displayName, email: session.email, role: session.role }} />
      </main>
    </PortalShell>
  );
}
