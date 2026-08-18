import { requireCapability } from "../access";
import { PortalPageIntro, PortalShell } from "../components";
import {
  CALL_ANGLE_SLOTS,
  INTRODUCTION_SLOTS,
  splitApprovedBody,
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
 * spoken region, PURPOSE: opens the purpose region; STEP headings and the
 * labels close regions, and a blank line closes purpose — the spoken region
 * deliberately survives blank lines, since approved scripts separate spoken
 * beats with them) and tags each ORIGINAL line untouched.
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
      // Inside a SCRIPT region, an unquoted line ending in ":" is a stage
      // direction introducing what follows ("After they explain:"), not
      // words an agent says — leave it plain. Bare directions like
      // "Holding" stay highlighted, matching the owner's mockup.
      out.push({
        line,
        kind: !line.includes("“") && bare.endsWith(":") ? "plain" : "spoken",
      });
    } else if (bare.startsWith("“")) {
      // Some steps carry spoken lines without a SCRIPT: label (STEP 4 in the
      // approved body). A line that OPENS with a quote is speech; narrative
      // lines that merely contain a quote ("If the caller asks: “…”") stay
      // plain, matching the mockup.
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
                : (() => {
                    // Whole-line stage direction ("Holding"): mark only the
                    // visible text — painting 26 leading spaces draws a long
                    // empty highlight bar, and a screen reader would open a
                    // "highlighted" region on whitespace.
                    const lead = line.length - line.trimStart().length;
                    const end = line.trimEnd().length;
                    return (
                      <>
                        {line.slice(0, lead)}
                        <mark className="training-mark">{line.slice(lead, end)}</mark>
                        {line.slice(end)}
                      </>
                    );
                  })()}
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

          {slot.purpose ? (
            <p className="training-slot-purpose">
              <span className="training-slot-purpose-tag">Covers</span>
              {slot.purpose}
            </p>
          ) : null}

          {/* Verbatim, in the author's own sections.
              splitApprovedBody is a pure split: every character of slot.body
              lands in exactly one snippet, in order, and the function throws
              rather than render if rejoining them does not reproduce the body
              exactly. ScriptBody then styles substrings without touching text.
              A runtime test concatenates every rendered snippet and asserts
              the result equals the approved body byte for byte — so breaking
              the script into pieces an agent can work from on a live call
              cannot become editing it. */}
          <div className="training-snippets">
            {splitApprovedBody(slot.body).map((snippet, index) => (
              <section className="training-snippet" key={snippet.id}>
                <span className="training-snippet-index" aria-hidden="true">
                  {index + 1}
                </span>
                <ScriptBody body={snippet.text} />
              </section>
            ))}
          </div>
        </>
      ) : (
        <>
        {slot.purpose ? (
          <p className="training-slot-purpose">
            <span className="training-slot-purpose-tag">Covers</span>
            {slot.purpose}
          </p>
        ) : null}
        <div className="training-empty-slot" role="note">
          <span aria-hidden="true">○</span>
          <div>
            <strong>Label reserved; script intentionally empty.</strong>
            <p>
              THRIVE has not loaded approved wording for this slot. No draft,
              suggested phrasing, or AI-generated substitute is shown — the
              line below describes which call this slot covers, not anything
              to say on one.
            </p>
          </div>
        </div>
        </>
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
