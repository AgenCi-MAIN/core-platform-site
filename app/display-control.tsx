"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PortalNavControl } from "./nav-control";
import { PortalPerformanceControl } from "./performance-control";
import { PortalThemeControl, useCurrentTheme } from "./theme-control";

/**
 * The display control — ONE topbar button for every rendering preference
 * (owner direction 2026-09-04: "consolidate the theme tabs into one but
 * still make it available constantly on top").
 *
 * The button shows the current theme's glyph and never leaves the topbar at
 * any width. Pressing it opens a small popover that holds the three controls
 * exactly as they were — colour mode, navigation placement, performance
 * boost — so nothing about how a preference is stored or applied changed;
 * only where the pills live. The popover closes on Escape, on a click
 * outside, and after a theme is chosen.
 *
 * `showNav` is false on the public site, which has no rail to place.
 */
export function PortalDisplayControl({ showNav = true }: { showNav?: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const theme = useCurrentTheme();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="portal-display-control" ref={root} data-open={open ? "true" : undefined}>
      <button
        type="button"
        className="portal-display-button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        title="Display: colour mode, navigation, performance"
        suppressHydrationWarning
      >
        <span aria-hidden="true" suppressHydrationWarning>{theme.glyph}</span>
        <span className="sr-only">Display settings</span>
      </button>
      <div className="portal-display-panel" id={panelId} role="group" aria-label="Display settings" hidden={!open}>
        <div className="portal-display-row">
          <span className="portal-display-label">Colour</span>
          <PortalThemeControl onChoose={() => setOpen(false)} />
        </div>
        {showNav ? (
          <div className="portal-display-row portal-display-row-nav">
            <span className="portal-display-label">Navigation</span>
            <PortalNavControl />
          </div>
        ) : null}
        <div className="portal-display-row">
          <span className="portal-display-label">Effects</span>
          <PortalPerformanceControl />
        </div>
      </div>
    </div>
  );
}
