import Link from "next/link";
import { requireCapability } from "../access";
import { EmptyState, PortalShell, PrototypeNotice } from "../components";
import { loadCallbacks, type CallbackPreview } from "../dashboard-data";
import {
  Disclosure,
  Drawer,
  DrawerActions,
  PanelHead,
  PanelNote,
  PanelTiles,
  RecordList,
  RecordRow,
  SourcePill,
  Tile,
  ViewChip,
} from "../panel";
import { readFaultCopy } from "../read-guard";

export const dynamic = "force-dynamic";

/**
 * Book of Business — the customer and policy workspace (Dispatch R3,
 * 2026-09-02, from the approved Direction B artboards).
 *
 * ONE ROUTE, ONE GUARD, THREE VIEWS. `?view=summary|customers|policies`
 * switches the focused panel; anything else is the summary. The guard is the
 * one this route always had (`book.view.self`, `/portal/book`) — no call site,
 * capability or role changed — and everything shown is SELF-SCOPED: the
 * member's own callback queue, never another member's book.
 *
 * WHAT IS REAL AND WHAT IS NOT, said on the page as it is said here:
 *   - Customers are the open voicemail callbacks the platform already holds
 *     for this member (masked numbers; no caller-name field exists anywhere).
 *     They are labelled Live · masked.
 *   - Policies, requirements, persistence and money have NO source. Their
 *     fields render so the shape is reviewable; their values are "Not
 *     provisioned". Nothing is invented.
 *
 * PROGRESSIVE DISCLOSURE. Level one is a row (name, one status, one next
 * action). `?customer=<id>` opens level two — a drawer on desktop, a sheet on
 * a phone — and only for an id inside the member's own list: an id outside it
 * opens nothing and says so, so the drawer can never be used to probe
 * records beyond the book (fail-closed by construction, no second query).
 */

const VIEWS = ["summary", "customers", "policies"] as const;
type View = (typeof VIEWS)[number];

function viewOf(value: string | undefined): View {
  return (VIEWS as readonly string[]).includes(value ?? "") ? (value as View) : "summary";
}

/** A customer id is a small positive integer or nothing at all. */
function customerIdOf(value: string | undefined): number | null {
  return value !== undefined && /^\d{1,9}$/.test(value) ? Number(value) : null;
}

function dueLabel(dueAt: string): string {
  return dueAt.replace("T", " ").slice(0, 16);
}

