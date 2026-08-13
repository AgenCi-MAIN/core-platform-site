/**
 * The THRIVE key.
 *
 * Deliberately simple. The first version drew a key and a separate keyhole at
 * 22x11, and at that size neither read as anything — it looked like two gold
 * specks. This is one shape: a ring, a shaft, two teeth, in solid gold, on a
 * square 20x20 grid so the strokes stay thick enough to see.
 *
 * The whole idea is in the motion: on hover the key turns a quarter turn about
 * the centre of its ring, the way a key turns in a lock. Access here is given,
 * not taken.
 *
 * Decorative only. It grants nothing and checks nothing.
 */
export function KeyGlyph({ label }: { label?: string }) {
  return (
    <svg
      className="key-glyph"
      viewBox="0 0 20 20"
      width="18"
      height="18"
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      <defs>
        <linearGradient id="thriveKeyGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbeec2" />
          <stop offset="38%" stopColor="#e9c869" />
          <stop offset="72%" stopColor="#c99b2e" />
          <stop offset="100%" stopColor="#9c7418" />
        </linearGradient>
      </defs>

      <g className="key-glyph-body" fill="url(#thriveKeyGold)">
        {/* Bow — drawn as a ring so the hole stays open at small sizes. */}
        <circle
          cx="6.2"
          cy="10"
          r="4"
          fill="none"
          stroke="url(#thriveKeyGold)"
          strokeWidth="2.5"
        />
        {/* Shaft */}
        <rect x="9.4" y="8.75" width="9.2" height="2.5" rx="1.25" />
        {/* Teeth */}
        <rect x="13.6" y="11.25" width="2.4" height="3.4" rx="1.2" />
        <rect x="16.6" y="11.25" width="2.4" height="2.3" rx="1.15" />
      </g>
    </svg>
  );
}
