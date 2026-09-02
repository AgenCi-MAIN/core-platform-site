import { signOutPath } from "../google-auth";
import { ThriveMark } from "../thrive-mark";
import { JarvisCommandPrompt } from "./command-prompt";
import Link from "next/link";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { memberRequests } from "../../db/schema";
import {
  ROLE_LABELS,
  can,
  canSeeInRoster,
  isCommandCenter,
  isFounder,
  normalizeEmail,
  type Capability,
  type PortalSession,
} from "./access";
import { readRows, type ReadFault } from "./read-guard";
import { PortalBackControl } from "./back-control";
import { PortalPerformanceControl } from "../performance-control";
import { PortalThemeControl } from "../theme-control";

type PortalIconName =
  | "dashboard"
  | "command"
  | "library"
  | "announcements"
  | "quoter"
  | "radio"
  | "shop"
  | "payrates"
  | "commission"
  | "training"
  | "book"
  | "calls"
  | "leaderboard"
  | "stats"
  | "surelc"
  | "reagan"
  | "toolbox"
  | "scripts"
  | "team"
  | "leadership"
  | "members"
  | "audit"
  | "gallery"
  | "dialer"
  | "signout";

type NavItem = {
  href: string;
  label: string;
  capability: Capability;
  icon: PortalIconName;
  group: "Work" | "Resources" | "Administration";
  description: string;
  state: "live" | "pending";
  /** Set for third-party tools opened outside the portal. */
  external?: boolean;
  /**
   * Visible only to the seeded founder identity, regardless of role or
   * capability. The page behind such an item enforces the same rule
   * server-side with requireFounder — this flag only controls the sidebar.
   */
  founderOnly?: boolean;
  /**
   * Visible to COMMAND_CENTER_EMAILS (the founder plus named helpers),
   * regardless of role. The page behind it enforces the same set server-side
   * with requireCommandCenter — this flag only controls the sidebar.
   */
  commandOnly?: boolean;
  stateLabel: string;
};

