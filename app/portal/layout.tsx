import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CORE Portal — J.A.R.V.I.S.",
  description: "Authenticated CORE operating portal.",
  robots: { index: false, follow: false },
};

/**
 * Portal shell. This layout deliberately performs no authorization: the
 * `/portal/no-access` page lives inside this tree and must render for callers
 * who have been refused. Each page guards itself with `requireCapability`.
 */
export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="portal">
      {children}
      <footer className="portal-footer">
        <p>
          <strong>J.A.R.V.I.S.</strong> — Joint Agency Routing, Verification &amp;
          Intelligence System. CORE&apos;s project-level operational identity; the
          underlying AI system is Codex by OpenAI.
        </p>
        <p>
          J.A.R.V.I.S. is not a human, a licensed insurance producer, or a
          contracting party. Licensed activity, compliance sign-off, and final
          executive judgment remain with authorized humans.
        </p>
      </footer>
    </div>
  );
}
