"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { CollabDialer } from "../dialer/collab-dialer";

type CallHistory = {
  id: number;
  calledLine: string;
  caller: string;
  stage: string;
  status: string;
  activityStatus: string;
  disposition: string | null;
  startedAt: string;
  voicemailState: string | null;
};

type CallbackTask = {
  id: number;
  assignedMemberId: number | null;
  claimedByMemberId: number | null;
  status: string;
  dueAt: string;
  voicemailReady: boolean;
  caller: string;
  calledLine: string;
  lineType: string;
  startedAt: string;
};

type Bootstrap = {
  phoneEnabled: boolean;
  setupState: string;
  personalNumber?: string | null;
  founder: boolean;
  currentMemberId: number;
  presence: { state: string; expiresAt: string | null };
  history: CallHistory[];
  callbackTasks: CallbackTask[];
  callbackCounts?: { open: number; mine: number };
  aggregates?: { availableEmployees: number; registeredEmployees: number };
  error?: string;
};

export type LabCall = {
  id: number;
  transferId: string;
  receivedAt: string;
  caller: string;
  agent: string;
  status: string;
  consent: string;
  reviewHref: string;
  recordingHref: string | null;
};

type Tab = "live" | "history" | "lab" | "voicemail" | "outbound";
const STANDARD_TABS: Array<{ id: Tab; label: string }> = [
  { id: "live", label: "Live" },
  { id: "history", label: "My History" },
  { id: "lab", label: "Call Lab" },
  { id: "voicemail", label: "Voicemail" },
];
const FOUNDER_TABS: Array<{ id: Tab; label: string }> = [
  ...STANDARD_TABS,
  { id: "outbound", label: "Outbound" },
];

