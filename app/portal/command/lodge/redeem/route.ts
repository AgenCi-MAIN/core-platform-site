import { redirect } from "next/navigation";
import { safeRelativeReturnPath } from "../../../../google-auth";
import { recordAudit, resolvePortalAccess } from "../../../access";
import { passCookieHeader, redeemPass } from "../../../command-pass";

export const dynamic = "force-dynamic";

/**
 * Redeem a Command Center lodge code.
 *
 * Nothing here trusts the interface. The session is re-resolved on every
 * request, the pass must be bound to THIS person's address, and the code is
 * compared against a hash — the plaintext was never stored, so there is
 * nothing on the server to leak.
 *
 * Every outcome is audited, including every failure, because a run of refused
 * redemptions against one address is exactly the signal worth having and the
 * half of the record that usually goes unwritten.
 */
export async function POST(request: Request): Promise<Response> {
  const result = await resolvePortalAccess("/portal/command");
  if (!result.ok) redirect("/portal/no-access");

  const { session } = result;
  const form = await request.formData();
  const code = String(form.get("code") ?? "").trim();
  const returnTo = safeRelativeReturnPath(String(form.get("return_to") ?? "/portal/command"));

  if (!/^\d{6}$/.test(code)) {
    await recordAudit({
      action: "command.view",
      decision: "deny",
      reason: "lodge_malformed_code",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: "/portal/command/lodge",
    });
    redirect("/portal/command/lodge?error=1");
  }

  const outcome = await redeemPass(session.email, session.subjectId, code);

  if (!outcome.ok) {
    await recordAudit({
      action: "command.view",
      decision: "deny",
      reason: `lodge_${outcome.reason}`,
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: "/portal/command/lodge",
    });
    // One message for every failure. Telling the visitor WHICH check failed
    // would tell an attacker whether a live pass exists for an address.
    redirect(`/portal/command/lodge?error=1${outcome.reason === "locked" ? "&locked=1" : ""}`);
  }

  await recordAudit({
    action: "command.view",
    decision: "allow",
    reason: "lodge_pass_redeemed",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    requestPath: returnTo,
    detail: JSON.stringify({ pass: outcome.passId, burned: true }),
  });

  const secure = new URL(request.url).protocol === "https:";
  return new Response(null, {
    status: 303,
    headers: {
      Location: returnTo,
      "Set-Cookie": passCookieHeader(outcome.token, secure),
    },
  });
}
