import { ThriveMark } from "thrive-brand-marks";

export function Default() {
  return <ThriveMark />;
}

export function Topbar() {
  return (
    <span
      style={{
        display: "inline-grid",
        placeItems: "center",
        width: 32,
        height: 32,
        borderRadius: 8,
        background: "linear-gradient(135deg, #1d1730, #3a2f5c)",
        color: "#e0b64e",
      }}
    >
      <ThriveMark size={20} />
    </span>
  );
}

export function AccessGate() {
  return (
    <span
      style={{
        display: "inline-grid",
        placeItems: "center",
        width: 48,
        height: 48,
        borderRadius: 12,
        background: "linear-gradient(140deg, #1d1730, #3a2f5c)",
        color: "#fdf3d2",
      }}
    >
      <ThriveMark size={26} />
    </span>
  );
}
