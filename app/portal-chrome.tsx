/**
 * Chrome shared by every portal-themed surface: the authenticated portal, the
 * public access intake, and the recruiting tour.
 *
 * It exists so the theme boot script and the governance footer are declared
 * once. Duplicating them per layout is how the footer's AI-vendor line drifted
 * out of date in the first place.
 */

export const PORTAL_THEME_STORAGE_KEY = "core-portal-theme";
export const PORTAL_PERFORMANCE_STORAGE_KEY = "thrive-portal-performance";

/**
 * Restores both the colour mode and the performance mode before first paint.
 * Doing this in one blocking inline script is what stops the page flashing the
 * wrong theme, and stops a boosted machine rendering one animated frame before
 * the effects are switched off.
 */
// IMO IS THE DEFAULT (founder's order 2026-08-18: "DO NOT TAKE IMO
// COLOR OUT. THAT'LL BE THE DEFAULT COLOR WHILE STILL HAVING BRIGHT AND
// DARK"). Only a stored "bright" or "dark" opts out — any other stored value
// (junk, or a theme removed in a future revision) falls back to thrive, the
// SAME fallback theme-control.tsx's readTheme uses; a test pins the two
// against each other. All three themes remain selectable; what changed is
// which one a visitor meets before choosing. The three names and their chrome hexes
// mirror the THEMES table in app/theme-control.tsx — this copy exists only
// because the boot must run before React. It also rewrites the theme-color
// meta so the phone's status bar and the installed app's chrome match the
// page instead of guessing from the OS preference, which is not what chooses
// the portal's theme. "thrive" keeps colorScheme light: its workspace is
// light; the navy sidebar scopes its own dark color-scheme in globals.css.
const THEME_BOOT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("${PORTAL_THEME_STORAGE_KEY}");var v=(t==="bright"||t==="dark")?t:"thrive";d.dataset.portalTheme=v;d.style.colorScheme=v==="dark"?"dark":"light";var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute("content",v==="dark"?"#0c0a07":v==="bright"?"#f3ecdf":"#eef2f9")}var p=localStorage.getItem("${PORTAL_PERFORMANCE_STORAGE_KEY}");d.dataset.portalPerformance=p==="boost"?"boost":"full"}catch(e){}})();`;

/** Applies the saved theme and performance mode before first paint. */
export function PortalThemeBoot() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />;
}

/**
 * The standing disclosure carried by every portal surface.
 *
 * The underlying AI system is deliberately NOT named here. More than one system
 * works this workspace, so a hard-coded vendor literal is false whenever the
 * other one is running — and AGENTS.md requires naming whichever system is
 * actually running rather than inferring it from a committed file. A committed
 * file cannot know that, so it states the governed relationship instead.
 */
export function PortalGovernanceFooter() {
  return (
    <footer className="portal-footer">
      <p>
        <strong>J.A.R.V.I.S.</strong> — Joint Agency Routing, Verification &amp;
        Intelligence System. the IMO&apos;s project-level operational identity,
        operated under IMO governance.
      </p>
      <p>
        J.A.R.V.I.S. is not a human, a licensed insurance producer, or a
        contracting party. Licensed activity, compliance sign-off, and final
        executive judgment remain with authorized humans.
      </p>
    </footer>
  );
}
