"use client";

import { useMemo, useState } from "react";

/**
 * Pay Rates Studio — the modelling surface for rank economics.
 *
 * Everything here is a projection. Moving a slider changes nothing about
 * anyone's actual compensation: contract levels are employment terms, agreed
 * with a human and recorded outside this system. This is the place to see the
 * consequence of a change before proposing it, not the place to make it.
 */

type Rank = {
  id: string;
  name: string;
  tier: string;
  metal: string;
  contract: number;
  grants: number;
  people: number;
};

const START: Rank[] = [
  { id: "bronze", name: "Bronze", tier: "Entry", metal: "#c67c3e", contract: 90, grants: 0, people: 8 },
  { id: "iron", name: "Iron", tier: "Producer", metal: "#9aa7b4", contract: 100, grants: 1, people: 10 },
  { id: "ember", name: "Ember", tier: "Established", metal: "#e0764a", contract: 110, grants: 3, people: 10 },
  { id: "apex", name: "Apex", tier: "Senior", metal: "#e0b64e", contract: 120, grants: 7, people: 5 },
  { id: "obsidian", name: "Obsidian", tier: "Leader", metal: "#7b6bb0", contract: 140, grants: 15, people: 3 },
  { id: "zenith", name: "Zenith", tier: "Principal", metal: "#bfe6f5", contract: 140, grants: 20, people: 2 },
];

