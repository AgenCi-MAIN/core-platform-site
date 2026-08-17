"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Back control for the portal.
 *
 * Two ways to go back: a button that is always in the topbar, and the Escape
 * key. The button is the real affordance — Escape is a shortcut for people who
 * already reach for it.
 *
 * Escape is guarded, because it already means "dismiss" in several places and
 * hijacking it would break them. It is ignored when:
 *   - a popover or dialog is open (the mobile navigation drawer is a popover,
 *     and Escape must close that, not navigate away from the page); on
 *     engines without the Popover API the drawer is a checked fallback
 *     checkbox instead, and the shell's inline listener closes it and
 *     marks the event consumed via preventDefault
 *   - focus is in a text field, textarea, select, or anything contenteditable
 *   - a modifier key is held
 *   - there is nothing to go back to
 *
 * `history.length` is the only signal available for that last check. It is
 * imperfect — it counts the whole tab session, not this app — so the button
 * falls back to the dashboard rather than doing nothing on a first page load.
 */
export function PortalBackControl({ fallback = "/portal" }: { fallback?: string }) {
  const router = useRouter();

  // History depth is read at click time, not at mount: it changes as the
  // member moves around, and the moment of the click is the only moment the
  // answer actually matters.
  const goBack = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push(fallback);
  }, [router, fallback]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.defaultPrevented) return;

      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      // Let Escape dismiss an open dialog instead of navigating.
      if (document.querySelector("dialog[open]")) return;

      // Same for an open popover — queried on its own, because selector-list
      // parsing for querySelector is non-forgiving: one unrecognized
      // pseudo-class rejects the WHOLE list. Combined with dialog[open] this
      // threw SyntaxError on every keypress on exactly the pre-Popover
      // engines (Safari 15.4–16.x) the drawer's checkbox fallback serves,
      // so Escape-to-go-back never ran there at all. On those engines the
      // open drawer is the checked fallback checkbox — treat that as the
      // thing Escape is dismissing.
      try {
        if (document.querySelector("[popover]:popover-open")) return;
      } catch {
        const drawer = document.getElementById("portal-mobile-drawer");
        if (drawer instanceof HTMLInputElement && drawer.checked) return;
      }

      goBack();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [goBack]);

  return (
    <button
      className="portal-back"
      type="button"
      onClick={goBack}
      title="Back  (Esc)"
    >
      {/* A drawn chevron, not the ‹ glyph: the text character's optical
          center varies by font and needed line-height and margin hacks that
          still sat visibly off. The SVG centers because it is geometry. */}
      <svg
        className="portal-back-arrow"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14.5 5.5 8 12l6.5 6.5" />
      </svg>
      <span className="portal-back-label">Back</span>
      <kbd className="portal-back-key" aria-hidden="true">Esc</kbd>
      <span className="sr-only">Go back to the previous page</span>
    </button>
  );
}
