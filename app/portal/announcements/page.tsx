import { requireCapability } from "../access";
import { JarvisMark } from "../jarvis-mark";
import { EmptyState, PortalPageIntro, PortalShell } from "../components";
import {
  ANNOUNCEMENTS,
  ANNOUNCEMENT_CATEGORY_LABELS,
  type Announcement,
} from "./content";

export const dynamic = "force-dynamic";

/**
 * Announcements from the agency to its members.
 *
 * Guarded by `dashboard.view.self`, which all six roles hold — announcements
 * are for everyone with portal access. Contains no member, book, or call data.
 * Every word is owner-authored and rendered verbatim.
 */
export default async function AnnouncementsPage() {
  const session = await requireCapability(
    "dashboard.view.self",
    "/portal/announcements",
  );

  const ordered = [...ANNOUNCEMENTS].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.date.localeCompare(a.date);
  });

  return (
    <PortalShell
      session={session}
      current="/portal/announcements"
      section="Announcements"
    >
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="THRIVE — From the desk"
          title="Announcements"
          subtitle="Releases, roadmap, and operating notes, published by the agency."
          compact
        />

        {ordered.length === 0 ? (
          <section className="portal-card portal-placeholder-card">
            <EmptyState
              title="No announcements yet"
              body="When THRIVE publishes an announcement it appears here, newest first."
            />
          </section>
        ) : (
          <div className="announce-list">
            {ordered.map((item) => (
              <AnnouncementCard item={item} key={item.id} />
            ))}
          </div>
        )}
      </main>
    </PortalShell>
  );
}

function AnnouncementCard({ item }: { item: Announcement }) {
  return (
    <article
      className={`portal-card announce-card${item.pinned ? " announce-card-pinned" : ""}`}
      id={item.id}
    >
      {item.pinned ? (
        <span className="announce-pin" aria-label="Pinned announcement">
          <span aria-hidden="true">★</span> Pinned
        </span>
      ) : null}

      <header className="announce-head">
        <div className="announce-meta">
          <span className={`announce-tag announce-tag-${item.category}`}>
            {ANNOUNCEMENT_CATEGORY_LABELS[item.category]}
          </span>
          <time className="announce-date" dateTime={item.date}>
            {formatDate(item.date)}
          </time>
        </div>
        <h2>{item.title}</h2>
        <p className="announce-author">
          {item.author === "J.A.R.V.I.S." ? (
            <>
              <JarvisMark size={22} className="announce-author-mark" />
              <span>Posted by J.A.R.V.I.S. — automated system identity</span>
            </>
          ) : (
            <span>Posted by {item.author}</span>
          )}
        </p>
      </header>

      <div className="announce-body">
        {item.body.map((paragraph, i) => (
          <p key={i}>{renderOwnerText(paragraph)}</p>
        ))}
      </div>

      {item.roadmap && item.roadmap.length > 0 ? (
        <div className="announce-roadmap">
          <p className="announce-roadmap-label">On the roadmap</p>
          <ul>
            {item.roadmap.map((entry, i) => (
              <li key={i}>{entry}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

/**
 * Preserve the owner's Markdown-style emphasis without introducing a general
 * Markdown/HTML parser into an authenticated surface. Only paired `**...**`
 * segments become <strong>; every character remains a React text node.
 */
function renderOwnerText(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((segment, index) =>
    segment.startsWith("**") && segment.endsWith("**") ? (
      <strong key={index}>{segment.slice(2, -2)}</strong>
    ) : (
      segment
    ),
  );
}

/**
 * Render the ISO date in a fixed, unambiguous form. Deliberately not
 * locale-dependent: 09/12 means different months either side of the Atlantic,
 * and this is read by people in more than one place.
 */
function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const index = Number.parseInt(month ?? "", 10) - 1;
  const name = months[index] ?? month;
  return `${name} ${Number.parseInt(day ?? "", 10)}, ${year}`;
}
