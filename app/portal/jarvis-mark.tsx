/**
 * The J.A.R.V.I.S. identity mark.
 *
 * Drawn as inline SVG so it needs no network request, scales cleanly, and works
 * in both themes. Original artwork in the same visual language as the supplied
 * avatar: a segmented HUD ring, a hooded silhouette, and a reactor arc.
 *
 * TO USE THE SUPPLIED IMAGE INSTEAD: save it as `public/jarvis-avatar.png`,
 * then pass `useImage`. Nothing else changes.
 */

export function JarvisMark({
  size = 40,
  useImage = false,
  className,
}: {
  size?: number;
  useImage?: boolean;
  className?: string;
}) {
  const classes = `jarvis-mark${className ? ` ${className}` : ""}`;

  if (useImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/jarvis-avatar.png"
        alt="J.A.R.V.I.S."
        width={size}
        height={size}
        className={`${classes} jarvis-mark-image`}
      />
    );
  }

  return (
    <svg
      className={classes}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="J.A.R.V.I.S."
    >
      <defs>
        <radialGradient id="jarvisField" cx="50%" cy="40%" r="62%">
          <stop offset="0%" stopColor="#16273d" />
          <stop offset="62%" stopColor="#0b1420" />
          <stop offset="100%" stopColor="#05080d" />
        </radialGradient>
        <linearGradient id="jarvisRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d6e8ff" />
          <stop offset="55%" stopColor="#7aa6dc" />
          <stop offset="100%" stopColor="#33507a" />
        </linearGradient>
        <linearGradient id="jarvisHood" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#8fb6e6" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#31517a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0a121d" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Field */}
      <circle cx="50" cy="50" r="49" fill="url(#jarvisField)" />

      {/* Segmented outer ring — four arcs with gaps at the diagonals */}
      <g fill="none" stroke="url(#jarvisRim)" strokeWidth="2.4" strokeLinecap="round">
        <path d="M50 3.5 A46.5 46.5 0 0 1 96.5 50" />
        <path d="M96.5 50 A46.5 46.5 0 0 1 50 96.5" />
        <path d="M50 96.5 A46.5 46.5 0 0 1 3.5 50" />
        <path d="M3.5 50 A46.5 46.5 0 0 1 50 3.5" />
      </g>

      {/* Inner telemetry arcs */}
      <g fill="none" stroke="#4d78ad" strokeOpacity="0.45" strokeWidth="0.8">
        <path d="M22 58 A32 32 0 0 1 27 33" />
        <path d="M78 58 A32 32 0 0 0 73 33" />
        <path d="M30 66 A25 25 0 0 1 28 46" />
      </g>

      {/* Hooded silhouette */}
      <path
        d="M50 20c-11.6 0-20 9.2-20 21.5 0 6.4 1.7 11.9 4.4 16.2-6.6 3.2-11.2 8.3-13.4 14.8h58c-2.2-6.5-6.8-11.6-13.4-14.8 2.7-4.3 4.4-9.8 4.4-16.2C70 29.2 61.6 20 50 20Z"
        fill="url(#jarvisHood)"
      />
      {/* The void where a face would be */}
      <ellipse cx="50" cy="42" rx="12.5" ry="15" fill="#04070b" />

      {/* Reactor */}
      <circle cx="50" cy="72" r="8.5" fill="none" stroke="#33557f" strokeWidth="1.6" />
      <path
        d="M50 63.5 A8.5 8.5 0 0 1 58.5 72"
        fill="none"
        stroke="#cfe6ff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="50" cy="72" r="4.4" fill="none" stroke="#5f8cc4" strokeWidth="1" />
    </svg>
  );
}
