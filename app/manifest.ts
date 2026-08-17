import type { MetadataRoute } from "next";

/**
 * Web app manifest — served at /manifest.webmanifest.
 *
 * This is what lets the portal be installed to a phone's home screen and open
 * without browser chrome. It changes nothing about access: an installed shell
 * is still just a browser making the same requests, carrying the same
 * `core_session` cookie, and every route it reaches re-resolves membership
 * server-side. Installing grants nothing.
 *
 * `start_url` is /portal deliberately. Someone who installs this is a member,
 * and a member wants the workspace, not the marketing page. A visitor who
 * installs it without a membership row lands on /access — which is the correct
 * answer, and the same one they get in a browser tab.
 *
 * `id` is pinned so a future change to start_url does not make installed copies
 * look like a different app and duplicate the icon on someone's home screen.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/portal",
    name: "THRIVE — J.A.R.V.I.S. Portal",
    short_name: "THRIVE",
    description:
      "THRIVE's permissioned operating portal: verified opportunity, carrier intelligence, call review, scripts, compensation ranks, and accountable outcomes.",
    start_url: "/portal",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    /**
     * Dark, matching the portal's DEFAULT theme. These paint the splash
     * screen and the installed window's chrome, and a bright splash opening
     * into a dark portal reads as a flash-of-wrong-theme. A member who opts
     * into Bright gets it from the theme-color meta, which the boot script
     * rewrites per stored preference; the manifest cannot read localStorage.
     */
    background_color: "#0c0a07",
    theme_color: "#0c0a07",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Android crops installed icons to whatever shape the launcher uses.
        // This one is full-bleed with the mark inside the safe circle, so the
        // crop never clips it.
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Announcements",
        short_name: "News",
        url: "/portal/announcements",
      },
      { name: "Call review", short_name: "Calls", url: "/portal/calls" },
      { name: "Scripts", short_name: "Scripts", url: "/portal/scripts" },
      { name: "THRIVE Radio", short_name: "Radio", url: "/portal/music" },
    ],
  };
}
