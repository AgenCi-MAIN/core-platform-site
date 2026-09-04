import Link from "next/link";
import { can, requireCapability } from "../access";
import { EmptyState, PortalShell, PrototypeNotice } from "../components";
import { loadCallbacks } from "../dashboard-data";
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
import {
  POLICY_STATUS_LABELS,
  bookCounts,
  customerNext,
  last4Label,
  loadBook,
  money,
  policiesOf,
  policyPillState,
  type BookCustomer,
  type BookData,
  type BookPolicy,
} from "./data";
import { CustomerDeleteForm, CustomerForm, PolicyDeleteForm, PolicyForm, StatusForm } from "./forms";

export const dynamic = "force-dynamic";

/**
 * Book of Business — the member's own customers and policies (owner
 * direction 2026-09-02, on the Dispatch R3 panel).
 *
 * ONE ROUTE, ONE GUARD, THREE VIEWS. `?view=summary|customers|policies`
 * switches the focused panel; anything else is the summary. The guard is the
 * one this route always had (`book.view.self`, `/portal/book`). Everything
 * shown is SELF-SCOPED: the member's own book rows and their own callback
 * queue, never another member's.
 *
 * WHAT IS REAL. Customers and policies are rows the member entered through
 * the two forms on this page (routes under /portal/book, capability
 * `book.edit.self`, tables from db/sql/0014). Phone numbers are stored
 * masked and policy numbers as their last four characters — the page shows
 * exactly what is stored. Until 0014 is applied the tables do not exist and
 * the page says "not provisioned" with no form whose POST must fail.
 *
 * PROGRESSIVE DISCLOSURE. Level one is a row. `?customer=<id>` opens level
 * two — a drawer on desktop, a sheet on a phone — and only for an id inside
 * the member's own loaded list: an id outside it opens nothing and says so
 * (fail-closed by construction, no second query).
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

const FLAGS = ["invalid", "unavailable", "not_provisioned", "foreign", "removed"] as const;
type Flag = (typeof FLAGS)[number];
function flagOf(value: string | undefined): Flag | null {
  return (FLAGS as readonly string[]).includes(value ?? "") ? (value as Flag) : null;
}

const FLAG_COPY: Record<Flag, string> = {
  invalid:
    "Those details were refused and nothing was saved — a name up to 80 characters, a phone of 10 to 15 digits, a two-letter state, dates as a calendar date, premium up to $999,999.99.",
  unavailable: "The book could not be written just now. Nothing was saved — try again in a moment.",
  not_provisioned: "The book's tables are not provisioned on this database yet, so nothing can be saved until the owner applies migration 0014.",
  foreign: "That record is not in your book, so nothing changed.",
  removed: "Removed from your book.",
};

function dateLabel(iso: string | null): string {
  if (!iso) return "";
  const parsed = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`);
  if (Number.isNaN(parsed.getTime())) return iso.slice(0, 10);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(parsed);
}

function dueLabel(dueAt: string): string {
  return dueAt.replace("T", " ").slice(0, 16);
}

function PolicyPill({ policy }: { policy: BookPolicy }) {
  return <SourcePill state={policyPillState(policy.status)} label={POLICY_STATUS_LABELS[policy.status]} />;
}

function customerMeta(book: Extract<BookData, { kind: "ok" }>, customer: BookCustomer): string {
  const count = policiesOf(book, customer.id).length;
  const next = customerNext(book, customer.id);
  const parts = [`${count} ${count === 1 ? "policy" : "policies"}`];
  if (customer.state) parts.push(customer.state);
  if (next) parts.push(next.on ? `${next.text} · ${dateLabel(next.on)}` : next.text);
  return parts.join(" · ");
}

function customerPill(book: Extract<BookData, { kind: "ok" }>, customer: BookCustomer) {
  const next = customerNext(book, customer.id);
  if (next) return <PolicyPill policy={next.policy} />;
  const live = policiesOf(book, customer.id).find((p) => p.status === "in_force");
  if (live) return <PolicyPill policy={live} />;
  return <SourcePill state="protected" label={customer.status === "active" ? "Client" : "Inactive"} />;
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; customer?: string; book?: string }>;
}) {
  const session = await requireCapability("book.view.self", "/portal/book");
  const params = await searchParams;
  const view = viewOf(params.view);
  const flag = flagOf(params.book);
  const canEdit = can(session, "book.edit.self");

  const book = await loadBook(session);
  const callbacks = await loadCallbacks(session, { limit: 25 });
  const customers = book.kind === "ok" ? book.customers : [];
  const counts = book.kind === "ok" ? bookCounts(book) : null;

  const requestedId = customerIdOf(params.customer);
  const selected = requestedId === null ? null : (customers.find((row) => row.id === requestedId) ?? null);
  const unknownRequested = requestedId !== null && selected === null;

  const base = "/portal/book";
  const viewHref = (next: View) => (next === "summary" ? base : `${base}?view=${next}`);
  const customerHref = (id: number) => `${base}?view=customers&customer=${id}`;
  const closeHref = viewHref(view);

  const provisioned = book.kind === "ok";
  const bookFault = book.kind === "fault" ? book.fault : null;
  const bookState = provisioned ? "live" : "pending";

  const nextActions =
    book.kind === "ok"
      ? book.customers
          .map((customer) => ({ customer, next: customerNext(book, customer.id) }))
          .filter((row): row is { customer: BookCustomer; next: NonNullable<ReturnType<typeof customerNext>> } => row.next !== null)
          .sort((a, b) => (a.next.on ?? "9999").localeCompare(b.next.on ?? "9999"))
      : [];

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
              ? "Every policy you have entered, with its status and the one next thing to do."
              : view === "customers"
                ? "Your customers, entered by you. A row opens the record; the form below adds one."
                : "Your own customers, policies, and callbacks. Add to the book from the Customers and Policies views."
          }
          chips={
            <>
              <ViewChip href={viewHref("summary")} current={view === "summary"}>
                Summary
              </ViewChip>
              <ViewChip href={viewHref("customers")} current={view === "customers"}>
                Customers{counts ? ` · ${counts.customers}` : ""}
              </ViewChip>
              <ViewChip href={viewHref("policies")} current={view === "policies"}>
                Policies{counts ? ` · ${counts.policies}` : ""}
              </ViewChip>
            </>
          }
          actions={
            canEdit && provisioned ? (
              <>
                <Link className="portal-button portal-button-primary" href={`${base}?view=customers#add-customer`}>
                  Add customer
                </Link>
                <Link className="portal-button" href={`${base}?view=policies#add-policy`}>
                  Add policy
                </Link>
              </>
            ) : undefined
          }
        />

        {flag ? (
          <p className={`portal-panel-note portal-panel-note-${flag === "foreign" || flag === "removed" ? "quiet" : "error"}`} role="status">
            {FLAG_COPY[flag]}
          </p>
        ) : null}

        {bookFault ? (
          <section className="portal-card portal-panel-card" aria-labelledby="book-fault-title">
            <header className="portal-panel-card-head">
              <h2 id="book-fault-title">Your book</h2>
              <SourcePill state="pending" />
            </header>
            <EmptyState {...readFaultCopy(bookFault, "Book of Business")} />
            {bookFault === "not_provisioned" ? (
              <PanelNote>
                Customers and policies can be entered here once migration 0014 (book_customers, book_policies) is applied to this
                database by the owner. Nothing is shown or accepted until then.
              </PanelNote>
            ) : null}
          </section>
        ) : null}

        {view === "summary" ? (
          <>
            <PanelTiles label="Book at a glance">
              <Tile label="Active clients" value={counts ? counts.activeCustomers : null} state={bookState} />
              <Tile label="Policies in force" value={counts ? counts.inForce : null} state={bookState} />
              <Tile label="Requirements open" value={counts ? counts.requirements : null} state={bookState} />
              <Tile
                label="Callbacks waiting"
                value={callbacks.kind === "ok" ? callbacks.count : null}
                state={callbacks.kind === "hidden" ? "pending" : "live"}
                note={callbacks.kind === "fault" ? "could not be read just now" : undefined}
              />
            </PanelTiles>

            <div className="portal-panel-grid">
              <section className="portal-card portal-panel-card" aria-labelledby="book-next-title">
                <header className="portal-panel-card-head">
                  <h2 id="book-next-title">Next actions</h2>
                  <SourcePill state={bookState} label={provisioned ? "Your entries" : undefined} />
                </header>
                {!provisioned ? (
                  <PanelNote>Next actions come from the policies you enter.</PanelNote>
                ) : nextActions.length === 0 ? (
                  <PanelNote>
                    Nothing is due. A policy with a next action, or one waiting on a requirement, shows here.
                  </PanelNote>
                ) : (
                  <RecordList label="Customers with a next action">
                    {nextActions.slice(0, 6).map(({ customer, next }) => (
                      <RecordRow
                        key={customer.id}
                        href={customerHref(customer.id)}
                        title={customer.displayName}
                        meta={next.on ? `${next.text} · ${dateLabel(next.on)}` : next.text}
                        pill={<PolicyPill policy={next.policy} />}
                        current={selected?.id === customer.id}
                      />
                    ))}
                  </RecordList>
                )}
              </section>

              <section className="portal-card portal-panel-card" aria-labelledby="book-callbacks-title">
                <header className="portal-panel-card-head">
                  <h2 id="book-callbacks-title">Callbacks</h2>
                  <SourcePill state="live" label="Live · masked" />
                </header>
                {callbacks.kind === "fault" ? (
                  <EmptyState {...readFaultCopy(callbacks.fault, "Callback tasks")} />
                ) : callbacks.kind === "hidden" ? (
                  <PanelNote>This role has no callback queue.</PanelNote>
                ) : callbacks.top.length === 0 ? (
                  <PanelNote>No callbacks are waiting. Every voicemail has been answered or claimed.</PanelNote>
                ) : (
                  <RecordList label="Callbacks waiting">
                    {callbacks.top.slice(0, 5).map((task) => (
                      <RecordRow
                        key={task.id}
                        href="/portal/calls?tab=voicemail"
                        title={task.callerNumberMasked}
                        meta={`Return the call · due ${dueLabel(task.dueAt)}`}
                        pill={<SourcePill state={task.overdue ? "pending" : "live"} label={task.overdue ? "Past due" : "Callback owed"} />}
                      />
                    ))}
                  </RecordList>
                )}
                <p className="portal-panel-foot">
                  Callers are masked numbers from the voice tables; they are not matched to your customers.
                </p>
              </section>
            </div>
          </>
        ) : null}

        {view === "customers" ? (
          <>
            <section className="portal-card portal-panel-card" aria-labelledby="book-customers-title">
              <header className="portal-panel-card-head">
                <h2 id="book-customers-title">Customers{counts ? ` · ${counts.customers}` : ""}</h2>
                <SourcePill state={bookState} label={provisioned ? "Your entries" : undefined} />
              </header>
              {!provisioned ? (
                <PanelNote>Customers you enter appear here.</PanelNote>
              ) : customers.length === 0 ? (
                <PanelNote>No customers yet. Add the first one below; every row you add is yours alone.</PanelNote>
              ) : (
                <RecordList label="Customers">
                  {customers.map((customer) => (
                    <RecordRow
                      key={customer.id}
                      href={customerHref(customer.id)}
                      title={customer.displayName}
                      meta={customerMeta(book as Extract<BookData, { kind: "ok" }>, customer)}
                      pill={customerPill(book as Extract<BookData, { kind: "ok" }>, customer)}
                      current={selected?.id === customer.id}
                    />
                  ))}
                </RecordList>
              )}
              <p className="portal-panel-foot">
                A row opens the customer&rsquo;s record. Phone numbers are stored masked; the full number is never kept.
              </p>
            </section>

            {canEdit && provisioned ? (
              <details className="portal-book-add" id="add-customer" open={flag === "invalid" || customers.length === 0}>
                <summary>
                  <span className="portal-book-add-title">Add a customer</span>
                  <span className="portal-pill portal-pill-protected">Yours only</span>
                  <span className="portal-disclosure-caret" aria-hidden="true" />
                </summary>
                <div className="portal-book-add-body">
                  <CustomerForm />
                </div>
              </details>
            ) : null}
          </>
        ) : null}

        {view === "policies" ? (
          <>
            <section className="portal-card portal-panel-card" aria-labelledby="book-policies-title">
              <header className="portal-panel-card-head">
                <h2 id="book-policies-title">Policies{counts ? ` · ${counts.policies}` : ""}</h2>
                <SourcePill state={bookState} label={provisioned ? "Your entries" : undefined} />
              </header>
              <div className="portal-table-wrap">
                <table className="portal-panel-table">
                  <thead>
                    <tr>
                      <th scope="col">Policy</th>
                      <th scope="col">Customer</th>
                      <th scope="col">Carrier · product</th>
                      <th scope="col">Status</th>
                      <th scope="col">Premium / mo</th>
                      <th scope="col">Next</th>
                      {canEdit ? (
                        <th scope="col">
                          <span className="sr-only">Actions</span>
                        </th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {!provisioned ? (
                      <tr>
                        <td colSpan={canEdit ? 7 : 6}>
                          <EmptyState
                            title="No policy system connected"
                            body="Policies you enter show here once the book's tables are provisioned. Nothing is shown until then."
                          />
                        </td>
                      </tr>
                    ) : book.kind === "ok" && book.policies.length === 0 ? (
                      <tr>
                        <td colSpan={canEdit ? 7 : 6}>
                          <EmptyState
                            title="No policies yet"
                            body={
                              customers.length === 0
                                ? "Add a customer first, then add their policy."
                                : "Add the first policy below, or open a customer and add it from their record."
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      (book as Extract<BookData, { kind: "ok" }>).policies.map((policy) => {
                        const customer = customers.find((c) => c.id === policy.customerId);
                        return (
                          <tr key={policy.id}>
                            <td className="portal-cell-mono">{last4Label(policy.policyLast4)}</td>
                            <td>
                              {customer ? (
                                <Link href={customerHref(customer.id)}>{customer.displayName}</Link>
                              ) : (
                                <span className="portal-muted">—</span>
                              )}
                            </td>
                            <td>
                              {policy.carrier} · {policy.product}
                            </td>
                            <td>
                              <PolicyPill policy={policy} />
                            </td>
                            <td className="portal-cell-mono">{policy.premiumCents > 0 ? money(policy.premiumCents) : "—"}</td>
                            <td>
                              {policy.nextAction ? (
                                <>
                                  {policy.nextAction}
                                  {policy.nextActionOn ? ` · ${dateLabel(policy.nextActionOn)}` : ""}
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                            {canEdit ? (
                              <td className="portal-cell-actions">
                                <PolicyDeleteForm policy={policy} />
                              </td>
                            ) : null}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {canEdit && provisioned ? (
              customers.length === 0 ? (
                <PanelNote>
                  A policy belongs to a customer. <Link href={`${base}?view=customers#add-customer`}>Add a customer</Link> first.
                </PanelNote>
              ) : (
                <details className="portal-book-add" id="add-policy" open={flag === "invalid" || flag === "foreign"}>
                  <summary>
                    <span className="portal-book-add-title">Add a policy</span>
                    <span className="portal-pill portal-pill-protected">Yours only</span>
                    <span className="portal-disclosure-caret" aria-hidden="true" />
                  </summary>
                  <div className="portal-book-add-body">
                    <PolicyForm customers={customers} />
                  </div>
                </details>
              )
            ) : null}
          </>
        ) : null}

        {unknownRequested ? (
          <PanelNote>That record is not in your book, so nothing was opened.</PanelNote>
        ) : null}

        <PrototypeNotice>
          This workspace shows your own book — customers and policies you entered, with phone numbers masked and policy numbers
          kept as their last four characters — plus your own callback queue from the voice tables. It connects to no outside
          system.
        </PrototypeNotice>
      </main>

      {selected && book.kind === "ok" ? (
        <Drawer
          id="book-customer"
          eyebrow={
            <>
              Customer · <SourcePill state="protected" />
            </>
          }
          title={selected.displayName}
          closeHref={closeHref}
        >
          <p className="portal-drawer-meta">
            {policiesOf(book, selected.id).length} {policiesOf(book, selected.id).length === 1 ? "policy" : "policies"}
            {selected.phoneMasked ? ` · ${selected.phoneMasked}` : ""}
            {selected.state ? ` · ${selected.state}` : ""}
            {` · added ${dateLabel(selected.createdAt)}`}
          </p>
          <DrawerActions>
            {canEdit ? (
              <a className="portal-button portal-button-primary" href="#drawer-add-policy">
                Add policy
              </a>
            ) : null}
            <Link className="portal-button" href="/portal/calls?tab=voicemail">
              Open Calls
            </Link>
            <Link className="portal-button portal-button-quiet" href={closeHref}>
              Back to list
            </Link>
          </DrawerActions>

          <Disclosure title="Policies" count={policiesOf(book, selected.id).length} state="live" open>
            {policiesOf(book, selected.id).length === 0 ? (
              <p>No policies on this customer yet.</p>
            ) : (
              <ul className="portal-drawer-policies">
                {policiesOf(book, selected.id).map((policy) => (
                  <li key={policy.id} className="portal-drawer-policy">
                    <div className="portal-drawer-policy-main">
                      <strong className="portal-cell-mono">{last4Label(policy.policyLast4)}</strong>
                      <span>
                        {policy.carrier} · {policy.product}
                        {policy.premiumCents > 0 ? ` · ${money(policy.premiumCents)}/mo` : ""}
                        {policy.effectiveOn ? ` · effective ${dateLabel(policy.effectiveOn)}` : ""}
                      </span>
                      {policy.nextAction ? (
                        <span className="portal-drawer-policy-next">
                          Next: {policy.nextAction}
                          {policy.nextActionOn ? ` · ${dateLabel(policy.nextActionOn)}` : ""}
                        </span>
                      ) : null}
                    </div>
                    <div className="portal-drawer-policy-side">
                      <PolicyPill policy={policy} />
                      {canEdit ? (
                        <>
                          <StatusForm policy={policy} customerId={selected.id} />
                          <PolicyDeleteForm policy={policy} customerId={selected.id} />
                        </>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Disclosure>

          {canEdit ? (
            <Disclosure title="Add a policy" state="protected" open={policiesOf(book, selected.id).length === 0}>
              <div id="drawer-add-policy">
                <PolicyForm customers={customers} customerId={selected.id} />
              </div>
            </Disclosure>
          ) : null}

          <Disclosure title="Note" state="protected" open={Boolean(selected.note)}>
            <p>{selected.note ?? "No note on this customer."}</p>
          </Disclosure>
          <Disclosure title="Calls &amp; callbacks" state="live">
            <p>
              Callbacks are worked from Calls. The voice tables hold masked numbers only, so a callback is not linked to a customer
              by name.
            </p>
          </Disclosure>
          <Disclosure title="Persistence &amp; chargebacks" state="pending">
            <p>Not provisioned. No figure is estimated.</p>
          </Disclosure>
          {canEdit ? (
            <Disclosure title="Remove from book" state="protected">
              <CustomerDeleteForm customer={selected} policyCount={policiesOf(book, selected.id).length} />
            </Disclosure>
          ) : null}
        </Drawer>
      ) : null}
    </PortalShell>
  );
}
