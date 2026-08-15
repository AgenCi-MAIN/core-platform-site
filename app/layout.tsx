import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { PortalThemeBoot } from "./portal-chrome";
import { ServiceWorkerBoot } from "./service-worker-boot";
import "./globals.css";

/**
 * `themeColor` paints the phone's status bar and the installed app's window
 * chrome. A single dark value, matching the portal's DEFAULT theme — the
 * theme is chosen in localStorage, not by the OS, so a prefers-color-scheme
 * media query here answered the wrong question. PortalThemeBoot rewrites this
 * meta before first paint (and the theme control keeps it in step), so a
 * member who opts into Bright gets a bright bar too.
 *
 * `width` carries `viewport-fit=cover` deliberately, and it is not a typo.
 * vinext builds the viewport meta by joining a fixed list of fields — width,
 * height, initial/minimum/maximum scale, user-scalable — and has no case for
 * Next's `viewportFit`, so setting that field renders nothing. Appending the
 * directive to `width` lands it in the same comma-joined string, producing
 * exactly `width=device-width, viewport-fit=cover, initial-scale=1`.
 *
 * Without it iOS letterboxes an installed copy inside the safe area, which is
 * the difference between something that looks like an app and something that
 * looks like a page in a box. The safe-area rules at the end of globals.css
 * are what keep content clear of the notch and the home indicator once the
 * layout is allowed to reach them.
 *
 * A test asserts the rendered meta, so if a future vinext escapes this value or
 * grows real `viewportFit` support, the suite says so instead of the phone.
 */
export const viewport: Viewport = {
  width: "device-width, viewport-fit=cover",
  initialScale: 1,
  themeColor: "#0e1116",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: "CORE J.A.R.V.I.S. — The In-House Signal Exchange",
    description: "J.A.R.V.I.S. connects verified in-house opportunity, carrier intelligence, call coaching, scripts, compensation ranks, and accountable outcomes in one CORE operating system.",
    manifest: "/manifest.webmanifest",
    applicationName: "THRIVE",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
      // iOS ignores SVG here and will screenshot the page instead, which is how
      // a home-screen icon ends up a blurry thumbnail. It needs a real PNG.
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    /**
     * Makes an iOS home-screen launch open without Safari's chrome, matching
     * what Android already does from the manifest's `display: standalone`.
     * Nothing here affects authorization: the standalone window is still a
     * browser sending the same cookie to the same guarded routes.
     *
     * `statusBarStyle` is "default", not "black-translucent". Translucent
     * pins WHITE status-bar glyphs regardless of what the page paints, which
     * breaks the moment a member opts into the Bright theme. "default" lets
     * modern iOS derive the bar from the theme-color meta — which the boot
     * script keeps matched to the actual theme, dark by default.
     */
    appleWebApp: {
      capable: true,
      title: "THRIVE",
      statusBarStyle: "default",
    },
    /**
     * `appleWebApp.capable` above emits only the modern `mobile-web-app-capable`
     * name, which Safari does not read. Every iOS version before 16.4 needs the
     * `apple-` prefixed one to launch standalone at all, and it costs nothing on
     * versions that no longer require it.
     */
    other: { "apple-mobile-web-app-capable": "yes" },
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
        <ServiceWorkerBoot />
      </body>
    </html>
  );
}
