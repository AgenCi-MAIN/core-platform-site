import { getDb } from "../../../../db";
import { bookCustomers } from "../../../../db/schema";
import {
  assertCapability,
  recordAudit,
  requireCapability,
  resolvePortalAccess,
} from "../../access";
import { isSameOrigin } from "../../calls/voice-server";
import { writeRow } from "../../read-guard";

export const dynamic = "force-dynamic";

/**
 * Add a customer to the member's OWN book — the only writer of
 * `book_customers` (owner direction 2026-09-02).
 *
 * A plain HTML form on the Book page posts here; no client JS in the loop.
 * The row's owner is decided entirely on the server: member_id is the
 * session's own resolved membership. A `member_id` in the body is ignored
 * outright — no parameter exists through which another member's book can be
 * named.
 *
 * WHAT IS STORED. The name as typed (1..80 chars), a two-letter state, a
 * note up to 500 chars, and the phone MASKED: the full number is used only
 * to derive "***-***-1234" and the last four digits, then discarded. CORE
 * keeps no full customer number, matching the standing rule for callers.
 *
 * Bounds here are mirrored by CHECK constraints in db/sql/0014, so a
 * bypassed validator still cannot store an absurd row. Every response is
 * no-store and every deny after access resolution writes its own audit row.
 */

const BOOK = "/portal/book";

function json(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

function seeOther(location: string): Response {
  return new Response(null, { status: 303, headers: { location, "cache-control": "no-store" } });
}

export type CustomerInput = {
  displayName: string;
  phoneMasked: string | null;
  phoneLast4: string | null;
  state: string | null;
  note: string | null;
};

function field(form: FormData, name: string): string | null {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : null;
}

/** Parse the add-customer form. Null on any shape the table would refuse. */
export function parseCustomer(form: FormData): CustomerInput | null {
  const displayName = field(form, "display_name");
  if (!displayName || displayName.length > 80 || /[\u0000-\u001f\u007f]/.test(displayName)) return null;

  const phoneRaw = field(form, "phone") ?? "";
  let phoneMasked: string | null = null;
  let phoneLast4: string | null = null;
  if (phoneRaw !== "") {
    const digits = phoneRaw.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) return null;
    phoneLast4 = digits.slice(-4);
    phoneMasked = `***-***-${phoneLast4}`;
  }

  const stateRaw = (field(form, "state") ?? "").toUpperCase();
  const state = stateRaw === "" ? null : /^[A-Z]{2}$/.test(stateRaw) ? stateRaw : undefined;
  if (state === undefined) return null;

  const noteRaw = field(form, "note") ?? "";
  if (noteRaw.length > 500) return null;
  const note = noteRaw === "" ? null : noteRaw;

  return { displayName, phoneMasked, phoneLast4, state, note };
}

/** A GET has nothing to show: it lands on the Customers view like every guarded path. */
export async function GET(): Promise<Response> {
  await requireCapability("book.view.self", "/portal/book/customers");
  return seeOther(`${BOOK}?view=customers`);
}

export async function POST(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname; // "/portal/book/customers"
  const access = await resolvePortalAccess(path);
  if (!access.ok) {
    return json({ error: "Sign in required." }, access.denial.kind === "anonymous" ? 401 : 403);
  }
  const { session } = access;

  try {
    await assertCapability(session, "book.edit.self", "book_customers", path);
  } catch {
    return json({ error: "Your role cannot add to a book of business." }, 403);
  }

  if (!isSameOrigin(request)) {
    await recordAudit({
      action: "book.customer.add",
      decision: "deny",
      reason: "origin_mismatch",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: path,
    });
    return json({ error: "Request origin rejected." }, 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    form = new FormData();
  }

  const customer = parseCustomer(form);
  if (!customer) {
    await recordAudit({
      action: "book.customer.add",
      decision: "deny",
      reason: "invalid_customer",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: path,
    });
    return seeOther(`${BOOK}?view=customers&book=invalid`);
  }

  const outcome = await writeRow("book_customers", () =>
    getDb()
      .insert(bookCustomers)
      .values({ memberId: session.memberId, ...customer })
      .returning({ id: bookCustomers.id }),
  );
  if (!outcome.ok) {
    await recordAudit({
      action: "book.customer.add",
      decision: "deny",
      reason: `write_${outcome.fault}`,
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: path,
    });
    return seeOther(`${BOOK}?view=customers&book=${outcome.fault}`);
  }

  const id = outcome.value[0]?.id;
  await recordAudit({
    action: "book.customer.add",
    decision: "allow",
    reason: "customer_recorded",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: id ? `book_customer:${id}` : "book_customer",
    requestPath: path,
    // The audit row names the id only — never the customer's name or number.
  });
  return seeOther(id ? `${BOOK}?view=customers&customer=${id}` : `${BOOK}?view=customers`);
}