const NAV: readonly NavItem[] = [
  {
    href: "/portal",
    label: "Dashboard",
    capability: "dashboard.view.self",
    icon: "dashboard",
    group: "Work",
    description: "Your authenticated IMO command surface.",
    state: "live",
    stateLabel: "Available",
  },
  {
    href: "/portal/training",
    label: "Training",
    capability: "dashboard.view.self",
    icon: "training",
    group: "Work",
    description: "IMO-approved introductions, call angles, and training language.",
    state: "live",
    stateLabel: "Approved content",
  },
  {
    href: "/portal/calls",
    label: "Calls",
    capability: "calls.answer",
    icon: "calls",
    group: "Work",
    description: "Live browser calls, history, voicemail, authorized review, and founder outbound calling.",
    state: "live",
    stateLabel: "Voice workspace",
  },
  {
    href: "/portal/scripts",
    label: "Script Vault",
    capability: "scripts.manage",
    icon: "scripts",
    group: "Work",
    description: "Governed, versioned conversation playbooks.",
    state: "pending",
    stateLabel: "Import pending",
  },
  {
    href: "/portal/stats",
    label: "My Stats",
    capability: "dashboard.view.self",
    icon: "stats",
    group: "Work",
    description: "Your own production numbers, computed from the platform's records.",
    state: "live",
    stateLabel: "All members",
  },
  {
    href: "/portal/leaderboard",
    label: "Leaderboard",
    capability: "dashboard.view.self",
    icon: "leaderboard",
    group: "Work",
    description: "Team standings from real call production — no hand-entered numbers.",
    state: "live",
    stateLabel: "All members",
  },
  {
    href: "/portal/announcements",
    label: "Announcements",
    capability: "dashboard.view.self",
    icon: "announcements",
    group: "Resources",
    description: "Releases, roadmap, and operating notes from the agency.",
    state: "live",
    stateLabel: "Available",
  },
  {
    href: "/portal/library",
    label: "Library",
    capability: "dashboard.view.self",
    icon: "library",
    group: "Resources",
    description: "Who IMO is, what we believe, training, and the incentive plan.",
    state: "live",
    stateLabel: "Available",
  },
  {
    href: "/portal/commission",
    label: "Commission Schedule",
    capability: "dashboard.view.self",
    icon: "commission",
    group: "Resources",
    description: "Every carrier's comp grid by contract level, with ladders and promotion rules.",
    state: "live",
    stateLabel: "All members",
  },
  {
    href: "/portal/music",
    label: "Radio",
    capability: "dashboard.view.self",
    icon: "radio",
    group: "Resources",
    description: "Music for the floor. Owner-uploaded tracks only.",
    state: "live",
    stateLabel: "Available",
  },
  /**
   * The Command Center no longer carries its own sidebar entry (founder's
   * order 2026-08-18: "Move Command center in RADIO. Hidden in plain sight").
   * It is reached from inside Radio instead.
   *
   * BE CLEAR ABOUT WHAT THIS IS AND IS NOT. Removing a label hides the DOOR,
   * never the room: `/portal/command` still resolves, still refuses anyone
   * without a member row, still refuses anyone off COMMAND_CENTER_EMAILS, and
   * still demands a single-use lodge code from everyone but the founder. The
   * route is unchanged on purpose, so bookmarks, the /go/hq handoff, and every
   * guard test keep working.
   *
   * Obscurity is not a control and nothing here is treated as one. This is a
   * quieter front door on a locked room, which is fine — and it would be
   * dangerous only if it were ever mistaken for the lock itself.
   */
  {
    href: "/portal/gallery",
    label: "Operations Deck",
    capability: "dashboard.view.self",
    icon: "gallery",
    group: "Resources",
    description: "Ten AI-made agent portraits. Select, build, and publish to Inkbox.",
    state: "live",
    stateLabel: "Available",
  },
  {
    href: "/portal/shop",
    label: "Exchange",
    capability: "dashboard.view.self",
    icon: "shop",
    group: "Resources",
    description: "Trade contract points for transferred calls and AI capacity.",
    state: "live",
    stateLabel: "Priced menu",
  },
  {
    href: "/portal/quoter",
    label: "Quoter",
    capability: "book.view.self",
    icon: "quoter",
    group: "Resources",
    description: "Final expense quoting and underwriting — quote inline without leaving CORE.",
    state: "live",
    stateLabel: "Beta",
  },
  // Three SureLC upline instances, each the owner's exact link (2026-08-18).
  // One entry per upline per PLATFORM-MAP rule 2 — never a shared page.
  {
    href: "https://accounts.surancebay.com/oauth/authorize?redirect_uri=https:%2F%2Fsurelc.surancebay.com%2Fproducer%2Foauth%3FreturnUrl%3D%252Fprofile%252Fcontact-info%253FgaId%253D505&gaId=505&client_id=surecrmweb&response_type=code",
    // gaId 505 arrived unbranched; labeled Heartland per the owner's original
    // ask — correct the label if the owner says otherwise.
    label: "SureLC — Heartland",
    capability: "dashboard.view.self",
    icon: "surelc",
    group: "Resources",
    description:
      "Carrier contracting and licensing via SuranceBay. Opens in a new tab; sign in there separately.",
    state: "live",
    stateLabel: "External tool",
    external: true,
  },
  {
    href: "https://accounts.surancebay.com/oauth/authorize?redirect_uri=https:%2F%2Fsurelc.surancebay.com%2Fproducer%2Foauth%3FreturnUrl%3D%252Fprofile%252Fcontact-info%253FgaId%253D862%2526gaId%253D862%2526branch%253DBrenda%252520Daly%2526branchVisible%253Dtrue%2526branchEditable%253Dfalse%2526branchRequired%253Dtrue%2526autoAdd%253Dfalse%2526requestMethod%253DGET&gaId=862&client_id=surecrmweb&response_type=code",
    label: "SureLC — Brenda Daly",
    capability: "dashboard.view.self",
    icon: "surelc",
    group: "Resources",
    description:
      "Carrier contracting via SuranceBay, Brenda Daly branch. Opens in a new tab; sign in there separately.",
    state: "live",
    stateLabel: "External tool",
    external: true,
  },
  {
    href: "https://accounts.surancebay.com/oauth/authorize?redirect_uri=https:%2F%2Fsurelc.surancebay.com%2Fproducer%2Foauth%3FreturnUrl%3D%252Fprofile%252Fcontact-info%253FgaId%253D323%2526branch%253DAltura%252520of%252520America&gaId=323&client_id=surecrmweb&response_type=code",
    label: "SureLC — Altura of America",
    capability: "dashboard.view.self",
    icon: "surelc",
    group: "Resources",
    description:
      "Carrier contracting via SuranceBay, Altura of America. Opens in a new tab; sign in there separately.",
    state: "live",
    stateLabel: "External tool",
    external: true,
  },
  {
    href: "https://reagan.ai/Account/Login?ReturnUrl=%2FAgentPortal%2FManage%2FAccount",
    label: "Reagan AI",
    capability: "dashboard.view.self",
    icon: "reagan",
    group: "Resources",
    description:
      "The Reagan.ai agent portal. Opens in a new tab; sign in there separately.",
    state: "live",
    stateLabel: "External tool",
    external: true,
  },
  {
    href: "/portal/tools",
    label: "Tool Directory",
    capability: "dashboard.view.self",
    icon: "toolbox",
    group: "Resources",
    description:
      "Every external tool in one categorized place — carriers, contracting, leads, quoting, documents.",
    state: "live",
    stateLabel: "All members",
  },
  {
    href: "/portal/pay-rates",
    label: "Pay Rates",
    capability: "leadership.view.all",
    icon: "payrates",
    group: "Administration",
    description: "Restricted. Model contract levels, grants, and cost.",
    state: "live",
    stateLabel: "Restricted",
  },
  {
    href: "/portal/members",
    label: "Members",
    capability: "members.view",
    icon: "members",
    group: "Administration",
    description: "The current authenticated membership roster.",
    state: "live",
    stateLabel: "Membership live",
  },
  {
    href: "/portal/audit",
    label: "Audit",
    capability: "audit.view",
    icon: "audit",
    group: "Administration",
    description: "Recorded portal access and hiring decisions. Founder only.",
    state: "live",
    founderOnly: true,
    stateLabel: "Founder only",
  },
  {
    // The console had no sidebar entry at all until 2026-08-27 — twenty-three
    // nav rows and not one of them reached it, so it could only be opened by
    // typing the URL. A page you have to remember the address of is a page
    // that stops being used.
    href: "/portal/command",
    label: "Command Center",
    // commandOnly above is the gate; capability is the floor all members hold.
    capability: "portal.access",
    icon: "dashboard",
    group: "Administration",
    description: "Workforce state, owner decisions, waiting signals, and accountable handoffs.",
    state: "live",
    commandOnly: true,
    stateLabel: "Command Center only",
  },
];

