"use client";

import { useState } from "react";

const ranks = [
  {
    id: "01",
    mark: "I",
    name: "Ember",
    phase: "Bronze / Captive",
    headline: "Learn to protect the first dollar.",
    body: "The foundation rank teaches the full policy economy: annual premium, advance exposure, residual value, placement, and the cost of losing a case before month nine.",
    metric: "50%",
    unit: "contract level",
    economics: { commission: "$600", advance: "$450", residual: "$150" },
    facts: ["$1,200 annual premium example", "9-month advance = 75%", "Book-quality proof starts here"],
  },
  {
    id: "02",
    mark: "II",
    name: "Vector",
    phase: "Silver / Producer",
    headline: "Consistency creates direction.",
    body: "Vector is earned through repeatable production, not one hot month. Core separates AP, commission, advance, lead cost, and deposited cash so the agent can see what performance actually survives.",
    metric: "80%",
    unit: "contract level",
    economics: { commission: "$960", advance: "$720", residual: "$240" },
    facts: ["Proposed gate: $25K AP x 3 months", "Lead spend stays visible", "Chargeback risk stays in the score"],
  },
  {
    id: "03",
    mark: "III",
    name: "Apex",
    phase: "Gold / Thrive",
    headline: "Production earns altitude. Quality keeps it.",
    body: "Apex recognizes the producer who can place business without hollowing out the book. Promotion blends sustained AP with retention, chargeback control, clean files, and customer outcomes.",
    metric: "95%",
    unit: "contract level",
    economics: { commission: "$1,140", advance: "$855", residual: "$285" },
    facts: ["Proposed gate: $35K placed AP x 3", "85%+ 13-month persistence", "Chargeback ratio at or below 8%"],
  },
  {
    id: "04",
    mark: "IV",
    name: "Dominion",
    phase: "Diamond / Core 1.0",
    headline: "Own the book, not just the leaderboard.",
    body: "Dominion is the first complete Core operator rank: production, retention, coaching, and operational discipline move together. It rewards durable influence, not only personal output.",
    metric: "100%",
    unit: "contract level",
    economics: { commission: "$1,200", advance: "$900", residual: "$300" },
    facts: ["Proposed gate: $50K placed AP x 3", "88%+ 13-month persistence", "Mentor one Vector producer"],
  },
  {
    id: "05",
    mark: "V",
    name: "Zenith",
    phase: "Obsidian / Core 2.0",
    headline: "The system compounds through you.",
    body: "Zenith is not simply the highest contract. It is the operator who produces, protects the book, upgrades the team, and leaves the intelligence layer stronger after every call and every case.",
    metric: "110%",
    unit: "contract level",
    economics: { commission: "$1,320", advance: "$990", residual: "$330" },
    facts: ["Producer or builder promotion path", "90%+ persistence / 5% max chargeback", "Manager-approved quality contribution"],
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

const carrierTabs = ["Tiers", "Underwriting", "Build", "Riders", "Support"];

const carrierTiers = [
  { name: "Preferred", ages: "50–75", face: "$25K–$40K", benefit: "Immediate", tone: "lime" },
  { name: "Standard", ages: "50–85", face: "$5K–$40K", benefit: "Immediate", tone: "mint" },
  { name: "Graded", ages: "50–85", face: "$5K–$20K", benefit: "Graded", tone: "orange" },
  { name: "Guaranteed", ages: "50–80", face: "$3K–$10K", benefit: "Limited", tone: "paper" },
];

const underwritingTopics = [
  { name: "COPD / respiratory", signal: "Review oxygen use, severity, medication, and recent hospitalization.", route: "Compare Standard → Graded" },
  { name: "Diabetes", signal: "Confirm onset age, control, complications, insulin use, and build.", route: "Run full tier check" },
  { name: "Cancer history", signal: "Capture type, stage, treatment end date, and recurrence history.", route: "Recency drives route" },
  { name: "Stroke / TIA", signal: "Verify event date, recurrence, residual effects, and current treatment.", route: "Recency drives route" },
  { name: "Oxygen use", signal: "Separate current use from past use and document the underlying condition.", route: "Knockout check first" },
];

const commandViews = {
  Today: [
    { priority: "P1", title: "Recover 3 pending requirements", detail: "Carrier response window closes today", impact: "$4.8K AP" },
    { priority: "P1", title: "Re-route 11 quality leads", detail: "Licensing and carrier fit changed overnight", impact: "11 moves" },
    { priority: "P2", title: "Coach the opening 30 seconds", detail: "7 reviewed calls show the same early drop-off", impact: "+8% signal" },
  ],
  Book: [
    { priority: "P1", title: "Protect 2 at-risk policies", detail: "Payment and retention signals need follow-up", impact: "$2.1K AP" },
    { priority: "P2", title: "Resolve one stale requirement", detail: "No carrier movement in 72 hours", impact: "1 case" },
    { priority: "P3", title: "Review the 13-month cohort", detail: "Persistence is above plan; isolate why", impact: "94% kept" },
  ],
  Coach: [
    { priority: "P1", title: "Review the winning objection path", detail: "A new phrase is outperforming baseline", impact: "+12% close" },
    { priority: "P2", title: "Share one annotated call", detail: "Best match for developing agents", impact: "08:42 clip" },
    { priority: "P3", title: "Refresh the master script", detail: "18 sold calls now support the update", impact: "v3 ready" },
  ],
  Growth: [
    { priority: "P1", title: "Unblock 4 carrier appointments", detail: "Two agents are one approval from ready", impact: "4 gaps" },
    { priority: "P2", title: "Advance 3 Signal agents", detail: "Quality threshold met; retention proof remains", impact: "3 near rank" },
    { priority: "P3", title: "Open one partner lane", detail: "Capacity supports a controlled pilot", impact: "25 leads" },
  ],
};

const callFilters = ["All inbound", "Won", "Lost", "Needs review"];

const callLibrary = [
  {
    id: "N-001",
    intent: "Unexpected billing",
    angle: "Service to full policy review",
    outcome: "Needs review",
    duration: "1:03:41",
    score: 79,
    delta: "+06",
    vitals: [91, 93, 72, 76],
    summary: "Nate validates a stressful $723 billing concern, inventories multiple policies, uncovers a loan and waiting-period exposure, and earns enough trust to discuss a broader review. The call creates real advisory value, but the original service problem stays open and the close depends on an unconfirmed callback.",
    pattern: "Strong empathy and deep discovery create authority; permission and a tighter decision checkpoint would make the pivot feel earned sooner.",
    next: "Rebuild the 03:31 pivot with explicit permission, compress the middle, verify every carrier claim, and lock a precise callback commitment.",
    moments: [
      ["00:43", "Concern validated", "trust"],
      ["03:31", "Policy-review pivot", "pivot"],
      ["25:40", "Health discovery", "compliance"],
      ["29:36", "Waiting-period gap", "pitch"],
      ["61:19", "Risks finally stacked", "risk"],
      ["62:47", "Callback recovery", "outcome"],
    ],
  },
  {
    id: "C-1042",
    intent: "Update payment",
    angle: "Standard to preferred",
    outcome: "Won",
    duration: "24:15",
    score: 92,
    delta: "+14",
    vitals: [95, 88, 84, 97],
    summary: "A service request became a policy-quality conversation after the agent exposed a waiting-period gap, rebuilt trust, and confirmed the next step.",
    pattern: "Name the hidden policy problem before presenting the alternative.",
    next: "Share the 05:38-08:19 sequence with Signal-rank agents.",
    moments: [
      ["00:07", "Permission + identity", "trust"],
      ["02:13", "Coverage discovery", "discovery"],
      ["05:38", "Waiting-period gap", "pivot"],
      ["08:19", "Preferred route", "pitch"],
      ["11:52", "Decision sequence", "close"],
      ["22:16", "Application submitted", "outcome"],
    ],
  },
  {
    id: "C-1038",
    intent: "Policy information",
    angle: "Work policy",
    outcome: "Lost",
    duration: "13:28",
    score: 61,
    delta: "-09",
    vitals: [72, 66, 48, 83],
    summary: "The caller had a clear life transition and policy concern, but the conversation stayed procedural too long and the underlying decision never became concrete.",
    pattern: "The first emotional reason appeared early; the decision frame arrived too late.",
    next: "Coach a 90-second transition from service question to decision map.",
    moments: [
      ["00:12", "Greeting", "trust"],
      ["01:24", "Life transition", "discovery"],
      ["02:04", "Policy type check", "discovery"],
      ["05:41", "Decision drift", "risk"],
      ["09:08", "Unclear route", "risk"],
      ["13:12", "No committed next step", "outcome"],
    ],
  },
  {
    id: "C-1031",
    intent: "Cash surrender",
    angle: "Consolidation",
    outcome: "Won",
    duration: "30:56",
    score: 88,
    delta: "+11",
    vitals: [92, 90, 83, 89],
    summary: "The agent slowed the surrender request into a full needs review, connected the existing policy to the caller's real goal, and kept the route understandable.",
    pattern: "Acknowledge the request, then widen the frame with one consequence question.",
    next: "Promote the consequence question into the master playbook.",
    moments: [
      ["00:18", "Service intent", "trust"],
      ["03:42", "Goal uncovered", "discovery"],
      ["08:11", "Consequence question", "pivot"],
      ["14:20", "Options compared", "pitch"],
      ["25:04", "Objection resolved", "close"],
      ["30:12", "Route confirmed", "outcome"],
    ],
  },
  {
    id: "C-1026",
    intent: "Quote shopper",
    angle: "Non-life entry",
    outcome: "Lost",
    duration: "27:42",
    score: 67,
    delta: "-05",
    vitals: [80, 76, 51, 78],
    summary: "The caller volunteered strong buying intent and frustration with spam, but trust was not converted into a clean, owned follow-up commitment.",
    pattern: "High intent is fragile when the caller has already been over-contacted.",
    next: "Trigger a consent-first callback plan before collecting more detail.",
    moments: [
      ["00:40", "Buying intent", "discovery"],
      ["01:00", "Spam frustration", "trust"],
      ["01:21", "Agent reassurance", "trust"],
      ["06:35", "Needs mapped", "pitch"],
      ["18:02", "Friction rises", "risk"],
      ["27:18", "Follow-up not owned", "outcome"],
    ],
  },
  {
    id: "C-1019",
    intent: "Death claim",
    angle: "Service only",
    outcome: "Needs review",
    duration: "28:31",
    score: 74,
    delta: "+02",
    vitals: [86, 72, 68, 93],
    summary: "A sensitive service call required precision and empathy. Core separates service quality from sales outcome so the right behavior is rewarded.",
    pattern: "Not every valuable inbound call should be forced into a sales score.",
    next: "Audit verification, empathy, and handoff completion as the success criteria.",
    moments: [
      ["00:15", "Calm greeting", "trust"],
      ["00:25", "Claim intent", "discovery"],
      ["00:58", "Relationship verified", "compliance"],
      ["04:10", "Carrier identified", "discovery"],
      ["18:44", "Handoff prepared", "close"],
      ["27:50", "Service route", "outcome"],
    ],
  },
];

const scriptLibrary = [
  {
    id: "SV-01",
    name: "Service to Review",
    intent: "Inbound service",
    evidence: "Use when the original service path is clear and the caller grants permission to widen the review.",
    guardrail: "Do not imply carrier affiliation or promise a service resolution you cannot control.",
    steps: [
      ["01", "Stabilize", "Name the problem back in plain language and state exactly what you can do next."],
      ["02", "Permission bridge", "While I investigate that, would it help if I checked whether the rest of the coverage still matches what you need?"],
      ["03", "Inventory", "Map carrier, policy type, premium, benefit, ownership, and the customer's reason for keeping it."],
      ["04", "Decision map", "Separate urgent service work from optional coverage decisions and assign a next step to each."],
    ],
  },
  {
    id: "SV-02",
    name: "Gap Before Option",
    intent: "Waiting period / policy fit",
    evidence: "Use only after the relevant policy detail is verified and the customer understands why it matters.",
    guardrail: "Treat carrier materials and licensed review as controlling; never present an estimate as approval.",
    steps: [
      ["01", "Verify", "Confirm the actual benefit period, issue date, and current status before naming a gap."],
      ["02", "Translate", "Explain the consequence in the customer's own time horizon without fear language."],
      ["03", "Compare", "Show keep, change, and defer paths with cost, benefit, and uncertainty side by side."],
      ["04", "Confirm", "Ask the customer to explain the tradeoff back before moving toward an application."],
    ],
  },
  {
    id: "SV-03",
    name: "One-Book Review",
    intent: "Consolidation",
    evidence: "Use when multiple policies create confusion, duplicated cost, unclear ownership, or unmanaged loan exposure.",
    guardrail: "A simpler portfolio is not automatically a better portfolio; preserve valuable guarantees and verify surrender impact.",
    steps: [
      ["01", "Map", "Build one visible inventory with policy purpose, cost, benefit, status, and beneficiary."],
      ["02", "Protect", "Flag anything that could lapse, lose value, restart a waiting period, or create tax consequences."],
      ["03", "Prioritize", "Rank gaps by customer harm and urgency instead of by commission opportunity."],
      ["04", "Stage", "Make the smallest safe change first and document why the remaining policies stay untouched."],
    ],
  },
  {
    id: "SV-04",
    name: "Callback Recovery",
    intent: "Dropped / interrupted call",
    evidence: "Use when the conversation loses connection or time before a clear decision is complete.",
    guardrail: "Confirm consent, number, time window, and purpose; do not use a callback to bypass contact preferences.",
    steps: [
      ["01", "Recap", "State the one unresolved issue and the one decision still open."],
      ["02", "Lock", "Confirm the exact callback number and a narrow time window."],
      ["03", "Prepare", "Tell the customer what you will verify and what they should have ready."],
      ["04", "Own", "Create the task before hanging up and close it only after the outcome is logged."],
    ],
  },
];

export default function Home() {
  const [activeRank, setActiveRank] = useState(4);
  const [activeCarrierTab, setActiveCarrierTab] = useState("Tiers");
  const [underwritingSearch, setUnderwritingSearch] = useState("");
  const [activeCommandView, setActiveCommandView] = useState<keyof typeof commandViews>("Today");
  const [activeCallFilter, setActiveCallFilter] = useState("All inbound");
  const [activeCallId, setActiveCallId] = useState(callLibrary[0].id);
  const [activeScript, setActiveScript] = useState(0);
  const [annualTarget, setAnnualTarget] = useState(400000);
  const [monthlySignals, setMonthlySignals] = useState(500);
  const [signalPrice, setSignalPrice] = useState(45);
  const rank = ranks[activeRank];
  const filteredTopics = underwritingTopics.filter((topic) =>
    `${topic.name} ${topic.signal} ${topic.route}`.toLowerCase().includes(underwritingSearch.toLowerCase()),
  );
  const monthlyTarget = annualTarget / 12;
  const weeklyTarget = annualTarget / 50;
  const placedPolicies = Math.ceil(annualTarget / 780);
  const dailyConversations = Math.ceil(placedPolicies / 0.7 / 0.2 / 250);
  const visibleCalls = activeCallFilter === "All inbound" ? callLibrary : callLibrary.filter((call) => call.outcome === activeCallFilter);
  const selectedCall = callLibrary.find((call) => call.id === activeCallId) ?? callLibrary[0];
  const selectedScript = scriptLibrary[activeScript];
  const fundedCapacity = monthlySignals * signalPrice;
  const qualityReserve = fundedCapacity * 0.15;
  const releasedBilling = fundedCapacity - qualityReserve;
  const formatMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

  return (
    <main>
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Core operating model home">
          <span className="brand-mark">C</span>
          <span className="brand-wordmark">CORE <i>Operating system</i></span>
        </a>
        <div className="nav-links">
          <a href="#ranks">Ranks</a>
          <a href="#carrier-intelligence">CarrierOS</a>
          <a href="#command-system">Command</a>
          <a href="#call-intelligence">Call Lab</a>
        </div>
        <a className="nav-cta" href="#command-system">Enter Core <span>↘</span></a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-glow" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> Agency intelligence, end to end</p>
          <h1>From rented demand<br />to owned <em>intelligence.</em></h1>
          <p className="hero-lede">Core is an in-house signal exchange: every permissioned conversation, handoff, and carrier outcome becomes a visible operating record—so partners fund defined opportunity, not anonymous lead volume.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#ranks">Enter the rank system <span>↓</span></a>
            <a className="text-link" href="#quality">See the quality standard <span>↗</span></a>
          </div>
        </div>

        <div className="control-plane" aria-label="Core control plane preview">
          <div className="plane-topline">
            <div><span className="pulse" /> CORE / CONTROL PLANE</div>
            <span>RANK 05 / ZENITH</span>
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
            <div><span>PEAK CONTRACT</span><strong>110%</strong><small>quality-gated</small></div>
            <div><span>CALL MEMORY</span><strong>68</strong><small>inbound records</small></div>
          </div>
          <div className="plane-flow" aria-hidden="true">
            <span>Source</span><i>→</i><span>Qualify</span><i>→</i><span>Route</span><i>→</i><span>Retain</span>
          </div>
        </div>

        <div className="hero-index" aria-hidden="true">CORE RANK / 01 — 05</div>
      </section>

      <section className="transition-strip" aria-label="Core rank progression">
        <p>CORE RANK SYSTEM</p>
        <div><span>I</span><strong>Ember</strong></div>
        <i>→</i>
        <div><span>II</span><strong>Vector</strong></div>
        <i>→</i>
        <div><span>III</span><strong>Apex</strong></div>
        <i>→</i>
        <div><span>IV</span><strong>Dominion</strong></div>
        <i>→</i>
        <div><span>V</span><strong>Zenith</strong></div>
      </section>

      <section className="scenarios section-light" id="ranks">
        <div className="section-heading">
          <div>
            <p className="kicker">Core maturity index</p>
            <h2>Five ranks.<br /><em>No shortcuts.</em></h2>
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
            <div className="rank-economics" aria-label={`Rank ${rank.id} commission example on $1,200 annual premium`}>
              <div><span>Total commission</span><strong>{rank.economics.commission}</strong></div>
              <div><span>9-month advance</span><strong>{rank.economics.advance}</strong></div>
              <div><span>3-month residual</span><strong>{rank.economics.residual}</strong></div>
            </div>
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

      <section className="signal-exchange" id="signal-exchange">
        <div className="exchange-heading">
          <div>
            <p className="kicker kicker-dark">In-house leads / commercial model</p>
            <h2>Don't sell a list.<br /><em>Fund a verified signal.</em></h2>
          </div>
          <p>Core separates lead money from policy money. Partners reserve capacity, billing releases against a documented opportunity standard, and a quality reserve stays visible until delivery issues are reconciled.</p>
        </div>

        <div className="exchange-shell">
          <div className="exchange-flow">
            {[
              ["01", "Fund the lane", "A partner sets geography, licensing, hours, volume, and a capacity budget before routing begins."],
              ["02", "Verify the signal", "Identity, contact permission, need, timestamp, source, and routing reason travel with the opportunity."],
              ["03", "Reconcile delivery", "Invalid, duplicate, unreachable, or out-of-scope records move into a visible review and replacement lane."],
              ["04", "Learn from outcome", "Disposition improves future routing and quality scoring; the fee is never contingent on an insurance purchase."],
            ].map(([number, title, body]) => (
              <article key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p><i>&rarr;</i></article>
            ))}
          </div>

          <aside className="exchange-calculator">
            <div className="exchange-calculator-head"><span>CAPACITY MODEL</span><small>ILLUSTRATIVE</small></div>
            <label htmlFor="monthly-signals">Verified opportunities / month <strong>{monthlySignals}</strong></label>
            <input id="monthly-signals" type="range" min="100" max="2000" step="50" value={monthlySignals} onChange={(event) => setMonthlySignals(Number(event.target.value))} />
            <label htmlFor="signal-price">Funding per verified signal <strong>{formatMoney(signalPrice)}</strong></label>
            <input id="signal-price" type="range" min="20" max="100" step="5" value={signalPrice} onChange={(event) => setSignalPrice(Number(event.target.value))} />
            <div className="exchange-ledger">
              <div><span>Funded capacity</span><strong>{formatMoney(fundedCapacity)}</strong></div>
              <div><span>Released at verification</span><strong>{formatMoney(releasedBilling)}</strong></div>
              <div><span>15% quality reserve</span><strong>{formatMoney(qualityReserve)}</strong></div>
            </div>
            <p>Planning model only. Final pricing, taxes, refunds, replacements, consent rules, telemarketing requirements, and commercial terms require legal and compliance approval.</p>
          </aside>
        </div>
        <div className="exchange-standard"><span>CORE VERIFIED SIGNAL</span><strong>Source + permission + need + routing fit + accountable disposition.</strong><small>Not a promise of sale or placement.</small></div>
      </section>

      <section className="carrier-intelligence" id="carrier-intelligence">
        <div className="carrier-heading">
          <div>
            <p className="kicker kicker-dark">CarrierOS / Rank 03 capability</p>
            <h2>Every carrier answer.<br /><em>One intelligence layer.</em></h2>
          </div>
          <p>Core keeps approval tiers, underwriting signals, field guidance, and support paths in one fast workspace—without stripping licensed agents of judgment.</p>
        </div>

        <div className="carrier-shell">
          <aside className="carrier-rail" aria-label="Carrier library">
            <div className="rail-label"><span>ACTIVE LIBRARY</span><strong>05</strong></div>
            {[
              ["RN", "Royal Neighbors", "Live"],
              ["AH", "American Home Life", "Ready"],
              ["CB", "Corebridge", "Ready"],
              ["TA", "Transamerica", "Ready"],
              ["AA", "American Amicable", "Ready"],
            ].map(([mark, name, status], index) => (
              <div className={`carrier-rail-item ${index === 0 ? "active" : ""}`} key={name}>
                <span>{mark}</span><div><strong>{name}</strong><small>{status}</small></div><i>{index === 0 ? "●" : "○"}</i>
              </div>
            ))}
            <div className="rail-foot"><span>SYNC STATUS</span><strong><i /> Source checked</strong></div>
          </aside>

          <div className="carrier-workspace">
            <div className="carrier-overview">
              <div>
                <p>Carrier intelligence / 01</p>
                <h3>Royal Neighbors<br />of America</h3>
                <span>Final expense focus · Voice signature · Four-tier ladder</span>
              </div>
              <div className="carrier-score"><small>CORE FIT SCORE</small><strong>94</strong><span>/ 100</span></div>
            </div>

            <div className="carrier-tablist" role="tablist" aria-label="Carrier intelligence sections">
              {carrierTabs.map((tabName) => (
                <button
                  key={tabName}
                  className={activeCarrierTab === tabName ? "active" : ""}
                  onClick={() => setActiveCarrierTab(tabName)}
                  role="tab"
                  aria-selected={activeCarrierTab === tabName}
                >{tabName}</button>
              ))}
            </div>

            <div className="carrier-panel" role="tabpanel" aria-live="polite">
              {activeCarrierTab === "Tiers" && (
                <div className="tier-grid">
                  {carrierTiers.map((tier, index) => (
                    <article className={`tier-card ${tier.tone}`} key={tier.name}>
                      <div><span>0{index + 1}</span><small>{tier.benefit} benefit</small></div>
                      <h4>{tier.name}</h4>
                      <dl><div><dt>Issue ages</dt><dd>{tier.ages}</dd></div><div><dt>Face amount</dt><dd>{tier.face}</dd></div></dl>
                    </article>
                  ))}
                </div>
              )}

              {activeCarrierTab === "Underwriting" && (
                <div className="underwriting-panel">
                  <div className="underwriting-search">
                    <label htmlFor="condition-search">Underwriting lookup</label>
                    <div><input id="condition-search" value={underwritingSearch} onChange={(event) => setUnderwritingSearch(event.target.value)} placeholder="Search COPD, diabetes, cancer, stroke, oxygen…" /><span>⌕</span></div>
                  </div>
                  <div className="underwriting-results">
                    {filteredTopics.length ? filteredTopics.map((topic, index) => (
                      <article key={topic.name}><span>0{index + 1}</span><div><h4>{topic.name}</h4><p>{topic.signal}</p></div><strong>{topic.route}</strong></article>
                    )) : <p className="no-result">No saved signal matches that search. Route it for manual review.</p>}
                  </div>
                </div>
              )}

              {activeCarrierTab === "Build" && (
                <div className="carrier-explainer"><span>BUILD / 03</span><h4>Put the chart beside the decision.</h4><p>Capture height, weight, age band, tobacco status, and tier target in the same view. Core flags missing inputs before an agent treats an estimate as an answer.</p><div><strong>01</strong> Profile complete <i>→</i><strong>02</strong> Chart matched <i>→</i><strong>03</strong> Agent verified</div></div>
              )}

              {activeCarrierTab === "Riders" && (
                <div className="carrier-explainer"><span>RIDERS / 04</span><h4>Show availability without overpromising.</h4><p>Rider inventory, issue limits, and state availability remain linked to the current carrier materials. Agents see what to verify, not a false guarantee of approval.</p><div><strong>Inventory</strong> Current <i>·</i><strong>State check</strong> Required <i>·</i><strong>Final review</strong> Licensed agent</div></div>
              )}

              {activeCarrierTab === "Support" && (
                <div className="carrier-explainer"><span>SUPPORT / 05</span><h4>Escalate with the whole case attached.</h4><p>Every question carries the customer context, proposed tier, open requirement, and last action so support can answer the real issue without restarting the conversation.</p><div><strong>Case context</strong> Attached <i>→</i><strong>Owner</strong> Assigned <i>→</i><strong>Outcome</strong> Logged</div></div>
              )}
            </div>

            <div className="carrier-disclaimer"><span>LIVE GUIDE / INTERNAL</span><p>Illustrative planning guidance only. Current carrier materials, state availability, underwriting, and licensed-agent review control every application.</p></div>
          </div>
        </div>
      </section>

      <section className="command-system" id="command-system">
        <div className="command-heading">
          <div>
            <p className="kicker">Core command / closed-loop intelligence</p>
            <h2>Every signal becomes<br /><em>the next move.</em></h2>
          </div>
          <p>Production tells you what happened. Core tells you what deserves attention now—and learns from what happens next.</p>
        </div>

        <div className="command-shell">
          <aside className="command-nav">
            <div className="command-brand"><span className="pulse" /> CORE / COMMAND</div>
            <p>Mission view</p>
            {(Object.keys(commandViews) as Array<keyof typeof commandViews>).map((view, index) => (
              <button key={view} onClick={() => setActiveCommandView(view)} className={activeCommandView === view ? "active" : ""}>
                <span>0{index + 1}</span><strong>{view}</strong><i>↗</i>
              </button>
            ))}
            <div className="command-rank"><small>CURRENT OPERATING RANK</small><strong>II</strong><div><span>Signal</span><i>82 / 100</i></div></div>
          </aside>

          <div className="command-main">
            <div className="command-topline"><div><span>MISSION QUEUE</span><strong>{activeCommandView}</strong></div><div className="live-chip"><i /> LIVE SIGNALS</div></div>
            <div className="command-stats">
              <div><span>Quality conversations</span><strong>140</strong><small>today</small></div>
              <div><span>Placed AP</span><strong>$38.4K</strong><small>rolling 30d</small></div>
              <div><span>Retention</span><strong>94%</strong><small>13-month</small></div>
              <div><span>Open risk</span><strong>05</strong><small>needs action</small></div>
            </div>
            <div className="action-queue">
              <div className="queue-label"><span>RANKED ACTIONS</span><small>Sorted by urgency × durable value</small></div>
              {commandViews[activeCommandView].map((action, index) => (
                <article key={action.title}>
                  <span className={`priority priority-${action.priority.toLowerCase()}`}>{action.priority}</span>
                  <span className="action-index">0{index + 1}</span>
                  <div><h3>{action.title}</h3><p>{action.detail}</p></div>
                  <strong>{action.impact}</strong><i>→</i>
                </article>
              ))}
            </div>
            <div className="signal-loop" aria-label="Core intelligence feedback loop">
              <span>Lead</span><i>→</i><span>Call</span><i>→</i><span>Carrier</span><i>→</i><span>Policy</span><i>→</i><span>Retain</span><i>↻</i><strong>Score improves</strong>
            </div>
          </div>

          <aside className="goal-engine">
            <div className="engine-label"><span>GOAL ENGINE</span><small>PLAN / 2026</small></div>
            <h3>Turn ambition into an operating pace.</h3>
            <label htmlFor="annual-target">Annual planning target</label>
            <div className="target-number">{formatMoney(annualTarget)}</div>
            <input id="annual-target" type="range" min="100000" max="1000000" step="25000" value={annualTarget} onChange={(event) => setAnnualTarget(Number(event.target.value))} />
            <div className="target-scale"><span>$100K</span><span>$1M</span></div>
            <div className="goal-outputs">
              <div><span>Monthly</span><strong>{formatMoney(monthlyTarget)}</strong></div>
              <div><span>Weekly</span><strong>{formatMoney(weeklyTarget)}</strong></div>
              <div><span>Placed policies / yr</span><strong>{placedPolicies}</strong></div>
              <div><span>Quality conversations / day</span><strong>{dailyConversations}</strong></div>
            </div>
            <div className="engine-note"><span>MODEL ONLY</span><p>Illustrative activity translation using editable yield, placement, and close-rate assumptions. Not an income promise.</p></div>
          </aside>
        </div>
      </section>

      <section className="call-intelligence" id="call-intelligence">
        <div className="call-heading">
          <div>
            <p className="kicker kicker-dark">Core call lab / portfolio intelligence</p>
            <h2>Don't replay the hour.<br /><em>Find the five minutes that matter.</em></h2>
          </div>
          <p>Core studies every inbound outcome as a connected portfolio. It contrasts wins with losses, spots the moment momentum changed, and turns the finding into a ranked coaching move&mdash;no prompt required.</p>
        </div>

        <div className="call-lab-shell">
          <div className="call-lab-topline">
            <div><span className="pulse" /> INBOUND MEMORY / ACTIVE</div>
            <div><strong>68</strong><span>calls indexed</span><strong>412</strong><span>moments mapped</span><strong>07</strong><span>patterns promoted</span></div>
          </div>

          <div className="call-filters" role="tablist" aria-label="Inbound call filters">
            {callFilters.map((filter) => (
              <button
                key={filter}
                className={activeCallFilter === filter ? "active" : ""}
                onClick={() => {
                  setActiveCallFilter(filter);
                  const firstMatch = filter === "All inbound" ? callLibrary[0] : callLibrary.find((call) => call.outcome === filter);
                  if (firstMatch) setActiveCallId(firstMatch.id);
                }}
                role="tab"
                aria-selected={activeCallFilter === filter}
              >{filter}<span>{filter === "All inbound" ? callLibrary.length : callLibrary.filter((call) => call.outcome === filter).length}</span></button>
            ))}
          </div>

          <div className="call-lab-grid">
            <aside className="call-list" aria-label="Illustrative inbound call library">
              <div className="call-list-label"><span>RANKED LIBRARY</span><small>Outcome + learning value</small></div>
              {visibleCalls.map((call) => (
                <button key={call.id} onClick={() => setActiveCallId(call.id)} className={selectedCall.id === call.id ? "active" : ""}>
                  <span className={`call-outcome ${call.outcome.toLowerCase().replace(" ", "-")}`}>{call.outcome}</span>
                  <div><strong>{call.intent}</strong><small>{call.angle}</small></div>
                  <div><strong>{call.score}</strong><small>{call.delta}</small></div>
                </button>
              ))}
            </aside>

            <article className="call-detail" aria-live="polite">
              <div className="call-detail-head">
                <div><span>{selectedCall.id} / {selectedCall.intent}</span><h3>{selectedCall.angle}</h3><small>{selectedCall.duration} reviewed / illustrative record</small></div>
                <div className="call-score"><span>CORE CALL SCORE</span><strong>{selectedCall.score}</strong><small>{selectedCall.delta} vs baseline</small></div>
              </div>

              <div className="call-vitals">
                {["Trust", "Discovery", "Decision clarity", "Compliance"].map((label, index) => (
                  <div key={label}><span>{label}</span><strong>{selectedCall.vitals[index]}</strong><i style={{ width: `${selectedCall.vitals[index]}%` }} /></div>
                ))}
              </div>

              <div className="call-summary"><span>60-SECOND BRIEF</span><p>{selectedCall.summary}</p></div>

              <div className="call-timeline">
                <div className="timeline-label"><span>DECISION TIMELINE</span><small>Jump to evidence, not guesswork</small></div>
                <div className="timeline-track" aria-label="Key call moments">
                  {selectedCall.moments.map(([time, label, type], index) => (
                    <button key={`${time}-${label}`} className={`moment moment-${type}`} style={{ left: `${8 + index * 17}%` }} title={`${time} ${label}`}>
                      <i /><span>{time}</span><strong>{label}</strong>
                    </button>
                  ))}
                </div>
              </div>

              <div className="call-learning-grid">
                <div className="winning-pattern"><span>PORTFOLIO PATTERN</span><h4>{selectedCall.pattern}</h4><p>Supported by similar moments across won and lost inbound calls; promote only after manager review.</p></div>
                <div className="next-move"><span>NEXT BEST MOVE</span><h4>{selectedCall.next}</h4><button>Queue coaching move <i>&rarr;</i></button></div>
              </div>
            </article>
          </div>

          <div className="call-memory-loop"><span>CALL</span><i>&rarr;</i><span>MOMENTS</span><i>&rarr;</i><span>PATTERN</span><i>&rarr;</i><span>COACH</span><i>&rarr;</i><span>OUTCOME</span><strong>Portfolio memory gets smarter.</strong></div>
          <p className="call-model-note">Illustrative product experience. Call recording, consent, retention, redaction, carrier guidance, and licensed-agent requirements must follow applicable law and agency policy.</p>
        </div>
      </section>

      <section className="script-vault" id="script-vault">
        <div className="script-heading">
          <div>
            <p className="kicker">Core playbook / evidence-controlled</p>
            <h2>Scripts should learn.<br /><em>Agents should still sound human.</em></h2>
          </div>
          <p>The vault keeps every approved play, branch, proof source, and guardrail together. A phrase is promoted because outcomes support it&mdash;not because an AI thought it sounded confident.</p>
        </div>

        <div className="script-shell">
          <aside className="script-index">
            <div className="script-index-label"><span>PLAYBOOK INDEX</span><strong>{String(scriptLibrary.length).padStart(2, "0")}</strong></div>
            {scriptLibrary.map((script, index) => (
              <button key={script.id} className={activeScript === index ? "active" : ""} onClick={() => setActiveScript(index)}>
                <span>{script.id}</span><div><strong>{script.name}</strong><small>{script.intent}</small></div><i>&nearr;</i>
              </button>
            ))}
            <div className="script-sync"><i className="pulse" /><span>Call outcomes linked</span></div>
          </aside>

          <article className="script-document" aria-live="polite">
            <div className="script-document-head">
              <div><span>{selectedScript.id} / APPROVED PLAY</span><h3>{selectedScript.name}</h3><p>{selectedScript.intent}</p></div>
              <div className="script-status"><i /> MANAGER REVIEWED</div>
            </div>

            <div className="script-evidence"><span>WHEN TO USE</span><p>{selectedScript.evidence}</p><strong>Outcome-linked</strong></div>

            <div className="script-steps">
              {selectedScript.steps.map(([number, title, body]) => (
                <div key={number}><span>{number}</span><h4>{title}</h4><p>{body}</p><button aria-label={`Add coaching note to ${title}`}>+</button></div>
              ))}
            </div>

            <div className="script-guardrail"><span>NON-NEGOTIABLE GUARDRAIL</span><p>{selectedScript.guardrail}</p></div>
          </article>

          <aside className="script-proof">
            <div className="proof-radar" aria-hidden="true"><i /><i /><i /><strong>CORE</strong></div>
            <span>PROMOTION LOGIC</span>
            <h3>Win rate is not enough.</h3>
            <p>A play advances only when it improves decision clarity without weakening consent, service, compliance, or retention.</p>
            <ul>
              <li><span>01</span> Won vs lost contrast</li>
              <li><span>02</span> Manager-reviewed evidence</li>
              <li><span>03</span> Compliance check</li>
              <li><span>04</span> Downstream policy outcome</li>
            </ul>
            <button>Compare supporting calls <i>&rarr;</i></button>
          </aside>
        </div>
        <p className="script-note">Original illustrative playbook content for the Core prototype. Final scripts require agency, compliance, carrier, and legal review before use.</p>
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
        <div className="footer-meta"><span>CORE RANK / 01—05</span><a href="#top">Back to top ↑</a></div>
      </footer>
    </main>
  );
}
