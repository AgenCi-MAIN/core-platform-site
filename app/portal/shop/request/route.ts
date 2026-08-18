import { can, recordAudit, resolvePortalAccess } from "../../access";

export const dynamic = "force-dynamic";

const PATH = "/portal/shop/request";

const PRODUCTS = {
  "transfer-calls": { label: "Live transfer calls", unitPrice: 23, quantity: true },
  "recruiting-ads": { label: "Recruiting ads", unitPrice: null, quantity: false },
  "gohighlevel": { label: "GoHighLevel access", unitPrice: null, quantity: false },
  "ai-capacity": { label: "AI capacity", unitPrice: null, quantity: false },
} as const;

type ProductId = keyof typeof PRODUCTS;

function deny(status: 401 | 403, error: string) {
  return Response.json({ error }, { status });
}

/**
 * Capture a marketplace order request without pretending to charge anyone.
 * The wallet/payment ledger does not exist yet, so the server records the
 * member's request in the append-only audit stream and returns an explicit
 * "no charge" response. A future checkout can consume the same product ids.
 */
export async function POST(request: Request) {
  const access = await resolvePortalAccess(PATH);
  if (!access.ok) {
    return access.denial.kind === "anonymous"
      ? deny(401, "Sign in required.")
      : deny(403, "Portal access required.");
  }

  const { session } = access;
  if (!can(session, "dashboard.view.self")) return deny(403, "Marketplace access required.");

  let payload: { productId?: unknown; quantity?: unknown };
  try {
    payload = (await request.json()) as { productId?: unknown; quantity?: unknown };
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof payload.productId !== "string" || !(payload.productId in PRODUCTS)) {
    return Response.json({ error: "Unknown marketplace product." }, { status: 400 });
  }

  const productId = payload.productId as ProductId;
  const product = PRODUCTS[productId];
  const quantity = product.quantity
    ? typeof payload.quantity === "number" && Number.isInteger(payload.quantity)
      ? payload.quantity
      : 0
    : 1;

  if (quantity < 1 || quantity > 500) {
    return Response.json({ error: "Quantity must be between 1 and 500." }, { status: 400 });
  }

  const estimatedTotal = product.unitPrice === null ? null : product.unitPrice * quantity;

  await recordAudit({
    action: "marketplace.request",
    decision: "allow",
    reason: "order_request_received",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: productId,
    requestPath: PATH,
    detail: JSON.stringify({
      productId,
      label: product.label,
      quantity,
      unitPrice: product.unitPrice,
      estimatedTotal,
      charged: false,
    }),
  });

  return Response.json({
    ok: true,
    charged: false,
    estimatedTotal,
    message:
      estimatedTotal === null
        ? "Request recorded. THRIVE still needs to set pricing and checkout before any charge can occur."
        : `Request recorded for $${estimatedTotal.toFixed(2)}. No charge has been made because the wallet/checkout ledger is not connected yet.`,
  });
}
