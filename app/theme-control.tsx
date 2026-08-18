"use client";

import { useSyncExternalStore } from "react";

/**
 * The theme table — the ONE place a theme's name, chrome color, and
 * color-scheme live. The boot script in app/portal-chrome.tsx carries the
 * same three names and hexes inline (it must run before React exists); a
 * test pins the two files against each other so they cannot drift.
 *
 * "thrive" is the navy/blue skin matched to the commission schedule's design
 * language (owner order 2026-08-18): #16202e navy chrome, white surfaces,
 * #2563eb accent. Its root color-scheme is light (the workspace is light);
 * the navy sidebar scopes its own dark treatment in globals.css.
 */
const THEMES = [
  { id: "bright", label: "Bright", glyph: "☼", chrome: "#f3ecdf", scheme: "light" },
  { id: "dark", label: "Dark", glyph: "◐", chrome: "#0c0a07", scheme: "dark" },
  { id: "thrive", label: "Thrive", glyph: "◆", chrome: "#16202e", scheme: "light" },
] as const;

type PortalTheme = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "core-portal-theme";
const THEME_CHANGE_EVENT = "core-portal-theme-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
}

function readTheme(): PortalTheme {
  const value = document.documentElement.dataset.portalTheme;
  const known = THEMES.find((theme) => theme.id === value);
  // Unknown or missing falls back to dark — the SAME default as the boot
  // script, deliberately: the two disagreeing is how a third theme makes
  // aria-pressed lie about which button is active.
  return known ? known.id : "dark";
}

function applyTheme(themeId: PortalTheme) {
  const theme = THEMES.find((entry) => entry.id === themeId) ?? THEMES[1];
  document.documentElement.dataset.portalTheme = theme.id;
  document.documentElement.style.colorScheme = theme.scheme;
  // The status-bar/browser chrome colour follows the page. The boot script
  // does the same before first paint; this keeps toggles in step after it.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.chrome);
}

export function PortalThemeControl() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "bright");

  function chooseTheme(nextTheme: PortalTheme) {
    applyTheme(nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // The mode still applies for this page when browser storage is unavailable.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <div className="portal-theme-control" role="group" aria-label="Portal color mode">
      {THEMES.map((entry) => (
        <button
          key={entry.id}
          type="button"
          suppressHydrationWarning
          aria-pressed={theme === entry.id}
          onClick={() => chooseTheme(entry.id)}
          title={`Use ${entry.label} mode`}
        >
          <span aria-hidden="true">{entry.glyph}</span>
          <span className="portal-theme-label">{entry.label}</span>
        </button>
      ))}
    </div>
  );
}
