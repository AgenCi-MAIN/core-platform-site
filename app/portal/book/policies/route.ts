import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { BOOK_POLICY_STATUSES, bookPolicies, type BookPolicyStatus } from "../../../../db/schema";
import {
  assertCapability,
  recordAudit,
  requireCapability,
  resolvePortalAccess,
} from "../../access";
import { isSameOrigin } from "../../calls/voice-server";
import { writeRow } from "../../read-guard";
import { ownsCustomer } from "../data";

export const dynamic = "force-dynamic";

/**
 * Add a policy to a customer in the member's OWN book, or move one of the
 * member's own policies to a new status — the only writer of
 * `book_policies` (owner direction 2026-09-02).
 *
 * Two intents on one endpoint, both plain HTML forms:
 *   intent=add     carrier, product, status, premium, dates, next action
 *   intent=status  policy_id + status
 *
 * Ownership is enforced twice and on the server only: the customer a new
 * policy attaches to must be in the session's own book (one self-scoped
 * query, before any write), and a status change updates only a row whose
 * member_id is the session's own — a foreign id updates nothing and says
 * so. `member_id` in the body is ignored outright.
 *
 * The policy number is kept as its last four characters only. Money is
 * integer cents; bounds mirror the CHECK constraints in db/sql/0014.
 */

const BOOK = "/portal/book";
const PREMIUM_SHAPE = /^\d{1,6}(\.\d{1,2})?$/;
const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;
const PREMIUM_MAX_CENTS = 100_000_000;

