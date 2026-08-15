import { env } from "cloudflare:workers";
import { can, recordAudit, requireCapability } from "../access";
import { PortalPageIntro, PortalShell } from "../components";
import { START_INPUTS, START_RANKS } from "./model";
import { PayRatesStudio } from "./studio";

export const dynamic = "force-dynamic";

/**
 * Pay Rates Studio — restricted.
 *
 * ON THE SECOND FACTOR
 *
 * A shared password was requested for this page. It is not implemented, and
 * deliberately so: AGENTS.md states plainly that no password may be stored in
 * this workspace, and a literal in the source would be committed, pushed, and
 * permanent — irretractable in the same way a member's address is. A secret
 * four people know and one forwards is also not authentication.
 *
 * What guards this page instead:
 *
 *   1. `leadership.view.all`, enforced server-side on every request and audited
 *      whether it passes or fails. Owner, admin, and manager hold it.
 *   2. Optionally a deployment secret in `PAY_RATES_KEY`, supplied by the
 *      hosting platform and never committed. When that binding is absent the
 *      capability alone governs, which is the current state.
 *
 * If a second factor is genuinely wanted, set `PAY_RATES_KEY` in the deployment
 * environment. The value lives with the platform, can be rotated without a
 * commit, and never appears in git history.
 */
export default async function PayRatesPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const session = await requireCapability("leadership.view.all", "/portal/pay-rates");

  const runtime = env as unknown as { PAY_RATES_KEY?: string };
  const required = runtime.PAY_RATES_KEY;
  const supplied = (await searchParams).key;

  if (required && supplied !== required) {
    await recordAudit({
      action: "pay_rates.open",
      decision: "deny",
      reason: "second_factor_missing",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: "/portal/pay-rates",
    });

    return (
      <PortalShell session={session} current="/portal/pay-rates" section="Pay Rates">
        <main className="portal-main portal-gate">
          <section className="portal-card portal-gate-card access-card">
            <header className="access-head">
              <span className="access-mark" aria-hidden="true">T</span>
              <p className="portal-eyebrow">THRIVE — Restricted</p>
              <h1>Second factor required</h1>
              <p className="portal-lede">
                Your role holds this capability, but this deployment also requires
                a key that was not supplied. This refusal has been recorded.
              </p>
            </header>
            <p className="portal-fine">
              The key is held by the deployment, not by this application. An owner
              can supply it or clear the requirement.
            </p>
          </section>
        </main>
      </PortalShell>
    );
  }

  await recordAudit({
    action: "pay_rates.open",
    decision: "allow",
    reason: required ? "capability_and_second_factor" : "capability_held",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    requestPath: "/portal/pay-rates",
  });

  const canManage = can(session, "members.manage");

  return (
    <PortalShell session={session} current="/portal/pay-rates" section="Pay Rates">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Restricted — leadership"
          title="Pay Rates Studio"
          subtitle="Model contract levels, API grants, and headcount against real cost. Every dial is a projection; nothing here changes anyone's pay."
          compact
        />

        <p className="pay-restricted" role="note">
          <span className="pay-restricted-tag">Special admin access</span>
          <span>
            This page is not part of the recruit or agent experience — they see
            the rank ladder, never the rates behind it. Access is granted by
            request to an owner and is recorded in the audit log every time it is
            opened.{" "}
            {canManage ? (
              <strong>You hold members.manage, so you can grant it.</strong>
            ) : (
              <strong>You can view it; only an owner or admin can grant it.</strong>
            )}
          </span>
        </p>

        <PayRatesStudio startRanks={START_RANKS} startInputs={START_INPUTS} />

        <section className="portal-card">
          <header className="portal-card-header">
            <span className="portal-card-icon" aria-hidden="true">◇</span>
            <div>
              <h2>Why there is no shared password</h2>
              <p>Asked for, and deliberately not built.</p>
            </div>
          </header>
          <p className="portal-lede">
            A password written into the code is committed, pushed, and permanent
            — it cannot be removed from git history any more than a member&apos;s
            address can. THRIVE&apos;s own operating rules forbid storing one in
            this workspace, and a secret several people share and forward is not
            authentication in any case.
          </p>
          <p className="portal-fine">
            This page is instead gated on the <code>leadership.view.all</code>{" "}
            capability, enforced server-side on every request and audited whether
            it passes or fails — which is stronger, revocable per person, and
            leaves a record of who looked. A deployment key can be added as a
            second factor by setting <code>PAY_RATES_KEY</code> in the hosting
            environment; that value lives with the platform, rotates without a
            commit, and never enters the repository.
          </p>
        </section>
      </main>
    </PortalShell>
  );
}
