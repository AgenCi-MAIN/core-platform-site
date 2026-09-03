import Link from "next/link";

/**
 * Focused-panel primitives (Dispatch R3, from the approved Direction B
 * artboards): one destination renders one panel, a panel discloses detail one
 * level at a time, and every figure carries the state of the source behind it.
 *
 * Server components only — nothing here holds state, and nothing here
 * decides access. A page calls its guard first and hands the result in.
 *
 * SOURCE STATES, the one vocabulary every panel speaks:
 *   live       a platform table the worker reads today
 *   protected  member or customer data behind a capability, masked by default
 *   pending    "Not provisioned": the field renders, its value does not
 *   deferred   a surface the owner has parked; shown, never actionable
 */
export type SourceState = "live" | "protected" | "pending" | "deferred";

const SOURCE_LABEL: Record<SourceState, string> = {
  live: "Live",
  protected: "Protected",
  pending: "Not provisioned",
  deferred: "Deferred",
};

export function SourcePill({ state, label }: { state: SourceState; label?: string }) {
  return <span className={`portal-pill portal-pill-${state}`}>{label ?? SOURCE_LABEL[state]}</span>;
}

/** Panel header: eyebrow, serif title, optional lede, view chips, and actions. */
export function PanelHead({
  eyebrow,
  title,
  lede,
  chips,
  actions,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  chips?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="portal-panel-head">
      <div className="portal-panel-copy">
        <p className="portal-eyebrow">{eyebrow}</p>
        <h1 className="portal-panel-title">{title}</h1>
        {lede ? <p className="portal-lede">{lede}</p> : null}
      </div>
      {chips ? (
        <nav className="portal-chips" aria-label="View">
          {chips}
        </nav>
      ) : null}
      {actions ? <div className="portal-panel-actions">{actions}</div> : null}
    </header>
  );
}

/** A view chip: a link into the same panel with a different `view`. */
export function ViewChip({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link className="portal-chip" href={href} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}

/** A chip that only names a period whose source is not connected: inert, and says so. */
export function InertChip({ children, current = false }: { children: React.ReactNode; current?: boolean }) {
  return (
    <span className="portal-chip" aria-disabled="true" aria-current={current ? "page" : undefined}>
      {children}
    </span>
  );
}

export function PanelTiles({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <section className="portal-tiles" aria-label={label}>
      {children}
    </section>
  );
}

/**
 * One metric tile. A pending or faulted tile keeps the identical layout so a
 * real number drops in without a redesign, but never shows a fabricated zero.
 */
export function Tile({
  label,
  value,
  state,
  note,
}: {
  label: string;
  /** Null renders the honest em dash. */
  value: number | string | null;
  state: SourceState;
  note?: React.ReactNode;
}) {
  return (
    <article className="portal-tile">
      <span className="portal-tile-label">{label}</span>
      {value === null ? (
        <strong
          className="portal-tile-value portal-tile-value-pending"
          aria-label={state === "pending" ? "No source connected" : "Could not be read just now"}
        >
          &mdash;
        </strong>
      ) : (
        <strong className="portal-tile-value">{value}</strong>
      )}
      <span className="portal-tile-foot">
        <SourcePill state={state} />
        {note ? <span>{note}</span> : null}
      </span>
    </article>
  );
}

export function RecordList({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <ul className="portal-records" aria-label={label}>
      {children}
    </ul>
  );
}

/**
 * Level-one disclosure: a name, one status, one next action. Enter or tap
 * opens level two. No contact detail and no money live on this row.
 */
export function RecordRow({
  href,
  title,
  meta,
  pill,
  current = false,
}: {
  href: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  pill?: React.ReactNode;
  current?: boolean;
}) {
  return (
    <li>
      <Link className="portal-record" href={href} aria-current={current ? "true" : undefined}>
        <span className="portal-record-main">
          <span className="portal-record-title">{title}</span>
          {meta ? <span className="portal-record-meta">{meta}</span> : null}
        </span>
        {pill}
        <span className="portal-record-caret" aria-hidden="true">
          ›
        </span>
      </Link>
    </li>
  );
}

/**
 * Level-two disclosure: a side drawer on desktop, a bottom sheet on a phone
 * (the stylesheet decides at 900px). Server-rendered and addressable — the
 * open state IS the URL — so a reload, a shared link, and the back button all
 * behave. Its close control is a plain link back to the list.
 *
 * Keyboard: the close control takes focus on load, Escape follows it, and the
 * whole section is a labelled dialog region. Nothing traps focus: the page
 * behind stays reachable, because the drawer is disclosure, not a modal.
 */
export function Drawer({
  id,
  eyebrow,
  title,
  closeHref,
  children,
}: {
  id: string;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  closeHref: string;
  children: React.ReactNode;
}) {
  const titleId = `${id}-title`;
  return (
    <section
      className="portal-drawer"
      id={id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-close-href={closeHref}
    >
      <header className="portal-drawer-head">
        <div>
          <p className="portal-eyebrow">{eyebrow}</p>
          <h2 id={titleId}>{title}</h2>
        </div>
        <Link className="portal-drawer-close" href={closeHref} aria-label="Close" title="Close (Esc)">
          <span aria-hidden="true">×</span>
        </Link>
      </header>
      {children}
      {/* Focus on open and Escape to close, without a client component: the
          drawer is server-rendered disclosure and needs no hydration. Escape
          is consumed here so the shell's back control does not also fire on
          the same keypress; an open navigation menu keeps its own Escape. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var d=document.getElementById(${JSON.stringify(id)});if(!d)return;var c=d.querySelector(".portal-drawer-close");if(c&&typeof c.focus==="function")c.focus();document.addEventListener("keydown",function(e){if(e.key!=="Escape"||e.defaultPrevented)return;var m=document.getElementById("portal-mobile-navigation");try{if(m&&m.matches(":popover-open"))return}catch(x){}e.preventDefault();window.location.assign(d.dataset.closeHref)})})();`,
        }}
      />
    </section>
  );
}

export function DrawerActions({ children }: { children: React.ReactNode }) {
  return <div className="portal-drawer-actions">{children}</div>;
}

/**
 * A collapsible section with its count and its source state on the summary
 * line, so a member knows what opening it will and will not show. Native
 * <details>: keyboard-operable, announces expanded state, needs no script.
 */
export function Disclosure({
  title,
  count,
  state,
  open = false,
  children,
}: {
  title: React.ReactNode;
  count?: number | string;
  state?: SourceState;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="portal-disclosure" open={open}>
      <summary>
        <span className="portal-disclosure-title">{title}</span>
        {count !== undefined ? <span className="portal-pill">{count}</span> : null}
        {state ? <SourcePill state={state} /> : null}
        <span className="portal-disclosure-caret" aria-hidden="true" />
      </summary>
      <div className="portal-disclosure-body">{children}</div>
    </details>
  );
}

/** The honest dashed note every unconnected panel carries. */
export function PanelNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="portal-panel-note" role="note">
      {children}
    </p>
  );
}