const money = (n: number) =>
  (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString();

export function PayRatesStudio() {
  const [ranks, setRanks] = useState<Rank[]>(START);
  const [premium, setPremium] = useState(700);
  const [leadCost, setLeadCost] = useState(15);
  const [closeRate, setCloseRate] = useState(15);
  const [apiPerAgent, setApiPerAgent] = useState(47);
  const [dealsPerPerson, setDealsPerPerson] = useState(8);

  function edit(id: string, field: keyof Rank, value: number) {
    setRanks((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  const model = useMemo(() => {
    const rows = ranks.map((r) => {
      const agents = r.grants * r.people;
      const apiCost = agents * apiPerAgent;
      const deals = r.people * dealsPerPerson;
      const premiumWritten = deals * premium;
      // Commission paid out at this contract level.
      const payout = premiumWritten * (r.contract / 100);
      // What the agency retains, assuming a 140-point total available.
      const retained = premiumWritten * ((140 - r.contract) / 100);
      return { ...r, agents, apiCost, deals, premiumWritten, payout, retained, net: retained - apiCost };
    });

    const t = rows.reduce(
      (a, r) => ({
        people: a.people + r.people,
        agents: a.agents + r.agents,
        apiCost: a.apiCost + r.apiCost,
        deals: a.deals + r.deals,
        premiumWritten: a.premiumWritten + r.premiumWritten,
        payout: a.payout + r.payout,
        retained: a.retained + r.retained,
        net: a.net + r.net,
      }),
      { people: 0, agents: 0, apiCost: 0, deals: 0, premiumWritten: 0, payout: 0, retained: 0, net: 0 },
    );

    const revenuePerCall = premium * (closeRate / 100);
    const breakEvenGive = revenuePerCall > 0 ? (leadCost / revenuePerCall) * 100 : 0;

    return { rows, t, revenuePerCall, breakEvenGive };
  }, [ranks, premium, leadCost, closeRate, apiPerAgent, dealsPerPerson]);

  const { rows, t, revenuePerCall, breakEvenGive } = model;
  const peak = Math.max(...rows.map((r) => Math.abs(r.net)), 1);
  const netTone = t.net >= 0 ? "good" : "bad";

  return (
    <div className="pay-studio">
      {/* ---------------- headline ---------------- */}
      <div className="pay-tiles">
        <article className={`portal-metric portal-metric-${netTone}`}>
          <span className="portal-metric-label">Net after AI</span>
          <strong className="portal-metric-value">{money(t.net)}</strong>
          <span className="portal-metric-detail">retained margin less API spend, per month</span>
        </article>
        <article className="portal-metric portal-metric-gold">
          <span className="portal-metric-label">Premium written</span>
          <strong className="portal-metric-value">{money(t.premiumWritten)}</strong>
          <span className="portal-metric-detail">{Math.round(t.deals)} deals · {t.people} people</span>
        </article>
        <article className="portal-metric portal-metric-bad">
          <span className="portal-metric-label">API spend</span>
          <strong className="portal-metric-value">{money(t.apiCost)}</strong>
          <span className="portal-metric-detail">{t.agents} agents at {money(apiPerAgent)} each</span>
        </article>
        <article className="portal-metric">
          <span className="portal-metric-label">Break-even giveback</span>
          <strong className="portal-metric-value">{breakEvenGive.toFixed(1)}<small className="portal-metric-of"> pts</small></strong>
          <span className="portal-metric-detail">{money(leadCost)} ÷ {money(revenuePerCall)} per call</span>
        </article>
      </div>

      {/* ---------------- global dials ---------------- */}
      <section className="portal-card pay-dials">
        <h3>Assumptions</h3>
        <p className="portal-fine">
          None of these is measured. The portal has no dialer, CRM, or carrier
          connection — every figure below is a number someone chose.
        </p>
        <div className="pay-dial-grid">
          <Dial label="Average premium" value={premium} min={200} max={3000} step={50} onChange={setPremium} format={money} />
          <Dial label="Cost per transferred call" value={leadCost} min={0} max={80} step={1} onChange={setLeadCost} format={money} accent />
          <Dial label="Close rate" value={closeRate} min={2} max={50} step={1} onChange={setCloseRate} format={(v) => `${v}%`} />
          <Dial label="API cost per agent" value={apiPerAgent} min={0} max={200} step={1} onChange={setApiPerAgent} format={money} />
          <Dial label="Deals per person / month" value={dealsPerPerson} min={1} max={40} step={1} onChange={setDealsPerPerson} format={(v) => `${v}`} />
        </div>
      </section>

      {/* ---------------- rank editor ---------------- */}
      <section className="portal-card">
        <h3>Ranks</h3>
        <p className="portal-fine">
          Contract level, API grants, and headcount per rank. Edits are local to
          this page and are never saved.
        </p>
        <div className="pay-rank-list">
          {rows.map((r) => (
            <div className="pay-rank" key={r.id} style={{ borderLeftColor: r.metal }}>
              <div className="pay-rank-head">
                <span className="pay-rank-dot" style={{ background: r.metal }} aria-hidden="true" />
                <strong>{r.name}</strong>
                <small>{r.tier}</small>
                <span className={`pay-rank-net ${r.net >= 0 ? "is-good" : "is-bad"}`}>
                  {money(r.net)}
                </span>
              </div>
              <div className="pay-rank-dials">
                <Dial label="Contract" value={r.contract} min={50} max={160} step={1}
                  onChange={(v) => edit(r.id, "contract", v)} format={(v) => `${v}%`} compact />
                <Dial label="API grants" value={r.grants} min={0} max={40} step={1}
                  onChange={(v) => edit(r.id, "grants", v)} format={(v) => `${v}`} compact />
                <Dial label="People" value={r.people} min={0} max={60} step={1}
                  onChange={(v) => edit(r.id, "people", v)} format={(v) => `${v}`} compact />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- graph ---------------- */}
      <section className="portal-card">
        <h3>Net contribution by rank</h3>
        <p className="portal-fine">Retained margin less the API grants that rank consumes.</p>
        <svg className="pay-chart" viewBox="0 0 760 300" role="img" aria-label="Net contribution by rank">
          {(() => {
            const L = 96, R = 104, bh = 30, gap = 14;
            const zero = L + (760 - L - R) / 2;
            const half = (760 - L - R) / 2;
            return (
              <>
                <line x1={zero} y1={8} x2={zero} y2={8 + rows.length * (bh + gap)} className="shop-axis" />
                {rows.map((r, i) => {
                  const y = 8 + i * (bh + gap);
                  const w = Math.max((Math.abs(r.net) / peak) * half, 2);
                  const good = r.net >= 0;
                  return (
                    <g key={r.id}>
                      <text x={L - 10} y={y + bh / 2 + 5} textAnchor="end" className="shop-glab shop-glab-strong">{r.name}</text>
                      <rect x={good ? zero : zero - w} y={y} width={w} height={bh} rx={5} fill={r.metal} opacity={good ? 0.92 : 0.5} />
                      <text x={good ? zero + w + 9 : zero - w - 9} y={y + bh / 2 + 5}
                        textAnchor={good ? "start" : "end"} className="shop-glab shop-glab-value">{money(r.net)}</text>
                    </g>
                  );
                })}
              </>
            );
          })()}
        </svg>
      </section>

      {/* ---------------- how to improve it ---------------- */}
      <section className="portal-card pay-advice">
        <h3>How to improve the API model</h3>
        <ol>
          <li>
            <strong>Route by difficulty.</strong> Most agent work is classification
            and extraction. Running it on the cheapest capable model rather than the
            best available roughly halves spend on its own.
          </li>
          <li>
            <strong>Cache the fixed parts.</strong> System prompts and tool schemas
            resend on every call. Cached reads cost about a tenth of normal input —
            worth roughly 45% on agent-heavy traffic.
          </li>
          <li>
            <strong>Grant budgets, not agents.</strong> &ldquo;One agent&rdquo; is
            undefined: lead triage costs a few dollars a month, call transcription
            costs hundreds. A dollar allowance can be metered, capped, and shown
            back to the person spending it.
          </li>
          <li>
            <strong>Cap hops and time-to-live.</strong> Agents that call agents can
            loop. A hop limit turns a runaway bill into a task parked for a human.
          </li>
          <li>
            <strong>Charge the tier that costs the most.</strong> Break-even
            giveback is lead cost divided by revenue per call, which lands at
            roughly the same number for every tier. A smaller feed does not justify
            a smaller giveback — fixed AI overhead makes light tiers the hardest to
            make work.
          </li>
        </ol>
      </section>
    </div>
  );
}

function Dial({
  label, value, min, max, step, onChange, format, compact = false, accent = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  compact?: boolean;
  accent?: boolean;
}) {
  return (
    <label className={`pay-dial${compact ? " is-compact" : ""}${accent ? " is-accent" : ""}`}>
      <span className="pay-dial-label">
        {label}
        <b>{format(value)}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value))}
      />
    </label>
  );
}
