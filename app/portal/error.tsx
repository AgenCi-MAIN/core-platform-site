"use client";

/**
 * Portal error boundary.
 *
 * Next.js App Router calls this component when a server component inside
 * /portal throws an unhandled error. It renders a styled explanation
 * consistent with the portal design system, without exposing the error
 * detail to the browser (the detail is in the server logs).
 *
 * This does NOT run for authorization failures — those are handled by
 * requireCapability / assertCapability redirecting to /portal/no-access.
 * It runs only for genuine runtime faults: a D1 query that throws, an
 * unexpected null, a bug in a component.
 */

import { useEffect } from "react";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // This is a "use client" boundary, so this logs to the member's browser
    // console, not the server. The digest is the stable identifier the server
    // substitutes after sanitizing; the raw message never leaves the worker.
    console.error("[portal] unhandled error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="portal">
      <main className="portal-main portal-gate">
        <section className="portal-card portal-gate-card access-card">
          <header className="access-head">
            <span className="access-mark" aria-hidden="true">!</span>
            <p className="portal-eyebrow">THRIVE — System fault</p>
            <h1>Something went wrong</h1>
            <p className="portal-lede">
              This page could not be loaded. The fault has been recorded on the
              server. Your access and membership are unchanged.
            </p>
          </header>

          <div className="access-actions">
            <button
              className="button button-primary"
              onClick={reset}
              type="button"
            >
              Try again
            </button>
            <a className="text-link" href="/portal">
              Return to dashboard
            </a>
          </div>

          {error.digest && (
            <p className="portal-fine">
              Reference: <code>{error.digest}</code>
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
