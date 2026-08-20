"use client";

import { useState, useCallback } from "react";

const AGENTS = [
  {
    id: "01",
    name: "Vestal",
    role: "Mission Keeper",
    title: "The one who carries the fire between stations",
    accent: "#7C3AED",
    monogram: "V",
    gender: "Male-presenting, East Asian, 40s",
    expression: "Calm, measured authority",
    outfit: "Dark navy mandarin-collar jacket over charcoal tactical turtleneck",
    background: "Concentric orbital lines — mission timeline",
    signifier: "Abstract compass-rose enamel pin",
  },
  {
    id: "02",
    name: "Recon",
    role: "Originality Scout",
    title: "The one who returns with what no one sent for",
    accent: "#F97066",
    monogram: "R",
    gender: "Female-presenting, Black, late 20s",
    expression: "Alert, searching",
    outfit: "Fitted slate-grey field jacket, dark crew-neck base",
    background: "Scattered signal-burst shapes — sonar pings",
    signifier: "Silver stud in right nostril",
  },
  {
    id: "03",
    name: "Terraform",
    role: "World Builder",
    title: "The one who raises ground where there was none",
    accent: "#34D399",
    monogram: "T",
    gender: "Male-presenting, South Asian, mid 30s",
    expression: "Absorbed, visionary",
    outfit: "Rumpled dark bronze-brown field shirt, black thermal base",
    background: "Isometric grid structures — architectural wireframes",
    signifier: "Mechanical wristwatch at frame edge",
  },
  {
    id: "04",
    name: "Meridian",
    role: "Art Director",
    title: "The one who draws the line everything aligns to",
    accent: "#F59E0B",
    monogram: "M",
    gender: "Female-presenting, Latina, early 30s",
    expression: "Evaluating, composed",
    outfit: "Structured charcoal blazer with sheen, black silk shell",
    background: "Composition guides — rule-of-thirds and golden-ratio spirals",
    signifier: "Bold geometric matte-black earrings",
  },
  {
    id: "05",
    name: "Lattice",
    role: "Trait Architect",
    title: "The one who decides what holds and what bends",
    accent: "#3B82F6",
    monogram: "L",
    gender: "Androgynous-presenting, mixed ethnicity, late 20s",
    expression: "Analytical, quietly fascinated",
    outfit: "High-collared dark graphite technical vest, black long-sleeve",
    background: "Branching decision-tree diagrams",
    signifier: "Wire-frame glasses with blue-tinted lens",
  },
  {
    id: "06",
    name: "Cipher",
    role: "Prompt Engineer",
    title: "The one who speaks so the machine understands",
    accent: "#1E1B4B",
    monogram: "C",
    gender: "Female-presenting, East European, mid 30s",
    expression: "Thoughtful, precise",
    outfit: "Soft-structured dark plum wool overshirt, black ribbed top",
    background: "Flowing text-like marks — abstract calligraphy",
    signifier: "Constellation of freckles across cheekbones",
  },
  {
    id: "07",
    name: "Lumen",
    role: "Image Maker",
    title: "The one who pulls shape from the signal",
    accent: "#F59E0B",
    monogram: "Lu",
    gender: "Male-presenting, Middle Eastern, late 30s",
    expression: "Intense, absorbed",
    outfit: "Dark olive-black canvas work jacket, faded black henley",
    background: "Overlapping rectangular frames — viewfinders and crop marks",
    signifier: "Stylus tucked behind one ear",
  },
  {
    id: "08",
    name: "Index",
    role: "Collection Curator",
    title: "The one who knows where every piece belongs",
    accent: "#7C3AED",
    monogram: "I",
    gender: "Female-presenting, Southeast Asian, early 40s",
    expression: "Composed, discerning",
    outfit: "Tailored midnight-navy knit blazer, cream silk blouse",
    background: "Tessellated grid patterns — gallery wall",
    signifier: "Pearl stud earrings",
  },
  {
    id: "09",
    name: "Assay",
    role: "Quality Guardian",
    title: "The one who holds the line no one sees",
    accent: "#F97066",
    monogram: "A",
    gender: "Male-presenting, Northern European, late 40s",
    expression: "Skeptical, exacting",
    outfit: "Dark charcoal wool crew-neck sweater",
    background: "Diagnostic crosshair marks — calibration patterns",
    signifier: "Reading glasses pushed onto forehead",
  },
  {
    id: "10",
    name: "Ledger",
    role: "Release Archivist",
    title: "The one who seals the record and turns the key",
    accent: "#F59E0B",
    monogram: "Le",
    gender: "Male-presenting, West African, mid 50s",
    expression: "Patient, assured",
    outfit: "Dark espresso-brown corduroy overshirt, black turtleneck",
    background: "Layered horizontal strata — archival shelving",
    signifier: "Leather-banded analog watch",
  },
] as const;

