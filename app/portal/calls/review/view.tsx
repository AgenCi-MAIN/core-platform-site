import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "../../../../db";
import { dialerTransfers } from "../../../../db/schema";
import {
  EmptyState,
  PortalCardHeader,
  PortalPageIntro,
  PortalShell,
  PrototypeNotice,
} from "../../components";
import type { PortalSession } from "../../access";
import { readFaultCopy, readRows } from "../../read-guard";
import { getCallRecordingsBucket } from "../storage";

/**
 * The authenticated call-level review view. D1 supplies the transfer metadata;
 * the audio element points at the recording route, which performs its own
 * membership, capability, consent, lifecycle, and R2 checks.
 */
export async function CallReviewView({
  session,
  id,
}: {
  session: PortalSession;
  id: number;
}) {
  const { rows, fault } = await readRows("dialer_transfers", () =>
    getDb()
      .select()
      .from(dialerTransfers)
      .where(eq(dialerTransfers.id, id))
      .limit(1),
  );

  if (fault) {
    return (
      <PortalShell session={session} current="/portal/calls" section="Call review">
        <main className="portal-main portal-dialer">
          <ReviewHeader />
          <section className="portal-card">
            <EmptyState {...readFaultCopy(fault, "The call review index")} />
          </section>
        </main>
      </PortalShell>
    );
  }

  const [call] = rows;
  if (!call) notFound();

  const storageReady = getCallRecordingsBucket() !== null;
  const canPlay =
    call.status === "ready" &&
    call.consentStatus === "verified" &&
    Boolean(call.recordingObjectKey) &&
    storageReady;

  return (
    <PortalShell session={session} current="/portal/calls" section="Call review">
      <main className="portal-main portal-dialer portal-call-review">
        <ReviewHeader />

        <section className="portal-call-review-summary">
          <PortalPageIntro
            eyebrow="Protected call review"
            title={<>Transfer <em>{call.transferId}</em></>}
            subtitle="Review the transfer context first. Playback remains a second, independently checked step so a metadata view never becomes an audio bypass."
            compact
          />
          <div className="portal-call-review-state">
            <span className={`portal-state portal-call-status-${call.status}`}>
              {humanize(call.status)}
            </span>
            <span className={`portal-state portal-call-consent-${call.consentStatus}`}>
              Consent: {humanize(call.consentStatus)}
            </span>
          </div>
        </section>

        <section className="portal-call-review-grid">
          <article className="portal-card portal-call-player-card">
            <div className="portal-card-title-row">
              <PortalCardHeader
                icon="▶"
                title="Recording playback"
                description="Audio is streamed from private R2 storage through the consent-checked recording route."
              />
              <span className={`portal-state portal-state-${canPlay ? "live" : "restricted"}`}>
                {canPlay ? "Playback ready" : "Playback locked"}
              </span>
            </div>

            {canPlay ? (
              <div className="portal-call-player">
                <audio
                  controls
                  preload="metadata"
                  src={`/portal/calls/recording?id=${call.id}`}
                  aria-label={`Recording for transfer ${call.transferId}`}
                >
                  Your browser does not support audio playback. Use the recording
                  link from a supported browser.
                </audio>
                <p className="portal-fine">
                  Playback re-checks your membership, the <code>calls.review</code>
                  capability, verified consent, the D1 lifecycle state, and the
                  R2 object on every request.
                </p>
              </div>
            ) : (
              <EmptyState
                title={recordingStateTitle(call.status, call.consentStatus, storageReady)}
                body={recordingStateBody(call.status, call.consentStatus, storageReady)}
              />
            )}
          </article>

          <aside className="portal-card portal-call-review-guide">
            <PortalCardHeader
              icon="✓"
              title="Reviewer pass"
              description="A repeatable sequence for coaching-oriented review."
            />
            <ol className="portal-review-steps">
              <li>
                <strong>Listen for the opening</strong>
                <span>Did the agent establish trust and identify the reason for the call?</span>
              </li>
              <li>
                <strong>Check discovery</strong>
                <span>Were the important needs, constraints, and decision context surfaced?</span>
              </li>
              <li>
                <strong>Check decision clarity</strong>
                <span>Did the next step have a clear owner, purpose, and time?</span>
              </li>
              <li>
                <strong>Check compliance</strong>
                <span>Were claims verified and required consent or disclosures respected?</span>
              </li>
            </ol>
            <p className="portal-fine">
              This review surface reads the existing transfer and recording only.
              Structured coaching notes require a separately approved review record
              and are not written into the call metadata by this page.
            </p>
          </aside>
        </section>

        <section className="portal-call-facts-grid">
          <article className="portal-card">
            <PortalCardHeader
              icon="C"
              title="Call context"
              description="Protected metadata from the dialer transfer index."
            />
            <dl className="portal-call-facts">
              <Fact label="Caller" value={call.callerNumberMasked ?? "Caller withheld"} />
              <Fact label="Direction" value={humanize(call.direction)} />
              <Fact label="Source" value={call.sourceSystem} />
              <Fact label="Queue" value={call.queueName ?? "No queue"} />
              <Fact label="Assigned agent" value={call.agentEmail ?? "Unassigned"} />
              <Fact label="External call ID" value={call.externalCallId ?? "Not supplied"} />
            </dl>
          </article>

          <article className="portal-card">
            <PortalCardHeader
              icon="T"
              title="Transfer lifecycle"
              description="Timing and readiness fields carried by D1."
            />
            <dl className="portal-call-facts">
              <Fact label="Received" value={formatTimestamp(call.receivedAt)} />
              <Fact label="Started" value={formatOptionalTimestamp(call.startedAt)} />
              <Fact label="Ended" value={formatOptionalTimestamp(call.endedAt)} />
              <Fact label="Duration" value={formatDuration(call.durationSeconds)} />
              <Fact label="Last updated" value={formatTimestamp(call.updatedAt)} />
              <Fact label="Recording storage" value={storageReady ? "R2 binding available" : "R2 binding unavailable"} />
            </dl>
          </article>
        </section>

        <PrototypeNotice>
          Call review is currently a protected read and playback workflow over the
          existing D1 transfer index and R2 recording vault. Consent, retention,
          redaction, reviewer ownership, and any future coaching-note write path
          remain governed operations and must be approved before production use.
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function recordingStateTitle(
  status: string,
  consentStatus: string,
  storageReady: boolean,
): string {
  if (consentStatus !== "verified") return "Playback requires verified consent";
  if (status !== "ready") return "Recording is still processing";
  if (!storageReady) return "Recording storage is not connected";
  return "Recording is unavailable";
}

function recordingStateBody(
  status: string,
  consentStatus: string,
  storageReady: boolean,
): string {
  if (consentStatus !== "verified") {
    return "The transfer can be reviewed as metadata, but audio stays locked until the approved consent state is verified in D1.";
  }
  if (status !== "ready") {
    return "The transfer is visible, but the dialer has not marked a playable recording as ready yet.";
  }
  if (!storageReady) {
    return "The D1 record is present, but the private CALL_RECORDINGS R2 binding is unavailable on this deployment.";
  }
  return "The transfer metadata points to a recording that cannot currently be opened.";
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
}

function formatOptionalTimestamp(value: string | null): string {
  return value ? formatTimestamp(value) : "Not supplied";
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "Pending";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}
