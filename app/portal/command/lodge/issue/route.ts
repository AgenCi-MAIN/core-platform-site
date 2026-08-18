import { redirect } from "next/navigation";
import {
  isCommandCenter,
  isCommandCenterUnlocked,
  normalizeEmail,
  recordAudit,
  resolvePortalAccess,
} from "../../../access";
import { issuePass } from "../../../command-pass";

export const dynamic = "force-dynamic";

/**
 * Issue a lodge code. FOUNDER ONLY — not "owner", not "on the Command Center
 * list". The founder is the one person the lock does not apply to, so he is
 * the only one who can hand out a way around it. Anyone else minting passes
 * would be a way to grant yourself access with extra steps.
 *
 * The plaintext code is returned to the founder's screen once, in a redirect
 * parameter, and never stored, logged, or written anywhere. The audit row
 * records that a pass was issued, for whom, and when it expires — never the
 * code.
 */
export async function POST(request: Request): Promise<Response> {
  const result = await resolvePortalAccess("/portal/command");
  if (!result.ok) redirect("/portal/no-access");

  const { session } = result;
  if (!isCommandCenterUnlocked(session)) {
    await recordAudit({
      action: "command.view",
      decision: "deny",
      reason: "lodge_issue_founder_only",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: "/portal/command/lodge/issue",
    });
    redirect("/portal/no-access");
  }

  const form = await request.formData();
  const forEmail = normalizeEmail(String(form.get("email") ?? ""));
  const note = String(form.get("note") ?? "").trim() || null;

  // A pass is only meaningful for someone already eligible: an active member
  // whose address is on the Command Center list. Issuing one for anybody else
  // would create a second, quieter way onto that list.
  const eligible = isCommandCenter({ ...session, email: forEmail });
  if (!forEmail || !eligible) {
    await recordAudit({
      action: "command.view",
      decision: "deny",
      reason: "lodge_issue_ineligible_target",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: "/portal/command/lodge/issue",
      detail: JSON.stringify({ requested_for: forEmail || null }),
    });
    redirect("/portal/command?issue=ineligible");
  }

  const pass = await issuePass(forEmail, session.email, note);

  await recordAudit({
    action: "command.view",
    decision: "allow",
    reason: "lodge_pass_issued",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    requestPath: "/portal/command/lodge/issue",
    detail: JSON.stringify({
      pass: pass.id,
      for: forEmail,
      expires_at: pass.expiresAt,
    }),
  });

  // Shown once, then gone. Not stored, not logged, not recoverable.
  redirect(`/portal/command?issued=${pass.code}&for=${encodeURIComponent(forEmail)}`);
}
