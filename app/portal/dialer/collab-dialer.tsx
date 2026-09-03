"use client";

import { useState, type FormEvent } from "react";
import { TELEPHONY_CONFIG } from "../telephony-config";
import { SCRIPT_VAULT_SOURCE_URL } from "../scripts/source";

const STYLES = `
.dialer-console{display:grid;gap:16px}.dialer-map{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.dialer-card{border:1px solid var(--portal-line);border-radius:16px;padding:18px;background:var(--portal-panel)}.dialer-card span{display:block;color:var(--portal-muted);font-size:.68rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.dialer-card strong{display:block;margin-top:9px;color:var(--portal-text);font-size:clamp(1.05rem,2vw,1.45rem);letter-spacing:-.025em}.dialer-card small{display:block;margin-top:6px;color:var(--portal-muted);line-height:1.45}.dialer-live{border-color:color-mix(in srgb,var(--portal-accent) 45%,var(--portal-line));background:color-mix(in srgb,var(--portal-accent) 7%,var(--portal-panel))}.dialer-actions{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.3fr);gap:14px}.dialer-panel{border:1px solid var(--portal-line);border-radius:18px;padding:20px;background:var(--portal-panel)}.dialer-panel h2{margin:0;color:var(--portal-text);font-size:1.05rem}.dialer-panel p{margin:8px 0 0;color:var(--portal-muted);line-height:1.55}.dialer-label{display:grid;gap:7px;margin-top:16px;color:var(--portal-text);font-size:.78rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.dialer-input{width:100%;min-height:48px;border:1px solid var(--portal-line);border-radius:12px;padding:0 14px;background:var(--portal-bg);color:var(--portal-text);font:inherit}.dialer-input:focus{outline:2px solid color-mix(in srgb,var(--portal-accent) 55%,transparent);outline-offset:2px}.dialer-button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;margin-top:14px;border:1px solid var(--portal-accent);border-radius:12px;padding:0 17px;background:var(--portal-accent);color:white;font:inherit;font-weight:900;cursor:pointer}.dialer-button.secondary{border-color:var(--portal-line);background:var(--portal-soft);color:var(--portal-text)}.dialer-button:disabled{cursor:not-allowed;opacity:.55}.dialer-result{margin-top:14px;border-radius:12px;padding:13px 14px;font-size:.86rem;line-height:1.5}.dialer-result.ok{border:1px solid color-mix(in srgb,#35d07f 45%,var(--portal-line));background:color-mix(in srgb,#35d07f 9%,var(--portal-panel));color:var(--portal-text)}.dialer-result.error{border:1px solid color-mix(in srgb,var(--portal-danger) 45%,var(--portal-line));background:color-mix(in srgb,var(--portal-danger) 8%,var(--portal-panel));color:var(--portal-text)}.dialer-rules{display:grid;gap:7px;margin:15px 0 0;padding:0;list-style:none}.dialer-rules li{display:grid;grid-template-columns:20px 1fr;gap:8px;color:var(--portal-muted);font-size:.82rem;line-height:1.45}.dialer-rules b{color:var(--portal-accent)}@media(max-width:820px){.dialer-map,.dialer-actions{grid-template-columns:1fr}}`;

type Result = { tone: "ok" | "error"; message: string } | null;

