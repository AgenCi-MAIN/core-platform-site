import { requireCapability } from "../access";
import { PortalPageIntro, PortalShell } from "../components";
import {
  CALL_ANGLE_SLOTS,
  INTRODUCTION_SLOTS,
  type TrainingSlot,
} from "./library";

export const dynamic = "force-dynamic";

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

          {/* Verbatim. Whitespace preserved. Never transformed. */}
          <pre className="script-body training-script-body">{slot.body}</pre>
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