function CustomerPill({ task }: { task: CallbackPreview }) {
  return (
    <SourcePill state={task.overdue ? "pending" : "live"} label={task.overdue ? "Past due" : "Callback owed"} />
  );
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; customer?: string }>;
}) {
  const session = await requireCapability("book.view.self", "/portal/book");
  const params = await searchParams;
  const view = viewOf(params.view);

  const callbacks = await loadCallbacks(session, { limit: 25 });
  const rows = callbacks.kind === "ok" ? callbacks.top : [];

  const requestedId = customerIdOf(params.customer);
  const selected = requestedId === null ? null : (rows.find((task) => task.id === requestedId) ?? null);
  const unknownRequested = requestedId !== null && selected === null;

  const base = "/portal/book";
  const viewHref = (next: View) => (next === "summary" ? base : `${base}?view=${next}`);
  const customerHref = (id: number) => `${base}?view=customers&customer=${id}`;
  const closeHref = viewHref(view);

  const countValue = callbacks.kind === "ok" ? callbacks.count : null;
  const countState = callbacks.kind === "hidden" ? "pending" : "live";
  const countNote = callbacks.kind === "fault" ? "could not be read just now" : undefined;

  return (
    <PortalShell session={session} current="/portal/book" section="Book of Business">
      <main className="portal-main portal-panel">
        <PanelHead
          eyebrow={
            <>
              Book of Business · <SourcePill state="protected" label="Yours only" />
            </>
          }
          title={view === "customers" ? "Customers" : view === "policies" ? "Policies" : "Book summary"}
          lede={
            view === "policies"
              ? "Every policy field, with no policy system behind it yet."
              : "Your open callbacks are the customers the platform knows. Policies and requirements populate when an approved source connects."
          }
          chips={
            <>
              <ViewChip href={viewHref("summary")} current={view === "summary"}>
                Summary
              </ViewChip>
              <ViewChip href={viewHref("customers")} current={view === "customers"}>
                Customers{callbacks.kind === "ok" ? ` · ${callbacks.count}` : ""}
              </ViewChip>
              <ViewChip href={viewHref("policies")} current={view === "policies"}>
                Policies
              </ViewChip>
            </>
          }
        />

        {view === "summary" ? (
          <>
            <PanelTiles label="Book at a glance">
              <Tile label="Callbacks waiting" value={countValue} state={countState} note={countNote} />
              <Tile label="Policies in force" value={null} state="pending" />
              <Tile label="Active clients" value={null} state="pending" />
              <Tile label="Requirements open" value={null} state="pending" />
            </PanelTiles>

            <section className="portal-card portal-panel-card" aria-labelledby="book-next-title">
              <header className="portal-panel-card-head">
                <h2 id="book-next-title">Next actions</h2>
                <SourcePill state="live" label="Live · masked" />
              </header>
              {callbacks.kind === "fault" ? (
                <EmptyState {...readFaultCopy(callbacks.fault, "Callback tasks")} />
              ) : callbacks.kind === "hidden" ? (
                <PanelNote>This role has no callback queue.</PanelNote>
              ) : rows.length === 0 ? (
                <PanelNote>No callbacks are waiting. Every voicemail has been answered or claimed.</PanelNote>
              ) : (
                <RecordList label="Customers needing a callback">
                  {rows.slice(0, 5).map((task) => (
                    <RecordRow
                      key={task.id}
                      href={customerHref(task.id)}
                      title={task.callerNumberMasked}
                      meta={`Return the call · due ${dueLabel(task.dueAt)}`}
                      pill={<CustomerPill task={task} />}
                      current={selected?.id === task.id}
                    />
                  ))}
                </RecordList>
              )}
            </section>
          </>
        ) : null}

        {view === "customers" ? (
          <section className="portal-card portal-panel-card" aria-labelledby="book-customers-title">
            <header className="portal-panel-card-head">
              <h2 id="book-customers-title">Customers</h2>
              <SourcePill state="live" label="Live · masked" />
            </header>
            {callbacks.kind === "fault" ? (
              <EmptyState {...readFaultCopy(callbacks.fault, "Callback tasks")} />
            ) : callbacks.kind === "hidden" ? (
              <PanelNote>This role has no callback queue.</PanelNote>
            ) : rows.length === 0 ? (
              <PanelNote>No customers are waiting on you. The list fills as voicemail arrives.</PanelNote>
            ) : (
              <RecordList label="Customers">
                {rows.map((task) => (
                  <RecordRow
                    key={task.id}
                    href={customerHref(task.id)}
                    title={task.callerNumberMasked}
                    meta={`Callback due ${dueLabel(task.dueAt)}`}
                    pill={<CustomerPill task={task} />}
                    current={selected?.id === task.id}
                  />
                ))}
              </RecordList>
            )}
            <p className="portal-panel-foot">
              A row opens the customer&rsquo;s drawer. Contact details stay masked; policy history has
              no source yet.
            </p>
          </section>
        ) : null}

        {view === "policies" ? (
          <section className="portal-card portal-panel-card" aria-labelledby="book-policies-title">
            <header className="portal-panel-card-head">
              <h2 id="book-policies-title">Policies</h2>
              <SourcePill state="pending" />
            </header>
            <div className="portal-table-wrap">
              <table className="portal-panel-table">
                <thead>
                  <tr>
                    <th scope="col">Policy</th>
                    <th scope="col">Carrier · product</th>
                    <th scope="col">Status</th>
                    <th scope="col">Premium</th>
                    <th scope="col">Next</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        title="No policy system connected"
                        body="Placement status, requirements, persistence and chargebacks populate after an approved CRM or carrier integration is connected. Nothing is shown until then."
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {unknownRequested ? (
          <PanelNote>That record is not in your book, so nothing was opened.</PanelNote>
        ) : null}

        <PrototypeNotice>
          This workspace shows your own callback queue, masked, from the platform&rsquo;s voice
          tables. It holds no policy, premium, or contact data and connects to no outside system.
        </PrototypeNotice>
      </main>

      {selected ? (
        <Drawer
          id="book-customer"
          eyebrow={
            <>
              Customer · <SourcePill state="protected" />
            </>
          }
          title={selected.callerNumberMasked}
          closeHref={closeHref}
        >
          <DrawerActions>
            <Link className="portal-button portal-button-primary" href="/portal/calls?tab=voicemail">
              Open in Calls
            </Link>
            <Link className="portal-button portal-button-quiet" href={closeHref}>
              Back to list
            </Link>
          </DrawerActions>

          <Disclosure title="Callback" state="live" open>
            <p>
              Due {dueLabel(selected.dueAt)}
              {selected.overdue ? " · past due" : ""}. Claim, listen to the voicemail, and return
              the call from Calls. The number is masked; the full number is ciphertext only.
            </p>
          </Disclosure>
          <Disclosure title="Policies" count={0} state="pending">
            <p>No policy system is connected. Carrier, product, status and premium render here once
              an approved source exists.</p>
          </Disclosure>
          <Disclosure title="Requirements" state="pending">
            <p>Outstanding requirements and their due dates come from the same source.</p>
          </Disclosure>
          <Disclosure title="Persistence &amp; chargebacks" state="pending">
            <p>Not provisioned. No figure is estimated.</p>
          </Disclosure>
        </Drawer>
      ) : null}
    </PortalShell>
  );
}
