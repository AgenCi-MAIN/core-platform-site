"use client";

import { useState } from "react";

const ranks = [
  {
    id: "01",
    mark: "I",
    name: "Origin",
    phase: "Calibrate",
    headline: "Map the cost of rented demand.",
    body: "Rank 01 starts with visibility. The agency proves it can trace paid-lead economics, identify the break-even line, and see whether placed business can carry the operating load.",
    metric: "500",
    unit: "paid leads / month",
    facts: ["$30 cost per lead", "20% planning close rate", "≈18.4% modeled break-even"],
  },
  {
    id: "02",
    mark: "II",
    name: "Signal",
    phase: "Prove",
    headline: "Prove quality before replacing spend.",
    body: "Rank 02 unlocks when Core routes useful, permissioned conversations—not raw call volume. Paid spend steps down only when self-generated demand produces equal or better placed and retained outcomes.",
    metric: "140",
    unit: "quality calls / day",
    facts: ["20 active agents", "7 routed calls per agent", "Source-to-outcome tracking"],
  },
  {
    id: "03",
    mark: "III",
    name: "Command",
    phase: "Control",
    headline: "Own the signal from source to retention.",
    body: "Rank 03 requires more than three months of stable production. Core becomes the control layer: preserving context, improving routing, and measuring outcomes through placement and retention.",
    metric: "210+",
    unit: "insurance calls / day",
    facts: ["90+ days stable", "250+ calls Mon–Wed", "Full quality ledger"],
  },
  {
    id: "04",
    mark: "IV",
    name: "Network",
    phase: "Distribute",
    headline: "Turn proven quality into network power.",
    body: "Rank 04 extends the proven internal system to partner agencies. Every opportunity carries its source, permission, need, qualification, handoff, and downstream result.",
    metric: "300",
    unit: "quality calls / day",
    facts: ["30 producing agents", "6,600 calls per month", "Accountable partner handoffs"],
  },
];

const pipeline = [
  ["01", "Source", "Know where demand began.", "Source ID · channel · permission"],
  ["02", "Qualify", "Capture need, urgency, and fit.", "Need summary · readiness · gaps"],
  ["03", "Route", "Match the right licensed owner.", "Reason · owner · response time"],
  ["04", "Apply", "Confirm before submission.", "AP written · disclosures · status"],
  ["05", "Place", "Follow the carrier decision.", "Placed AP · outcome · requirements"],
  ["06", "Retain", "Measure durable customer value.", "Persistence · complaints · chargebacks"],
];

const leadershipMetrics = [
  "Lead cost",
  "Response speed",
  "Application rate",
  "Placed AP",
  "Persistence",
  "Chargebacks",
  "Complaint rate",
  "Profit per placed policy",
];