const NAV_GROUPS = ["Work", "Resources", "Administration"] as const;

/**
 * Subtitle shown under a section header. Work and Resources carry one;
 * Administration renders its label alone.
 */
const NAV_GROUP_SUBTITLES: Partial<Record<(typeof NAV_GROUPS)[number], string>> = {
  Work: "Answer, train & produce",
  Resources: "References, tools & trades",
};

function visibleNav(session: PortalSession): NavItem[] {
  return NAV.filter((item) =>
    item.founderOnly
      ? isFounder(session)
      : item.commandOnly
        ? isCommandCenter(session)
        : can(session, item.capability),
  );
}

/** Requests waiting on THIS person. Fault ⇒ count 0 + fault set: an unreadable
 *  table hides the badge and makes the card say so — never a confident zero.
 *
 *  `readRows` rather than a bare query: an unreadable table must not render
 *  as "nothing pending". Wrapped in React's `cache` so the shell and any page
 *  card share one query per request — a badge that says 3 next to a card
 *  saying 5 is worse than no badge. */
export const pendingRequestsFor = cache(
  async (session: PortalSession): Promise<{ count: number; fault: ReadFault | null }> => {
    const { rows, fault } = await readRows("member_requests", () =>
      getDb()
        .select({ requestedBy: memberRequests.requestedBy, requestedRole: memberRequests.requestedRole })
        .from(memberRequests)
        .where(eq(memberRequests.status, "pending")),
    );
    // You decide for your downline, never for yourself: a request you raised
    // is not a request waiting on you.
    const count = rows.filter(
      (row) =>
        normalizeEmail(row.requestedBy) !== normalizeEmail(session.email) &&
        canSeeInRoster(session, { email: row.requestedBy, role: row.requestedRole as PortalSession["role"] }),
    ).length;
    return { count, fault: fault ?? null };
  },
);

