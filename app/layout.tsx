import type { Metadata } from "next";
import { headers } from "next/headers";
import { PortalThemeBoot } from "./portal-chrome";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: "CORE J.A.R.V.I.S. — The In-House Signal Exchange",
    description: "J.A.R.V.I.S. connects verified in-house opportunity, carrier intelligence, call coaching, scripts, compensation ranks, and accountable outcomes in one CORE operating system.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "From rented demand to owned intelligence.",
      description: "A verified signal exchange and agency intelligence system for traceable demand, quality routing, call learning, and durable growth.",
      type: "website",
      images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Core Agency operating model" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "From rented demand to owned intelligence.",
      description: "The five-rank Core signal exchange and agency operating system.",
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <PortalThemeBoot />
        {children}
      </body>
    </html>
  );
}
