/**
 * Rank medallions.
 *
 * Five ranks, five metals: bronze, silver, gold, diamond, obsidian. Each is a
 * struck coin — faceted bezel, engraved numeral, a specular highlight, and a
 * sweeping reflection. They are drawn as inline SVG so they scale to any size,
 * carry no network cost, and pick up the current theme.
 *
 * The point is motivational: rank should look like something you earned, and
 * the metal should be legible at a glance from across a room. Bronze must look
 * like bronze and gold must look like gold — a coloured square is not a rank.
 *
 * The six portal roles reuse the same metals, since a role IS the rank a member
 * operates at. `METAL_FOR_ROLE` is the single place that mapping lives.
 */

export type Metal = "bronze" | "silver" | "gold" | "diamond" | "obsidian" | "steel";

/** Portal role -> metal. One place, so the UI can never disagree with itself. */
export const METAL_FOR_ROLE: Record<string, Metal> = {
  owner: "gold",
  admin: "diamond",
  manager: "silver",
  reviewer: "obsidian",
  agent: "bronze",
  support: "steel",
};

type Stops = { light: string; mid: string; deep: string; edge: string; ink: string };

const METALS: Record<Metal, Stops> = {
  bronze: { light: "#f0c9a0", mid: "#c67c3e", deep: "#8a4a1c", edge: "#5c2f10", ink: "#3a1d09" },
  silver: { light: "#ffffff", mid: "#c9d2da", deep: "#8b98a5", edge: "#5e6a76", ink: "#2b333b" },
  gold: { light: "#fdf3d2", mid: "#e0b64e", deep: "#a97b1d", edge: "#7a5610", ink: "#3a290a" },
  diamond: { light: "#ffffff", mid: "#bfe6f5", deep: "#6fa8c9", edge: "#3f7a9c", ink: "#12303f" },
  obsidian: { light: "#7b6bb0", mid: "#3a2f5c", deep: "#1d1730", edge: "#100c1c", ink: "#e6e0ff" },
  steel: { light: "#e8edf2", mid: "#9aa7b4", deep: "#66727e", edge: "#454f59", ink: "#232a31" },
};

export function RankMedallion({
  metal,
  numeral,
  size = 44,
  title,
}: {
  metal: Metal;
  numeral: string;
  size?: number;
  title?: string;
}) {
  const c = METALS[metal];
  const uid = `${metal}-${numeral}`.replace(/[^a-z0-9-]/gi, "");

  return (
    <svg
      className={`rank-medallion rank-medallion-${metal}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : "true"}
    >
      <defs>
        <linearGradient id={`face-${uid}`} x1="12%" y1="0%" x2="88%" y2="100%">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="38%" stopColor={c.mid} />
          <stop offset="74%" stopColor={c.deep} />
          <stop offset="100%" stopColor={c.edge} />
        </linearGradient>
        <linearGradient id={`bezel-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="50%" stopColor={c.deep} />
          <stop offset="100%" stopColor={c.light} />
        </linearGradient>
        <radialGradient id={`spec-${uid}`} cx="34%" cy="26%" r="46%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer bezel */}
      <circle cx="32" cy="32" r="30" fill={`url(#bezel-${uid})`} />
      {/* Faceted rim: twelve notches, struck-coin reeding */}
      <g opacity="0.55">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          return (
            <line
              key={i}
              x1={32 + Math.cos(a) * 26.5}
              y1={32 + Math.sin(a) * 26.5}
              x2={32 + Math.cos(a) * 30}
              y2={32 + Math.sin(a) * 30}
              stroke={c.edge}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          );
        })}
      </g>
      {/* Face */}
      <circle cx="32" cy="32" r="25" fill={`url(#face-${uid})`} />
      {/* Inner engraved ring */}
      <circle cx="32" cy="32" r="21" fill="none" stroke={c.edge} strokeWidth="1" opacity="0.45" />
      {/* Specular highlight */}
      <circle cx="32" cy="32" r="25" fill={`url(#spec-${uid})`} />
      {/* Numeral */}
      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        fill={c.ink}
        fontSize={numeral.length > 2 ? 16 : 21}
        fontWeight="900"
        letterSpacing="0.5"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {numeral}
      </text>
      {/* Sweeping reflection */}
      <g className="rank-medallion-shine">
        <path d="M4 44 L26 -6 L38 -6 L16 44 Z" fill="#ffffff" opacity="0.16" />
      </g>
    </svg>
  );
}
