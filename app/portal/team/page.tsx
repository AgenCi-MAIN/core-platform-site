import { requireCapability } from "../access";
import { PortalPlaceholderPage } from "../components";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await requireCapability("team.view", "/portal/team");
  return (
    <PortalPlaceholderPage
      session={session}
      current="/portal/team"
      section="Team"
      eyebrow="People and coaching"
      title="Team"
      subtitle="Role-aware visibility into assignments, development, and operating support."
      cardTitle="Team workspace"
      cardDescription="Assignments, coaching plans, availability, and progression evidence."
      emptyTitle="Team operations not connected"
      emptyBody="This workspace will populate after CORE approves the team data model and connects its member, assignment, coaching, and rank-evidence sources."
      icon="◎"
    />
  );
}