function json(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

function seeOther(location: string): Response {
  return new Response(null, { status: 303, headers: { location, "cache-control": "no-store" } });
}

function field(form: FormData, name: string): string | null {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : null;
}

function smallId(value: string | null): number | null {
  return value !== null && /^\d{1,9}$/.test(value) ? Number(value) : null;
}

function statusOf(value: string | null): BookPolicyStatus | null {
  return (BOOK_POLICY_STATUSES as readonly string[]).includes(value ?? "") ? (value as BookPolicyStatus) : null;
}

/** A calendar date that actually exists, as YYYY-MM-DD, or null for blank. Undefined = refused. */
function dateOf(value: string | null): string | null | undefined {
  if (value === null || value === "") return null;
  if (!DATE_SHAPE.test(value)) return undefined;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? undefined : value;
}

export type PolicyInput = {
  customerId: number;
  carrier: string;
  product: string;
  policyLast4: string | null;
  status: BookPolicyStatus;
  premiumCents: number;
  effectiveOn: string | null;
  nextAction: string | null;
  nextActionOn: string | null;
};

/** Parse the add-policy form. Null on any shape the table would refuse. */
export function parsePolicy(form: FormData): PolicyInput | null {
  const customerId = smallId(field(form, "customer_id"));
  if (customerId === null || customerId === 0) return null;

  const carrier = field(form, "carrier");
  const product = field(form, "product");
  if (!carrier || carrier.length > 60 || !product || product.length > 60) return null;
  if (/[\u0000-\u001f\u007f]/.test(carrier + product)) return null;

  const numberRaw = (field(form, "policy_number") ?? "").replace(/[\s-]/g, "");
  if (numberRaw !== "" && (numberRaw.length < 4 || !/^[A-Za-z0-9]+$/.test(numberRaw))) return null;
  const policyLast4 = numberRaw === "" ? null : numberRaw.slice(-4);

  const status = statusOf(field(form, "status"));
  if (!status) return null;

  const premiumRaw = field(form, "premium") ?? "";
  let premiumCents = 0;
  if (premiumRaw !== "") {
    if (!PREMIUM_SHAPE.test(premiumRaw)) return null;
    premiumCents = Math.round(Number.parseFloat(premiumRaw) * 100);
    if (!Number.isInteger(premiumCents) || premiumCents < 0 || premiumCents > PREMIUM_MAX_CENTS) return null;
  }

  const effectiveOn = dateOf(field(form, "effective_on"));
  const nextActionOn = dateOf(field(form, "next_action_on"));
  if (effectiveOn === undefined || nextActionOn === undefined) return null;

  const nextRaw = field(form, "next_action") ?? "";
  if (nextRaw.length > 120 || /[\u0000-\u001f\u007f]/.test(nextRaw)) return null;
  const nextAction = nextRaw === "" ? null : nextRaw;

  return { customerId, carrier, product, policyLast4, status, premiumCents, effectiveOn, nextAction, nextActionOn };
}

export async function GET(): Promise<Response> {
  await requireCapability("book.view.self", "/portal/book/policies");
  return seeOther(`${BOOK}?view=policies`);
}

export async function POST(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname; // "/portal/book/policies"
  const access = await resolvePortalAccess(path);
  if (!access.ok) {
    return json({ error: "Sign in required." }, access.denial.kind === "anonymous" ? 401 : 403);
  }
  const { session } = access;

  try {
    await assertCapability(session, "book.edit.self", "book_policies", path);
  } catch {
    return json({ error: "Your role cannot add to a book of business." }, 403);
  }

  const audit = (action: string, decision: "allow" | "deny", reason: string, resource?: string) =>
    recordAudit({
      action,
      decision,
      reason,
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      resource,
      requestPath: path,
    });

  if (!isSameOrigin(request)) {
    await audit("book.policy.write", "deny", "origin_mismatch");
    return json({ error: "Request origin rejected." }, 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    form = new FormData();
  }

  const intent = field(form, "intent") ?? "add";

  if (intent === "status") {
    const policyId = smallId(field(form, "policy_id"));
    const status = statusOf(field(form, "status"));
    const returnTo = smallId(field(form, "customer_id"));
    const back = returnTo ? `${BOOK}?view=customers&customer=${returnTo}` : `${BOOK}?view=policies`;
    if (policyId === null || !status) {
      await audit("book.policy.status", "deny", "invalid_status");
      return seeOther(`${back}&book=invalid`);
    }
    // Self-scoped update: a foreign or unknown id matches no row.
    const outcome = await writeRow("book_policies", () =>
      getDb()
        .update(bookPolicies)
        .set({ status, updatedAt: new Date().toISOString() })
        .where(and(eq(bookPolicies.id, policyId), eq(bookPolicies.memberId, session.memberId)))
        .returning({ id: bookPolicies.id }),
    );
    if (!outcome.ok) {
      await audit("book.policy.status", "deny", `write_${outcome.fault}`, `book_policy:${policyId}`);
      return seeOther(`${back}&book=${outcome.fault}`);
    }
    if (outcome.value.length === 0) {
      await audit("book.policy.status", "deny", "not_in_book", `book_policy:${policyId}`);
      return seeOther(`${back}&book=foreign`);
    }
    await audit("book.policy.status", "allow", `status_${status}`, `book_policy:${policyId}`);
    return seeOther(back);
  }

  const policy = parsePolicy(form);
  if (!policy) {
    await audit("book.policy.add", "deny", "invalid_policy");
    return seeOther(`${BOOK}?view=policies&book=invalid`);
  }
  if (!(await ownsCustomer(session, policy.customerId))) {
    await audit("book.policy.add", "deny", "customer_not_in_book", `book_customer:${policy.customerId}`);
    return seeOther(`${BOOK}?view=policies&book=foreign`);
  }

  const outcome = await writeRow("book_policies", () =>
    getDb()
      .insert(bookPolicies)
      .values({ memberId: session.memberId, ...policy })
      .returning({ id: bookPolicies.id }),
  );
  if (!outcome.ok) {
    await audit("book.policy.add", "deny", `write_${outcome.fault}`, `book_customer:${policy.customerId}`);
    return seeOther(`${BOOK}?view=policies&book=${outcome.fault}`);
  }
  const id = outcome.value[0]?.id;
  await audit("book.policy.add", "allow", "policy_recorded", id ? `book_policy:${id}` : "book_policy");
  return seeOther(`${BOOK}?view=customers&customer=${policy.customerId}`);
}
