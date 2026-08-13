import Link from "next/link";
import { chatGPTSignOutPath } from "../../chatgpt-auth";
import { resolvePortalAccess, type AccessDenial } from "../access";

export const dynamic = "force-dynamic";

/**
 * Explains why access was refused. Deliberately vague about whether a given
 * email exists in the membership table beyond what the caller already knows
 * about their own account, and never reveals another member's data.
 */
export default async function NoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>;
}) {
  const { need } = await searchParams;
  const result = await resolvePortalAccess();

  const view = result.ok
    ? {
        heading: "Additional permission required",
        body: need
          ? `Your role does not hold the “${need}” capability, which this page requires.`
          : "Your role does not include this area of the portal.",
        next: "An owner or administrator can change your role. Role changes are recorded in the audit log.",
      }
    : describeDenial(result.denial);

  return (
    <main className="portal-main portal-gate">
      <section className="portal-card portal-gate-card">
        <p className="eyebrow">
          <span /> CORE portal
        </p>
        <h1>{view.heading}</h1>
        <p className="portal-lede">{view.body}</p>
        <p className="portal-fine">{view.next}</p>

        <div className="portal-gate-actions">
          <Link className="button button-primary" href="/">
            Return to the public site <span>↘</span>
          </Link>
          <a className="text-link" href={chatGPTSignOutPath("/")}>
            Sign out <span>↘</span>
          </a>
        </div>
      </section>
    </main>
  );
}

function describeDenial(denial: AccessDenial) {
  switch (denial.kind) {
    case "anonymous":
      return {
        heading: "Sign in required",
        body: "The CORE portal is only available to signed-in members.",
        next: "Sign in and try again. If you reached this page after signing in, your session may have expired.",
      };
    case "not_provisioned":
      return {
        heading: "Portal not provisioned",
        body: "The portal database is not configured on this deployment, so membership cannot be verified.",
        next: "An administrator must provision the D1 binding and apply the portal migration before anyone can sign in. Access fails closed until then.",
      };
    case "not_a_member":
      return {
        heading: "No CORE membership",
        body: `Signing in confirmed your identity as ${denial.email}, but that account has not been granted CORE portal membership.`,
        next: "Membership is granted by an owner or administrator before first sign-in. Contact your CORE administrator to request access.",
      };
    case "suspended":
      return {
        heading: `Access ${denial.status}`,
        body: denial.note
          ? `Portal access for ${denial.email} is currently ${denial.status}. Reason on file: ${denial.note}`
          : `Portal access for ${denial.email} is currently ${denial.status}.`,
        next: "An owner or administrator can restore access. This refusal has been recorded in the audit log.",
      };
    case "subject_conflict":
      return {
        heading: "Account mismatch",
        body: `The CORE membership for ${denial.email} is bound to a different sign-in account than the one you used.`,
        next: "This protects an existing member from having their access taken over. An owner or administrator must resolve the binding.",
      };
    case "invalid_role":
      return {
        heading: "Membership needs repair",
        body: `The CORE membership for ${denial.email} carries a role the portal does not recognize, so its permissions are undefined.`,
        next: "Access is refused rather than guessed. An owner or administrator must correct the role on this membership record.",
      };
  }
}
