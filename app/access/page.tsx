import Link from "next/link";
import { KeyGlyph } from "../key-glyph";
import { signInPath } from "../google-auth";
import { SiteTopbar } from "../site-chrome";

export const dynamic = "force-dynamic";

/**
 * Public sign-in intake for the THRIVE operating portal.
 *
 * IMPORTANT — this page performs NO membership lookup, deliberately.
 *
 * An unauthenticated page that reported whether a typed address holds
 * membership would be a roster enumeration oracle: anyone could try addresses
 * and learn who works here. So the email field never reaches the database. It
 * exists only to echo the address back, so the visitor can confirm they are
 * about to sign in to Google with the same one they were onboarded under.
 *
 * The response is byte-identical for a member and a stranger.
 *
 * Authorization still happens exactly where it always did: `resolvePortalAccess`
 * runs server-side after Sign in with Google establishes identity. Nothing on
 * this page grants anything.
 */
export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const typed = normalizeTyped(email);

  return (
    <>
      <SiteTopbar section="Access" context="Portal access" />

      <main className="site-main portal-gate access-gate">
        <section className="portal-card portal-gate-card access-card">
          <header className="access-head">
            <span className="access-mark" aria-hidden="true">T</span>
            <p className="portal-eyebrow">THRIVE — Operating portal</p>
            <h1>Portal access</h1>
            <p className="portal-lede">
              The THRIVE portal is a permissioned workspace. Access is assigned
              to you by name before your first sign-in — it is never self-served.
            </p>
            <span className="portal-state portal-state-restricted access-phase">
              Alpha access · permission required
            </span>
          </header>

          <form className="access-form" method="get" action="/access">
            <label className="access-field" htmlFor="access-email">
              <span className="access-field-label">
                Email used during onboarding
              </span>
              <input
                className="access-input"
                id="access-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="you@example.com"
                defaultValue={typed ?? ""}
                aria-describedby="access-email-help"
              />
            </label>
            <button className="access-submit" type="submit">
              Continue
            </button>
            <p className="access-field-help" id="access-email-help">
              This does not sign you in and is never checked against the member
              list. It only shows you which address to use in the next step.
            </p>
          </form>

          {typed ? (
            <div className="access-confirm access-confirm-ready" role="status">
              <div className="access-confirm-copy">
                <p className="access-confirm-label">Ready — sign in with Google using</p>
                <p className="access-confirm-email">{typed}</p>
              </div>
              <a
                className="button button-primary access-confirm-go"
                href={signInPath("/portal")}
              >
                Continue to sign in <KeyGlyph />
              </a>
              <p className="access-confirm-note">
                The next screen is Google&apos;s account chooser. Pick the
                account with the address above — the portal matches it exactly.
              </p>
            </div>
          ) : null}

          <p className="access-warning" role="note">
            <strong>You MUST sign in with the Google account whose email is the
            SAME EMAIL you provided during onboarding.</strong> A different
            Google account — even your own personal one — will be refused,
            because the portal matches your Google identity against the address
            THRIVE has on file for you.
          </p>

          <div className="portal-gate-actions">
            <a className="button button-primary" href={signInPath("/portal")}>
              Sign in with Google <KeyGlyph />
            </a>
            <Link className="text-link" href="/tour">
              New here? Onboarding <KeyGlyph />
            </Link>
          </div>

          <div className="access-help">
            <h2>Not able to get in?</h2>
            <dl className="access-help-list">
              <div>
                <dt>Your email account is still pending</dt>
                <dd>
                  If you have completed onboarding but have not been assigned
                  access yet, <strong>text your personal recruiter.</strong> They
                  submit the access request on your behalf. Access is granted by
                  an owner or administrator, and every grant is recorded.
                </dd>
              </div>
              <div>
                <dt>You signed in and were still refused</dt>
                <dd>
                  The Google account you used does not match the address on
                  file. Sign in again and pick the account with the onboarding
                  address in Google&apos;s account chooser.
                </dd>
              </div>
              <div>
                <dt>You do not have an onboarding email yet</dt>
                <dd>
                  You are not onboarded. Your recruiter starts that process — the
                  portal cannot.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* About — shown before sign-in, for anyone who landed here cold. */}
        <section className="portal-card access-about" id="about">
          <p className="portal-eyebrow">About</p>
          <h2>What you are signing in to</h2>
          <p className="portal-lede">
            THRIVE is an insurance agency built around owning its demand rather
            than renting it. This portal is where that operating model actually
            runs — your book, call review, scripts, team, and the company
            reading library, each opened only to the roles that hold it.
          </p>

          <div className="access-about-grid">
            <div>
              <strong>Two checks, every request</strong>
              <p>
                Signing in with Google proves who you are. A membership record
                THRIVE created for you proves you belong here and carries your
                role. Identity alone grants nothing.
              </p>
            </div>
            <div>
              <strong>Deny by default</strong>
              <p>
                Six roles, ten capabilities. A role holds exactly what is listed
                and nothing more. Anything not granted is refused on the server,
                not merely hidden in the interface.
              </p>
            </div>
            <div>
              <strong>Every decision is written down</strong>
              <p>
                Allowed and refused alike, into a log that is never edited and
                never deleted. That record is what makes the access model worth
                trusting.
              </p>
            </div>
          </div>

          <div className="portal-gate-actions">
            <Link className="button button-primary" href="/">
              Read more about THRIVE <KeyGlyph />
            </Link>
            <Link className="text-link" href="/tour">
              Onboarding &amp; training <KeyGlyph />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

/**
 * Trim and bound the echoed value. This is display-only text that came from the
 * query string, so it is length-capped and stripped of control characters
 * before it is rendered back. React escapes it; this keeps it sane as well.
 */
function normalizeTyped(value: string | undefined): string | null {
  if (!value) return null;
  // Strip C0/C1 control characters only. Everything else an address may
  // legitimately contain -- '+', '.', '-' -- must survive untouched.
  const cleaned = value.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  if (!cleaned) return null;
  return cleaned.slice(0, 254);
}
