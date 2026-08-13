"use client";

import { useState } from "react";

type PortalTheme = "bright" | "dark";

const STORAGE_KEY = "core-portal-theme";

function applyTheme(theme: PortalTheme) {
  document.documentElement.dataset.portalTheme = theme;
  document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
}

export function PortalThemeControl() {
  const [theme, setTheme] = useState<PortalTheme>(() =>
    typeof document !== "undefined" && document.documentElement.dataset.portalTheme === "dark"
      ? "dark"
      : "bright",
  );

  function chooseTheme(nextTheme: PortalTheme) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // The mode still applies for this page when browser storage is unavailable.
    }
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
