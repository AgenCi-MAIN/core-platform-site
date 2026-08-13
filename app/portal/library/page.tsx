import { requireCapability } from "../access";
import { PortalPageIntro, PortalShell } from "../components";
import { LIBRARY, type LibraryBlock, type LibraryDocument } from "./content";

export const dynamic = "force-dynamic";

/**
 * The reading room: who THRIVE is, what it believes, how training works, and
 * the current incentive plan.
 *
 * Guarded by `dashboard.view.self`, which every one of the six roles holds —
 * this is company reading, not privileged operational data. It contains no
 * member records, no book data, and no call material.
 */
export default async function LibraryPage() {
  const session = await requireCapability("dashboard.view.self", "/portal/library");

  return (
    <PortalShell session={session} current="/portal/library" section="Library">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="THRIVE — Company reading"
          title="Library"
          subtitle="Who we are, what we believe, how you get trained, and what the agency invests in you."
          compact
        />

        <nav className="library-index" aria-label="Library contents">
          {LIBRARY.map((doc) => (
            <a className="library-index-item" href={`#${doc.id}`} key={doc.id}>
              <span className="library-index-icon" aria-hidden="true">{doc.icon}</span>
              <span className="library-index-copy">
                <strong>{doc.title}</strong>
                <small>{doc.summary}</small>
              </span>
              {doc.status === "draft" ? (
                <span className="portal-state portal-state-pending">Draft</span>
              ) : (
                <span className="portal-state portal-state-live">Approved</span>
              )}
            </a>
          ))}
        </nav>

        {LIBRARY.map((doc) => (
          <LibraryArticle doc={doc} key={doc.id} />
        ))}
      </main>
    </PortalShell>
  );
}

function LibraryArticle({ doc }: { doc: LibraryDocument }) {
  return (
    <article className="portal-card library-doc" id={doc.id}>
      <header className="library-doc-head">
        <span className="library-doc-icon" aria-hidden="true">{doc.icon}</span>
        <div className="library-doc-title">
          <h2>{doc.title}</h2>
          <p>{doc.summary}</p>
        </div>
        <span
          className={`portal-state portal-state-${doc.status === "draft" ? "pending" : "live"}`}
        >
          {doc.status === "draft" ? "Draft — not approved" : "Approved"}
        </span>
      </header>

      {doc.status === "draft" ? (
        <p className="library-draft-note" role="note">
          <strong>This is a draft.</strong> It was written for THRIVE&apos;s
          owner to edit or approve, and it is not agency policy until they do.
          Nothing in it states a figure, date, or commitment the agency has not
          supplied.
        </p>
      ) : null}

      <div className="library-body">
        {doc.blocks.map((block, i) => (
          <LibraryBlockView block={block} key={i} />
        ))}
      </div>

      <footer className="library-doc-foot">
        <p className="portal-fine">
          <strong>Source:</strong> {doc.provenance}
        </p>
        {doc.expires ? (
          <p className="library-expiry" role="note">
            <strong>Time-limited:</strong> {doc.expires}
          </p>
        ) : null}
      </footer>
    </article>
  );
}

function LibraryBlockView({ block }: { block: LibraryBlock }) {
  switch (block.kind) {
    case "paragraph":
      return <p className="library-paragraph">{block.text}</p>;
    case "heading":
      return <h3 className="library-heading">{block.text}</h3>;
    case "quote":
      return <p className="library-quote">{block.text}</p>;
    case "list":
      return (
        <ul className="library-list">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "numbered":
      return (
        <ol className="library-numbered">
          {block.items.map((item, i) => (
            <li key={i}>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </li>
          ))}
        </ol>
      );
  }
}