export async function PortalShell({
  session,
  current,
  section,
  children,
}: {
  session: PortalSession;
  current: string;
  section: string;
  children: React.ReactNode;
}) {
  // A silent zero is a lie only when it is presented as a fact, and an absent
  // badge asserts nothing — the shared helper carries the fault alongside the
  // count for surfaces that do have to say something.
  const { count: pendingRequests } = await pendingRequestsFor(session);

  const visible = visibleNav(session);

  return (
    <div className="portal-shell">
      {/* Fallback menu state for engines without the Popover API (Safari
          15.4–16.x and other pre-2023 builds): a visually-hidden checkbox,
          driven by <label> open controls and :has(...:checked) in globals.css.
          Without it those browsers cannot open the navigation menu at all,
          which strands the member with no navigation on every portal sub-page.
          Modern browsers use the popover and leave this untouched. */}
      <input
        className="portal-mobile-drawer-toggle"
        id="portal-mobile-drawer"
        type="checkbox"
        aria-label="Toggle mobile navigation"
      />

      {/* Nav links are client-side now, so tapping one no longer reloads the
          page — which also means the mobile drawer no longer closes itself.
          One delegated listener closes it on any link tap inside it. Inline
          for the same reason as PortalThemeBoot: no props, no state, no
          hydration boundary worth shipping. When Escape actually closes the
          checkbox-fallback drawer, the listener preventDefaults so
          PortalBackControl's defaultPrevented guard treats that Escape as
          consumed — one keypress must never both dismiss and navigate. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            '(function(){if(window.__thriveDrawerClose)return;window.__thriveDrawerClose=1;function u(){var c=document.getElementById("portal-mobile-drawer");if(c&&c.checked){c.checked=false;return true}return false}document.addEventListener("click",function(e){var t=e.target instanceof Element?e.target:null;if(!t)return;var p=t.closest("#portal-mobile-navigation");if(p&&t.closest("a")){if(typeof p.hidePopover==="function"){p.hidePopover()}u()}});document.addEventListener("keydown",function(e){if(e.key==="Escape"&&u()){e.preventDefault()}})})();',
        }}
      />

      {/* The one navigation surface at every width: a slide-up grouped menu,
          anchored above the bottom dock, opened as a popover where the engine
          has one and through the checkbox fallback where it does not. */}
      <aside
        className="portal-menu"
        id="portal-mobile-navigation"
        aria-label="Portal navigation"
        popover="auto"
      >
        <button
          className="portal-drawer-close portal-drawer-close-popover"
          type="button"
          popoverTarget="portal-mobile-navigation"
          popoverTargetAction="hide"
        >
          <span aria-hidden="true">×</span>
          <span className="sr-only">Close navigation</span>
        </button>
        {/* Fallback close: unchecking #portal-mobile-drawer slides the menu
            shut where the popover hide button is inert. */}
        <label
          className="portal-drawer-close portal-drawer-close-fallback"
          htmlFor="portal-mobile-drawer"
          title="Close navigation"
        >
          <span aria-hidden="true">×</span>
          <span className="sr-only">Close navigation</span>
        </label>
        <PortalMenuContent
          session={session}
          current={current}
          visible={visible}
          pendingRequests={pendingRequests}
        />
      </aside>

      {/* Backdrop for the checkbox fallback: the popover path gets a native
          ::backdrop, this gives the fallback the same dimmed click-to-close
          overlay. Hidden unless there is no popover support and the drawer is
          open. */}
      <label
        className="portal-drawer-backdrop"
        htmlFor="portal-mobile-drawer"
        aria-hidden="true"
      />

      <div className="portal-workspace">
        <header className="portal-topbar">
          <div className="portal-topbar-start">
            <PortalBackControl />
            {/* Secondary menu opener: the dock hides on the three bespoke
                command-console routes, so navigation must never depend on it.
                CSS shows exactly one of these two per @supports branch. */}
            <button
              className="portal-topbar-menu portal-button portal-button-quiet"
              type="button"
              popoverTarget="portal-mobile-navigation"
              popoverTargetAction="toggle"
              aria-label="Open navigation menu"
            >
              Menu
            </button>
            <label
              className="portal-topbar-menu-fallback portal-button portal-button-quiet"
              htmlFor="portal-mobile-drawer"
              aria-label="Open navigation menu"
              title="Open navigation menu"
            >
              Menu
            </label>
            <span className="portal-topbar-copy">
              <strong className="portal-section-name">J.A.R.V.I.S. / {section}</strong>
              <small className="portal-section-context">Private operations · IMO</small>
            </span>
          </div>

          <div className="portal-topbar-end" aria-label={`Signed in as ${session.displayName}`}>
            <PortalThemeControl />
            <PortalPerformanceControl />
            <span className="portal-connection">
              <span aria-hidden="true" /> Secure session
            </span>
            <span className={`portal-status portal-status-${session.status}`}>
              {session.status}
            </span>
            <span className="portal-member-name">
              <strong>{session.displayName}</strong>
              <small>{ROLE_LABELS[session.role]}</small>
            </span>
            <span className="portal-topbar-avatar" aria-hidden="true">
              {initials(session.displayName)}
            </span>
          </div>
        </header>

        {/* THE COMMAND BAR — sticky, collapsible, and gated.
            Founder, 2026-08-27: "i want it on top of the screen constanly."
            The prompt used to live on one page you had to navigate to; here it
            rides the shell, so it is at the top of every portal surface.

            GATED to Command Center holders, not merely rendered. Showing an
            agent a command prompt that refuses them is worse than not showing
            one — it advertises a door and then holds it shut.

            COLLAPSED BY DEFAULT, and that is the point of the collapse: sticky
            furniture is permanent furniture, and a phone has little enough
            height without a text field occupying it on every scroll. Shut, it
            is one 44px line; open, it is the same prompt as the console.

            CSS-only, via the same visually-hidden checkbox + :has(:checked)
            mechanism as #portal-mobile-drawer above. No client component and
            no hydration for what is a disclosure widget. The dock's Command
            control is a second label for this same checkbox. */}
        {isCommandCenter(session) ? (
          <>
            <input
              className="portal-command-bar-toggle"
              id="portal-command-bar-toggle"
              type="checkbox"
              aria-label="Open the command prompt"
            />
            <div className="portal-command-bar">
              <label
                className="portal-command-bar-tab"
                htmlFor="portal-command-bar-toggle"
              >
                <span className="portal-command-bar-mark" aria-hidden="true">J</span>
                <span className="portal-command-bar-label">Command</span>
                <span className="portal-command-bar-hint">Ask about this workspace</span>
                <span className="portal-command-bar-caret" aria-hidden="true" />
              </label>
              <div className="portal-command-bar-body">
                <JarvisCommandPrompt />
              </div>
            </div>
          </>
        ) : null}

        {children}

        {/* THE DOCK — the fixed bottom strip that replaced the left rail.
            Quick links render only when their route survived the same
            capability filter as the menu; the Command opener is a second
            label for the very same #portal-command-bar-toggle checkbox the
            sticky bar uses, rendered in the same gated branch as the bar
            itself so the string never reaches markup for non-holders. */}
        <nav className="portal-dock" aria-label="Quick actions">
          {isCommandCenter(session) ? (
            <label className="portal-dock-command" htmlFor="portal-command-bar-toggle">
              <span className="portal-dock-command-mark" aria-hidden="true">J</span>
              Command
            </label>
          ) : null}
          <button
            className="portal-dock-menu"
            type="button"
            popoverTarget="portal-mobile-navigation"
            popoverTargetAction="toggle"
            aria-label="Open navigation menu"
          >
            Menu
          </button>
          {/* Fallback opener for engines without the Popover API. CSS shows
              exactly one of these two per @supports branch. */}
          <label
            className="portal-dock-menu-fallback"
            htmlFor="portal-mobile-drawer"
            aria-label="Open navigation menu"
            title="Open navigation menu"
          >
            Menu
          </label>
          {["/portal", "/portal/calls", "/portal/music"].map((href) => {
            const item = visible.find((entry) => entry.href === href);
            if (!item) return null;
            return (
              <Link
                key={item.href}
                className="portal-dock-link"
                href={item.href}
                aria-current={item.href === current ? "page" : undefined}
                title={item.label}
              >
                <span className="portal-dock-link-icon" aria-hidden="true">
                  <PortalNavMark name={item.icon} />
                </span>
                <span className="portal-dock-link-text">{item.label}</span>
              </Link>
            );
          })}
          {/* Honest hint: Esc genuinely closes the menu on both paths. */}
          <span className="portal-dock-hint" aria-hidden="true">
            <kbd>Esc</kbd> closes
          </span>
        </nav>
      </div>
    </div>
  );
}

