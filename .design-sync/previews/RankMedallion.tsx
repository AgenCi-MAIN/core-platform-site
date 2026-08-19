import { RankMedallion, METAL_FOR_ROLE, type Metal } from "thrive-brand-marks";

const RANKS: { metal: Metal; numeral: string; label: string }[] = [
  { metal: "bronze", numeral: "1", label: "Bronze" },
  { metal: "silver", numeral: "2", label: "Silver" },
  { metal: "gold", numeral: "3", label: "Gold" },
  { metal: "diamond", numeral: "4", label: "Diamond" },
  { metal: "obsidian", numeral: "5", label: "Obsidian" },
];

export function AllRanks() {
  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      {RANKS.map((r) => (
        <div key={r.metal} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <RankMedallion metal={r.metal} numeral={r.numeral} title={r.label} />
          <span style={{ fontSize: 12, fontFamily: "system-ui" }}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

export function InMetricRow() {
  const metal = METAL_FOR_ROLE.admin;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <RankMedallion metal={metal} numeral="4" size={38} title="Admin" />
      <strong style={{ fontFamily: "system-ui", fontSize: 15 }}>Admin</strong>
    </span>
  );
}

export function Large() {
  return <RankMedallion metal="gold" numeral="3" size={80} title="Gold" />;
}
