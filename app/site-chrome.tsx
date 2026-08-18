import Link from "next/link";
import { ThriveMark } from "./thrive-mark";
import { PortalThemeControl } from "./theme-control";

/**
 * Topbar for the public, unauthenticated surfaces — the landing page, the
 * access intake, and the recruiting preview.
 *
 * It mirrors the authenticated portal's topbar deliberately: same tokens, same
 * theme control, same proportions. A recruit who sees the public page and then
 * signs in should feel like they entered the same building, not a different one.
 */
export function SiteTopbar({
  section,
  context = "THRIVE operating portal",
  cta,
}: {
  section: string;
  context?: string;
  cta?: { href: string; label: string };
}) {
  return (
    <header className="site-topbar">
      <Link className="site-brand" href="/" aria-label="THRIVE home">
        <span className="site-brand-mark" aria-hidden="true"><ThriveMark size={20} /></span>
        <span className="site-brand-copy">
          <strong>THRIVE</strong>
          <small>{context}</small>
        </span>
      </Link>

      <nav className="site-nav" aria-label="Public navigation">
        <Link href="/">Overview</Link>
        <Link href="/access">Portal access</Link>
        <Link href="/tour">Onboarding</Link>
      </nav>

      <div className="site-topbar-end">
        <span className="site-section" aria-hidden="true">{section}</span>
        <PortalThemeControl />
        {cta ? (
          <Link className="site-cta" href={cta.href}>
            {cta.label}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
