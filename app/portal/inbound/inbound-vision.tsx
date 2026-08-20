"use client";

import { useState } from "react";

const OPERATORS = [
  {
    id: "sentinel",
    glyph: "☎",
    name: "Voice Sentinel",
    covers: "the no-answer branch",
    points: [
      "Picks up in under a second when the roster misses — 3am, dinner rush, both agents busy",
      "Handles FAQs, waitlists, and bookings in natural conversation",
      "Discloses it is an AI and warm-transfers anything licensed",
    ],
  },
  {
    id: "closer",
    glyph: "☏",
    name: "Sales Closer",
    covers: "the callback follow-up",
    points: [
      "Works a captured lead by text toward a goal you set",
      "Captures intent, budget, and consent onto the record",
      "Pushes the next step while the lead is still warm",
    ],
  },
  {
    id: "scheduler",
    glyph: "✎",
    name: "Scheduler",
    covers: "bookings & no-shows",
    points: [
      "Books, reschedules, and confirms without a human touch",
      "Texts addresses and reminders after the call",
      "Follows up on no-shows so a missed slot is not a dead lead",
    ],
  },
  {
    id: "warden",
    glyph: "★",
    name: "Reputation Warden",
    covers: "after the call ends",
    points: [
      "Drafts personalized replies to Google and Facebook reviews",
      "Nothing goes public without your approval",
      "Fresh responses lift ranking, and ranking rings the line again",
    ],
  },
] as const;

const RUNWAY = [
  {
    n: 1,
    title: "Ship the real Relay softphone on this page",
    body: "Replaces device-app calling with dial, DTMF, and inbound answer/decline handled here.",
  },
  {
    n: 2,
    title: "Set a caller ID",
    body: "The carrier requires a space-owned number for outbound — one pick in dialer settings.",
  },
  {
    n: 3,
    title: "Set the CORE ingest credential",
    body: "A Worker-side, owner-only secret so every call writes a record here instead of nowhere.",
  },
  {
    n: 4,
    title: "Point the no-answer branch at Voice Sentinel",
    body: "One routing edit: the hangup message becomes the Sentinel endpoint, closing the leak.",
  },
] as const;