export function CollabDialer() {
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState<"test" | "customer" | null>(null);
  const [result, setResult] = useState<Result>(null);

  async function send(body: Record<string, string>, kind: "test" | "customer") {
    setBusy(kind);
    setResult(null);
    try {
      const response = await fetch("/portal/dialer/originate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      if (!response.ok) {
        setResult({ tone: "error", message: payload?.error ?? "The call was not started." });
        return;
      }
      setResult({ tone: "ok", message: payload?.message ?? "SignalWire accepted the call." });
    } catch {
      setResult({ tone: "error", message: "The portal could not reach its dialer service." });
    } finally {
      setBusy(null);
    }
  }

  async function placeCustomerCall(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await send({ mode: "customer", destination }, "customer");
  }

  return (
    <section className="dialer-console" aria-labelledby="dialer-title">
      <style>{STYLES}</style>

      <div className="dialer-map" aria-label="SignalWire number roles">
        <article className="dialer-card dialer-live">
          <span>CORE website line</span>
          <strong>{TELEPHONY_CONFIG.platformLine.display}</strong>
          <small>Shown to your mobile and to the customer on portal-originated calls.</small>
        </article>
        <article className="dialer-card">
          <span>Public inbound line</span>
          <strong>{TELEPHONY_CONFIG.mainNumber.display}</strong>
          <small>Customers call this number to enter the the IMO inbound queue.</small>
        </article>
        <article className="dialer-card">
          <span>Inbound bridge line</span>
          <strong>{TELEPHONY_CONFIG.bridgeLine.display}</strong>
          <small>Used by the inbound queue when it rings your private mobile.</small>
        </article>
      </div>

      <div className="dialer-actions">
        <article className="dialer-panel">
          <h2 id="dialer-title">Test the platform line</h2>
          <p>
            SignalWire will call the approved private-mobile fallback from {TELEPHONY_CONFIG.platformLine.display}. Answer and press 1; no customer is called. The private number is intentionally not shown in portal HTML.
          </p>
          <button
            className="dialer-button secondary"
            type="button"
            disabled={busy !== null}
            onClick={() => send({ mode: "agent_test" }, "test")}
          >
            {busy === "test" ? "Starting test…" : "Call my private mobile"}
          </button>
        </article>

        <form className="dialer-panel" onSubmit={placeCustomerCall}>
          <h2>Call a customer</h2>
          <p>
            CORE rings your private mobile first. After you answer and press 1, SignalWire rings the customer from {TELEPHONY_CONFIG.platformLine.display}.
          </p>
          <label className="dialer-label">
            Customer number
            <input
              className="dialer-input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+1 205 555 0123"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              required
              aria-describedby="dialer-number-help"
            />
          </label>
          <small id="dialer-number-help">Include country code. CORE never stores the full customer number in its audit trail.</small>
          <button className="dialer-button" type="submit" disabled={busy !== null}>
            {busy === "customer" ? "Starting call…" : "Ring me, then customer"}
          </button>
        </form>
      </div>

      {result ? (
        <div className={`dialer-result ${result.tone}`} role="status" aria-live="polite">
          {result.message}
        </div>
      ) : null}

      {/* TEMPORARY HYBRID BRIDGE (Dispatch work order 1B). A plain anchor to
          the canonical script document, opened in a new tab. It rides inside
          the founder-gated outbound panel, so only an already-authorized
          session ever receives it. It is not a button, has no handler, calls
          no endpoint, and touches no microphone, call, dial, or recording;
          CORE stores no Google credential, token, cookie, or document content
          through it. The Script Vault is the structured in-product copy; this
          link is the reference bridge until it retires. */}
      <article className="dialer-panel dialer-script-bridge">
        <h2>Script library · temporary hybrid</h2>
        <p>
          Opens the canonical script document in a new tab as an external reference while the
          in-product Script Vault is under review. Temporary; external; stores nothing here.
        </p>
        <a
          className="dialer-button secondary dialer-script-bridge-link"
          href={SCRIPT_VAULT_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Script Library (Temporary Hybrid) ↗
        </a>
      </article>

      <ul className="dialer-rules" aria-label="Dialer controls">
        <li><b>✓</b><span>Founder-only server action; browser code never receives a Project ID or API token.</span></li>
        <li><b>✓</b><span>One accepted request per 30 seconds; no recording, transcription, voicemail, or AI agent.</span></li>
          <li><b>✓</b><span>Dedicated Voice-only credential stays server-side. The existing active, over-scoped Shawn token is not reused.</span></li>
      </ul>
    </section>
  );
}