type Agent = (typeof AGENTS)[number];

type BuilderState = {
  name: string;
  role: string;
  title: string;
  expression: string;
  accent: string;
};

const ACCENT_OPTIONS = [
  { label: "Violet", hex: "#7C3AED" },
  { label: "Coral", hex: "#F97066" },
  { label: "Gold", hex: "#F59E0B" },
  { label: "Mint", hex: "#34D399" },
  { label: "Blue", hex: "#3B82F6" },
  { label: "Deep Ink", hex: "#1E1B4B" },
];

export function OperationsDeck({ session }: { session: { name: string; email: string; role: string } }) {
  const [selected, setSelected] = useState<Agent | null>(null);
  const [view, setView] = useState<"grid" | "detail" | "builder">("grid");
  const [builder, setBuilder] = useState<BuilderState>({
    name: "",
    role: "",
    title: "",
    expression: "",
    accent: "#7C3AED",
  });
  const [publishedAgent, setPublishedAgent] = useState<Agent | BuilderState | null>(null);

  const selectAgent = useCallback((agent: Agent) => {
    setSelected(agent);
    setView("detail");
  }, []);

  const backToGrid = useCallback(() => {
    setView("grid");
    setSelected(null);
  }, []);

  const openBuilder = useCallback(() => {
    setView("builder");
    setSelected(null);
  }, []);

  const publishToInkbox = useCallback((agent: Agent | BuilderState) => {
    setPublishedAgent(agent);
  }, []);

  return (
    <div className="ops-deck">
      <style>{`
        .ops-deck {
          --ink: var(--portal-text, #16142b);
          --paper: var(--portal-panel, #fffaf2);
          --violet: var(--portal-accent, #6d42e5);
          --surface: var(--portal-soft, rgba(22, 20, 43, 0.04));
          --border: var(--portal-line, rgba(22, 20, 43, 0.12));
          --radius: 12px;
        }

        .ops-toolbar {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .ops-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--surface);
          color: var(--ink);
          font: 600 13px/1 system-ui, sans-serif;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .ops-btn:hover { background: var(--border); }
        .ops-btn:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }
        .ops-btn-primary {
          background: var(--violet);
          color: white;
          border-color: var(--violet);
        }
        .ops-btn-primary:hover { background: #5b2fd0; }
        .ops-btn-inkbox {
          background: #0f172a;
          color: #38bdf8;
          border-color: #1e293b;
        }
        .ops-btn-inkbox:hover { background: #1e293b; }

        .ops-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .agent-card {
          position: relative;
          padding: 20px;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--surface);
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
        }
        .agent-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(22, 20, 43, 0.1);
        }
        .agent-card:focus-visible {
          outline: 2px solid var(--violet);
          outline-offset: 2px;
        }
        .agent-card-stripe {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          border-radius: var(--radius) var(--radius) 0 0;
        }

        .agent-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font: 700 16px/1 system-ui, sans-serif;
          color: white;
          margin-bottom: 12px;
        }
        .agent-card-name {
          font: 700 16px/1.2 system-ui, sans-serif;
          color: var(--ink);
          margin: 0 0 4px;
        }
        .agent-card-role {
          font: 500 12px/1.4 system-ui, sans-serif;
          color: var(--ink);
          opacity: 0.6;
          margin: 0 0 8px;
        }
        .agent-card-title {
          font: italic 13px/1.4 Georgia, serif;
          margin: 0;
        }
        .agent-card-actions {
          display: flex;
          gap: 6px;
          margin-top: 14px;
        }
        .agent-card-action {
          padding: 5px 10px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: transparent;
          color: var(--ink);
          font: 500 11px/1 system-ui, sans-serif;
          cursor: pointer;
          transition: background 0.12s;
        }
        .agent-card-action:hover { background: var(--border); }
        .agent-card-action:focus-visible { outline: 2px solid var(--violet); outline-offset: 1px; }

        .detail-panel {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          margin-bottom: 24px;
        }
        .detail-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          border-bottom: 1px solid var(--border);
        }
        .detail-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font: 700 22px/1 system-ui, sans-serif;
          color: white;
          flex-shrink: 0;
        }
        .detail-info h2 {
          font: 700 24px/1.2 system-ui, sans-serif;
          color: var(--ink);
          margin: 0 0 4px;
        }
        .detail-info p {
          font: 500 14px/1.4 system-ui, sans-serif;
          color: var(--ink);
          opacity: 0.6;
          margin: 0;
        }
        .detail-body {
          padding: 24px;
        }
        .detail-quote {
          font: italic 18px/1.5 Georgia, serif;
          color: var(--ink);
          opacity: 0.8;
          margin: 0 0 24px;
          padding-left: 16px;
          border-left: 3px solid var(--violet);
        }
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .detail-field {
          padding: 12px;
          background: var(--surface);
          border-radius: 8px;
        }
        .detail-field-label {
          font: 600 10px/1 system-ui, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink);
          opacity: 0.5;
          margin: 0 0 6px;
        }
        .detail-field-value {
          font: 400 13px/1.4 system-ui, sans-serif;
          color: var(--ink);
          margin: 0;
        }
        .detail-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .builder-form {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          margin-bottom: 24px;
        }
        .builder-form h2 {
          font: 700 20px/1.2 system-ui, sans-serif;
          color: var(--ink);
          margin: 0 0 4px;
        }
        .builder-form > p {
          font: 400 14px/1.5 system-ui, sans-serif;
          color: var(--ink);
          opacity: 0.6;
          margin: 0 0 24px;
        }
        .builder-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (max-width: 600px) {
          .builder-fields { grid-template-columns: 1fr; }
        }
        .builder-field { display: flex; flex-direction: column; gap: 4px; }
        .builder-field.full { grid-column: 1 / -1; }
        .builder-label {
          font: 600 11px/1 system-ui, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink);
          opacity: 0.6;
        }
        .builder-input {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--ink);
          font: 400 14px/1.4 system-ui, sans-serif;
        }
        .builder-input:focus {
          outline: 2px solid var(--violet);
          outline-offset: 1px;
          border-color: transparent;
        }
        .builder-input::placeholder { color: var(--ink); opacity: 0.3; }
        .accent-picker {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .accent-swatch {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.12s;
        }
        .accent-swatch:hover { transform: scale(1.15); }
        .accent-swatch.active { border-color: var(--ink); box-shadow: 0 0 0 2px var(--surface); }
        .accent-swatch:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }

        .builder-preview {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          background: var(--surface);
          margin-bottom: 24px;
        }
        .builder-preview-title {
          font: 600 12px/1 system-ui, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink);
          opacity: 0.5;
          margin: 0 0 12px;
        }

        .publish-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(22, 20, 43, 0.6);
          display: grid;
          place-items: center;
          z-index: 100;
          padding: 20px;
        }
        .publish-modal {
          background: var(--paper);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 24px 48px rgba(22, 20, 43, 0.2);
        }
        .publish-modal h3 {
          font: 700 20px/1.2 system-ui, sans-serif;
          color: var(--ink);
          margin: 0 0 8px;
        }
        .publish-modal > p {
          font: 400 14px/1.5 system-ui, sans-serif;
          color: var(--ink);
          opacity: 0.7;
          margin: 0 0 24px;
        }
        .publish-summary {
          padding: 16px;
          background: var(--surface);
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .publish-summary dt {
          font: 600 10px/1.2 system-ui, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink);
          opacity: 0.5;
        }
        .publish-summary dd {
          font: 500 14px/1.4 system-ui, sans-serif;
          color: var(--ink);
          margin: 0 0 10px;
        }
        .publish-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
      `}</style>

      {/* ── Toolbar ── */}
      <div className="ops-toolbar">
        {view !== "grid" && (
          <button className="ops-btn" onClick={backToGrid} type="button">
            ← Back to deck
          </button>
        )}
        <button
          className={`ops-btn${view === "builder" ? " ops-btn-primary" : ""}`}
          onClick={openBuilder}
          type="button"
        >
          + Build your own agent
        </button>
      </div>

      {/* ── Grid View ── */}
      {view === "grid" && (
        <div className="ops-grid">
          {AGENTS.map((agent) => (
            <div
              key={agent.id}
              className="agent-card"
              onClick={() => selectAgent(agent)}
              onKeyDown={(e) => e.key === "Enter" && selectAgent(agent)}
              tabIndex={0}
              role="button"
              aria-label={`View ${agent.name} — ${agent.role}`}
            >
              <div className="agent-card-stripe" style={{ background: agent.accent }} />
              <div className="agent-avatar" style={{ background: agent.accent }}>
                {agent.monogram}
              </div>
              <p className="agent-card-name">{agent.name}</p>
              <p className="agent-card-role">{agent.id} · {agent.role}</p>
              <p className="agent-card-title" style={{ color: agent.accent === "#1E1B4B" ? "#8B85C1" : agent.accent }}>{agent.title}</p>
              <div className="agent-card-actions">
                <button
                  className="agent-card-action"
                  onClick={(e) => { e.stopPropagation(); selectAgent(agent); }}
                  type="button"
                >
                  Inspect
                </button>
                <button
                  className="agent-card-action"
                  onClick={(e) => { e.stopPropagation(); publishToInkbox(agent); }}
                  type="button"
                >
                  Publish →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail View ── */}
      {view === "detail" && selected && (
        <div className="detail-panel">
          <div className="detail-header">
            <div className="detail-avatar" style={{ background: selected.accent }}>
              {selected.monogram}
            </div>
            <div className="detail-info">
              <h2>{selected.name}</h2>
              <p>{selected.id} · {selected.role}</p>
            </div>
          </div>
          <div className="detail-body">
            <p className="detail-quote">{selected.title}</p>
            <div className="detail-grid">
              <div className="detail-field">
                <p className="detail-field-label">Presence</p>
                <p className="detail-field-value">{selected.gender}</p>
              </div>
              <div className="detail-field">
                <p className="detail-field-label">Expression</p>
                <p className="detail-field-value">{selected.expression}</p>
              </div>
              <div className="detail-field">
                <p className="detail-field-label">Outfit</p>
                <p className="detail-field-value">{selected.outfit}</p>
              </div>
              <div className="detail-field">
                <p className="detail-field-label">Background</p>
                <p className="detail-field-value">{selected.background}</p>
              </div>
              <div className="detail-field">
                <p className="detail-field-label">Signifier</p>
                <p className="detail-field-value">{selected.signifier}</p>
              </div>
              <div className="detail-field">
                <p className="detail-field-label">Accent</p>
                <p className="detail-field-value">
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: selected.accent,
                      verticalAlign: "middle",
                      marginRight: 6,
                    }}
                  />
                  {selected.accent}
                </p>
              </div>
            </div>
            <div className="detail-actions">
              <button className="ops-btn-primary ops-btn" onClick={() => publishToInkbox(selected)} type="button">
                Publish to Inkbox
              </button>
              <button className="ops-btn" onClick={backToGrid} type="button">
                Back to deck
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Builder View ── */}
      {view === "builder" && (
        <>
          <div className="builder-form">
            <h2>Build your own agent</h2>
            <p>Configure a custom Operations Deck agent with your own identity and accent.</p>
            <div className="builder-fields">
              <div className="builder-field">
                <label className="builder-label" htmlFor="builder-name">Agent name</label>
                <input
                  id="builder-name"
                  className="builder-input"
                  placeholder="e.g. Oracle"
                  value={builder.name}
                  onChange={(e) => setBuilder((b) => ({ ...b, name: e.target.value }))}
                />
              </div>
              <div className="builder-field">
                <label className="builder-label" htmlFor="builder-role">Role</label>
                <input
                  id="builder-role"
                  className="builder-input"
                  placeholder="e.g. Intelligence Analyst"
                  value={builder.role}
                  onChange={(e) => setBuilder((b) => ({ ...b, role: e.target.value }))}
                />
              </div>
              <div className="builder-field full">
                <label className="builder-label" htmlFor="builder-title">Title card</label>
                <input
                  id="builder-title"
                  className="builder-input"
                  placeholder="The one who..."
                  value={builder.title}
                  onChange={(e) => setBuilder((b) => ({ ...b, title: e.target.value }))}
                />
              </div>
              <div className="builder-field full">
                <label className="builder-label" htmlFor="builder-expression">Expression</label>
                <input
                  id="builder-expression"
                  className="builder-input"
                  placeholder="e.g. Contemplative, watchful"
                  value={builder.expression}
                  onChange={(e) => setBuilder((b) => ({ ...b, expression: e.target.value }))}
                />
              </div>
              <div className="builder-field full">
                <span className="builder-label">Accent color</span>
                <div className="accent-picker">
                  {ACCENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.hex}
                      className={`accent-swatch${builder.accent === opt.hex ? " active" : ""}`}
                      style={{ background: opt.hex }}
                      onClick={() => setBuilder((b) => ({ ...b, accent: opt.hex }))}
                      title={opt.label}
                      type="button"
                      aria-label={`Select ${opt.label}`}
                      aria-pressed={builder.accent === opt.hex}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Live preview */}
            {builder.name && (
              <div className="builder-preview">
                <p className="builder-preview-title">Preview</p>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    className="agent-avatar"
                    style={{ background: builder.accent, flexShrink: 0 }}
                  >
                    {builder.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="agent-card-name">{builder.name}</p>
                    <p className="agent-card-role">{builder.role || "Custom agent"}</p>
                    {builder.title && (
                      <p className="agent-card-title" style={{ color: builder.accent }}>{builder.title}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="ops-btn ops-btn-primary"
                disabled={!builder.name}
                onClick={() => publishToInkbox(builder)}
                type="button"
              >
                Publish to Inkbox
              </button>
              <button className="ops-btn" onClick={backToGrid} type="button">
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Publish Modal ── */}
      {publishedAgent && (
        <div
          className="publish-modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setPublishedAgent(null)}
        >
          <div className="publish-modal" role="dialog" aria-label="Publish to Inkbox">
            <h3>Publish to Inkbox</h3>
            <p>
              This will open Inkbox with your agent identity ready to go.
            </p>
            <dl className="publish-summary">
              <dt>Agent</dt>
              <dd>{"name" in publishedAgent ? publishedAgent.name : ""}</dd>
              <dt>Role</dt>
              <dd>{"role" in publishedAgent ? publishedAgent.role : ""}</dd>
              <dt>Published by</dt>
              <dd>{session.name} ({session.email})</dd>
            </dl>
            <div className="publish-actions">
              <button className="ops-btn" onClick={() => setPublishedAgent(null)} type="button">
                Cancel
              </button>
              <a
                className="ops-btn ops-btn-inkbox"
                href="https://inkbox.me"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPublishedAgent(null)}
              >
                Open Inkbox →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