function PortalMenuContent({
  session,
  current,
  visible,
  pendingRequests,
}: {
  session: PortalSession;
  current: string;
  visible: readonly NavItem[];
  pendingRequests: number;
}) {
  return (
    <>
      <div className="portal-menu-head">
        <Link className="portal-brand" href="/portal" aria-label="IMO portal dashboard">
          <span className="portal-brand-mark" aria-hidden="true"><ThriveMark size={19} /></span>
          <span className="portal-brand-copy">
            <strong>IMO</strong>
            <small>Operating portal</small>
          </span>
        </Link>
        <span className="portal-brand-kicker">Protected workspace</span>
      </div>

      <nav className="portal-menu-columns" aria-label="Portal sections">
        {NAV_GROUPS.map((group) => {
          const groupItems = visible.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;

          return (
            <div className={`portal-menu-group portal-menu-group-${group.toLowerCase()}`} key={group}>
              <p className="portal-menu-group-label">{group}</p>
              {NAV_GROUP_SUBTITLES[group] ? (
                <p className="portal-menu-group-sub">{NAV_GROUP_SUBTITLES[group]}</p>
              ) : null}
              {/* Internal links navigate client-side ON PURPOSE. A plain
                  <a> is a full page load, which tears down the portal layout
                  — and the audio deck inside it, killing the radio on every
                  page switch. <Link> keeps the layout (and the playing
                  <audio> element) alive across navigations. */}
              {groupItems.map((item) =>
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`portal-menu-item portal-menu-item-${item.icon}`}
                    title={`${item.label} — opens in a new tab`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="portal-menu-dot" aria-hidden="true" />
                    <span className="portal-menu-label">{item.label}</span>
                    <span className="portal-menu-external" aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`portal-menu-item portal-menu-item-${item.icon}`}
                    aria-current={item.href === current ? "page" : undefined}
                    title={item.label}
                  >
                    <span className="portal-menu-dot" aria-hidden="true" />
                    {/* The dashboard row wears the member's own name and rank
                        instead of the word "Dashboard" (founder 2026-08-18).
                        It is the same destination; the first row of the menu
                        answers "who am I signed in as". */}
                    {item.href === "/portal" ? (
                      <span className="portal-menu-label portal-menu-identity">
                        <strong>{session.displayName}</strong>
                        <small>{ROLE_LABELS[session.role]}</small>
                      </span>
                    ) : (
                      <span className="portal-menu-label">{item.label}</span>
                    )}
                    {/* The count of things waiting on THIS person. Rendered
                        only when there is something to see: a badge that is
                        permanently present but usually zero teaches people to
                        stop looking at badges. */}
                    {item.href === "/portal" && pendingRequests > 0 ? (
                      <span className="portal-menu-badge">
                        {pendingRequests > 99 ? "99+" : pendingRequests}
                        <span className="sr-only">
                          {" "}
                          request{pendingRequests === 1 ? "" : "s"} waiting on you
                        </span>
                      </span>
                    ) : null}
                    {item.founderOnly || item.commandOnly ? (
                      <span className="portal-pill portal-pill-owner">OWNER ONLY</span>
                    ) : null}
                    {item.icon === "shop" ? (
                      <span className="portal-pill portal-pill-live" aria-hidden="true">
                        LIVE
                      </span>
                    ) : null}
                  </Link>
                ),
              )}
            </div>
          );
        })}
      </nav>

      {/* The three demoted stubs (decision 2026-09-02): named, not linked. Their
          routes and guards live on untouched; they re-enter the menu when their
          sources land. Plain text on purpose — no href, so the gated-absence tests
          and the roster of refused doors stay clean. */}
      <p className="portal-menu-coming">
        Coming online: Book of Business · Team · Leadership
      </p>

      <div className="portal-menu-foot">
        <span className="portal-menu-system">
          {/* Wordless hidden control. For everyone it is just the status
              light; for the founder alone it is the entrance to
              INVESTIGATOR's console. Rendered as a link ONLY in the founder's
              own server-rendered menu, so for anyone else there is no element
              to find, inspect, or reach. /portal/investigator re-checks the
              founder identity: the button is convenience, the server guard is
              the boundary. */}
          {isFounder(session) ? (
            <Link
              className="portal-system-dot-link"
              href="/portal/investigator"
              aria-label="Investigator console"
            >
              <span className="portal-system-dot" aria-hidden="true" />
            </Link>
          ) : (
            <span className="portal-system-dot" aria-hidden="true" />
          )}
          <span>Access controls active</span>
        </span>
        {/* Deliberately a plain <a>, never <Link>: Link may prefetch its
            target, and prefetching /auth/signout would sign the member out
            for merely rendering the menu. */}
        <a className="portal-signout portal-menu-signout" href={signOutPath("/")} title="Sign out">
          Sign out
        </a>
      </div>
    </>
  );
}

