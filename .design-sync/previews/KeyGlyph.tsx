import { KeyGlyph } from "thrive-brand-marks";

export function Standalone() {
  return <KeyGlyph />;
}

export function InPrimaryButton() {
  return (
    <a
      href="#"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "12px 18px",
        borderRadius: 8,
        background: "#d9a63a",
        color: "#241b10",
        fontFamily: "system-ui",
        fontWeight: 800,
        textDecoration: "none",
      }}
    >
      Portal access
      <KeyGlyph label="Sign in" />
    </a>
  );
}

export function InTextLink() {
  return (
    <a
      href="#"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "8px 2px",
        borderBottom: "1px solid #4b5563",
        color: "#111827",
        fontFamily: "system-ui",
        fontWeight: 800,
        fontSize: 12,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        textDecoration: "none",
      }}
    >
      Onboarding &amp; training
      <KeyGlyph label="Continue" />
    </a>
  );
}
