import { Fragment } from "react";
import { requireCapability } from "../access";
import { PortalPageIntro, PortalShell } from "../components";
import { formatBody } from "./format";
import { CALL_SCRIPTS, SCRIPT_STATUS_LABELS, SCRIPT_VAULT_SOURCE } from "./library";

export const dynamic = "force-dynamic";

/**
 * The Script Vault — the structured, in-product copy of the canonical script
 * document, one section per source tab, in source order.
 *
 * Presentation here is free to change. The script text is not: every `body`
 * is the verbatim export of the human-owned document and is rendered through
 * a presentation-only formatter (see format.ts) whose text output a runtime
 * test compares byte-for-byte against `plainText(body)`.
 *
 * EVERY SECTION IS A DRAFT. The label on each card is not decoration: nothing
 * here has been through licensed or compliance review, and nothing here
 * activates a call, a sale, a claim, a replacement, or a cancellation. It is a
 * reference copy held for review.
 */

const DRAFT_NOTICE =
  "Imported from the canonical script document for review. Not compliance-approved guidance. " +
  "Nothing on this page places a call, sells, files a claim, replaces, or cancels a policy.";

function ScriptBody({ body }: { body: string }) {
  const lines = formatBody(body);
  return (
    <pre className="script-body script-vault-body">
      {lines.map((line, index) => {
        const newline = index < lines.length - 1 ? "\n" : "";
        const content = line.segments.map((segment, at) => {
          let node: React.ReactNode = segment.text;
          if (segment.italic) node = <em key={`i-${at}`}>{node}</em>;
          if (segment.bold) node = <strong key={`b-${at}`}>{node}</strong>;
          return <Fragment key={at}>{node}</Fragment>;
        });
        if (line.kind === "heading") {
          return (
            <span key={index} className={`script-vault-h script-vault-h${line.level}`}>
              {content}
              {newline}
            </span>
          );
        }
        return (
          <Fragment key={index}>
            {content}
            {newline}
          </Fragment>
        );
      })}
    </pre>
  );
}

export default async function ScriptsPage() {
  const session = await requireCapability("scripts.manage", "/portal/scripts");
  const scripts = CALL_SCRIPTS;

  return (
    <PortalShell session={session} current="/portal/scripts" section="Script Vault">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Imported drafts · review required"
          title="Script Vault"
          subtitle={`${scripts.length} sections imported from the canonical script document, in its order, rendered word-for-word.`}
          compact
        />

        <p className="script-governance script-governance-draft" role="note">
          <span className="script-governance-tag">{SCRIPT_STATUS_LABELS.draft_compliance_review}</span>
          <span>
            {DRAFT_NOTICE} Script wording is owned by the humans who wrote it;
            J.A.R.V.I.S. renders it verbatim and{" "}
            <strong>may not write, reword, or summarise it.</strong> Source:{" "}
            <a href={SCRIPT_VAULT_SOURCE.url} target="_blank" rel="noopener noreferrer">
              {SCRIPT_VAULT_SOURCE.title}
            </a>{" "}
            (Google Doc, imported {SCRIPT_VAULT_SOURCE.importedOn}).
          </span>
        </p>

        {scripts.length === 0 ? (
          <section className="portal-card portal-placeholder-card">
            <div className="portal-placeholder-state">
              <span className="portal-state portal-state-pending">Awaiting script import</span>
            </div>
            <p>No scripts are loaded. Script text must come from the canonical document; it is not generated here.</p>
          </section>
        ) : (
          <>
            <nav className="portal-card script-vault-index" aria-label="Script sections">
              <ol>
                {scripts.map((script) => (
                  <li key={script.id}>
                    <a href={`#${script.id}`}>
                      <span className="script-vault-index-order">{script.order}</span>
                      {script.title}
                    </a>
                    <small>{script.phase}</small>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="script-list">
              {scripts.map((script) => (
                <section className="portal-card script-card" id={script.id} key={script.id}>
                  <header className="script-card-head">
                    <div>
                      <h2>
                        <span className="script-vault-order">{script.order}.</span> {script.title}
                      </h2>
                      <p className="script-stage">{script.phase}</p>
                    </div>
                    <span className="portal-state portal-state-pending script-draft-label">
                      {SCRIPT_STATUS_LABELS[script.status]}
                    </span>
                  </header>

                  <dl className="script-meta">
                    <div>
                      <dt>Source</dt>
                      <dd>
                        {SCRIPT_VAULT_SOURCE.title} · tab “{script.sourceTab}”
                      </dd>
                    </div>
                    <div>
                      <dt>Imported</dt>
                      <dd>{SCRIPT_VAULT_SOURCE.importedOn}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>Draft — licensed and compliance review required</dd>
                    </div>
                  </dl>

                  {/* Verbatim. Whitespace preserved. Markers become structure, never new words. */}
                  <ScriptBody body={script.body} />
                </section>
              ))}
            </div>
          </>
        )}
      </main>
    </PortalShell>
  );
}
