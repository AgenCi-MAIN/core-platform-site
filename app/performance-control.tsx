"use client";

import { useState } from "react";

export const PERFORMANCE_STORAGE_KEY = "thrive-portal-performance";

type PerformanceMode = "full" | "boost";

/**
 * Performance mode.
 *
 * The portal's elevated look costs real frames: backdrop blur on the audio
 * deck, layered shadows, gradient washes, and entrance animation. That is fine
 * on a modern laptop and noticeably not fine on an old machine, a cheap tablet,
 * or a remote desktop session — which is what a lot of agents actually work on.
 *
 * Boost keeps the layout and the colour identical and drops the expensive
 * effects. It is a rendering choice, not a reduced feature set: nothing becomes
 * unavailable, and no data changes.
 */
function applyMode(mode: PerformanceMode) {
  document.documentElement.dataset.portalPerformance = mode;
}

export function PortalPerformanceControl() {
  const [mode, setMode] = useState<PerformanceMode>(() =>
    typeof document !== "undefined" &&
    document.documentElement.dataset.portalPerformance === "boost"
      ? "boost"
      : "full",
  );

  function choose(next: PerformanceMode) {
    setMode(next);
    applyMode(next);
    try {
      window.localStorage.setItem(PERFORMANCE_STORAGE_KEY, next);
    } catch {
      // The mode still applies for this page when browser storage is unavailable.
    }
  }

  const boosted = mode === "boost";

  return (
    <button
      className="portal-performance-toggle"
      type="button"
      suppressHydrationWarning
      aria-pressed={boosted}
      onClick={() => choose(boosted ? "full" : "boost")}
      title={
        boosted
          ? "Performance boost is on. Click to restore full visual effects."
          : "Boost performance by turning off blur, shadows, and animation."
      }
    >
      <span aria-hidden="true">{boosted ? "▰" : "▱"}</span>
      <span className="portal-theme-label">
        {boosted ? "Boosted" : "Boost"}
      </span>
    </button>
  );
}