export function PortalCardHeader({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <header className="portal-card-header">
      <span className="portal-card-icon" aria-hidden="true">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </header>
  );
}

export function PortalPageIntro({
  eyebrow,
  title,
  subtitle,
  compact = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`portal-intro${compact ? " portal-intro-compact" : ""}`}>
      <p className="portal-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="portal-lede">{subtitle}</p>
    </section>
  );
}

export function PortalPlaceholderPage({
  session,
  current,
  section,
  eyebrow,
  title,
  subtitle,
  cardTitle,
  cardDescription,
  emptyTitle,
  emptyBody,
  icon,
}: {
  session: PortalSession;
  current: string;
  section: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cardTitle: string;
  cardDescription: string;
  emptyTitle: string;
  emptyBody: React.ReactNode;
  icon: string;
}) {
  return (
    <PortalShell session={session} current={current} section={section}>
      <main className="portal-main">
        <PortalPageIntro eyebrow={eyebrow} title={title} subtitle={subtitle} compact />
        <section className="portal-card portal-placeholder-card">
          <div className="portal-placeholder-state">
            <span className="portal-state portal-state-pending">Source not connected</span>
          </div>
          <PortalCardHeader icon={icon} title={cardTitle} description={cardDescription} />
          <EmptyState title={emptyTitle} body={emptyBody} />
        </section>
      </main>
    </PortalShell>
  );
}