export function CallsWorkspace({ labCalls, labAuthorized, labFault, outboundAuthorized }: {
  labCalls: LabCall[];
  labAuthorized: boolean;
  labFault: { title: string; body: string } | null;
  outboundAuthorized: boolean;
}) {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [tab, setTab] = useState<Tab>("live");
  const [phonePhase, setPhonePhase] = useState("offline");
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState<number | null>(null);
  const tabs = outboundAuthorized ? FOUNDER_TABS : STANDARD_TABS;

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/portal/calls/bootstrap", { cache: "no-store" });
      const body = (await response.json()) as Bootstrap;
      if (!response.ok) throw new Error(body.error ?? "Calls could not be loaded.");
      setData(body);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Calls could not be loaded.");
    }
  }, []);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("tab");
    const initialTimer = window.setTimeout(() => {
      if (tabs.some((item) => item.id === value)) setTab(value as Tab);
      void refresh();
    }, 0);
    const timer = window.setInterval(() => void refresh(), 20_000);
    const onState = (event: Event) => {
      const next = (event as CustomEvent<{ phase?: string }>).detail?.phase;
      if (next) setPhonePhase(next);
    };
    window.addEventListener("thrive:phone-state", onState);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
      window.removeEventListener("thrive:phone-state", onState);
    };
  }, [outboundAuthorized, refresh, tabs]);

  function chooseTab(next: Tab) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  }

  function moveTabFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0 || tabs.length === 0) return;
    event.preventDefault();
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    const id = tabs[next]?.dataset.callsTab as Tab | undefined;
    if (!id) return;
    chooseTab(id);
    tabs[next].focus();
  }

  async function claim(id: number) {
    setClaiming(id);
    setError("");
    try {
      const response = await fetch(`/portal/calls/callback-tasks/${id}/claim`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "The task could not be claimed.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The task could not be claimed.");
    } finally {
      setClaiming(null);
    }
  }

  const visibleTasks = data?.callbackTasks ?? [];
  const presence = ["available", "ringing", "connecting", "connected"].includes(phonePhase)
    ? phonePhase
    : data?.presence.state ?? "offline";

  return (
    <section className="calls-workspace">
      <div className="calls-tabs" role="tablist" aria-label="Calls workspace" onKeyDown={moveTabFocus}>
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`calls-tab-${item.id}`}
            data-calls-tab={item.id}
            aria-selected={tab === item.id}
            aria-controls={`calls-panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => chooseTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="portal-notice" role="alert"><span>Call workspace</span>{error}</p> : null}

      <div id="calls-panel-live" role="tabpanel" aria-labelledby="calls-tab-live" hidden={tab !== "live"}>
        <div className="calls-live-grid">
          <article className="portal-card calls-ready-card">
            <div className="portal-card-title-row">
              <div><span className="portal-kicker">Browser phone</span><h2>Computer availability</h2></div>
              <span className={`portal-state portal-state-${presence === "available" || presence === "connected" ? "live" : "pending"}`}>{humanize(presence)}</span>
            </div>
            <p>
              {data?.phoneEnabled
                ? `Your assigned line is ${data.personalNumber ?? "masked"}. Keep one CORE tab open, grant microphone access, and press Available in the floating eye.`
                : data?.setupState === "not_provisioned"
                  ? "The inbound-call migration has not been applied yet."
                  : "A number and subscriber assignment have not been provisioned for this account yet."}
            </p>
            <div className="calls-ready-action">
              <button
                type="button"
                disabled={!data?.phoneEnabled}
                onClick={() => window.dispatchEvent(new CustomEvent("thrive:phone-panel", { detail: { open: true } }))}
              >
                Open Calls in J.A.R.V.I.S.
              </button>
              <span className="portal-cell-sub">Keyboard 1 answers only while an incoming offer is active.</span>
            </div>
          </article>
          <article className="portal-card">
            <span className="portal-kicker">Callback queue</span>
            <h2>{data?.callbackCounts?.open ?? "—"} open</h2>
            <p>{data?.callbackCounts?.mine ?? "—"} assigned to or claimed by you.</p>
            {data?.founder && data.aggregates ? (
              <p>{data.aggregates.availableEmployees} employees currently report Available.</p>
            ) : null}
          </article>
        </div>
        <TaskList tasks={visibleTasks.filter((task) => task.status === "open" || task.status === "claimed")} data={data} claiming={claiming} canClaim={presence === "available"} onClaim={claim} />
      </div>

      <div id="calls-panel-history" role="tabpanel" aria-labelledby="calls-tab-history" hidden={tab !== "history"}>
        <article className="portal-card">
          <span className="portal-kicker">Protected history</span>
          <h2>{data?.founder ? "Authorized company call history" : "My offered and answered calls"}</h2>
          <div className="calls-history-list">
            {(data?.history ?? []).length === 0 ? <p>No inbound call activity has been stored yet.</p> : (data?.history ?? []).map((call) => (
              <div className="calls-history-row" key={call.id}>
                <div>
                  <strong>{call.caller} · {call.calledLine}</strong>
                  <small>{formatTime(call.startedAt)} · {humanize(call.stage)} · {humanize(call.activityStatus ?? call.disposition ?? call.status)}</small>
                </div>
                <span className={`portal-state portal-state-${call.status === "connected" || call.status === "completed" ? "live" : "pending"}`}>{humanize(call.status)}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div id="calls-panel-lab" role="tabpanel" aria-labelledby="calls-tab-lab" hidden={tab !== "lab"}>
        <article className="portal-card">
          <span className="portal-kicker">Permissioned review</span>
          <h2>Call Lab</h2>
          {!labAuthorized ? (
            <p>Company-wide review remains founder-authorized. Your own inbound activity is available under My History.</p>
          ) : labFault ? (
            <div className="portal-notice" role="status"><span>{labFault.title}</span>{labFault.body}</div>
          ) : labCalls.length === 0 ? (
            <p>No authorized transferred recordings are ready for review.</p>
          ) : (
            <div className="calls-history-list">
              {labCalls.map((call) => (
                <div className="calls-history-row" key={call.id}>
                  <div><strong>Dialer transfer · {call.caller} · {call.agent}</strong><small>{call.transferId} · {formatTime(call.receivedAt)} · {humanize(call.consent)} · {humanize(call.status)}</small></div>
                  <div className="calls-task-actions">
                    <a className="portal-recording-link" href={call.reviewHref}>Review call</a>
                    {call.recordingHref ? <a className="portal-recording-link" href={call.recordingHref}>Open recording</a> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      <div id="calls-panel-voicemail" role="tabpanel" aria-labelledby="calls-tab-voicemail" hidden={tab !== "voicemail"}>
        <article className="portal-card">
          <span className="portal-kicker">Voicemail callbacks</span>
          <h2>Messages and follow-up</h2>
          <TaskList tasks={visibleTasks} data={data} claiming={claiming} canClaim={presence === "available"} onClaim={claim} />
        </article>
      </div>

      {outboundAuthorized ? (
        <div className="calls-outbound-panel" id="calls-panel-outbound" role="tabpanel" aria-labelledby="calls-tab-outbound" hidden={tab !== "outbound"}>
          <article className="portal-card calls-outbound-intro">
            <span className="portal-kicker">Founder controlled · outbound</span>
            <h2>Collab Dialer</h2>
            <p>CORE rings the approved private-mobile fallback first. Only after telephone-key 1 confirmation does SignalWire connect the customer from the dedicated CORE platform line.</p>
          </article>
          <CollabDialer />
        </div>
      ) : null}
    </section>
  );
}

function TaskList({ tasks, data, claiming, canClaim, onClaim }: {
  tasks: CallbackTask[];
  data: Bootstrap | null;
  claiming: number | null;
  canClaim: boolean;
  onClaim: (id: number) => Promise<void>;
}) {
  if (tasks.length === 0) return <p>No callback tasks in this view.</p>;
  return (
    <div className="calls-task-list">
      {tasks.map((task) => {
        const mine = task.assignedMemberId === data?.currentMemberId || task.claimedByMemberId === data?.currentMemberId;
        const unclaimed = task.assignedMemberId === null && task.claimedByMemberId === null && task.status === "open";
        return (
          <div className="calls-task" key={task.id}>
            <div>
              <strong>{task.caller} · {task.calledLine}</strong>
              <small>{task.lineType === "shared" ? "Shared main line" : "Personal business line"} · due {formatTime(task.dueAt)} · {humanize(task.status)}</small>
            </div>
            <div className="calls-task-actions">
              {unclaimed ? <button type="button" disabled={!canClaim || claiming === task.id} title={canClaim ? undefined : "Become Available to claim this callback"} onClick={() => void onClaim(task.id)}>{claiming === task.id ? "Claiming…" : "Claim"}</button> : null}
              {task.voicemailReady && (data?.founder || mine) ? <a href={`/portal/calls/voicemail/audio?id=${task.id}`} target="_blank" rel="noopener noreferrer">Play voicemail</a> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
