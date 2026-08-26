import Link from "next/link";
import { KeyGlyph } from "../../key-glyph";
import { signOutPath } from "../../google-auth";
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
  const result = await resolvePortalAccess("/portal/no-access");

  const view = result.ok
    ? {
        heading: "Additional permission required",
        body: need
          ? `Your role does not hold the “${need}” capability, which this page requires.`
          : "Your role does not include this area of the portal.",
        next: "An owner or administrator can change your role. Role changes are recorded in the audit log.",
        showRecruiter: false,
        showEmailRule: false,
      }
    : describeDenial(result.denial);

  return (
    <main className="portal-main portal-gate">
      <section className="portal-card portal-gate-card access-card">
        <header className="access-head">
          <span className="access-mark" aria-hidden="true">T</span>
          <p className="portal-eyebrow">IMO — Operating portal</p>
          <h1>{view.heading}</h1>
          <p className="portal-lede">{view.body}</p>
          <span className="portal-state portal-state-restricted access-phase">
            Alpha access · permission required
          </span>
        </header>

        <p className="portal-fine">{view.next}</p>

        {view.showRecruiter ? (
          <div className="access-pending" role="note">
            <p className="access-pending-title">Email account pending</p>
            <p>
              If you have finished onboarding but have not been assigned access
              yet, <strong>please text your personal recruiter.</strong> They
              request access on your behalf. An owner or administrator assigns
              it, and every grant is recorded in the audit log.
            </p>
          </div>
        ) : null}

        {view.showEmailRule ? (
          <p className="access-warning" role="note">
            <strong>You MUST sign in with the Google account whose email is the
            SAME EMAIL you provided during onboarding.</strong> A different
            Google account — including your own personal one — will be refused,
            because the portal matches your Google identity against the address
            IMO has on file for you.
          </p>
        ) : null}

        <div className="portal-gate-actions">
          <Link className="button button-primary" href="/access">
            Portal access <KeyGlyph />
          </Link>
          <a className="text-link" href={signOutPath("/access")}>
            Sign out <KeyGlyph />
          </a>
          <Link className="text-link" href="/">
            Public site <KeyGlyph />
          </Link>
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
        body: "The IMO portal is only available to signed-in members.",
        next: "Sign in and try again. If you reached this page after signing in, your session may have expired.",
        showRecruiter: false,
        showEmailRule: true,
      };
    case "not_provisioned":
      return {
        heading: "Portal not provisioned",
        body: "The portal database is not configured on this deployment, so membership cannot be verified.",
        next: "An administrator must provision the D1 binding and apply the portal migration before anyone can sign in. Access fails closed until then.",
        showRecruiter: false,
        showEmailRule: false,
      };
    case "not_a_member":
      return {
        heading: "No IMO membership",
        body: `Signing in confirmed your identity as ${denial.email}, but that account has not been granted IMO portal membership.`,
        next: "Membership is assigned by an owner or administrator before first sign-in. It is never self-served.",
        showRecruiter: true,
        showEmailRule: true,
      };
    case "suspended":
      return {
        heading: `Access ${denial.status}`,
        body: denial.note
          ? `Portal access for ${denial.email} is currently ${denial.status}. Reason on file: ${denial.note}`
          : `Portal access for ${denial.email} is currently ${denial.status}.`,
        next: "An owner or administrator can restore access. This refusal has been recorded in the audit log.",
        showRecruiter: true,
        showEmailRule: false,
      };
    case "subject_conflict":
      return {
        heading: "Account mismatch",
        body: `The IMO membership for ${denial.email} is bound to a different sign-in account than the one you used.`,
        next: "This protects an existing member from having their access taken over. An owner or administrator must resolve the binding.",
        showRecruiter: true,
        showEmailRule: true,
      };
    case "identity_ambiguous":
      return {
        heading: "Two memberships match you",
        body: `Your sign-in account is already bound to one IMO membership, and ${denial.email} belongs to a different one. The portal cannot tell which is yours.`,
        next: "Access is refused rather than guessed, so neither membership can be taken over by mistake. An owner or administrator must merge or remove one of the two records.",
        showRecruiter: true,
        showEmailRule: false,
      };
    case "invalid_role":
      return {
        heading: "Membership needs repair",
        body: `The IMO membership for ${denial.email} carries a role the portal does not recognize, so its permissions are undefined.`,
        next: "Access is refused rather than guessed. An owner or administrator must correct the role on this membership record.",
        showRecruiter: false,
        showEmailRule: false,
      };
  }
}
