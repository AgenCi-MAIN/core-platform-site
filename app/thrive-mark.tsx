/**
 * CORE mark — a "C" (owner direction 2026-09-04, replacing the IMO "V").
 *
 * A confident open ring with a sheared terminal: the arc runs from the top
 * terminal around the left to the bottom, and the counter is left open on the
 * right so it reads as a letter and not a circle at 17px. A small four-point
 * spark sits in the mouth of the C — the one detail carried over from the
 * previous mark, so the badge keeps its sparkle. Rendered in `currentColor`,
 * so a badge sets the colour (gold on the obsidian marks) and the mark
 * inherits it.
 *
 * One source of truth for every in-app logo (site topbar, portal sidebar,
 * access gate). The favicon and PWA icons carry their own rendering.
 */
export function ThriveMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* The C: a 270° arc, thick, with round terminals. */}
      <path
        d="M47.5 19.5 A20.5 20.5 0 1 0 47.5 44.5"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Four-point spark in the mouth of the C. */}
      <path
        d="M47 24 C 48 30 49.5 31.5 55.5 32.5 C 49.5 33.5 48 35 47 41 C 46 35 44.5 33.5 38.5 32.5 C 44.5 31.5 46 30 47 24 Z"
        fill="currentColor"
      />
    </svg>
  );
}
