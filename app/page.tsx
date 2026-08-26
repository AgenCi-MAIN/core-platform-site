import Link from "next/link";
import { KeyGlyph } from "./key-glyph";
import { PortalGovernanceFooter } from "./portal-chrome";
import { RankMedallion, type Metal } from "./rank-medallion";
import { SiteTopbar } from "./site-chrome";

/**
 * Public overview for IMO.
 *
 * Rebuilt on the portal's design system: the same `.portal` token scope, the
 * same card and topbar language, the same Bright/Dark control. A recruit who
 * reads this page and then signs in should recognise the place.
 *
 * This page is public and therefore carries no member, book, call, or audit
 * data. The rank figures are the designed structure, labelled as an
 * illustration of the model — never an operating result or an offer.
 */

const RANKS = [
  {
    id: "01",
    mark: "I",
    name: "Ember",
    phase: "Bronze / Captive",
    headline: "Learn to protect the first dollar.",
    body: "The foundation rank teaches the full policy economy: annual premium, advance exposure, residual value, placement, and the cost of losing a case before month nine.",
    metric: "50%",
    metal: "bronze" as Metal,
  },
  {
    id: "02",
    mark: "II",
    name: "Vector",
    phase: "Silver / Producer",
    headline: "Consistency creates direction.",
    body: "Vector is earned through repeatable production, not one hot month. AP, commission, advance, lead cost, and deposited cash stay separated so an agent can see what performance actually survives.",
    metric: "80%",
    metal: "silver" as Metal,
  },
  {
    id: "03",
    mark: "III",
    name: "Apex",
    phase: "Gold",
    headline: "Production earns altitude. Quality keeps it.",
    body: "Apex recognizes the producer who can place business without hollowing out the book. Promotion blends sustained AP with retention, chargeback control, clean files, and customer outcomes.",
    metric: "95%",
    metal: "gold" as Metal,
  },
  {
    id: "04",
    mark: "IV",
    name: "Dominion",
    phase: "Diamond / Core 1.0",
    headline: "Own the book, not just the leaderboard.",
    body: "Dominion is the first complete operator rank: production, retention, coaching, and operational discipline move together. It rewards durable influence, not only personal output.",
    metric: "100%",
    metal: "diamond" as Metal,
  },
  {
    id: "05",
    mark: "V",
    name: "Zenith",
    phase: "Obsidian / Core 2.0",
    headline: "The system compounds through you.",
    body: "Zenith is not simply the highest contract. It is the operator who produces, protects the book, upgrades the team, and leaves the intelligence layer stronger after every call and every case.",
    metric: "110%",
    metal: "obsidian" as Metal,
  },
] as const;

const PILLARS = [
  {
    mark: "S",
    title: "Fund a verified signal",
    body: "Don't sell a list. A signal carries its own provenance — where it came from, what was said, what was verified, and what it cost. Anything that cannot show its origin is not a signal.",
  },
  {
    mark: "C",
    title: "Every carrier answer",
    body: "One intelligence layer instead of nine portals and a group chat. When a carrier rule changes, the answer changes everywhere at once, and the agent on a live call sees the current one.",
  },
  {
    mark: "M",
    title: "Every signal becomes the next move",
    body: "A conversation that ends without changing what happens next was overhead. Outcomes route back in, so the following call starts further ahead than the last one did.",
  },
] as const;

const INTELLIGENCE = [
  {
    mark: "R",
    title: "Find the five minutes that matter",
    body: "Don't replay the hour. Review lands on the moments that decided the outcome — the objection, the pause, the point the conversation turned — so coaching is specific instead of general.",
  },
  {
    mark: "V",
    title: "Scripts should learn",
    body: "Agents should still sound human. Language is versioned, owned, and compliance-reviewed, and what works is folded back in rather than passed around as folklore.",
  },
  {
    mark: "P",
    title: "Portfolio memory gets smarter",
    body: "What one agent learns on a hard case should make the next agent's case easier. Knowledge that leaves when a person leaves was never an asset.",
  },
] as const;

