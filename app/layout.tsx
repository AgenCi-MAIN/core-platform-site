import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: "Core Agency — From Rented Demand to Owned Intelligence",
    description: "The Core Agency operating model: a measurable transition from paid lead acquisition to quality-controlled, self-generated demand.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "From rented demand to owned intelligence.",
      description: "A disciplined operating model for traceable demand, quality routing, and durable agency growth.",
      type: "website",
      images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Core Agency operating model" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "From rented demand to owned intelligence.",
      description: "The four-rank Core Agency operating system.",
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
