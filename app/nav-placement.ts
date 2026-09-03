/**
 * Navigation placement — the ONE place its vocabulary lives.
 *
 * A member may keep the portal's navigation as the bottom pill dock (the
 * default) or, on a desktop-width viewport, as a left rail. The preference is
 * a rendering choice like the colour mode and the performance mode next to
 * it: nothing becomes reachable or unreachable, and no data changes. It is
 * therefore stored the same way those two are — in the browser's own
 * localStorage under NAV_PLACEMENT_STORAGE_KEY, restored before first paint
 * by the boot script in app/portal-chrome.tsx, and never sent to the server.
 *
 * LIMITATION, STATED PLAINLY. The existing preference system is local-only:
 * a preference follows the browser profile, not the member. Two devices can
 * disagree, a cleared profile forgets, and a private window starts from the
 * default. That is exactly how the colour mode already behaves, and this
 * follows it rather than inventing a server-side store — a new table or a
 * migration is a governance decision this change does not make.
 *
 * FAIL-CLOSED RESOLUTION. Two rules, and both are pure:
 *
 *   1. Only the literal "rail" opts in. Anything else stored — nothing, junk,
 *      a value some future revision retires — is the dock. The boot script
 *      carries the same test inline (it must run before React exists) and a
 *      test pins the two against each other, because a boot that disagrees
 *      with the control produces a page that paints one placement and
 *      settles into another.
 *
 *   2. A rail is a desktop arrangement. Below NAV_RAIL_MIN_WIDTH the compact
 *      bottom dock is used regardless of the stored preference: the override
 *      lives in a CSS media query keyed on the same width (pinned by test),
 *      so a phone never runs a line of JavaScript to get the right chrome,
 *      and a window resized narrow snaps back without a reload.
 *
 * Pure and import-free on purpose: the boot script, the client control, the
 * stylesheet's breakpoint, and the tests all read the same three constants.
 */

export const NAV_PLACEMENTS = ["dock", "rail"] as const;
export type NavPlacement = (typeof NAV_PLACEMENTS)[number];

/** Duplicated by hand in app/portal-chrome.tsx (the boot cannot import). */
export const NAV_PLACEMENT_STORAGE_KEY = "core-portal-nav";

/** Viewport width, in CSS px, at and above which a stored rail is honoured. */
export const NAV_RAIL_MIN_WIDTH = 960;

export const DEFAULT_NAV_PLACEMENT: NavPlacement = "dock";

/** The stored preference, validated: exactly "rail" opts in, all else is the dock. */
export function storedNavPlacement(stored: unknown): NavPlacement {
  return stored === "rail" ? "rail" : DEFAULT_NAV_PLACEMENT;
}

/**
 * The placement actually rendered for a stored value at a viewport width.
 * `null` width means "unknown" (no window, or a server render): a rail cannot
 * be proven wide enough, so the dock is used — closed, never assumed.
 */
export function resolveNavPlacement(stored: unknown, viewportWidth: number | null): NavPlacement {
  const wanted = storedNavPlacement(stored);
  if (wanted !== "rail") return DEFAULT_NAV_PLACEMENT;
  if (viewportWidth === null || !Number.isFinite(viewportWidth)) return DEFAULT_NAV_PLACEMENT;
  return viewportWidth >= NAV_RAIL_MIN_WIDTH ? "rail" : DEFAULT_NAV_PLACEMENT;
}
