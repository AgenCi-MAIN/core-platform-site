import { requireCapability } from "../access";
import { PortalCardHeader, PortalPageIntro, PortalShell, EmptyState } from "../components";
import {
  TRAINING_DOCS,
  TRAINING_SECTION_LABELS,
  TRAINING_STATUS_LABELS,
  type TrainingSection,
} from "./content";

export const dynamic = "force-dynamic";

/**
 * Training — Training · Introductions · Call Angles.
 *
 * Presentation here is free to change. The content is not: every `body` value
 * is authored by a human at THRIVE and rendered verbatim, and empty slots stay
 * visibly empty rather than being filled with generated text. See content.ts
 * for the content rule. Guarded like every member surface: dashboard.view.self
 * is held by all six roles, so training reaches every active member while
 * anonymous and suspended callers are refused server-side.
 */
const SECTION_ORDER: readonly TrainingSection[] = ["training", "introductions", "angles"];

export default async function TrainingPage() {
  const session = await requireCapability("dashboard.view.self", "/portal/training");

  return (
    <PortalShell session={session} current="/portal/training" section="Training">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Approved curriculum"
          title="Training"
          subtitle="Introductions, call angles, and training modules — exactly as THRIVE approved them, rendered word-for-word."
          compact
        />

        <p className="script-governance" role="note">
          <span className="script-governance-tag">Content locked</span>
          <span>
            Training wording is authored and owned by THRIVE. J.A.R.V.I.S. renders
            it verbatim and <strong>may not write, reword, or summarise it.</strong>{" "}
            A slot without content says so plainly — nothing here is generated to
            fill a gap.
          </span>
        </p>

        {SECTION_ORDER.map((sectionKey) => {
          const meta = TRAINING_SECTION_LABELS[sectionKey];
          const docs = TRAINING_DOCS.filter((d) => d.section === sectionKey);

          return (
            <section className="portal-card script-card training-section" key={sectionKey} id={`training-${sectionKey}`}>
              <PortalCardHeader icon="✦" title={meta.title} description={meta.description} />

              {docs.length === 0 ? (
                <EmptyState
                  title="No modules loaded yet"
                  body={
                    <>
                      This section is built and ready. It is empty because its
                      content must come from THRIVE — it is not generated here.
                      Add approved modules to{" "}
                      <code>app/portal/training/content.ts</code> and they will
                      appear here verbatim.
                    </>
                  }
                />
              ) : (
                <div className="script-list">
                  {docs.map((doc) => (
                    <article className="portal-card script-card" id={doc.id} key={doc.id}>
                      <header className="script-card-head">
                        <div>
                          <h2>{doc.title}</h2>
                          {doc.titleTruncated ? (
                            <p className="script-stage">
                              Name truncated at the source — confirm the full title before renaming.
                            </p>
                          ) : null}
                        </div>
                        <span
                          className={`portal-state portal-state-${doc.body && doc.status === "approved" ? "live" : "pending"}`}
                        >
                          {doc.body ? TRAINING_STATUS_LABELS[doc.status] : TRAINING_STATUS_LABELS.in_review}
                        </span>
                      </header>

                      {doc.body ? (
                        <>
                          <dl className="script-meta">
                            <div>
                              <dt>Owner</dt>
                              <dd>{doc.owner}</dd>
                            </div>
                            <div>
                              <dt>Version</dt>
                              <dd>{doc.version}</dd>
                            </div>
                            <div>
                              <dt>Effective</dt>
                              <dd>{doc.effectiveFrom}</dd>
                            </div>
                          </dl>
                          {/* Verbatim. Whitespace preserved. Never transformed. */}
                          <pre className="script-body">{doc.body}</pre>
                        </>
                      ) : (
                        <EmptyState
                          title="Awaiting THRIVE content"
                          body={
                            <>
                              This slot is reserved for the approved{" "}
                              <strong>{doc.title}</strong> material. It renders
                              the moment a human adds the text to{" "}
                              <code>app/portal/training/content.ts</code> —
                              word-for-word, never generated.
                            </>
                          }
                        />
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>
    </PortalShell>
  );
}
