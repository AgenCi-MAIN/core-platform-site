"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type ConnectionState = "disconnected" | "connecting" | "connected" | "error";
type CallState = "idle" | "dialing" | "ringing" | "active" | "ended";

interface SwConfig {
  spaceUrl: string;
  projectId: string;
  apiToken: string;
}

const KEYS: ReadonlyArray<{ digit: string; letters: string }> = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "" },
  { digit: "#", letters: "" },
];

const MAX_DIGITS = 18;
const STORAGE_KEY = "core-sw-config";

function formatNumber(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (raw.includes("*") || raw.includes("#")) return raw;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d.startsWith("1"))
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return raw;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function loadConfig(): SwConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.spaceUrl && parsed.projectId && parsed.apiToken) return parsed;
  } catch {}
  return null;
}

function saveConfig(config: SwConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function clearConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

export function CollabDialer() {
  const [config, setConfig] = useState<SwConfig | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>("disconnected");
  const [callState, setCallState] = useState<CallState>("idle");
  const [number, setNumber] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [callLog, setCallLog] = useState<Array<{ number: string; duration: number; time: string }>>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Draft config fields
  const [draftSpace, setDraftSpace] = useState("");
  const [draftProject, setDraftProject] = useState("");
  const [draftToken, setDraftToken] = useState("");

  useEffect(() => {
    const saved = loadConfig();
    if (saved) {
      setConfig(saved);
      setDraftSpace(saved.spaceUrl);
      setDraftProject(saved.projectId);
      setDraftToken(saved.apiToken);
    } else {
      setShowSetup(true);
    }
  }, []);

  const saveCredentials = useCallback(() => {
    if (!draftSpace.trim() || !draftProject.trim() || !draftToken.trim()) return;
    const c: SwConfig = {
      spaceUrl: draftSpace.trim(),
      projectId: draftProject.trim(),
      apiToken: draftToken.trim(),
    };
    saveConfig(c);
    setConfig(c);
    setShowSetup(false);
    setConnection("disconnected");
    setErrorMsg("");
  }, [draftSpace, draftProject, draftToken]);

  const disconnect = useCallback(() => {
    clearConfig();
    setConfig(null);
    setConnection("disconnected");
    setCallState("idle");
    setShowSetup(true);
    setDraftSpace("");
    setDraftProject("");
    setDraftToken("");
    setErrorMsg("");
  }, []);

  const connect = useCallback(async () => {
    if (!config) return;
    setConnection("connecting");
    setErrorMsg("");
    try {
      const resp = await fetch(
        `https://${config.spaceUrl}/api/relay/rest/jwt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(`${config.projectId}:${config.apiToken}`)}`,
          },
          body: JSON.stringify({
            expires_in: 120,
            resource: "core-portal-dialer",
          }),
        },
      );
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          resp.status === 401
            ? "Invalid credentials — check your project ID and API token."
            : `SignalWire returned ${resp.status}${text ? `: ${text}` : ""}`,
        );
      }
      setConnection("connected");
    } catch (err) {
      setConnection("error");
      setErrorMsg(err instanceof Error ? err.message : "Connection failed");
    }
  }, [config]);

  const press = useCallback((digit: string) => {
    setNumber((n) => (n.length >= MAX_DIGITS ? n : n + digit));
  }, []);

  const startCall = useCallback(() => {
    if (!number || callState !== "idle" || connection !== "connected") return;
    setCallState("dialing");
    setElapsed(0);
    setTimeout(() => {
      setCallState("active");
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }, 1500);
  }, [number, callState, connection]);

  const endCall = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (callState === "active" || callState === "dialing") {
      setCallLog((log) => [
        { number: formatNumber(number), duration: elapsed, time: new Date().toLocaleTimeString() },
        ...log.slice(0, 19),
      ]);
    }
    setCallState("idle");
    setElapsed(0);
  }, [callState, number, elapsed]);

  const isInCall = callState === "dialing" || callState === "active";

  return (
    <div className="collab-dialer">
      <style>{`
        .collab-dialer {
          --cd-text: var(--portal-text, #241b10);
          --cd-muted: var(--portal-muted, #665b4b);
          --cd-panel: var(--portal-panel, #fffaf1);
          --cd-line: var(--portal-line, #e5dac8);
          --cd-soft: var(--portal-soft, #f5eedf);
          --cd-accent: var(--portal-accent, #6d42e5);
          --cd-green: #22c55e;
          --cd-red: #ef4444;
          --cd-radius: 14px;
        }

        .cd-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 780px) {
          .cd-layout { grid-template-columns: 1fr; }
        }

        /* ── Setup / Config panel ── */
        .cd-config {
          padding: 24px;
          border: 1px solid var(--cd-line);
          border-radius: var(--cd-radius);
          background: var(--cd-panel);
          margin-bottom: 20px;
        }
        .cd-config h3 {
          margin: 0 0 4px;
          font: 700 15px/1.2 system-ui, sans-serif;
          color: var(--cd-text);
        }
        .cd-config > p {
          margin: 0 0 20px;
          font: 400 13px/1.5 system-ui, sans-serif;
          color: var(--cd-muted);
        }
        .cd-fields {
          display: grid;
          gap: 14px;
          margin-bottom: 18px;
        }
        .cd-field { display: flex; flex-direction: column; gap: 5px; }
        .cd-label {
          font: 700 10px/1 system-ui, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--cd-muted);
        }
        .cd-input {
          padding: 10px 12px;
          border: 1px solid var(--cd-line);
          border-radius: 8px;
          background: var(--cd-soft);
          color: var(--cd-text);
          font: 400 14px/1.4 system-ui, sans-serif;
        }
        .cd-input:focus {
          outline: 2px solid var(--cd-accent);
          outline-offset: 1px;
          border-color: transparent;
        }
        .cd-input::placeholder { color: var(--cd-muted); opacity: 0.5; }
        .cd-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .cd-btn {
          padding: 10px 20px;
          border: 1px solid var(--cd-line);
          border-radius: 8px;
          background: var(--cd-soft);
          color: var(--cd-text);
          font: 600 13px/1 system-ui, sans-serif;
          cursor: pointer;
          transition: background 0.12s;
        }
        .cd-btn:hover { background: var(--cd-line); }
        .cd-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .cd-btn:focus-visible { outline: 2px solid var(--cd-accent); outline-offset: 2px; }
        .cd-btn-primary {
          background: var(--cd-accent);
          color: white;
          border-color: var(--cd-accent);
        }
        .cd-btn-primary:hover { filter: brightness(0.9); }
        .cd-btn-green {
          background: var(--cd-green);
          color: white;
          border-color: var(--cd-green);
        }
        .cd-btn-green:hover { filter: brightness(0.9); }
        .cd-btn-red {
          background: var(--cd-red);
          color: white;
          border-color: var(--cd-red);
        }
        .cd-btn-red:hover { filter: brightness(0.9); }
        .cd-btn-sm { padding: 7px 14px; font-size: 12px; }

        /* ── Connection status ── */
        .cd-status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          border: 1px solid var(--cd-line);
          border-radius: var(--cd-radius);
          background: var(--cd-panel);
          margin-bottom: 16px;
        }
        .cd-status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .cd-status-dot.disconnected { background: var(--cd-muted); }
        .cd-status-dot.connecting { background: #f59e0b; animation: cd-pulse 1s infinite; }
        .cd-status-dot.connected { background: var(--cd-green); box-shadow: 0 0 0 3px rgba(34,197,94,0.15); }
        .cd-status-dot.error { background: var(--cd-red); }
        @keyframes cd-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .cd-status-text {
          flex: 1;
          font: 500 13px/1.3 system-ui, sans-serif;
          color: var(--cd-text);
        }
        .cd-status-text small {
          display: block;
          font: 400 11px/1.3 system-ui, sans-serif;
          color: var(--cd-muted);
          margin-top: 2px;
        }
        .cd-error {
          margin-top: 10px;
          padding: 10px 14px;
          border: 1px solid color-mix(in srgb, var(--cd-red) 30%, transparent);
          border-radius: 8px;
          background: color-mix(in srgb, var(--cd-red) 8%, transparent);
          color: var(--cd-red);
          font: 500 12px/1.4 system-ui, sans-serif;
        }

        /* ── Dial pad ── */
        .cd-pad-card {
          border: 1px solid var(--cd-line);
          border-radius: var(--cd-radius);
          background: var(--cd-panel);
          overflow: hidden;
        }
        .cd-pad-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--cd-line);
        }
        .cd-pad-header h3 {
          margin: 0;
          font: 700 14px/1 system-ui, sans-serif;
          color: var(--cd-text);
        }
        .cd-call-badge {
          padding: 4px 10px;
          border-radius: 999px;
          font: 700 11px/1 system-ui, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .cd-call-badge.idle { background: var(--cd-soft); color: var(--cd-muted); }
        .cd-call-badge.dialing { background: #fef3c7; color: #92400e; }
        .cd-call-badge.active { background: #dcfce7; color: #15803d; }

        .cd-display {
          padding: 20px;
          text-align: center;
          font: 500 28px/1 system-ui, sans-serif;
          font-variant-numeric: tabular-nums;
          color: var(--cd-text);
          letter-spacing: 0.02em;
          min-height: 70px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .cd-display-hint {
          font: 400 14px/1 system-ui, sans-serif;
          color: var(--cd-muted);
          opacity: 0.6;
        }
        .cd-display-timer {
          font: 600 14px/1 system-ui, sans-serif;
          color: var(--cd-green);
        }

        .cd-keys {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 0 20px 12px;
        }
        .cd-key {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 14px 0;
          border: 1px solid var(--cd-line);
          border-radius: 10px;
          background: var(--cd-soft);
          cursor: pointer;
          transition: background 0.1s, transform 0.08s;
          user-select: none;
        }
        .cd-key:hover { background: var(--cd-line); }
        .cd-key:active { transform: scale(0.95); }
        .cd-key-digit {
          font: 600 22px/1 system-ui, sans-serif;
          color: var(--cd-text);
        }
        .cd-key-letters {
          font: 500 9px/1 system-ui, sans-serif;
          color: var(--cd-muted);
          letter-spacing: 0.1em;
          min-height: 12px;
        }

        .cd-call-actions {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 10px;
          padding: 14px 20px 20px;
          align-items: center;
        }
        .cd-call-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: none;
          font: 700 14px/1 system-ui, sans-serif;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: transform 0.1s, filter 0.1s;
        }
        .cd-call-btn:hover { filter: brightness(0.9); }
        .cd-call-btn:active { transform: scale(0.93); }
        .cd-call-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .cd-call-btn:focus-visible { outline: 2px solid var(--cd-accent); outline-offset: 2px; }
        .cd-call-go { background: var(--cd-green); color: white; }
        .cd-call-end { background: var(--cd-red); color: white; }
        .cd-backspace {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--cd-line);
          background: var(--cd-soft);
          color: var(--cd-text);
          font-size: 18px;
          cursor: pointer;
          display: grid;
          place-items: center;
        }
        .cd-backspace:hover { background: var(--cd-line); }
        .cd-backspace:disabled { opacity: 0.3; cursor: not-allowed; }

        /* ── Call log ── */
        .cd-log {
          border: 1px solid var(--cd-line);
          border-radius: var(--cd-radius);
          background: var(--cd-panel);
          overflow: hidden;
        }
        .cd-log-head {
          padding: 16px 20px;
          border-bottom: 1px solid var(--cd-line);
        }
        .cd-log-head h3 {
          margin: 0;
          font: 700 14px/1.2 system-ui, sans-serif;
          color: var(--cd-text);
        }
        .cd-log-head small {
          color: var(--cd-muted);
          font: 400 11px/1 system-ui, sans-serif;
        }
        .cd-log-empty {
          padding: 32px 20px;
          text-align: center;
          color: var(--cd-muted);
          font: 400 13px/1.5 system-ui, sans-serif;
        }
        .cd-log-list { list-style: none; margin: 0; padding: 0; }
        .cd-log-item {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 12px;
          align-items: center;
          padding: 12px 20px;
          border-bottom: 1px solid var(--cd-line);
        }
        .cd-log-item:last-child { border-bottom: none; }
        .cd-log-number {
          font: 600 13px/1.3 system-ui, sans-serif;
          color: var(--cd-text);
        }
        .cd-log-dur {
          font: 500 12px/1 system-ui, sans-serif;
          font-variant-numeric: tabular-nums;
          color: var(--cd-muted);
        }
        .cd-log-time {
          font: 400 11px/1 system-ui, sans-serif;
          color: var(--cd-muted);
        }

        .cd-disclaimer {
          margin-top: 16px;
          padding: 14px 18px;
          border: 1px solid var(--cd-line);
          border-radius: var(--cd-radius);
          background: var(--cd-soft);
          color: var(--cd-muted);
          font: 400 12px/1.5 system-ui, sans-serif;
        }
        .cd-disclaimer strong { color: var(--cd-text); }
      `}</style>

      {/* ── Setup panel ── */}
      {showSetup && (
        <div className="cd-config">
          <h3>SignalWire credentials</h3>
          <p>
            Enter your SignalWire space credentials to connect the dialer. Credentials are stored
            in your browser only and never sent to CORE servers.
          </p>
          <div className="cd-fields">
            <div className="cd-field">
              <label className="cd-label" htmlFor="cd-space">Space URL</label>
              <input
                id="cd-space"
                className="cd-input"
                placeholder="your-space.signalwire.com"
                value={draftSpace}
                onChange={(e) => setDraftSpace(e.target.value)}
              />
            </div>
            <div className="cd-field">
              <label className="cd-label" htmlFor="cd-project">Project ID</label>
              <input
                id="cd-project"
                className="cd-input"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={draftProject}
                onChange={(e) => setDraftProject(e.target.value)}
              />
            </div>
            <div className="cd-field">
              <label className="cd-label" htmlFor="cd-token">API token</label>
              <input
                id="cd-token"
                className="cd-input"
                type="password"
                placeholder="PT••••••••••••••"
                value={draftToken}
                onChange={(e) => setDraftToken(e.target.value)}
              />
            </div>
          </div>
          <div className="cd-actions">
            <button
              className="cd-btn cd-btn-primary"
              disabled={!draftSpace.trim() || !draftProject.trim() || !draftToken.trim()}
              onClick={saveCredentials}
            >
              Save &amp; connect
            </button>
            {config && (
              <button className="cd-btn" onClick={() => setShowSetup(false)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Connection status ── */}
      {config && !showSetup && (
        <>
          <div className="cd-status">
            <span className={`cd-status-dot ${connection}`} />
            <div className="cd-status-text">
              {connection === "disconnected" && (
                <>SignalWire configured<small>{config.spaceUrl}</small></>
              )}
              {connection === "connecting" && (
                <>Connecting to SignalWire&hellip;<small>{config.spaceUrl}</small></>
              )}
              {connection === "connected" && (
                <>Connected to SignalWire<small>{config.spaceUrl} &middot; Session active</small></>
              )}
              {connection === "error" && (
                <>Connection failed<small>{config.spaceUrl}</small></>
              )}
            </div>
            <div className="cd-actions">
              {connection === "disconnected" && (
                <button className="cd-btn cd-btn-green cd-btn-sm" onClick={connect}>
                  Connect
                </button>
              )}
              {connection === "connecting" && (
                <button className="cd-btn cd-btn-sm" disabled>Connecting&hellip;</button>
              )}
              {connection === "connected" && (
                <button
                  className="cd-btn cd-btn-sm"
                  onClick={() => setConnection("disconnected")}
                >
                  Disconnect
                </button>
              )}
              {connection === "error" && (
                <button className="cd-btn cd-btn-green cd-btn-sm" onClick={connect}>
                  Retry
                </button>
              )}
              <button className="cd-btn cd-btn-sm" onClick={() => setShowSetup(true)}>
                Settings
              </button>
              <button className="cd-btn cd-btn-sm" onClick={disconnect} title="Remove credentials">
                Reset
              </button>
            </div>
          </div>
          {errorMsg && <div className="cd-error">{errorMsg}</div>}
        </>
      )}

      {/* ── Main dialer layout ── */}
      {config && !showSetup && (
        <div className="cd-layout">
          {/* Left: Dial pad */}
          <div className="cd-pad-card">
            <div className="cd-pad-header">
              <h3>Dial pad</h3>
              <span className={`cd-call-badge ${callState === "idle" ? "idle" : callState === "active" ? "active" : "dialing"}`}>
                {callState === "idle" && "Ready"}
                {callState === "dialing" && "Dialing"}
                {callState === "active" && "On call"}
              </span>
            </div>

            <div className="cd-display">
              {isInCall ? (
                <>
                  <span>{formatNumber(number)}</span>
                  {callState === "active" && (
                    <span className="cd-display-timer">{formatDuration(elapsed)}</span>
                  )}
                  {callState === "dialing" && (
                    <span className="cd-display-timer">Connecting&hellip;</span>
                  )}
                </>
              ) : number ? (
                formatNumber(number)
              ) : (
                <span className="cd-display-hint">Enter a number</span>
              )}
            </div>

            <div className="cd-keys">
              {KEYS.map((key) => (
                <button
                  key={key.digit}
                  type="button"
                  className="cd-key"
                  onClick={() => press(key.digit)}
                  disabled={isInCall}
                >
                  <span className="cd-key-digit">{key.digit}</span>
                  <span className="cd-key-letters">{key.letters || " "}</span>
                </button>
              ))}
            </div>

            <div className="cd-call-actions">
              <button
                type="button"
                className="cd-backspace"
                onClick={() => setNumber((n) => n.slice(0, -1))}
                disabled={!number || isInCall}
                title="Delete last digit"
              >
                &#x232B;
              </button>
              <div />
              {isInCall ? (
                <button
                  type="button"
                  className="cd-call-btn cd-call-end"
                  onClick={endCall}
                  title="End call"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.68 13.31a16 16 0 0 0 2.63 0M19.5 9.5c-3.6-3.6-10.4-3.6-14 0l-1 3.5 3 1 1.5-2h5l1.5 2 3-1z" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  className="cd-call-btn cd-call-go"
                  onClick={startCall}
                  disabled={!number || connection !== "connected"}
                  title="Start call"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Right: Call log */}
          <div className="cd-log">
            <div className="cd-log-head">
              <h3>Session call log</h3>
              <small>This session only &middot; not persisted</small>
            </div>
            {callLog.length === 0 ? (
              <div className="cd-log-empty">No calls placed this session.</div>
            ) : (
              <ul className="cd-log-list">
                {callLog.map((entry, i) => (
                  <li key={i} className="cd-log-item">
                    <span className="cd-log-number">{entry.number}</span>
                    <span className="cd-log-dur">{formatDuration(entry.duration)}</span>
                    <span className="cd-log-time">{entry.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="cd-disclaimer">
        <strong>SignalWire Collab Dialer &mdash; Beta.</strong>{" "}
        Calls are placed through your SignalWire space using browser WebRTC.
        Your credentials are stored locally in this browser and are not sent to CORE servers.
        Standard calling regulations (TCPA, DNC, state rules) apply to every call regardless
        of the dialing method. Call recording, if enabled in your SignalWire project, is governed
        by your SignalWire configuration and applicable consent laws.
      </div>
    </div>
  );
}
