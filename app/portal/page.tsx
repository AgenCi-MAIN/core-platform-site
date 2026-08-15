import { count } from "drizzle-orm";
import { getDb } from "../../db";
import { portalMembers } from "../../db/schema";
import { CAPABILITIES, ROLE_LABELS, requireCapability } from "./access";
import { METAL_FOR_ROLE, RankMedallion } from "../rank-medallion";
import {
  PortalCardHeader,
  PortalPageIntro,
  PortalShell,
  PortalWorkspaceDirectory,
  PrototypeNotice,
} from "./components";

export const dynamic = "force-dynamic";

/** The full capability set, so the dashboard shows held-of-total. */
const TOTAL_CAPABILITIES = CAPABILITIES.length;

/**
 * Principal seats: Shawn, Ryan, Nate, Oscar. Stated by the owner rather than
 * derived, because it is an intent about who should hold access — the filled
 * count below is read from the database and can disagree with it, which is the
 * point.
 */
const TOTAL_SEATS = 4;

/** Roman numeral per role, struck into its medallion. */
const ROLE_NUMERAL: Record<string, string> = {
  owner: "V",
  admin: "IV",
  manager: "III",
  reviewer: "III",
  agent: "I",
  support: "I",
};

/**
 * Personal portal dashboard. Every value is derived from the authenticated
 * session or describes a known system boundary. Production metrics stay absent
 * until an approved source system is connected.
 */
