import type { Metadata } from "next";
import { PortalGovernanceFooter } from "../portal-chrome";

export const metadata: Metadata = {
  title: "THRIVE — Onboarding & Training",
  description:
    "Onboarding and training for new THRIVE agents. Process only; no member or production data.",
  robots: { index: false, follow: false },
};

export default function TourLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <div className="portal">
        {children}
        <PortalGovernanceFooter />
      </div>
    </>
  );
}
