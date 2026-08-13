import { requireCapability } from "../access";
import { PortalPlaceholderPage } from "../components";

export const dynamic = "force-dynamic";

export default async function CallsPage() {
  const session = await requireCapability("calls.review", "/portal/calls");
  return (
    <PortalPlaceholderPage
      session={session}
      current="/portal/calls"
      section="Call Lab"
      eyebrow="Conversation intelligence"
      title="Call Lab"
      subtitle="Evidence-led reviews, coaching moments, and script learning for authorized calls."
      cardTitle="Call review queue"
      cardDescription="Permissioned recordings, transcripts, scores, and reviewer decisions."
      emptyTitle="Call ingestion not connected"
      emptyBody="The queue will populate only after recording consent, source access, permitted processing, retention, redaction, and reviewer controls are approved and connected."
      icon="◉"
    />
  );
}
