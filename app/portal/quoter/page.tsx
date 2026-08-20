import { requireCapability } from "../access";
import { PortalPageIntro, PortalShell } from "../components";
import { QuoterTool } from "./quoter-tool";

export const dynamic = "force-dynamic";

export default async function QuoterPage() {
  const session = await requireCapability("book.view.self", "/portal/quoter");
  return (
    <PortalShell session={session} current="/portal/quoter" section="Quoter">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Quoting & Underwriting"
          title="Final Expense Quoter"
          subtitle="Get a quote inline — no external tools required. Enter the client's information and receive an instant premium estimate."
          compact
        />
        <QuoterTool />
      </main>
    </PortalShell>
  );
}
