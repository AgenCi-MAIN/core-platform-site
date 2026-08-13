import Link from "next/link";
import { KeyGlyph } from "../key-glyph";
import { PortalGovernanceFooter } from "../portal-chrome";
import { SiteTopbar } from "../site-chrome";

export const dynamic = "force-static";

/**
 * Onboarding and training — the page for people who are new to the business
 * and not yet managers.
 *
 * SAFETY CONTRACT — read before editing.
 *
 * 1. This module imports NOTHING from `app/portal/`. That is deliberate: the
 *    portal tree reaches `access.ts` -> `db/index.ts`, so importing any of it
 *    would give this page a code path to the database. It has none, and it
 *    compiles static, which means it cannot query anything at runtime.
 * 2. No real member, book, call, or compensation record appears here. Schedules
 *    and checklists describe the process, not any individual's progress.
 * 3. Anything requiring a member's own data lives behind sign-in, in the portal.
 */

const WEEK_ONE = [
  {
    day: "Days 1–2",
    title: "Setup and access",
    body: "Your onboarding email is registered, portal access is assigned to you by name, and you sign in for the first time. Bring the email you gave during onboarding — the portal matches against exactly that address.",
  },
  {
    day: "Days 2–4",
    title: "Licensing and appointments",
    body: "Your licence status and carrier appointments are confirmed by your manager. Nothing that requires a licence begins before this is complete.",
  },
  {
    day: "Days 3–5",
    title: "Product and script foundation",
    body: "You work through the approved product material and the Script Vault. The language is compliance-reviewed — you learn it as written before you make it your own.",
  },
  {
    day: "End of week one",
    title: "First live conversations",
    body: "Supervised, with your manager present. Your first deal is closed by a manager so you get paid while you are still learning the motion.",
  },
] as const;

const SUPPORT = [
  {
    mark: "1",
    title: "Weekly 1-on-1 with your manager",
    body: "A standing thirty minutes. Pipeline, blockers, one specific thing to improve, and one thing that went right. Not a performance review — a working session.",
  },
  {
    mark: "C",
    title: "Call review and coaching",
    body: "Recorded calls are reviewed against the moments that decided the outcome, not the whole hour. Coaching is specific: this objection, this pause, this turn.",
  },
  {
    mark: "T",
    title: "Team floor time",
    body: "You sit with producers. Most of what you learn in the first month you will learn by hearing someone else handle a call you would have lost.",
  },
  {
    mark: "M",
    title: "A named person to ask",
    body: "You are never routed to a queue. There is one person whose job includes answering your questions, and you will know their name on day one.",
  },
] as const;

const RANK_STEPS = [
  { mark: "I", name: "Ember", phase: "Bronze / Captive", note: "Where you start. Learn the full policy economy and protect the first dollar." },
  { mark: "II", name: "Vector", phase: "Silver / Producer", note: "Earned through repeatable production — not one hot month." },
  { mark: "III", name: "Apex", phase: "Gold / Thrive", note: "Production earns altitude. Quality keeps it." },
  { mark: "IV", name: "Dominion", phase: "Diamond / Core 1.0", note: "Own the book, not just the leaderboard." },
  { mark: "V", name: "Zenith", phase: "Obsidian / Core 2.0", note: "The system compounds through you." },
] as const;

