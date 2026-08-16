import { desc } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "../../../db";
import { dialerTransfers } from "../../../db/schema";
import { requireCapability } from "../access";
import {
  EmptyState,
  PortalCardHeader,
  PortalPageIntro,
  PortalShell,
  PrototypeNotice,
} from "../components";
import { readFaultCopy, readRows } from "../read-guard";
import { DialPad } from "./dialpad";
import { isCallRecordingStorageReady } from "./storage";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function CallsPage() {
  const session = await requireCapability("calls.review", "/portal/calls");
  const { rows: calls, fault } = await readRows("dialer_transfers", () =>
    getDb()
      .select()
      .from(dialerTransfers)
      .orderBy(desc(dialerTransfers.receivedAt), desc(dialerTransfers.id))
      .limit(PAGE_SIZE),
  );
  const storageReady = isCallRecordingStorageReady();
  const readyCount = calls.filter(
    (call) => call.status === "ready" && call.consentStatus === "verified" && call.recordingObjectKey,
  ).length;
  const attentionCount = calls.filter(
    (call) => call.status === "needs_review" || call.status === "failed" || call.consentStatus !== "verified",
  ).length;
  /**
   * A failed read produces the same empty array as an empty table, so every
   * count below would render a confident `0` over data nobody managed to look
   * at. Show an em dash instead: the tile then says "not known", which is the
   * truth, rather than "none", which is a claim.
   */
  const metric = (value: number) => (fault ? "—" : value);

  return (
    <PortalShell session={session} current="/portal/calls" section="Dialer Beta">
      <main className="portal-main portal-dialer">
        <div className="portal-dialer-heading">
          <PortalPageIntro
            eyebrow="Conversation intelligence"
            title={<>Dialer transfer <em>inbox</em></>}
            subtitle="Protected access to calls transferred into CORE for authorized review, playback, and later coaching workflows."
            compact
          />
          <span className="portal-beta-badge">Beta</span>
        </div>

        <section className="portal-dialer-metrics" aria-label="Dialer transfer overview">
          <article className="portal-metric">
            <span className="portal-metric-label">Transferred calls</span>
            <strong className="portal-metric-value">{metric(calls.length)}</strong>
            <span className="portal-metric-detail">Newest {PAGE_SIZE} protected transfer records</span>
          </article>
          <article className="portal-metric">
            <span className="portal-metric-label">Ready to open</span>
            <strong className="portal-metric-value">{metric(readyCount)}</strong>
            <span className="portal-metric-detail">Recording ready and consent verified</span>
          </article>
          <article className="portal-metric">
            <span className="portal-metric-label">Needs attention</span>
            <strong className="portal-metric-value">{metric(attentionCount)}</strong>
            <span className="portal-metric-detail">Pending consent, review, processing, or recovery</span>
          </article>
        </section>

        <section className="portal-dialer-grid">
          <article className="portal-card portal-dialer-inbox">
            <div className="portal-card-title-row">
              <PortalCardHeader
                icon="D"
                title="Transferred call library"
                description="Only calls received through an approved source appear here."
              />
              <span className={`portal-state portal-state-${!fault && calls.length > 0 ? "live" : "pending"}`}>
                {fault
                  ? "Inbox unavailable"
                  : calls.length > 0
                    ? "Transfers received"
                    : "Awaiting first transfer"}
              </span>
            </div>

            {fault ? (
              <EmptyState {...readFaultCopy(fault, "The transfer inbox")} />
            ) : calls.length === 0 ? (
              <EmptyState
                title="No dialer calls transferred yet"
                body="The protected inbox and recording vault are prepared. Connect an approved dialer transfer source, verify recording consent, and send the first authorized call before a recording can appear here."
              />
            ) : (
              <div className="portal-table-scroll">
                <table className="portal-table portal-dialer-table">
                  <thead>
                    <tr>
                      <th scope="col">Received</th>
                      <th scope="col">Call</th>
                      <th scope="col">Agent / queue</th>
                      <th scope="col">Duration</th>
                      <th scope="col">Consent</th>
                      <th scope="col">Status</th>
                      <th scope="col">Recording</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((call) => {
                      const canOpen = call.status === "ready"
                        && call.consentStatus === "verified"
                        && Boolean(call.recordingObjectKey)
                        && storageReady;
                      return (
                        <tr key={call.id}>
                          <td className="portal-cell-mono">{formatTimestamp(call.receivedAt)}</td>
                          <td>
                            <strong>{call.callerNumberMasked ?? "Caller withheld"}</strong>
                            <span className="portal-cell-sub">
                              {call.direction} · {call.sourceSystem} · {call.transferId}
                            </span>
                          </td>
                          <td>
                            <strong>{call.agentEmail ?? "Unassigned"}</strong>
                            <span className="portal-cell-sub">{call.queueName ?? "No queue"}</span>
                          </td>
                          <td>{formatDuration(call.durationSeconds)}</td>
                          <td>
                            <span className={`portal-state portal-call-consent-${call.consentStatus}`}>
                              {humanize(call.consentStatus)}
                            </span>
                          </td>
                          <td>
                            <span className={`portal-state portal-call-status-${call.status}`}>
                              {humanize(call.status)}
                            </span>
                          </td>
                          <td>
                            <Link
                              className="portal-recording-link"
                              href={`/portal/calls/review/${call.id}`}
                            >
                              Review call
                            </Link>
                          </td>
                          <td>
                            {canOpen ? (
                              <a
                                className="portal-recording-link"
                                href={`/portal/calls/recording?id=${call.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Open recording
                              </a>
                            ) : (
                              <span className="portal-cell-sub">Unavailable</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <aside className="portal-card portal-dialer-readiness">
            <PortalCardHeader
              icon="R"
              title="Transfer readiness"
              description="What is ready now and what must be connected next."
            />
            <div className="portal-readiness-list">
              <ReadinessRow
                label="Transfer inbox"
                detail="D1 metadata index and protected reviewer access."
                state="live"
                stateLabel="Ready"
              />
              <ReadinessRow
                label="Recording vault"
                detail="Private object storage for transferred audio."
                state={storageReady ? "live" : "pending"}
                stateLabel={storageReady ? "Ready" : "Provisioning"}
              />
              <ReadinessRow
                label="External dialer"
                detail="Authorized source credentials and transfer contract are not connected."
                state="pending"
                stateLabel="Not connected"
              />
              <ReadinessRow
                label="Consent gate"
                detail="Playback stays locked until recording consent is verified."
                state="restricted"
                stateLabel="Required"
              />
            </div>
          </aside>

          <article className="portal-card portal-dialer-pad">
            <div className="portal-card-title-row">
              <PortalCardHeader
                icon="C"
                title="Dial pad"
                description="Place a call from here today; ready to rewire to the approved dialer the day one is connected."
              />
              <span className="portal-state portal-state-pending">Device calling</span>
            </div>
            <DialPad />
          </article>
        </section>

        <PrototypeNotice>
          Dialer Beta is the protected receiving surface, not a claim that an external dialer is
          already integrated. Call transfer credentials, recording disclosures, retention,
          redaction, deletion, and reviewer procedures require approved connection and governance.
        </PrototypeNotice>
      </main>
    </PortalShell>
  );
}

function ReadinessRow({
  label,
  detail,
  state,
  stateLabel,
}: {
  label: string;
  detail: string;
  state: "live" | "pending" | "restricted";
  stateLabel: string;
}) {
  return (
    <div className="portal-readiness-item">
      <span
        className={`portal-system-dot${state === "pending" ? " portal-system-dot-pending" : state === "restricted" ? " portal-system-dot-neutral" : ""}`}
        aria-hidden="true"
      />
      <span className="portal-readiness-copy">
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <span className={`portal-readiness-status portal-state portal-state-${state}`}>
        {stateLabel}
      </span>
    </div>
  );
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
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
