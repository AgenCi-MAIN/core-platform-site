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
  // IMO's chrome is the LIGHT workspace hex, not the navy: on phones the
  // status bar sits directly above the white topbar (the navy rail is
  // off-canvas below 900px), so a navy status bar would draw a hard 15:1
  // edge against nothing navy. Desktop title bars get the same light chrome
  // for the same reason — the workspace is light.
  { id: "thrive", label: "Thrive", glyph: "◆", chrome: "#eef2f9", scheme: "light" },
] as const;

type PortalTheme = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "core-portal-theme";
const THEME_CHANGE_EVENT = "core-portal-theme-change";

function subscribe(onStoreChange: () => void) {
  // Same-tab changes arrive via the custom event; OTHER tabs' changes arrive
  // via the storage event (which never fires in the tab that wrote). Without
  // the storage listener, two open portal tabs diverge until a reload — the
  // second tab keeps the stale theme, aria-pressed and all.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    // A cleared value (storage wipe in another tab) leaves this tab's theme
    // alone rather than yanking it to the default mid-session.
    const known = THEMES.find((theme) => theme.id === event.newValue);
    if (!known) return;
    applyTheme(known.id);
    onStoreChange();
  };
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function readTheme(): PortalTheme {
  const value = document.documentElement.dataset.portalTheme;
  const known = THEMES.find((theme) => theme.id === value);
  // Missing/unknown attribute falls back to BRIGHT — deliberately NOT the
  // boot script's thrive default, because this function describes what the
  // DOM currently shows: with no data-portal-theme attribute, no themed CSS
  // selector matches and the stylesheet's unguarded base palette (Bright)
  // is what's on screen. That happens exactly when the boot script could
  // not run (storage blocked, so getItem threw before the attribute was
  // set) — reporting "dark" there would press the wrong pill on a visibly
  // Bright page. When the boot HAS run, the attribute is always one of the
  // three known values and this fallback is unreachable.
  return known ? known.id : "bright";
}

// The fallback must match the boot script exactly — a test pins the two
// together, because a control that disagrees with the boot produces a page
// that flashes one theme and settles into another.
const DEFAULT_THEME = THEMES.find((entry) => entry.id === "thrive")!;

function applyTheme(themeId: PortalTheme) {
  const theme = THEMES.find((entry) => entry.id === themeId) ?? DEFAULT_THEME;
  document.documentElement.dataset.portalTheme = theme.id;
  document.documentElement.style.colorScheme = theme.scheme;
  // The status-bar/browser chrome colour follows the page. The boot script
  // does the same before first paint; this keeps toggles in step after it.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.chrome);
}

export function PortalThemeControl() {
  // The server snapshot says dark because the boot script paints dark for a
  // first-time visitor before hydration — a "bright" snapshot would flash
  // the Bright pill pressed on a dark page between paint and hydration, and
  // would lie permanently if hydration never runs.
  const theme = useSyncExternalStore(subscribe, readTheme, () => "thrive");

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