export function InboundVision() {
  const [calls, setCalls] = useState(12);
  const [miss, setMiss] = useState(35);
  const [value, setValue] = useState(850);
  const [close, setClose] = useState(30);

  const missedPerMonth = calls * 30 * (miss / 100);
  const leak = missedPerMonth * (close / 100) * value;
  const recoveredFull = missedPerMonth * 0.97 * (close / 100) * value;
  const recoveredConservative = recoveredFull * 0.5;
  const recoveredYear = ((recoveredConservative + recoveredFull) / 2) * 12;
  const fmt = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

  return (
    <div className="iv-root">
      <style>{`
        .iv-root {
          --iv-ink: var(--portal-text, #16142b);
          --iv-panel: var(--portal-panel, #fffaf2);
          --iv-accent: var(--portal-accent, #6d42e5);
          --iv-surface: var(--portal-soft, rgba(22, 20, 43, 0.04));
          --iv-border: var(--portal-line, rgba(22, 20, 43, 0.12));
          --iv-muted: var(--portal-subtle, rgba(22, 20, 43, 0.6));
          --iv-danger: var(--portal-danger, #b9382f);
          --iv-radius: 12px;
          margin-top: 18px;
        }
        .iv-section { margin-top: 28px; }
        .iv-eyebrow {
          font: 700 11px/1 system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase;
          color: var(--iv-accent); margin: 0 0 8px;
        }
        .iv-h2 { font: 700 22px/1.2 system-ui, sans-serif; color: var(--iv-ink); margin: 0 0 6px; }
        .iv-lede { font: 400 14px/1.55 system-ui, sans-serif; color: var(--iv-muted); max-width: 68ch; margin: 0; }
        .iv-map { display: flex; flex-direction: column; gap: 0; margin-top: 18px; }
        .iv-node {
          display: grid; grid-template-columns: 36px 1fr auto; gap: 14px; align-items: center;
          background: var(--iv-panel); border: 1px solid var(--iv-border); border-radius: var(--iv-radius);
          padding: 12px 16px; margin: 4px 0;
        }
        .iv-node .iv-ic {
          width: 32px; height: 32px; border-radius: 9px; background: var(--iv-surface);
          border: 1px solid var(--iv-border); display: grid; place-items: center; font-size: 15px;
        }
        .iv-node h4 { font: 600 13.5px/1.3 system-ui, sans-serif; color: var(--iv-ink); margin: 0; }
        .iv-node p { font: 400 12px/1.4 system-ui, sans-serif; color: var(--iv-muted); margin: 2px 0 0; }
        .iv-node.iv-leak { border-color: color-mix(in srgb, var(--iv-danger) 45%, var(--iv-border)); background: color-mix(in srgb, var(--iv-danger) 7%, var(--iv-panel)); }
        .iv-split { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 4px; }
        @media (max-width: 720px) { .iv-split { grid-template-columns: 1fr; } }
        .iv-split-label { font: 700 11px/1 system-ui, sans-serif; letter-spacing: .1em; text-transform: uppercase; margin: 0 0 8px; color: var(--iv-muted); }
        .iv-chip {
          display: inline-flex; align-items: center; gap: 6px; font: 700 10.5px/1 system-ui, sans-serif;
          letter-spacing: .08em; text-transform: uppercase; border-radius: 999px; padding: 4px 10px;
          border: 1px solid var(--iv-border); color: var(--iv-muted); white-space: nowrap;
        }
        .iv-chip.iv-bad { color: var(--iv-danger); border-color: color-mix(in srgb, var(--iv-danger) 40%, var(--iv-border)); }
        .iv-chip.iv-ok { color: var(--iv-accent); border-color: color-mix(in srgb, var(--iv-accent) 40%, var(--iv-border)); }
        .iv-roster { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 14px; margin-top: 18px; }
        .iv-agent { background: var(--iv-panel); border: 1px solid var(--iv-border); border-radius: var(--iv-radius); padding: 18px; }
        .iv-agent .iv-glyph {
          width: 38px; height: 38px; border-radius: 10px; background: var(--iv-surface); border: 1px solid var(--iv-border);
          display: grid; place-items: center; font-size: 17px; margin-bottom: 10px;
        }
        .iv-agent h4 { font: 700 15px/1.2 system-ui, sans-serif; color: var(--iv-ink); margin: 0 0 3px; }
        .iv-agent .iv-covers { font: 600 11px/1.4 system-ui, sans-serif; color: var(--iv-accent); text-transform: uppercase; letter-spacing: .05em; margin: 0 0 10px; }
        .iv-agent ul { margin: 0; padding-left: 16px; }
        .iv-agent li { font: 400 12.5px/1.5 system-ui, sans-serif; color: var(--iv-muted); margin: 3px 0; }
        .iv-calc { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 18px; }
        @media (max-width: 880px) { .iv-calc { grid-template-columns: 1fr; } }
        .iv-card { background: var(--iv-panel); border: 1px solid var(--iv-border); border-radius: var(--iv-radius); padding: 18px; }
        .iv-field { margin-bottom: 14px; }
        .iv-field label { display: flex; justify-content: space-between; font: 600 12px/1 system-ui, sans-serif; color: var(--iv-ink); margin-bottom: 6px; }
        .iv-field output { color: var(--iv-accent); font-weight: 700; }
        .iv-field input[type=range] { width: 100%; accent-color: var(--iv-accent); }
        .iv-readout { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .iv-tile { background: var(--iv-surface); border: 1px solid var(--iv-border); border-radius: 10px; padding: 12px 14px; }
        .iv-tile .iv-v { font: 700 20px/1.15 system-ui, sans-serif; color: var(--iv-ink); }
        .iv-tile .iv-l { font: 600 10.5px/1.4 system-ui, sans-serif; letter-spacing: .06em; text-transform: uppercase; color: var(--iv-muted); margin-top: 3px; }
        .iv-tile.iv-hero { grid-column: 1 / -1; border-color: color-mix(in srgb, var(--iv-accent) 40%, var(--iv-border)); }
        .iv-tile.iv-hero .iv-v { color: var(--iv-accent); font-size: 26px; }
        .iv-runway { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
        .iv-step { display: grid; grid-template-columns: 34px 1fr; gap: 14px; align-items: center; background: var(--iv-panel); border: 1px solid var(--iv-border); border-radius: var(--iv-radius); padding: 14px 16px; }
        .iv-step .iv-n { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--iv-border); display: grid; place-items: center; font: 700 13px/1 system-ui, sans-serif; color: var(--iv-accent); }
        .iv-step h4 { font: 600 13.5px/1.3 system-ui, sans-serif; color: var(--iv-ink); margin: 0; }
        .iv-step p { font: 400 12px/1.4 system-ui, sans-serif; color: var(--iv-muted); margin: 2px 0 0; }
        .iv-rail { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 18px; }
        .iv-rail .iv-card h4 { font: 600 13.5px/1.3 system-ui, sans-serif; color: var(--iv-ink); margin: 0 0 6px; }
        .iv-rail .iv-card p { font: 400 12.5px/1.5 system-ui, sans-serif; color: var(--iv-muted); margin: 0; }
        .iv-foot { font: 400 12px/1.6 system-ui, sans-serif; color: var(--iv-muted); margin-top: 22px; max-width: 78ch; border-left: 2px solid var(--iv-border); padding-left: 14px; }
        .iv-gate-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-top: 18px; }
        .iv-gate-card {
          display: block; background: var(--iv-panel); border: 1px solid var(--iv-border); border-radius: var(--iv-radius);
          padding: 16px 18px; text-decoration: none;
        }
        .iv-gate-card h4 { font: 700 14px/1.3 system-ui, sans-serif; color: var(--iv-ink); margin: 0 0 4px; }
        .iv-gate-card p { font: 400 12.5px/1.5 system-ui, sans-serif; color: var(--iv-muted); margin: 0; }
        .iv-gate-card .iv-arrow { color: var(--iv-accent); font-weight: 700; }
      `}</style>

      <section className="iv-section" id="line-map">
        <p className="iv-eyebrow">The line, mapped</p>
        <h2 className="iv-h2">Where calls go today — and where they leak.</h2>
        <p className="iv-lede">
          Every inbound call to the THRIVE line walks this path. Concept below, drawn from the current
          queue design — not yet CORE-measured. The last node is the one that costs money.
        </p>
        <div className="iv-map">
          <div className="iv-node">
            <span className="iv-ic">{"☎"}</span>
            <div><h4>Caller dials the THRIVE line</h4><p>Greeting plays, then the queue tries the roster.</p></div>
            <span className="iv-chip">Live</span>
          </div>
          <div className="iv-node">
            <span className="iv-ic">{"\u{1F465}"}</span>
            <div><h4>Serial ring across the on-call roster</h4><p>One agent at a time, each with a short timeout — fine when someone is free.</p></div>
            <span className="iv-chip">Roster</span>
          </div>
        </div>
        <div className="iv-split">
          <div>
            <p className="iv-split-label">Today — nobody answers</p>
            <div className="iv-node iv-leak">
              <span className="iv-ic">{"\u{1F4F5}"}</span>
              <div><h4>&ldquo;Try again shortly&rdquo; &rarr; hangup</h4><p>No voicemail, no capture, no record.</p></div>
              <span className="iv-chip iv-bad">Leak</span>
            </div>
          </div>
          <div>
            <p className="iv-split-label">With Voice Sentinel</p>
            <div className="iv-node">
              <span className="iv-ic">{"\u{1F916}"}</span>
              <div><h4>AI answers, qualifies, books</h4><p>Discloses it&rsquo;s an AI, captures name, number and intent with consent, and writes the record into CORE.</p></div>
              <span className="iv-chip iv-ok">The fix</span>
            </div>
          </div>
        </div>
      </section>

      <section className="iv-section" id="operators">
        <p className="iv-eyebrow">The operators on this line</p>
        <h2 className="iv-h2">Four agents behind one number.</h2>
        <p className="iv-lede">
          Each covers a spot where a human can&rsquo;t be — none replaces the licensed humans the queue
          rings first. Concept roster, not yet deployed.
        </p>
        <div className="iv-roster">
          {OPERATORS.map((op) => (
            <article className="iv-agent" key={op.id}>
              <div className="iv-glyph">{op.glyph}</div>
              <h4>{op.name}</h4>
              <p className="iv-covers">Covers &middot; {op.covers}</p>
              <ul>{op.points.map((point) => <li key={point}>{point}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className="iv-section" id="calculator">
        <p className="iv-eyebrow">What the misses cost</p>
        <h2 className="iv-h2">The gap, in numbers.</h2>
        <p className="iv-lede">
          Vendor-benchmark estimates, not CORE-measured production. Set your own volume — the leak is
          computed here, not quoted.
        </p>
        <div className="iv-calc">
          <div className="iv-card">
            <div className="iv-field">
              <label>Inbound calls per day <output>{calls}</output></label>
              <input type="range" min={2} max={120} value={calls} onChange={(e) => setCalls(Number(e.target.value))} />
            </div>
            <div className="iv-field">
              <label>Share the roster misses <output>{miss}%</output></label>
              <input type="range" min={5} max={80} value={miss} onChange={(e) => setMiss(Number(e.target.value))} />
            </div>
            <div className="iv-field">
              <label>Average customer value <output>${value.toLocaleString()}</output></label>
              <input type="range" min={50} max={5000} step={50} value={value} onChange={(e) => setValue(Number(e.target.value))} />
            </div>
            <div className="iv-field">
              <label>Close rate on answered leads <output>{close}%</output></label>
              <input type="range" min={5} max={70} value={close} onChange={(e) => setClose(Number(e.target.value))} />
            </div>
          </div>
          <div className="iv-card">
            <div className="iv-readout">
              <div className="iv-tile"><div className="iv-v">{Math.round(missedPerMonth).toLocaleString()}</div><div className="iv-l">Calls hitting the hangup / month</div></div>
              <div className="iv-tile"><div className="iv-v">{fmt(leak)}</div><div className="iv-l">Revenue leaking / month</div></div>
              <div className="iv-tile iv-hero"><div className="iv-v">{fmt(recoveredConservative)} &ndash; {fmt(recoveredFull)}</div><div className="iv-l">Recoverable / month once the no-answer branch is covered</div></div>
              <div className="iv-tile"><div className="iv-v">{fmt(recoveredYear)}</div><div className="iv-l">Recoverable / year (midpoint)</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="iv-section" id="runway">
        <p className="iv-eyebrow">Activation runway</p>
        <h2 className="iv-h2">Four steps to a line that never drops a lead.</h2>
        <div className="iv-runway">
          {RUNWAY.map((step) => (
            <div className="iv-step" key={step.n}>
              <span className="iv-n">{step.n}</span>
              <div><h4>{step.title}</h4><p>{step.body}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="iv-section" id="governance">
        <p className="iv-eyebrow">Governance rail</p>
        <h2 className="iv-h2">Rules that ride every call.</h2>
        <div className="iv-rail">
          <div className="iv-card"><h4>{"☏"} Every call, every rule</h4><p>TCPA, do-not-call, and state calling rules apply to every call, whichever app or agent places it.</p></div>
          <div className="iv-card"><h4>{"\u{1F512}"} Consent before records</h4><p>Recordings and transcripts open for review only with verified consent.</p></div>
          <div className="iv-card"><h4>{"\u{1F916}"} The AI says it&rsquo;s an AI</h4><p>Every operator discloses itself and hands licensed activity to authorized humans.</p></div>
          <div className="iv-card"><h4>{"\u{1F4C8}"} No hand-entered numbers</h4><p>Every figure upgrades from vendor benchmark to CORE-computed record as calls flow.</p></div>
        </div>
      </section>

      <p className="iv-foot">
        Benchmark figures above are vendor-published estimates, not CORE-measured production. Replace
        every estimate with a CORE-computed record as soon as call data flows through this line.
      </p>
    </div>
  );
}

export function InboundGateLinks({
  canReviewCalls,
  isFounder,
}: {
  canReviewCalls: boolean;
  isFounder: boolean;
}) {
  if (!canReviewCalls && !isFounder) return null;
  return (
    <section className="iv-section iv-root" id="more-lines">
      <style>{`
        .iv-root { --iv-ink: var(--portal-text, #16142b); --iv-panel: var(--portal-panel, #fffaf2);
          --iv-accent: var(--portal-accent, #6d42e5); --iv-border: var(--portal-line, rgba(22, 20, 43, 0.12));
          --iv-muted: var(--portal-subtle, rgba(22, 20, 43, 0.6)); --iv-radius: 12px; }
      `}</style>
      <p className="iv-eyebrow">Reach the rest of the line</p>
      <h2 className="iv-h2">Moved in, not removed.</h2>
      <p className="iv-lede">Call Lab and the Collab Dialer still work exactly as before &mdash; they just live one click from here now instead of their own sidebar tabs.</p>
      <div className="iv-gate-grid">
        {canReviewCalls ? (
          <a className="iv-gate-card" href="/portal/calls">
            <h4>Call Lab <span className="iv-arrow">&rarr;</span></h4>
            <p>Transferred call inbox, recording review, and the device dial pad.</p>
          </a>
        ) : null}
        {isFounder ? (
          <a className="iv-gate-card" href="/portal/dialer">
            <h4>Collab Dialer <span className="iv-arrow">&rarr;</span></h4>
            <p>Founder-only SignalWire softphone &mdash; rings your private line first.</p>
          </a>
        ) : null}
      </div>
    </section>
  );
}
