import { requireCapability } from "../access";
import { PortalPageIntro, PortalShell } from "../components";
import {
  CALL_ANGLE_SLOTS,
  INTRODUCTION_SLOTS,
  type TrainingSlot,
} from "./library";

export const dynamic = "force-dynamic";

/**
 * Presentation-only script formatting (owner order 2026-08-18: "highlight
 * the talking part of the script", same format for every future approved
 * script). THE BYTE-VERBATIM CONTRACT HOLDS: this component's rendered TEXT
 * CONTENT is exactly `body` — it only wraps substrings in styling elements
 * (<mark>, <span>), never adds, removes, reorders, or rewords a character.
 * A runtime test extracts the rendered <pre>'s text and compares it
 * byte-for-byte against the approved constant, which is a STRONGER pin than
 * the source-regex it replaced: it proves the reader sees the approved
 * language, not merely that the source looked innocent.
 *
 * The format is structural, not script-specific, so future approved slots
 * using the same STEP / SCRIPT: / PURPOSE: convention format themselves:
 *   - "STEP …" lines render bold;
 *   - lines inside a SCRIPT: region highlight their quoted (“…”) spans —
 *     the words an agent actually says — or the whole line when it is a
 *     bare stage direction like "Holding";
 *   - the PURPOSE: label and its paragraph render italic and muted.
 */
type ScriptLineKind = "plain" | "step" | "purpose" | "spoken";

/**
 * Pure classification pass — no rendering, no mutation of component scope.
 * Walks the body's lines with a tiny region state machine (SCRIPT: opens the
 * spoken region, PURPOSE: opens the purpose region, blank lines and STEP
 * headings close them) and tags each ORIGINAL line untouched.
 */
function classifyScriptLines(body: string): { line: string; kind: ScriptLineKind }[] {
  const out: { line: string; kind: ScriptLineKind }[] = [];
  let region: "none" | "script" | "purpose" = "none";
  for (const line of body.split("\n")) {
    const bare = line.trim();
    if (bare === "") {
      if (region === "purpose") region = "none";
      out.push({ line, kind: "plain" });
    } else if (bare.startsWith("STEP ")) {
      region = "none";
      out.push({ line, kind: "step" });
    } else if (bare === "SCRIPT:") {
      region = "script";
      out.push({ line, kind: "plain" });
    } else if (bare === "PURPOSE:") {
      region = "purpose";
      out.push({ line, kind: "purpose" });
    } else if (region === "purpose") {
      out.push({ line, kind: "purpose" });
    } else if (region === "script") {
      out.push({ line, kind: "spoken" });
    } else {
      out.push({ line, kind: "plain" });
    }
  }
  return out;
}

function ScriptBody({ body }: { body: string }) {
  const lines = classifyScriptLines(body);

  return (
    <pre className="script-body training-script-body">
      {lines.map(({ line, kind }, index) => {
        const newline = index < lines.length - 1 ? "\n" : "";
        if (kind === "step") {
          return (
            <span key={index} className="training-line-step">
              {line}
              {newline}
            </span>
          );
        }
        if (kind === "purpose") {
          return (
            <span key={index} className="training-line-purpose">
              {line}
              {newline}
            </span>
          );
        }
        if (kind === "spoken") {
          const parts = line.split(/(“[^”]*”)/);
          const hasQuote = parts.length > 1;
          return (
            <span key={index}>
              {hasQuote
                ? parts.map((part, partIndex) =>
                    part.startsWith("“") && part.endsWith("”") ? (
                      <mark key={partIndex} className="training-mark">{part}</mark>
                    ) : (
                      <span key={partIndex}>{part}</span>
                    ),
                  )
                : <mark className="training-mark">{line}</mark>}
              {newline}
            </span>
          );
        }
        return (
          <span key={index}>
            {line}
            {newline}
          </span>
        );
      })}
    </pre>
  );
}

