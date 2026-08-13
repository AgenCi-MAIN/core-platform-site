import { requireCapability } from "../access";
import { PortalPlaceholderPage } from "../components";

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const session = await requireCapability("book.view.self", "/portal/book");
  return (
    <PortalPlaceholderPage
      session={session}
      current="/portal/book"
      section="Book of Business"
      eyebrow="Personal portfolio"
      title="Book of Business"
      subtitle="A governed view of your placed policies, retention, and case requirements."
      cardTitle="Policy intelligence"
      cardDescription="Personal production evidence from approved systems of record."
      emptyTitle="No policy system connected"
      emptyBody="Policies, placement status, requirements, persistence, and chargebacks will populate after an approved CRM or carrier integration is connected."
      icon="◫"
    />
  );
}