const GO_ROUTES = ["/portal/training", "/portal/calls", "/portal/stats", "/portal/shop"] as const;
/** Server-side display override: the founder-named tile label for the Exchange.
 *  The menu keeps "Exchange" + the client-side relabel; the tile is born "Marketplace". */
const GO_LABELS: Readonly<Record<string, string>> = { "/portal/shop": "Marketplace" };

export function PortalGoRow({ session }: { session: PortalSession }) {
  const visible = visibleNav(session);
  return (
    <section className="portal-go-row" aria-label="Go">
      {GO_ROUTES.map((href) => {
        const item = visible.find((entry) => entry.href === href);
        if (!item) return null;   // role-filtered: an unopenable tile is an absent tile
        return (
          <Link key={item.href} className="portal-go-tile" href={item.href} title={item.label}>
            <span className="portal-go-icon" aria-hidden="true"><PortalNavMark name={item.icon} /></span>
            <span className="portal-go-label">{GO_LABELS[item.href] ?? item.label}</span>
          </Link>
        );
      })}
    </section>
  );
}

export function PrototypeNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="portal-notice" role="note">
      <span>System boundary</span>
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="portal-empty">
      <span className="portal-empty-icon" aria-hidden="true">○</span>
      <div className="portal-empty-copy">
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </div>
  );
}

/**
 * Sidebar icons. These used to be single letters (D, B, C, …), which read as
 * placeholders. Inline stroke SVGs inherit `currentColor` exactly like the
 * letters did — same active/hover colour behaviour, both themes — and the
 * deck already proved this approach against iOS repainting emoji glyphs.
 */
