import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  BOOK_POLICY_STATUSES,
  bookCustomers,
  bookPolicies,
  type BookCustomerStatus,
  type BookPolicyStatus,
} from "../../../db/schema";
import { can, type PortalSession } from "../access";
import { readRows, type ReadFault } from "../read-guard";

/**
 * Book of Business reads (owner direction 2026-09-02).
 *
 * Every function here is SELF-SCOPED: the predicate is always the session's
 * own resolved member id, so no parameter exists through which another
 * member's book could be named. Server-only, like the rest of this
 * directory. Nothing here throws and nothing is invented: an unreadable
 * table comes back as a fault, and a missing table — 0014 not yet applied —
 * comes back as `not_provisioned`, which the page renders as the honest
 * "not provisioned" state with no form whose POST must fail.
 */

export { BOOK_POLICY_STATUSES };
export type { BookPolicyStatus };

export const POLICY_STATUS_LABELS: Record<BookPolicyStatus, string> = {
  applied: "Applied",
  requirement: "Requirement due",
  in_force: "In force",
  lapsed: "Lapsed",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

/** Statuses that still count as a live policy in the book. */
export const OPEN_POLICY_STATUSES: readonly BookPolicyStatus[] = ["applied", "requirement", "in_force"];

export type BookCustomer = {
  id: number;
  displayName: string;
  phoneMasked: string | null;
  state: string | null;
  note: string | null;
  status: BookCustomerStatus;
  createdAt: string;
};

export type BookPolicy = {
  id: number;
  customerId: number;
  carrier: string;
  product: string;
  policyLast4: string | null;
  status: BookPolicyStatus;
  premiumCents: number;
  effectiveOn: string | null;
  nextAction: string | null;
  nextActionOn: string | null;
  createdAt: string;
};

export type BookData =
  /** The role holds no book at all. */
  | { kind: "hidden" }
  | { kind: "fault"; fault: ReadFault }
  | { kind: "ok"; customers: BookCustomer[]; policies: BookPolicy[] };

export async function loadBook(session: PortalSession): Promise<BookData> {
  if (!can(session, "book.view.self")) return { kind: "hidden" };

  const customersRead = await readRows("book_customers", () =>
    getDb()
      .select({
        id: bookCustomers.id,
        displayName: bookCustomers.displayName,
        phoneMasked: bookCustomers.phoneMasked,
        state: bookCustomers.state,
        note: bookCustomers.note,
        status: bookCustomers.status,
        createdAt: bookCustomers.createdAt,
      })
      .from(bookCustomers)
      .where(eq(bookCustomers.memberId, session.memberId))
      .orderBy(desc(bookCustomers.createdAt), desc(bookCustomers.id))
      .limit(500),
  );
  if (customersRead.fault) return { kind: "fault", fault: customersRead.fault };

  const policiesRead = await readRows("book_policies", () =>
    getDb()
      .select({
        id: bookPolicies.id,
        customerId: bookPolicies.customerId,
        carrier: bookPolicies.carrier,
        product: bookPolicies.product,
        policyLast4: bookPolicies.policyLast4,
        status: bookPolicies.status,
        premiumCents: bookPolicies.premiumCents,
        effectiveOn: bookPolicies.effectiveOn,
        nextAction: bookPolicies.nextAction,
        nextActionOn: bookPolicies.nextActionOn,
        createdAt: bookPolicies.createdAt,
      })
      .from(bookPolicies)
      .where(eq(bookPolicies.memberId, session.memberId))
      .orderBy(asc(bookPolicies.nextActionOn), desc(bookPolicies.createdAt))
      .limit(2000),
  );
  if (policiesRead.fault) return { kind: "fault", fault: policiesRead.fault };

  return { kind: "ok", customers: customersRead.rows, policies: policiesRead.rows };
}

/**
 * Does this customer id belong to the session's own book? One self-scoped
 * query; used by the policy route before it writes a row that references
 * the customer, so a policy can never be attached to another member's
 * customer.
 */
export async function ownsCustomer(session: PortalSession, customerId: number): Promise<boolean> {
  const { rows, fault } = await readRows("book_customers", () =>
    getDb()
      .select({ id: bookCustomers.id })
      .from(bookCustomers)
      .where(and(eq(bookCustomers.id, customerId), eq(bookCustomers.memberId, session.memberId)))
      .limit(1),
  );
  return !fault && rows.length === 1;
}

export function policiesOf(book: Extract<BookData, { kind: "ok" }>, customerId: number): BookPolicy[] {
  return book.policies.filter((policy) => policy.customerId === customerId);
}

export type BookCounts = {
  customers: number;
  activeCustomers: number;
  policies: number;
  inForce: number;
  requirements: number;
  openNextActions: number;
};

export function bookCounts(book: Extract<BookData, { kind: "ok" }>): BookCounts {
  return {
    customers: book.customers.length,
    activeCustomers: book.customers.filter((c) => c.status === "active").length,
    policies: book.policies.length,
    inForce: book.policies.filter((p) => p.status === "in_force").length,
    requirements: book.policies.filter((p) => p.status === "requirement").length,
    openNextActions: book.policies.filter((p) => p.nextAction && OPEN_POLICY_STATUSES.includes(p.status)).length,
  };
}

/**
 * The one next thing on a customer: the earliest-dated open next action
 * across their live policies, else the first open policy's status, else
 * nothing. Presentation only.
 */
export function customerNext(
  book: Extract<BookData, { kind: "ok" }>,
  customerId: number,
): { text: string; on: string | null; policy: BookPolicy } | null {
  const live = policiesOf(book, customerId).filter((p) => OPEN_POLICY_STATUSES.includes(p.status));
  const dated = live
    .filter((p) => p.nextAction)
    .sort((a, b) => (a.nextActionOn ?? "9999").localeCompare(b.nextActionOn ?? "9999"));
  const pick = dated[0] ?? live.find((p) => p.status === "requirement") ?? null;
  if (!pick) return null;
  return {
    text: pick.nextAction ?? POLICY_STATUS_LABELS[pick.status],
    on: pick.nextActionOn,
    policy: pick,
  };
}

/** Integer cents → "$1,234.56". */
export function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "•••• 1234" for a stored last-four, or the honest dash. */
export function last4Label(last4: string | null): string {
  return last4 ? `•••• ${last4}` : "—";
}

/**
 * The status pill state for a policy: live for in force, pending for
 * anything still moving or lapsed, deferred for a closed outcome.
 */
export function policyPillState(status: BookPolicyStatus): "live" | "pending" | "deferred" {
  if (status === "in_force") return "live";
  if (status === "declined" || status === "withdrawn") return "deferred";
  return "pending";
}
