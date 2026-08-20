"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { PERSONAS, type PersonaId } from "@/shared/personas";

type AgentStatus = {
  personaId: PersonaId;
  status: "ready" | "working" | "degraded";
  messageCount: number;
  lastActiveAt: string | null;
  lastProbeAt: string | null;
  lastLatencyMs: number | null;
  lastError: string | null;
  memoryVersion: string;
  memoryUpdatedAt: string | null;
};

export type FleetPayload = {
  service: string;
  checkedAt: string;
  agents: AgentStatus[];
};

type TranscriptLine = { role: "user" | "agent"; text: string };

export function FleetConsole({
  initialFleet,
  initialError,
}: {
  initialFleet: FleetPayload | null;
  initialError: string | null;
}) {
  const [selectedId, setSelectedId] = useState<PersonaId>("vestal");
  const [fleet, setFleet] = useState<FleetPayload | null>(initialFleet);
  const [fleetError, setFleetError] = useState<string | null>(initialError);
  const [message, setMessage] = useState("");
  const [sendingId, setSendingId] = useState<PersonaId | null>(null);
  const [transcripts, setTranscripts] = useState<Partial<Record<PersonaId, TranscriptLine[]>>>({});

  const selected = PERSONAS.find((persona) => persona.id === selectedId) ?? PERSONAS[0];
  const selectedStatus = fleet?.agents.find((agent) => agent.personaId === selectedId);
  const transcript = transcripts[selectedId] ?? [];

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/fleet", { cache: "no-store" });
      const payload = (await response.json()) as FleetPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Fleet status failed.");
      setFleet(payload);
      setFleetError(null);
    } catch (error) {
      setFleetError(error instanceof Error ? error.message : "Fleet status failed.");
    }
  }, []);

  const readyCount = useMemo(
    () => fleet?.agents.filter((agent) => agent.status === "ready").length ?? 0,
    [fleet],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage || sendingId) return;

    const targetId = selectedId;

    setSendingId(targetId);
    setMessage("");
    setTranscripts((current) => ({
      ...current,
      [targetId]: [...(current[targetId] ?? []), { role: "user", text: cleanMessage }],
    }));

    try {
      const response = await fetch(`/api/agents/${targetId}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: cleanMessage }),
      });
      const payload = (await response.json()) as { answer?: string; error?: string };
      const answer = response.ok && payload.answer ? payload.answer : payload.error ?? "No answer returned.";
      setTranscripts((current) => ({
        ...current,
        [targetId]: [...(current[targetId] ?? []), { role: "agent", text: answer }],
      }));
      await refresh();
    } finally {
      setSendingId(null);
    }
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">CORE / J.A.R.V.I.S. · PRIVATE CONTROL SURFACE</p>
          <h1>The Operations Deck</h1>
          <p className="lede">
            Ten durable Cloudflare agent instances. Ten matching Inkbox identities. One Vercel console.
          </p>
        </div>
        <div className="health-summary" aria-live="polite">
          <strong>{readyCount}/{PERSONAS.length}</strong>
          <span>agents ready</span>
          <button type="button" onClick={() => void refresh()}>Refresh health</button>
        </div>
      </header>

      <aside className="boundary">
        <strong>Bounded by design.</strong> These personalities can analyze and draft. They have no external tools and
        cannot send, deploy, spend, change accounts, or make regulated decisions. Do not enter customer data, policy
        records, recordings, credentials, or private keys.
      </aside>

      {fleetError ? <p className="error-banner">{fleetError}</p> : null}

      <section className="deck" aria-label="Agent personalities">
        {PERSONAS.map((persona) => {
          const status = fleet?.agents.find((agent) => agent.personaId === persona.id);
          const active = persona.id === selectedId;
          return (
            <button
              key={persona.id}
              type="button"
              className={`agent-card${active ? " selected" : ""}`}
              style={{ "--accent": persona.accent } as React.CSSProperties}
              onClick={() => setSelectedId(persona.id)}
              aria-pressed={active}
            >
              <span className="monogram">{persona.monogram}</span>
              <span className="agent-copy">
                <span className="agent-number">{persona.number} · {persona.commandSeat}</span>
                <strong>{persona.name}</strong>
                <span>{persona.role}</span>
                <small>@{persona.inkboxHandle} · {sendingId === persona.id ? "working" : status?.status ?? "checking"}</small>
              </span>
            </button>
          );
        })}
      </section>

      <section className="console-grid">
        <article className="profile" style={{ "--accent": selected.accent } as React.CSSProperties}>
          <p className="eyebrow">PERSONALITY {selected.number}</p>
          <h2>{selected.name}</h2>
          <p className="role">{selected.role}</p>
          <blockquote>{selected.title}</blockquote>
          <dl>
            <div><dt>Command seat</dt><dd>{selected.commandSeat}</dd></div>
            <div><dt>Inkbox</dt><dd>@{selected.inkboxHandle}</dd></div>
            <div><dt>Cloudflare</dt><dd>{selectedStatus?.status ?? "checking"}</dd></div>
            <div><dt>Durable turns</dt><dd>{selectedStatus?.messageCount ?? 0}</dd></div>
            <div><dt>Memory</dt><dd>{selectedStatus?.memoryVersion ?? "checking"}</dd></div>
            <div><dt>Last latency</dt><dd>{selectedStatus?.lastLatencyMs ? `${selectedStatus.lastLatencyMs} ms` : "—"}</dd></div>
          </dl>
          <p>{selected.mandate}</p>
          <small>Identity mapping is configured in Inkbox. Channel actions remain governed inside Inkbox.</small>
        </article>

        <article className="chat-panel">
          <div className="chat-heading">
            <div><p className="eyebrow">DURABLE THREAD</p><h2>Ask {selected.name}</h2></div>
            <span>{sendingId === selectedId ? "working" : selectedStatus?.status ?? "checking"}</span>
          </div>
          <div className="transcript" aria-live="polite">
            {transcript.length === 0 ? (
              <p className="empty">Start with an internal, non-sensitive question. The reply is decision support, not an external action.</p>
            ) : transcript.map((line, index) => (
              <div key={`${line.role}-${index}`} className={`bubble ${line.role}`}>
                <strong>{line.role === "user" ? "You" : selected.name}</strong>
                <p>{line.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={submit}>
            <label htmlFor="message">Internal prompt</label>
            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={4000}
              rows={4}
              placeholder={`Ask ${selected.name} for analysis or a draft…`}
            />
            <div className="form-row">
              <span>{message.length}/4000 · no customer or credential data</span>
              <button type="submit" disabled={sendingId !== null || !message.trim()}>{sendingId === selectedId ? "Working…" : "Send to agent"}</button>
            </div>
          </form>
        </article>
      </section>
    </main>
  );
}
