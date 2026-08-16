import Link from "next/link";
import { EmptyState, PortalShell, PrototypeNotice } from "../../components";
import { requireCapability } from "../../access";

export const dynamic = "force-dynamic";

/**
 * The review index is intentionally a guarded landing page. The detail route
 * uses a path parameter rather than a query string because the current Vinext
 * RSC adapter does not reliably expose query parameters to page components.
 */
export default async function CallReviewIndexPage() {
  const session = await requireCapability("calls.review", "/portal/calls/review");

  return (
    <PortalShell session={session} current="/portal/calls" section="Call review">
      <main className="portal-main portal-dialer">
        <ReviewHeader />
        <section className="portal-card">
          <EmptyState
            title="Select a transfer to review"
            body={
              <>
                Open a transfer from the protected inbox to review its D1 context
                and, when ready, stream the consent-verified recording from R2.
              </>
            }
          />
          <Link className="portal-recording-link" href="/portal/calls">
            Return to transfer inbox
          </Link>
        </section>
        <PrototypeNotice>
          Review access is protected by the <code>calls.review</code> capability.
          The index itself does not expose transfer rows until the reviewer opens
          the authenticated inbox.
        </PrototypeNotice>
      </main>
    </PortalShell>
  );
}

function ReviewHeader() {
  return (
    <div className="portal-call-review-header">
      <Link className="portal-call-back" href="/portal/calls">
        <span aria-hidden="true">←</span> Back to transfer inbox
      </Link>
      <span className="portal-beta-badge">Calls / Review</span>
    </div>
  );
}
