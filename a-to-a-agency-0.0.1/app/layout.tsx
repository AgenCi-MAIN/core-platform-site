import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgenCi — AI-Native Command System",
  description:
    "AgenCi is an AI-native command system for governed intake, routing, analysis, and workflow execution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-command-red focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Skip to content
        </a>
        <div className="min-h-screen bg-command-ink text-command-text">
          <header className="sticky top-0 z-40 border-b border-command-frame bg-command-ink/95 backdrop-blur">
            <nav
              aria-label="Main navigation"
              className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4"
            >
              <p className="font-mono text-sm tracking-[0.22em] text-command-red">
                AGENCI
              </p>
              <div className="flex flex-wrap gap-5 text-sm text-command-muted">
                <Link className="focus-ring transition-colors hover:text-white" href="#services">
                  Capabilities
                </Link>
                <Link className="focus-ring transition-colors hover:text-white" href="#process">
                  Agent loop
                </Link>
                <Link className="focus-ring transition-colors hover:text-white" href="#compliance">
                  Boundaries
                </Link>
                <Link className="focus-ring transition-colors hover:text-white" href="#access">
                  Access
                </Link>
              </div>
            </nav>
          </header>
          <main id="main">{children}</main>
          <footer className="mt-20 border-t border-command-frame bg-command-panel/70">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-8 text-sm text-command-muted">
              <p>© {new Date().getFullYear()} AgenCi</p>
              <p>AI-native prototype. No live integrations, client data, guarantees, or licensed advice.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
