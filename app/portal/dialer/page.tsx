import { requireCapability } from "../access";
import { PortalPageIntro, PortalShell } from "../components";
import { CollabDialer } from "./collab-dialer";

export const dynamic = "force-dynamic";

export default async function DialerPage() {
  const session = await requireCapability("calls.review", "/portal/dialer");
  return (
    <PortalShell session={session} current="/portal/dialer" section="Collab Dialer">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="SignalWire softphone"
          title="Collab Dialer"
          subtitle="Place and receive calls through SignalWire directly from the portal. Enter your SignalWire credentials to connect."
          compact
        />
        <CollabDialer />
      </main>
    </PortalShell>
  );
}
