import { requireFounder } from "../access";
import { PortalPageIntro, PortalShell } from "../components";
import { CollabDialer } from "./collab-dialer";

export const dynamic = "force-dynamic";

export default async function DialerPage() {
  const session = await requireFounder("/portal/dialer", "calls.dial");
  return (
    <PortalShell session={session} current="/portal/dialer" section="Collab Dialer">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="SignalWire · founder controlled"
          title="Collab Dialer"
          subtitle="CORE rings your approved private mobile first. After you accept, SignalWire connects the customer and presents the dedicated 205-351-5158 platform line."
          compact
        />
        <CollabDialer />
      </main>
    </PortalShell>
  );
}
