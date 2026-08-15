"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The JARVIS Presence — the portal's talking pet.
 *
 * This component decides nothing and knows nothing. Every question posts to
 * /portal/presence, which re-resolves the session, asserts `pet.chat`, and
 * holds the only credential involved. Nothing here stores business data:
 * the conversation lives in component state and dies with the page.
 *
 * Answers are rendered as TEXT NODES ONLY (React-escaped, no markup path),
 * so even a fully manipulated model reply is just words in this bubble —
 * the client half of the route's isolation contract.
 */

type Line = { from: "you" | "presence"; text: string };

/**
 * The face. Designed from the owner's badge reference (the VIGIL lineage):
 * a circle with an eye in the middle — dark bezel with side ticks, blue
 * iris, bar pupil with a highlight, the crest bars above and the gold
 * chain-dots below. It blinks; BOOST and reduced-motion still the lid.
 */
function PresenceFace({ size = 40 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      {/* crest bars */}
      <g fill="#5aa9f4">
        <rect x="22" y="6" width="4" height="9" rx="2" />
        <rect x="28" y="2" width="4" height="13" rx="2" />
        <rect x="34" y="5" width="4" height="10" rx="2" />
        <rect x="40" y="8" width="4" height="7" rx="2" />
        <rect x="16" y="9" width="4" height="6" rx="2" />
      </g>
      {/* bezel */}
      <circle cx="32" cy="36" r="24" fill="#10151d" />
      <circle cx="32" cy="36" r="24" fill="none" stroke="#1f6fd6" strokeWidth="3" />
      {/* side ticks */}
      <rect x="6" y="34" width="4" height="4" rx="1" fill="#1f6fd6" />
      <rect x="54" y="34" width="4" height="4" rx="1" fill="#1f6fd6" />
      {/* the eye — this group blinks */}
      <g className="presence-eye">
        <circle cx="32" cy="36" r="17" fill="#2f9bff" />
        <rect x="29.5" y="27" width="5" height="18" rx="2.5" fill="#0c1118" />
        <circle cx="25" cy="30" r="3" fill="#cfe8ff" />
      </g>
      {/* gold chain */}
      <g fill="#e0b64e">
        <circle cx="20" cy="59" r="2" />
        <circle cx="26" cy="61" r="2.5" />
        <circle cx="32" cy="62" r="3" />
        <circle cx="38" cy="61" r="2.5" />
        <circle cx="44" cy="59" r="2" />
      </g>
    </svg>
  );
}

export function PortalPresence() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines, open]);

  async function ask() {
    const q = question.trim();
    if (!q || busy) return;
    setQuestion("");
    setLines((prev) => [...prev, { from: "you", text: q }]);
    setBusy(true);
    try {
      const res = await fetch("/portal/presence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      let parsed: { answer?: string; error?: string } = {};
      try {
        parsed = (await res.json()) as { answer?: string; error?: string };
      } catch {
        parsed = { error: "The Presence returned something unreadable." };
      }
      const text = res.ok
        ? (parsed.answer ?? "…")
        : (parsed.error ?? `Refused (${res.status}).`);
      setLines((prev) => [...prev, { from: "presence", text }]);
    } catch {
      setLines((prev) => [
        ...prev,
        { from: "presence", text: "I lost the connection — try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="presence">
      {open ? (
        <section className="presence-panel" role="dialog" aria-label="JARVIS Presence">
          <header className="presence-head">
            <PresenceFace size={26} />
            <div className="presence-head-copy">
              <strong>JARVIS Presence</strong>
              <small>Ask about THRIVE and this portal</small>
            </div>
            <button
              type="button"
              className="presence-close"
              onClick={() => setOpen(false)}
              aria-label="Close the Presence"
            >
              ×
            </button>
          </header>

          <div className="presence-log" ref={logRef}>
            {lines.length === 0 ? (
              <p className="presence-line presence-line-presence">
                Hi {""}— I answer questions about THRIVE, this portal, and your
                own setup. What do you want to know?
              </p>
            ) : (
              lines.map((line, i) => (
                <p
                  key={i}
                  className={`presence-line presence-line-${line.from}`}
                >
                  {line.text}
                </p>
              ))
            )}
            {busy ? (
              <p className="presence-line presence-line-presence presence-thinking">
                thinking…
              </p>
            ) : null}
          </div>

          <form
            className="presence-ask"
            onSubmit={(event) => {
              event.preventDefault();
              void ask();
            }}
          >
            <input
              type="text"
              value={question}
              maxLength={400}
              placeholder="Ask the Presence…"
              aria-label="Your question"
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button type="submit" disabled={busy || !question.trim()}>
              Ask
            </button>
          </form>

          <p className="presence-fine">
            Powered by Claude. A helper, not a person — no legal, tax, or
            coverage advice, and no quotes. Conversations are logged to the
            portal audit trail.
          </p>
        </section>
      ) : null}

      <button
        type="button"
        className="presence-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close the JARVIS Presence" : "Open the JARVIS Presence"}
        title="JARVIS Presence"
      >
        <PresenceFace />
      </button>
    </div>
  );
}
