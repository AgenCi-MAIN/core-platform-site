import type { Metadata } from "next";
import { PortalGovernanceFooter } from "../portal-chrome";

export const metadata: Metadata = {
  title: "IMO Portal Access",
  description: "Sign-in intake for the IMO Operating Portal.",
  robots: { index: false, follow: false },
};

export default function AccessLayout({
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