function ContentSlot({ slot }: { slot: TrainingSlot }) {
  const loaded = slot.state === "approved";

  return (
    <article
      className={`portal-card training-slot-card${loaded ? " training-slot-card-loaded" : ""}`}
      data-content-state={loaded ? "loaded" : "not-loaded"}
      id={slot.id}
    >
      <header className="training-slot-head">
        <div>
          <span className="training-slot-kicker">Approved language slot</span>
          <h3>{slot.label}</h3>
          {slot.labelCompleteness === "truncated" ? (
            <small className="training-title-pending">Full title pending from source</small>
          ) : null}
        </div>
        <span className={`portal-state portal-state-${loaded ? "live" : "pending"}`}>
          {loaded ? "THRIVE approved" : "Content not loaded"}
        </span>
      </header>

      {loaded ? (
        <>
          <dl className="script-meta">
            <div>
              <dt>Authorship</dt>
              <dd>Human-authored</dd>
            </div>
            <div>
              <dt>Approval</dt>
              <dd>THRIVE-approved</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{slot.source}</dd>
            </div>
          </dl>

          {/* Verbatim. Whitespace preserved. Never transformed — ScriptBody
              styles substrings but its text content is byte-identical to
              slot.body, and a runtime test proves it on the rendered page. */}
          <ScriptBody body={slot.body} />
        </>
      ) : (
        <div className="training-empty-slot" role="note">
          <span aria-hidden="true">○</span>
          <div>
            <strong>Label reserved; script intentionally empty.</strong>
            <p>
              THRIVE has not loaded approved wording for this slot. No draft,
              suggestion, summary, or AI-generated substitute is shown.
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

export default async function TrainingPage() {
  const session = await requireCapability("dashboard.view.self", "/portal/training");
  const loadedIntroductions = INTRODUCTION_SLOTS.filter(
    (slot) => slot.state === "approved",
  ).length;
  const loadedAngles = CALL_ANGLE_SLOTS.filter(
    (slot) => slot.state === "approved",
  ).length;

  return (
    <PortalShell session={session} current="/portal/training" section="Training">
      <main className="portal-main training-page">
        <PortalPageIntro
          eyebrow="THRIVE call enablement"
          title="Training"
          subtitle="Human-authored introductions and call angles, rendered exactly as THRIVE approved them. Empty means not loaded — never generated."
          compact
        />

        <p className="script-governance" role="note">
          <span className="script-governance-tag">Words locked</span>
          <span>
            The portal may organize and display approved training. It may not
            write, reword, complete, or summarize a script body. Missing content
            stays visibly missing until a human supplies it.
          </span>
        </p>

        <nav className="training-section-tabs" aria-label="Training sections">
          <a href="#training">Training</a>
          <a href="#introductions">Introductions</a>
          <a href="#call-angles">Call Angles</a>
        </nav>

        <section className="training-section" id="training" aria-labelledby="training-title">
          <header className="training-section-head">
            <div>
              <span>01 · Training</span>
              <h2 id="training-title">Approved training library</h2>
              <p>No standalone training module was supplied.</p>
            </div>
            <strong>0</strong>
          </header>

          <div
            className="portal-card training-section-empty"
            data-content-state="not-loaded"
            role="note"
          >
            <span className="portal-state portal-state-pending">Content not loaded</span>
            <div>
              <strong>Training slot ready; approved content is not loaded yet.</strong>
              <p>
                No training body was supplied. This section stays visibly empty
                until THRIVE provides human-authored, approved wording.
              </p>
            </div>
          </div>
        </section>

        <section
          className="training-section"
          id="introductions"
          aria-labelledby="introductions-title"
        >
          <header className="training-section-head">
            <div>
              <span>02 · Introductions</span>
              <h2 id="introductions-title">Different intros, kept distinct</h2>
              <p>All labels from the supplied introductions screenshot are reserved in order.</p>
            </div>
            <strong>{loadedIntroductions}/{INTRODUCTION_SLOTS.length}</strong>
          </header>

          <div className="training-slot-grid">
            {INTRODUCTION_SLOTS.map((slot) => <ContentSlot key={slot.id} slot={slot} />)}
          </div>
        </section>

        <section
          className="training-section"
          id="call-angles"
          aria-labelledby="call-angles-title"
        >
          <header className="training-section-head">
            <div>
              <span>03 · Call Angles</span>
              <h2 id="call-angles-title">Different angles, never collapsed</h2>
              <p>All labels from the supplied call-angles screenshot are reserved in order.</p>
            </div>
            <strong>{loadedAngles}/{CALL_ANGLE_SLOTS.length}</strong>
          </header>

          <div className="training-slot-grid training-angle-grid">
            {CALL_ANGLE_SLOTS.map((slot) => <ContentSlot key={slot.id} slot={slot} />)}
          </div>
        </section>
      </main>
    </PortalShell>
  );
}
