import type { Metadata } from "next";
import { PortalGovernanceFooter } from "../portal-chrome";
import { PortalAudioDeck } from "./audio-deck";
import { PortalPresence } from "./presence";

export const metadata: Metadata = {
  title: "THRIVE Portal — J.A.R.V.I.S.",
  description: "Authenticated THRIVE operating portal.",
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
    <>
      <div className="portal">
        {children}
        <PortalAudioDeck />
        {/* The widget renders for everyone in the tree; the server route it
            posts to enforces pet.chat on every request — the button is a
            courtesy, never a boundary (same doctrine as the member controls). */}
        <PortalPresence />
        <PortalGovernanceFooter />
      </div>
    </>
  );
}