export default async function PortalDashboard() {
  const session = await requireCapability("dashboard.view.self", "/portal");
  const roleLabel = ROLE_LABELS[session.role];
  const metal = METAL_FOR_ROLE[session.role] ?? "steel";
  const numeral = ROLE_NUMERAL[session.role] ?? "I";

  const granted = session.capabilities.length;
  const grantTone = granted >= TOTAL_CAPABILITIES ? "good" : granted < 5 ? "bad" : "warn";

  /**
   * Seats actually granted. A failure here must not take the dashboard down —
   * the count is informational, and the page has already passed authorization.
   *
   * But it must not be reported as zero either. This previously caught the
   * error and left the count at 0, which rendered "4 seats pending an address":
   * a confident statement about the roster, made at the one moment the roster
   * could not be read. `null` means unknown, and the tile says so.
   */
  let seatsFilled: number | null = null;
  try {
    const [row] = await getDb().select({ value: count() }).from(portalMembers);
    seatsFilled = row?.value ?? 0;
  } catch (error) {
    console.error("[portal] could not count portal_members for the seats tile:", error);
  }
  const seatsTone =
    seatsFilled === null
      ? "warn"
      : seatsFilled >= TOTAL_SEATS
        ? "good"
        : seatsFilled >= TOTAL_SEATS - 1
          ? "warn"
          : "bad";

  return (
    <PortalShell session={session} current="/portal" section="Dashboard">
      <main className="portal-main portal-dashboard">
        <div className="portal-dashboard-header">
          <PortalPageIntro
            eyebrow="Authenticated command surface"
            title={<>Welcome, {session.displayName}</>}
            subtitle={
              <>
                Your <strong>{roleLabel}</strong> workspace is ready. Access below reflects your
                current membership and server-enforced capability set.
              </>
            }
            compact
          />
          <div className="portal-dashboard-meta" aria-label="Workspace state">
            <span className="portal-state portal-state-live">Access controls active</span>
            <span className="portal-state portal-state-pending">Business sources pending</span>
          </div>
        </div>

        <section className="portal-metric-grid" aria-label="Session overview">
          {/* Membership: green when active, red otherwise. Status is the one
              value a member should be able to read from across the room. */}
          <article
            className={`portal-metric portal-metric-${session.status === "active" ? "good" : "bad"}`}
          >
            <span className="portal-metric-label">Membership</span>
            <strong className="portal-metric-value portal-metric-shout">{session.status}</strong>
            <span className="portal-metric-detail">Verified against your THRIVE member record</span>
          </article>

          {/* Operating role, struck in its rank metal. Owner is gold. */}
          <article className={`portal-metric portal-metric-metal portal-metric-${metal}`}>
            <span className="portal-metric-label">Operating role</span>
            <span className="portal-metric-rank">
              <RankMedallion metal={metal} numeral={numeral} size={38} title={roleLabel} />
              <strong className="portal-metric-value">{roleLabel}</strong>
            </span>
            <span className="portal-metric-detail">Controls which portal routes you can open</span>
          </article>

          {/* Grants: ten is the full set. Fewer than five is a narrow seat. */}
          <article className={`portal-metric portal-metric-${grantTone}`}>
            <span className="portal-metric-label">Capability grants</span>
            <strong className="portal-metric-value">
              {granted}
              <small className="portal-metric-of"> / {TOTAL_CAPABILITIES}</small>
            </strong>
            <span className="portal-metric-detail">Deny-by-default permissions held now</span>
          </article>

          {/* Seats: how many people hold portal access, out of the four
              principals. Read from the membership table, not asserted. */}
          <article className={`portal-metric portal-metric-${seatsTone}`}>
            <span className="portal-metric-label">Seats</span>
            <strong className="portal-metric-value">
              {seatsFilled ?? "—"}
              <small className="portal-metric-of"> / {TOTAL_SEATS}</small>
            </strong>
            <span className="portal-metric-detail">
              {seatsFilled === null
                ? "Roster could not be read just now"
                : seatsFilled === TOTAL_SEATS
                  ? "All principal seats granted"
                  : `${TOTAL_SEATS - seatsFilled} seat${TOTAL_SEATS - seatsFilled === 1 ? "" : "s"} pending an address`}
            </span>
          </article>

          <article className="portal-metric portal-metric-bad">
            <span className="portal-metric-label">Business sources</span>
            <strong className="portal-metric-value">Not connected</strong>
            <span className="portal-metric-detail">CRM, carrier, dialer feeds, and financial data stay absent</span>
          </article>
        </section>

        <section className="portal-dashboard-grid" aria-label="Dashboard details">
          <article className="portal-card portal-dashboard-primary">
            <PortalCardHeader
              icon="C"
              title="Your operating surface"
              description="Capability-filtered routes available to this account, with honest connection states."
            />
            <PortalWorkspaceDirectory session={session} />
          </article>

          <div className="portal-dashboard-side">
            <article className="portal-card">
              <header className="portal-section-heading">
                <div>
                  <p className="portal-section-kicker">System readiness</p>
                  <h2>What is operational</h2>
                </div>
              </header>
              <div className="portal-readiness-list">
                <div className="portal-readiness-item">
                  <span className="portal-system-dot" aria-hidden="true" />
                  <span className="portal-readiness-copy">
                    <strong>Identity and access</strong>
                    <small>Authentication, membership, and route authorization are active.</small>
                  </span>
                  <span className="portal-readiness-status portal-state portal-state-live">Operational</span>
                </div>
                <div className="portal-readiness-item">
                  <span className="portal-system-dot portal-system-dot-pending" aria-hidden="true" />
                  <span className="portal-readiness-copy">
                    <strong>Operating intelligence</strong>
                    <small>Dialer Beta storage is ready; external business sources await connection.</small>
                  </span>
                  <span className="portal-readiness-status portal-state portal-state-pending">Pending</span>
                </div>
                <div className="portal-readiness-item">
                  <span className="portal-system-dot portal-system-dot-neutral" aria-hidden="true" />
                  <span className="portal-readiness-copy">
                    <strong>Human authority</strong>
                    <small>Licensed, compliance, financial, and executive decisions remain human-controlled.</small>
                  </span>
                  <span className="portal-readiness-status portal-state portal-state-restricted">Required</span>
                </div>
              </div>
            </article>

            <article className="portal-card">
              <header className="portal-section-heading">
                <div>
                  <p className="portal-section-kicker">Account scope</p>
                  <h2>Your access record</h2>
                </div>
              </header>
              <dl className="portal-identity-list">
                <div className="portal-identity-row">
                  <dt className="portal-identity-key">Account</dt>
                  <dd className="portal-identity-value">{session.email}</dd>
                </div>
                <div className="portal-identity-row">
                  <dt className="portal-identity-key">Role</dt>
                  <dd className="portal-identity-value">{roleLabel}</dd>
                </div>
                <div className="portal-identity-row">
                  <dt className="portal-identity-key">Member ID</dt>
                  <dd className="portal-identity-value">#{session.memberId}</dd>
                </div>
              </dl>
              <details className="portal-capability-summary">
                <summary>Capabilities held · {session.capabilities.length} grants</summary>
                <ul className="portal-caps">
                  {session.capabilities.map((capability) => (
                    <li key={capability}><code>{capability}</code></li>
                  ))}
                </ul>
              </details>
            </article>
          </div>
        </section>

        <PrototypeNotice>
          This portal uses real authentication, membership, and server-side authorization. It
          does not yet contain production business data; disconnected areas remain clearly marked
          until approved systems of record are connected.
        </PrototypeNotice>
      </main>
    </PortalShell>
  );
}