const NAV_MARKS: Record<PortalIconName, React.ReactNode> = {
  // Four tiles — the command surface.
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  // Crosshair inside a field console — founder command.
  command: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="2.3" />
      <path d="M12 2.5V6M12 18v3.5M2.5 12H6M18 12h3.5" />
    </>
  ),
  // Speaker with sound waves.
  announcements: (
    <>
      <path d="M4 10v4h3.5l5.5 4V6L7.5 10H4z" />
      <path d="M16.5 9.5a4 4 0 0 1 0 5M19 7.5a7 7 0 0 1 0 9" />
    </>
  ),
  // Open book.
  library: (
    <>
      <path d="M12 6.5C10.5 5.2 8.4 4.5 6 4.5h-1v14h1c2.4 0 4.5.7 6 2 1.5-1.3 3.6-2 6-2h1v-14h-1c-2.4 0-4.5.7-6 2z" />
      <path d="M12 6.5v14" />
    </>
  ),
  // Eighth notes.
  radio: (
    <>
      <path d="M9.2 17.5V6.5l9.6-2v11" />
      <circle cx="7" cy="17.5" r="2.2" />
      <circle cx="16.6" cy="15.5" r="2.2" />
    </>
  ),
  // Open training guide with an approval check.
  training: (
    <>
      <path d="M4.5 5.5h6.2c1.8 0 3.3.7 4.3 1.8v12.2c-1-1.1-2.5-1.8-4.3-1.8H4.5V5.5z" />
      <path d="M19.5 5.5H15c-.7 0-1.4.1-2 .3M15.7 12.7l1.7 1.7 3.1-3.4" />
    </>
  ),
  // Briefcase — the book of business.
  book: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5" />
      <path d="M3.5 12.5h17" />
    </>
  ),
  // Phone handset.
  calls: (
    <path d="M5.5 4h3l1.5 4-2 1.6a12.5 12.5 0 0 0 6.4 6.4L16 14l4 1.5v3A1.5 1.5 0 0 1 18.4 20C10.9 19.4 4.6 13.1 4 5.6A1.5 1.5 0 0 1 5.5 4z" />
  ),
  // Podium — the leaderboard.
  leaderboard: (
    <>
      <path d="M9 20.5V9.5h6v11" />
      <path d="M3.5 20.5V13.5H9M15 20.5h5.5v-4.5H15" />
      <path d="M3.5 20.5h17" />
    </>
  ),
  // Rising bars — personal statistics.
  stats: (
    <>
      <path d="M5 20V14M10.5 20V9M16 20V11.5M21 20V5.5" transform="translate(-1 0)" />
      <path d="M3.5 20.5h17" />
    </>
  ),
  // Signature line under a document — contracting.
  surelc: (
    <>
      <path d="M6.5 3.5H14L17.5 7v9.5" />
      <path d="M13.5 3.5V7h4" />
      <path d="M4 19.5c1.6-2.6 3-2.6 3.6-.6.5 1.7 1.6 1.7 2.6-.6.8-1.8 1.8-1.8 2.6 0" />
      <path d="M15.5 19.5h5" />
    </>
  ),
  // Target with an outbound arrow — the lead portal.
  reagan: (
    <>
      <circle cx="11" cy="13" r="7" />
      <path d="M11 13 20 4M20 4h-4.5M20 4v4.5" />
    </>
  ),
  // Toolbox — the external tool directory.
  toolbox: (
    <>
      <rect x="3.5" y="9" width="17" height="11" rx="2" />
      <path d="M9 9V7a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 7v2" />
      <path d="M3.5 13.5h17M10.5 12.5v2M13.5 12.5v2" />
    </>
  ),
  // Document with lines.
  scripts: (
    <>
      <path d="M6.5 3.5H14L17.5 7v12a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V3.5z" />
      <path d="M13.5 3.5V7h4" />
      <path d="M9.5 12h5M9.5 15.5h5" />
    </>
  ),
  // Two people.
  team: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19.5c0-3 2.4-5 5.5-5s5.5 2 5.5 5" />
      <path d="M15.5 6a3 3 0 0 1 0 5.2M17.5 14.8c1.9.8 3 2.4 3 4.7" />
    </>
  ),
  // Flag planted.
  leadership: (
    <>
      <path d="M6 21V4" />
      <path d="M6 4.8c4-2 8 2 12 0v8.7c-4 2-8-2-12 0" />
    </>
  ),
  // Two-way trade arrows — the Exchange.
  shop: (
    <>
      <path d="M7 8h13.5M17 4.5 20.5 8 17 11.5" />
      <path d="M17 16H3.5M7 12.5 3.5 16 7 19.5" />
    </>
  ),
  // Calculator.
  quoter: (
    <>
      <rect x="5.5" y="3.5" width="13" height="17" rx="2" />
      <path d="M9 7.5h6" />
      <path d="M9 12h.01M12 12h.01M15 12h.01M9 15.7h.01M12 15.7h.01M15 15.7h.01" />
    </>
  ),
  // Percent mark — the comp grid.
  commission: (
    <>
      <circle cx="7.5" cy="7.5" r="2.6" />
      <circle cx="16.5" cy="16.5" r="2.6" />
      <path d="M17.5 5.5 6.5 18.5" />
    </>
  ),
  // Dollar in a coin.
  payrates: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v10M14.6 9.3c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.7.9-2.7 2.1s1.1 1.7 2.7 2c1.6.3 2.7.9 2.7 2.1s-1.2 2.1-2.7 2.1c-1.1 0-2.1-.5-2.6-1.4" />
    </>
  ),
  // ID badge — the roster.
  members: (
    <>
      <rect x="3.5" y="5" width="17" height="14.5" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6 16.5c.5-1.4 1.6-2.2 3-2.2s2.5.8 3 2.2" />
      <path d="M15 10h3.5M15 13.5h3.5" />
    </>
  ),
  // Shield with a check — the access log.
  audit: (
    <>
      <path d="M12 3.5 5 6v5.2c0 4.4 2.9 7.8 7 9.3 4.1-1.5 7-4.9 7-9.3V6z" />
      <path d="m9 11.8 2.2 2.2 4.3-4.3" />
    </>
  ),
  // Door with an outbound arrow.
  // Portrait frame — gallery / operations deck.
  gallery: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <circle cx="12" cy="11" r="3.5" />
      <path d="M7.5 18.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
    </>
  ),
  dialer: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <circle cx="9" cy="11" r="1" />
      <circle cx="12" cy="11" r="1" />
      <circle cx="15" cy="11" r="1" />
      <circle cx="9" cy="14" r="1" />
      <circle cx="12" cy="14" r="1" />
      <circle cx="15" cy="14" r="1" />
      <rect x="8" y="6" width="8" height="2.5" rx="0.5" />
    </>
  ),
  signout: (
    <>
      <path d="M13.5 4.5H7A1.5 1.5 0 0 0 5.5 6v12A1.5 1.5 0 0 0 7 19.5h6.5" />
      <path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5" />
    </>
  ),
};

function PortalNavMark({ name }: { name: PortalIconName }) {
  return (
    <svg
      className={`portal-nav-symbol portal-nav-symbol-${name}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {NAV_MARKS[name]}
    </svg>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "T";
}
