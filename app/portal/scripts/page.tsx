import { requireCapability } from "../access";
import { PortalCardHeader, PortalPageIntro, PortalShell, EmptyState } from "../components";
import { CALL_SCRIPTS, SCRIPT_STATUS_LABELS } from "./library";

export const dynamic = "force-dynamic";

/**
 * The live call Script Vault.
 *
 * Presentation here is free to change. The script text is not: every `body`
 * value is authored by a human at IMO and rendered verbatim. See
 * `library.ts` for the content rule.
 */
export default async function ScriptsPage() {
  const session = await requireCapability("scripts.manage", "/portal/scripts");
  const scripts = CALL_SCRIPTS;

  return (
    <PortalShell session={session} current="/portal/scripts" section="Script Vault">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Approved playbooks"
          title="Script Vault"
          subtitle="Live call language, exactly as IMO approved it. Versioned, owned, and rendered word-for-word."
          compact
        />

        <p className="script-governance" role="note">
          <span className="script-governance-tag">Content locked</span>
          <span>
            Script wording is authored and owned by IMO. J.A.R.V.I.S. renders
            it verbatim and <strong>may not write, reword, or summarise it.</strong>{" "}
            Layout and presentation can change freely; the words an agent says on
            a live call change only when a human changes them.
          </span>
        </p>

        {scripts.length === 0 ? (
          <section className="portal-card portal-placeholder-card">
            <div className="portal-placeholder-state">
              <span className="portal-state portal-state-pending">Awaiting script import</span>
            </div>
            <PortalCardHeader
              icon="✦"
              title="Script library"
              description="Approved language, owners, compliance status, and effective dates."
            />
            <EmptyState
              title="No scripts loaded yet"
              body={
                <>
                  The vault is built and ready to hold live call scripts. It is
                  empty because script text must come from IMO — it is not
                  generated here. Add approved scripts to{" "}
                  <code>app/portal/scripts/library.ts</code>, each with its owner,
                  version, and compliance status, and they will appear here
                  verbatim.
                </>
              }
            />
          </section>
        ) : (
          <div className="script-list">
            {scripts.map((script) => (
              <section className="portal-card script-card" id={script.id} key={script.id}>
                <header className="script-card-head">
                  <div>
                    <h2>{script.title}</h2>
                    <p className="script-stage">{script.stage}</p>
                  </div>
                  <span className={`portal-state portal-state-${script.status === "approved" ? "live" : "pending"}`}>
                    {SCRIPT_STATUS_LABELS[script.status]}
                  </span>
                </header>

                <dl className="script-meta">
                  <div>
                    <dt>Owner</dt>
                    <dd>{script.owner}</dd>
                  </div>
                  <div>
                    <dt>Version</dt>
                    <dd>{script.version}</dd>
                  </div>
                  <div>
                    <dt>Effective</dt>
                    <dd>{script.effectiveFrom}</dd>
                  </div>
                </dl>

                {/* Verbatim. Whitespace preserved. Never transformed. */}
                <pre className="script-body">{script.body}</pre>
              </section>
            ))}
          </div>
        )}
      </main>
    </PortalShell>
  );
}