export default function Home() {
  const [activeRank, setActiveRank] = useState(1);
  const rank = ranks[activeRank];

  return (
    <main>
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Core operating model home">
          <span className="brand-mark">C</span>
          <span className="brand-wordmark">CORE <i>Operating system</i></span>
        </a>
        <div className="nav-links">
          <a href="#ranks">Ranks</a>
          <a href="#quality">Quality</a>
          <a href="#scale">Scale</a>
        </div>
        <a className="nav-cta" href="#ranks">View the ranks <span>↘</span></a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-glow" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> Agency intelligence, end to end</p>
          <h1>From rented demand<br />to owned <em>intelligence.</em></h1>
          <p className="hero-lede">Core turns every lead, handoff, and carrier outcome into a visible operating system—so the agency can scale what works without losing the customer thread.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#ranks">Enter the rank system <span>↓</span></a>
            <a className="text-link" href="#quality">See the quality standard <span>↗</span></a>
          </div>
        </div>

        <div className="control-plane" aria-label="Core control plane preview">
          <div className="plane-topline">
            <div><span className="pulse" /> CORE / CONTROL PLANE</div>
            <span>RANK 02 / SIGNAL</span>
          </div>
          <div className="signal-orbit" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <div className="signal-core">CORE<span>QUALITY SIGNAL</span></div>
            <span className="signal-dot dot-one" />
            <span className="signal-dot dot-two" />
            <span className="signal-dot dot-three" />
          </div>
          <div className="plane-metrics">
            <div><span>QUALITY CALLS</span><strong>140</strong><small>/ day at Day 60</small></div>
            <div><span>ACTIVE AGENTS</span><strong>20</strong><small>licensed routing</small></div>
          </div>
          <div className="plane-flow" aria-hidden="true">
            <span>Source</span><i>→</i><span>Qualify</span><i>→</i><span>Route</span><i>→</i><span>Retain</span>
          </div>
        </div>

        <div className="hero-index" aria-hidden="true">CORE RANK / 01 — 04</div>
      </section>

      <section className="transition-strip" aria-label="Core rank progression">
        <p>CORE RANK SYSTEM</p>
        <div><span>I</span><strong>Origin</strong></div>
        <i>→</i>
        <div><span>II</span><strong>Signal</strong></div>
        <i>→</i>
        <div><span>III</span><strong>Command</strong></div>
        <i>→</i>
        <div><span>IV</span><strong>Network</strong></div>
      </section>

      <section className="scenarios section-light" id="ranks">
        <div className="section-heading">
          <div>
            <p className="kicker">Core maturity index</p>
            <h2>Four ranks.<br /><em>No shortcuts.</em></h2>
          </div>
          <p>Ranks are not titles. They are operating unlocks. Core advances only when the quality record proves the next level has been earned.</p>
        </div>

        <div className="scenario-tabs" role="tablist" aria-label="Core operating ranks">
          {ranks.map((item, index) => (
            <button
              key={item.id}
              className={index === activeRank ? "active" : ""}
              onClick={() => setActiveRank(index)}
              role="tab"
              aria-selected={index === activeRank}
              aria-controls="scenario-panel"
            >
              <span>{item.mark}</span>
              <strong>Rank {item.id}</strong>
              <small>{item.name} / {item.phase}</small>
            </button>
          ))}
        </div>

        <div className="scenario-panel" id="scenario-panel" role="tabpanel" aria-live="polite">
          <div className="scenario-marker"><span>{rank.mark}</span><small>Rank {rank.id}</small></div>
          <div className="scenario-story">
            <p className="micro-label">Core rank {rank.id} / {rank.name} / {rank.phase}</p>
            <h3>{rank.headline}</h3>
            <p>{rank.body}</p>
            <div className="scenario-facts">
              {rank.facts.map((fact) => <span key={fact}>✓ {fact}</span>)}
            </div>
          </div>
          <div className="scenario-number">
            <strong>{rank.metric}</strong>
            <span>{rank.unit}</span>
            <div className="mini-bars" aria-hidden="true">
              {[38, 55, 47, 72, 66, 84, 78, 96].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}
            </div>
          </div>
        </div>
      </section>

      <section className="quality" id="quality">
        <div className="quality-intro">
          <p className="kicker kicker-dark">The quality ledger</p>
          <h2>Volume is noise.<br /><em>Outcomes are signal.</em></h2>
          <p>A lead becomes valuable when its full story can be traced—from permission and need to placement, persistence, and customer experience.</p>
          <div className="quality-rule"><span>CORE STANDARD / 01</span><strong>Every handoff stays accountable.</strong></div>
        </div>
        <div className="pipeline-list">
          {pipeline.map(([number, title, description, record]) => (
            <article className="pipeline-row" key={number}>
              <span className="pipeline-number">{number}</span>
              <div><h3>{title}</h3><p>{description}</p></div>
              <span className="record-chip">{record}</span>
              <span className="row-arrow">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="proof-point">
        <div className="proof-label"><span>SIGNAL</span><small>Rank 02 / Day 60 proof</small></div>
        <div className="proof-equation" aria-label="20 agents times 7 quality calls equals 140 calls per day">
          <div><strong>20</strong><span>active agents</span></div><i>×</i>
          <div><strong>7</strong><span>quality calls</span></div><i>=</i>
          <div className="proof-result"><strong>140</strong><span>calls / day</span></div>
        </div>
        <p>Not a revenue promise. A measurable standard for useful, routed conversations.</p>
      </section>

      <section className="scale section-light" id="scale">
        <div className="section-heading scale-heading">
          <div>
            <p className="kicker">Rank 03 / Command</p>
            <h2>Scale without<br /><em>losing the thread.</em></h2>
          </div>
          <p>Stable production means the operating record survives every transition—from customer intent to licensed advice, carrier decision, and long-term policy outcome.</p>
        </div>

        <div className="scale-grid">
          <article className="scale-card scale-card-main">
            <div className="card-top"><span>DAILY OPERATING FLOOR</span><span>01</span></div>
            <strong>210<span>+</span></strong>
            <h3>insurance calls / day</h3>
            <p>With a higher operating cadence of 250+ calls Monday through Wednesday.</p>
            <div className="cadence" aria-label="Illustrative weekly call cadence">
              {[92, 96, 90, 74, 68].map((height, index) => <div key={height}><i style={{ height: `${height}%` }} /><span>{["M", "T", "W", "T", "F"][index]}</span></div>)}
            </div>
          </article>
          <article className="scale-card">
            <div className="card-top"><span>PLANNING INVESTMENT</span><span>02</span></div>
            <strong>$180K</strong>
            <h3>build estimate</h3>
            <p>A working planning assumption—not a guarantee, quote, or fixed operating cost.</p>
          </article>
          <article className="scale-card scale-card-accent">
            <div className="card-top"><span>TWO-YEAR DIRECTION</span><span>03</span></div>
            <strong>300</strong>
            <h3>quality calls / day</h3>
            <p>30 producing agents × 10 quality calls, creating 6,600 monthly calls at 22 business days.</p>
          </article>
        </div>
      </section>

      <section className="partner">
        <p className="kicker kicker-partner">Rank 04 / Network</p>
        <div className="partner-grid">
          <h2>Turn proven quality into a <em>partner advantage.</em></h2>
          <div>
            <p>Once Core demonstrates quality internally, the same documented opportunity can power accountable partner-agency distribution.</p>
            <ul>
              <li><span>01</span> Traceable source</li>
              <li><span>02</span> Appropriate contact permission</li>
              <li><span>03</span> Clear need and qualification notes</li>
              <li><span>04</span> Accountable handoff and outcome</li>
            </ul>
          </div>
        </div>
        <div className="partner-statement">The product is not a promise of sales. <strong>It is a documented opportunity.</strong></div>
      </section>

      <section className="leadership">
        <div className="leadership-copy">
          <p className="kicker kicker-dark">Leadership view</p>
          <h2>Measure what makes<br />the business <em>durable.</em></h2>
          <p>The goal is not hidden activity or raw volume. It is a reliable pipeline that improves service and creates measurable, retained business.</p>
        </div>
        <div className="metric-grid">
          {leadershipMetrics.map((metric, index) => (
            <div key={metric}><span>{String(index + 1).padStart(2, "0")}</span><strong>{metric}</strong><i>↗</i></div>
          ))}
        </div>
      </section>

      <footer>
        <div className="footer-brand"><span className="brand-mark">C</span><strong>CORE</strong></div>
        <p>This site describes internal operating ranks and editable planning assumptions. It is not an income claim, insurance offer, legal advice, or a promise of lead volume, placement, or commission. Carrier terms, licensing requirements, consumer-consent rules, and actual operating records control real-world results.</p>
        <div className="footer-meta"><span>CORE RANK / 01—04</span><a href="#top">Back to top ↑</a></div>
      </footer>
    </main>
  );
}
