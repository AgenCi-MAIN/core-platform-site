"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_NAV_PLACEMENT,
  NAV_PLACEMENT_STORAGE_KEY,
  storedNavPlacement,
  type NavPlacement,
} from "./nav-placement";

/**
 * Navigation placement control — the same shape as the colour-mode control
 * beside it, for the same reasons: a preference that is purely a rendering
 * choice, kept in localStorage, applied to a root data attribute the
 * stylesheet keys on, and restored before first paint by the boot script so
 * the page never flashes one placement and settles into another.
 *
 * What is stored is the PREFERENCE. Whether a rail actually renders is the
 * stylesheet's decision, made by a media query at NAV_RAIL_MIN_WIDTH: on a
 * narrow viewport the compact bottom dock is used whatever is stored, and the
 * control hides itself there so it never offers a choice with no effect.
 */
const PLACEMENTS: readonly { id: NavPlacement; label: string; glyph: string; title: string }[] = [
  { id: "dock", label: "Dock", glyph: "▁", title: "Keep navigation as the bottom dock" },
  { id: "rail", label: "Rail", glyph: "▏", title: "Move navigation to a left rail on desktop widths" },
];

const STORAGE_KEY: typeof NAV_PLACEMENT_STORAGE_KEY = "core-portal-nav";
const NAV_CHANGE_EVENT = "core-portal-nav-change";

function subscribe(onStoreChange: () => void) {
  // Same-tab changes arrive via the custom event; another tab's change via
  // the storage event, exactly as the theme control does it. A cleared value
  // elsewhere leaves this tab alone rather than yanking its chrome around.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    if (event.newValue !== "dock" && event.newValue !== "rail") return;
    applyPlacement(event.newValue);
    onStoreChange();
  };
  window.addEventListener(NAV_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(NAV_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** What the DOM currently shows: a missing attribute means the boot never ran, so the dock is on screen. */
function readPlacement(): NavPlacement {
  return storedNavPlacement(document.documentElement.dataset.portalNav);
}

function applyPlacement(placement: NavPlacement) {
  document.documentElement.dataset.portalNav = storedNavPlacement(placement);
}

export function PortalNavControl() {
  // The server snapshot is the dock: the boot paints the dock for a
  // first-time visitor, so a "rail" snapshot would press the wrong pill
  // between paint and hydration.
  const placement = useSyncExternalStore(subscribe, readPlacement, () => DEFAULT_NAV_PLACEMENT);

  function choose(next: NavPlacement) {
    applyPlacement(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The placement still applies for this page when browser storage is unavailable.
    }
    window.dispatchEvent(new Event(NAV_CHANGE_EVENT));
  }

  return (
    <div
      className="portal-theme-control portal-nav-control"
      role="group"
      aria-label="Navigation placement (desktop widths)"
    >
      {PLACEMENTS.map((entry) => (
        <button
          key={entry.id}
          type="button"
          suppressHydrationWarning
          aria-pressed={placement === entry.id}
          onClick={() => choose(entry.id)}
          title={entry.title}
        >
          <span aria-hidden="true">{entry.glyph}</span>
          <span className="portal-theme-label">{entry.label}</span>
        </button>
      ))}
    </div>
  );
}