export default function OnboardingPage() {
  return (
    <div className="portal site-page">
      <SiteTopbar
        section="Onboarding"
        context="Onboarding & training"
        cta={{ href: "/access", label: "Portal access" }}
      />

      <main className="site-main">
        <section className="site-hero">
          <p className="portal-eyebrow">THRIVE — New agent onboarding</p>
          <h1>
            Your first month<span> at THRIVE.</span>
          </h1>
          <p className="site-hero-lede">
            This page is for people who are new to the business. It covers what
            happens in week one, how training works, what support you get, and
            how advancement is measured. No guessing, and nothing here changes
            after you hit the number.
          </p>
          <div className="site-hero-actions">
            <Link className="button button-primary" href="/access">
              Portal access <KeyGlyph />
            </Link>
            <Link className="text-link" href="/">
              About THRIVE <KeyGlyph />
            </Link>
          </div>
        </section>

        <section className="site-section">
          <header className="site-section-head">
            <p className="portal-eyebrow">What the agency puts in first</p>
            <h2>You are not paying to learn.</h2>
          </header>
          <div className="site-pillars">
            <article className="portal-card site-pillar">
              <span className="site-pillar-mark" aria-hidden="true">$</span>
              <h3>First two weeks of business expenses covered</h3>
              <p>
                Less stress coming into a sales job so you can actually relax
                and learn to be self sufficient.
              </p>
            </article>
            <article className="portal-card site-pillar">
              <span className="site-pillar-mark" aria-hidden="true">✓</span>
              <h3>Your first deal closed by a manager</h3>
              <p>
                New agents that are onboarding will have their first deal closed
                by a manager to make sure you get paid as soon as you start the
                job and gain momentum.
              </p>
            </article>
            <article className="portal-card site-pillar">
              <span className="site-pillar-mark" aria-hidden="true">★</span>
              <h3>Early production bonus</h3>
              <p>
                The agency publishes a cash bonus for new agents who reach a
                weekly submission target during the qualifying period. Your
                recruiter or manager confirms the current terms.
              </p>
            </article>
          </div>
          <p className="portal-fine">
            Incentive terms are set by the agency and can change. The current
            published plan is in the portal Library once you have access; your
            manager confirms eligibility and timing.
          </p>
        </section>

        <section className="site-section">
          <header className="site-section-head">
            <p className="portal-eyebrow">Week one</p>
            <h2>What actually happens, in order.</h2>
          </header>
          <ol className="onboard-timeline">
            {WEEK_ONE.map((step) => (
              <li key={step.title}>
                <span className="onboard-day">{step.day}</span>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="site-section">
          <header className="site-section-head">
            <p className="portal-eyebrow">Support</p>
            <h2>Who you have, and how often.</h2>
          </header>
          <div className="site-pillars">
            {SUPPORT.map((s) => (
              <article className="portal-card site-pillar" key={s.title}>
                <span className="site-pillar-mark" aria-hidden="true">{s.mark}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="site-section">
          <header className="site-section-head">
            <p className="portal-eyebrow">Advancement</p>
            <h2>Five ranks. You start at Ember.</h2>
            <p className="portal-lede">
              The criteria are published before you walk the path. Advancement
              is measured the same way for everyone.
            </p>
          </header>
          <ol className="onboard-ranks">
            {RANK_STEPS.map((rank, i) => (
              <li key={rank.name} className={i === 0 ? "onboard-rank-current" : undefined}>
                <span className="rank-mark" aria-hidden="true">{rank.mark}</span>
                <span className="onboard-rank-copy">
                  <strong>{rank.name}</strong>
                  <small>{rank.phase}</small>
                  <span>{rank.note}</span>
                </span>
                {i === 0 ? <span className="portal-state portal-state-live">You start here</span> : null}
              </li>
            ))}
          </ol>
        </section>

        <section className="site-section">
          <article className="portal-card site-boundary">
            <span className="script-governance-tag">Straight answer</span>
            <h2>What this page is not.</h2>
            <p className="portal-lede">
              This is the process, not your record. It shows no individual&apos;s
              production, book, calls, or pay. Anything about you specifically
              lives behind sign-in, visible only to you and the roles authorized
              to see it.
            </p>
            <p className="portal-fine">
              Licensed activity stays with licensed people. Nothing on this page
              is insurance advice, a coverage recommendation, or an offer of
              employment or compensation.
            </p>
          </article>
        </section>

        <section className="site-section">
          <article className="portal-card site-cta-card">
            <h2>Ready to sign in?</h2>
            <p className="portal-lede">
              Use the email you gave during onboarding. If access has not been
              assigned yet, text your personal recruiter — they request it for
              you.
            </p>
            <div className="site-hero-actions">
              <Link className="button button-primary" href="/access">
                Go to portal access <KeyGlyph />
              </Link>
              <Link className="text-link" href="/">
                About THRIVE <KeyGlyph />
              </Link>
            </div>
          </article>
        </section>
      </main>

      <PortalGovernanceFooter />
    </div>
  );
}
