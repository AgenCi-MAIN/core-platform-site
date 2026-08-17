"use client";

import { useSyncExternalStore } from "react";

type PortalTheme = "bright" | "dark";

const STORAGE_KEY = "core-portal-theme";
const THEME_CHANGE_EVENT = "core-portal-theme-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
}

function readTheme(): PortalTheme {
  return document.documentElement.dataset.portalTheme === "dark" ? "dark" : "bright";
}

function applyTheme(theme: PortalTheme) {
  document.documentElement.dataset.portalTheme = theme;
  document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
  // The status-bar/browser chrome colour follows the page. The boot script
  // does the same before first paint; this keeps toggles in step after it.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0c0a07" : "#f3ecdf");
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
      <button
        type="button"
        suppressHydrationWarning
        aria-pressed={theme === "bright"}
        onClick={() => chooseTheme("bright")}
        title="Use Bright mode"
      >
        <span aria-hidden="true">&#9788;</span>
        <span className="portal-theme-label">Bright</span>
      </button>
      <button
        type="button"
        suppressHydrationWarning
        aria-pressed={theme === "dark"}
        onClick={() => chooseTheme("dark")}
        title="Use Dark mode"
      >
        <span aria-hidden="true">&#9680;</span>
        <span className="portal-theme-label">Dark</span>
      </button>
    </div>
  );
}