export default function Home() {
  return (
    <div className="portal site-page">
      <SiteTopbar section="Overview" cta={{ href: "/access", label: "Portal access" }} />

      <main className="site-main">
        <section className="site-hero">
          <p className="portal-eyebrow">IMO — Agency operating model</p>
          <h1>
            From rented demand<span> to owned intelligence.</span>
          </h1>
          <p className="site-hero-lede">
            Most agencies rent their demand: buy a list, dial it until it is
            dead, buy another. The economics only work while leads stay cheap
            and people stay disposable. IMO is built the other way round — so
            every conversation leaves something behind that the agency keeps.
          </p>
          <div className="site-hero-actions">
            <Link className="button button-primary" href="/access">
              Portal access <KeyGlyph />
            </Link>
            <Link className="text-link" href="/tour">
              New here? Start onboarding <KeyGlyph />
            </Link>
          </div>

          <div className="site-command">
            <div className="site-command-brand">
              <span className="site-pulse" aria-hidden="true" />
              J.A.R.V.I.S. / COMMAND
            </div>
            <div className="site-command-grid">
              <div>
                <strong>GOAL ENGINE</strong>
                <small>Turn ambition into an operating pace</small>
              </div>
              <div>
                <strong>N-001</strong>
                <small>Reference call review record</small>
              </div>
              <div>
                <strong>Deny by default</strong>
                <small>Six roles, ten capabilities, every decision logged</small>
              </div>
            </div>
          </div>
        </section>

        <section className="site-section" id="ranks">
          <header className="site-section-head">
            <p className="portal-eyebrow">Advancement</p>
            <h2>Five ranks. No shortcuts.</h2>
            <p className="portal-lede">
              The path is published before you walk it. Nobody should have to
              guess what advancement requires, or discover the rules moved after
              they hit the number.
            </p>
          </header>

          <div className="rank-grid">
            {RANKS.map((rank) => (
              <article className={`portal-card rank-card rank-card-${rank.metal}`} key={rank.id}>
                <div className="rank-top">
                  <RankMedallion metal={rank.metal} numeral={rank.mark} size={42} />
                  <span className="rank-id">
                    <strong>{rank.name}</strong>
                    <small>{rank.phase}</small>
                  </span>
                  <span className="rank-metric">
                    <strong>{rank.metric}</strong>
                    <small>contract level</small>
                  </span>
                </div>
                <h3>{rank.headline}</h3>
                <p>{rank.body}</p>
              </article>
            ))}
          </div>
          <p className="portal-fine">
            Contract levels shown are the designed rank structure. They
            illustrate the model — they are not a quote, an offer, or a record
            of any individual&apos;s compensation.
          </p>
        </section>

        <section className="site-section">
          <header className="site-section-head">
            <p className="portal-eyebrow">The operating idea</p>
            <h2>Volume is noise. Outcomes are signal.</h2>
            <p className="portal-lede">
              A hundred dials that produce nothing you can act on is not effort.
              It is waste wearing the costume of effort.
            </p>
          </header>
          <div className="site-pillars">
            {PILLARS.map((p) => (
              <article className="portal-card site-pillar" key={p.title}>
                <span className="site-pillar-mark" aria-hidden="true">{p.mark}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="site-section">
          <header className="site-section-head">
            <p className="portal-eyebrow">Conversation intelligence</p>
            <h2>The call is the asset.</h2>
            <p className="portal-lede">
              Everything downstream — coaching, scripts, carrier answers,
              portfolio memory — is built out of what actually got said.
            </p>
          </header>
          <div className="site-pillars">
            {INTELLIGENCE.map((p) => (
              <article className="portal-card site-pillar" key={p.title}>
                <span className="site-pillar-mark" aria-hidden="true">{p.mark}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="site-section">
          <article className="portal-card site-boundary">
            <span className="script-governance-tag">System boundary</span>
            <h2>What this system will not do.</h2>
            <p className="portal-lede">
              Licensed activity stays with licensed people. J.A.R.V.I.S. does
              not give insurance advice, recommend coverage, bind policies, or
              make employment and compensation decisions. Compliance takes
              priority over production — not as a slogan, but as the reason any
              of this is durable.
            </p>
            <p className="portal-fine">
              Where a system is not connected yet, this portal says so rather
              than showing a number that looks impressive and means nothing.
            </p>
          </article>
        </section>

        <section className="site-section">
          <article className="portal-card site-cta-card">
            <h2>Already onboarded?</h2>
            <p className="portal-lede">
              Sign in with the email IMO has on file for you. Access is
              assigned by name before your first sign-in — it is never
              self-served.
            </p>
            <div className="site-hero-actions">
              <Link className="button button-primary" href="/access">
                Go to portal access <KeyGlyph />
              </Link>
              <Link className="text-link" href="/portal">
                Portal <KeyGlyph />
              </Link>
            </div>
            <p className="portal-fine">
              Not onboarded yet? Your recruiter starts that process — the portal
              cannot.
            </p>
          </article>
        </section>
      </main>

      <PortalGovernanceFooter />
    </div>
  );
}
