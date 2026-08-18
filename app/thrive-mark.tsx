/**
 * THRIVE mark — the "V" glyph: a bold left arm, a flame/helix forming the
 * right arm, and a four-point sparkle. Rendered in `currentColor`, so a
 * badge sets the colour (gold on the obsidian marks) and the mark inherits it.
 *
 * One source of truth for every in-app logo (site topbar, portal sidebar,
 * access gate). The favicon and PWA icons carry the same glyph on a navy
 * ground — see public/favicon.svg and the icons rendered from it.
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
      {/* Bold left arm of the V. */}
      <path
        d="M16 14 L32 50"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Flame / helix forming the right arm. */}
      <path
        d="M32 50 C 31 42 41 41 39.5 33.5 C 38.2 27.5 31 25.5 34 18.5 C 35.4 15.2 38.8 13.8 42 12.6"
        stroke="currentColor"
        strokeWidth="6.2"
        strokeLinecap="round"
      />
      {/* Four-point sparkle. */}
      <path
        d="M49 6 C 50 12 51.5 13.5 57.5 14.5 C 51.5 15.5 50 17 49 23 C 48 17 46.5 15.5 40.5 14.5 C 46.5 13.5 48 12 49 6 Z"
        fill="currentColor"
      />
    </svg>
  );
}
