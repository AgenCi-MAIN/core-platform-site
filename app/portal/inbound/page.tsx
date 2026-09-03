import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { voicePresence } from "../../../db/schema";
import { can, requireCapability } from "../access";
import { PortalShell, PrototypeNotice } from "../components";
import { loadCallbacks, loadProduction } from "../dashboard-data";
import {
  InertChip,
  PanelHead,
  PanelNote,
  PanelTiles,
  RecordList,
  RecordRow,
  SourcePill,
  Tile,
} from "../panel";
import { readRows } from "../read-guard";

export const dynamic = "force-dynamic";

/**
 * Inbound Status — the daily inbound view (Dispatch R3, 2026-09-02).
 *
 * One focused panel: what rang today, what is owed, and whether you are on
 * the line. It is a VIEW of the voice workspace, not a second copy of it —
 * answering, availability and voicemail stay on the guarded Calls route,
 * which this panel links to. Calls left the dock in the same change; this
 * panel and the menu are its doors.
 *
 * The route existed before as a redirect into Calls. It now renders behind
 * exactly the same guard (`calls.answer`, `/portal/inbound`) — no capability
 * or call site changed — and reads only the self-scoped platform tables the
 * dashboard already reads plus this member's own presence row. Team presence
 * is protected and is not shown here.
 */

type Presence = { state: "live"; label: string; on: boolean } | { state: "fault" };

function presenceOf(
  row: { readyState: string; expiresAt: string } | undefined,
  fault: string | null,
): Presence {
  if (fault) return { state: "fault" };
  if (!row) return { state: "live", label: "Offline", on: false };
  // expires_at is written in both stored timestamp shapes; both are UTC.
  const iso = row.expiresAt.includes("T") ? row.expiresAt : `${row.expiresAt.replace(" ", "T")}Z`;
  const alive = iso > new Date().toISOString();
  if (!alive || row.readyState === "offline") return { state: "live", label: "Offline", on: false };
  if (row.readyState === "busy") return { state: "live", label: "On a call", on: true };
  return { state: "live", label: "Available", on: true };
}

function dueLabel(dueAt: string): string {
  return dueAt.replace("T", " ").slice(0, 16);
}

export default async function InboundStatusPage() {
  const session = await requireCapability("calls.answer", "/portal/inbound");

  const production = await loadProduction(session);
  const callbacks = await loadCallbacks(session, { limit: 5 });
  const presenceRead = await readRows("voice_presence", () =>
    getDb()
      .select({ readyState: voicePresence.readyState, expiresAt: voicePresence.expiresAt })
      .from(voicePresence)
      .where(eq(voicePresence.memberId, session.memberId))
      .limit(1),
  );
  const presence = presenceOf(presenceRead.rows[0], presenceRead.fault);

  const answered = production.callsAnswered;
  const answeredState = answered.kind === "pending" ? "pending" : "live";
  const answeredNote = answered.kind === "fault" ? "could not be read just now" : undefined;

  // A callback row opens the customer's drawer in the Book for roles that
  // hold a book; everyone else lands on the voicemail tab they can open.
  const hasBook = can(session, "book.view.self");
  const rowHref = (id: number) =>
    hasBook ? `/portal/book?view=customers&customer=${id}` : "/portal/calls?tab=voicemail";

  return (
    <PortalShell session={session} current="/portal/inbound" section="Inbound Status">
      <main className="portal-main portal-panel">
        <PanelHead
          eyebrow="Today · inbound voice"
          title="Inbound status"
          lede="What rang, what is owed, and whether you are on the line. Answering and availability live in Calls."
          chips={
            <>
              <InertChip current>Today</InertChip>
              <InertChip>This week</InertChip>
            </>
          }
          actions={
            <>
              <Link className="portal-button portal-button-primary" href="/portal/calls?tab=live">
                Open Calls
              </Link>
              <Link className="portal-button" href="/portal/calls?tab=voicemail">
                Voicemail queue
              </Link>
            </>
          }
        />

        <PanelTiles label="Today's inbound numbers">
          <Tile
            label="Answered today"
            value={answered.kind === "live" ? answered.day : null}
            state={answeredState}
            note={answeredNote}
          />
          <Tile
            label="Answered this week"
            value={answered.kind === "live" ? answered.week : null}
            state={answeredState}
            note={answeredNote}
          />
          <Tile
            label="Callbacks open"
            value={callbacks.kind === "ok" ? callbacks.count : null}
            state={callbacks.kind === "hidden" ? "pending" : "live"}
            note={callbacks.kind === "fault" ? "could not be read just now" : undefined}
          />
          <Tile label="Missed today" value={null} state="pending" note="no missed-call source" />
          <Tile label="Median answer" value={null} state="pending" note="no timing source" />
        </PanelTiles>

        <div className="portal-panel-grid">
          <section className="portal-card portal-panel-card" aria-labelledby="inbound-queue-title">
            <header className="portal-panel-card-head">
              <h2 id="inbound-queue-title">Callback queue</h2>
              <SourcePill state="live" label="Live · masked" />
            </header>
            {callbacks.kind === "hidden" ? (
              <PanelNote>The callback queue is not available to this role.</PanelNote>
            ) : callbacks.kind === "fault" ? (
              <PanelNote>The queue could not be read just now. Nothing is shown rather than a guess.</PanelNote>
            ) : callbacks.top.length === 0 ? (
              <PanelNote>No callbacks are waiting on you or the shared queue.</PanelNote>
            ) : (
              <RecordList label="Callbacks waiting">
                {callbacks.top.map((task) => (
                  <RecordRow
                    key={task.id}
                    href={rowHref(task.id)}
                    title={task.callerNumberMasked}
                    meta={`Due ${dueLabel(task.dueAt)}${task.overdue ? " · past due" : ""}`}
                    pill={
                      <SourcePill
                        state={task.overdue ? "pending" : "live"}
                        label={task.overdue ? "Past due" : "Callback owed"}
                      />
                    }
                  />
                ))}
              </RecordList>
            )}
            <p className="portal-panel-foot">
              Numbers are masked; the platform holds no caller name. Claim and call back in{" "}
              <Link href="/portal/calls?tab=voicemail">Calls</Link>.
            </p>
          </section>

          <section className="portal-card portal-panel-card" aria-labelledby="inbound-line-title">
            <header className="portal-panel-card-head">
              <h2 id="inbound-line-title">On the line</h2>
              <SourcePill state="live" label="Presence" />
            </header>
            {presence.state === "fault" ? (
              <PanelNote>Your presence could not be read just now.</PanelNote>
            ) : (
              <p className={`portal-presence-line${presence.on ? " portal-presence-line-on" : ""}`}>
                <span className="portal-presence-dot" aria-hidden="true" />
                <strong>You: {presence.label}</strong>
                <Link href="/portal/calls?tab=live">Change in Calls</Link>
              </p>
            )}
            <div className="portal-panel-row">
              <span>Team presence</span>
              <SourcePill state="protected" />
            </div>
            <p className="portal-panel-foot">
              Other members&rsquo; availability is not shown here. The hunt group rings whoever is
              Available; that routing is enforced server-side, not displayed.
            </p>
          </section>
        </div>

        <PrototypeNotice>
          This panel reads the same self-scoped call and callback tables as the dashboard, plus your
          own presence row. It places no call, records nothing, and carries no dialer.
        </PrototypeNotice>
      </main>
    </PortalShell>
  );
}
