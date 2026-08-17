import { requireFounder } from "../access";
import { PortalCardHeader, PortalPageIntro, PortalShell } from "../components";

export const dynamic = "force-dynamic";

/**
 * INVESTIGATOR console — founder-only, reached through the hidden wordless
 * control in the sidebar (the status dot). Guarded by identity, not by a
 * capability a role can hold: only the seeded founder identity resolves here.
 *
 * Honesty note that governs this whole page: INVESTIGATOR is a read-only
 * standing agent, and its live coded digests are produced as SCHEDULED
 * SESSION RUNS on the Claude Code platform — not in this database and not in
 * this repository. The Worker that serves this page has no data path to
 * those transcripts, and INVESTIGATOR writes nothing by design. So this page
 * does not fabricate a feed it cannot read; it tells the founder exactly what
 * INVESTIGATOR is, where the reports live, and names the one thing that would
 * have to change to pipe them in-portal.
 */
export default async function InvestigatorPage() {
  const session = await requireFounder("/portal/investigator", "investigator.view");

  return (
    <PortalShell session={session} current="/portal/investigator" section="Investigator">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Founder only"
          title={<>INVESTIGATOR <em>console</em></>}
          subtitle="Read-only oversight of the plan and the rate of change. Visible to the founder identity alone."
        />

        <section className="portal-card">
          <PortalCardHeader
            icon="◎"
            title="What INVESTIGATOR watches"
            description="Situational awareness for one human, while the machine moves fast."
          />
          <p className="portal-copy">
            Every hour, INVESTIGATOR reads the repository — the commit history,
            this platform&apos;s operating record, the workforce registry, and
            the strategy corpus — and writes a short coded digest of the current
            structure and how fast it is changing. Its leash is the strictest on
            the roster: it has no write rights of any kind, sends no messages,
            and touches nothing. It watches, understands, and reports.
          </p>
        </section>

        <section className="portal-card">
          <PortalCardHeader
            icon="◷"
            title="Where the live reports are"
            description="Stated plainly, because the portal cannot show what it cannot read."
          />
          <p className="portal-copy">
            INVESTIGATOR&apos;s digests are produced as <strong>scheduled agent
            runs on the Claude Code platform</strong>, once an hour. Each run
            leaves its coded report in that run&apos;s own session transcript,
            and pushes a phone notification only when something is materially
            worth the interruption — a spike in pace, a new structural element,
            or a governance item newly needing you.
          </p>
          <p className="portal-copy">
            Those transcripts live outside this portal. The Worker that serves
            this page runs in Cloudflare with no path to the Claude Code
            session history, and INVESTIGATOR writes nothing into this
            database or repository — that is what keeps it a pure reader. So
            this console does not print a live feed it would have to invent:
            the real reports are in your Claude Code sessions, and the phone
            notifications are the live channel.
          </p>
          <p className="portal-fine">
            To surface the digests inside this page instead, INVESTIGATOR would
            need one narrow, owner-approved write path — an append to a
            founder-only store this Worker can read. That trades away its
            zero-write purity, so it is a governance decision, not a default.
            Say the word and it becomes the next build.
          </p>
        </section>

        <section className="portal-card">
          <PortalCardHeader
            icon="◆"
            title="The access record"
            description="What the portal itself can show you live, right now."
          />
          <p className="portal-copy">
            For the portal&apos;s own live evidence — every sign-in, every
            allow and deny, and every question asked of the Presence — the{" "}
            <strong>Audit</strong> page reads this database directly and is
            current to the second. That is the in-portal companion to
            INVESTIGATOR&apos;s repository-level oversight: one watches the
            plan, the other watches the door.
          </p>
        </section>
      </main>
    </PortalShell>
  );
}
