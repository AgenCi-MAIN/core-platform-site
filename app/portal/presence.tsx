"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { BrowserPhone } from "./calls/browser-phone";

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
type PanelOffset = { x: number; y: number };
type DragSource = "toggle" | "handle";
type DragState = PanelOffset & {
  pointerId: number;
  startX: number;
  startY: number;
  baseLeft: number;
  baseTop: number;
  width: number;
  height: number;
  source: DragSource;
  moved: boolean;
};

const DRAG_THRESHOLD = 5;
const VIEWPORT_EDGE = 12;
const JARVIS_PROMPT_EVENT = "thrive:jarvis-prompt";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

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
  const [mode, setMode] = useState<"jarvis" | "calls">("jarvis");
  const [phonePhase, setPhonePhase] = useState("loading");
  const [lines, setLines] = useState<Line[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [offset, setOffset] = useState<PanelOffset>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressToggleClickRef = useRef(false);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines, open]);

  /** Keep the floating surface reachable after opening it or resizing the viewport. */
  const containOffset = useCallback((next: PanelOffset): PanelOffset => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return next;

    const baseLeft = rect.left - next.x;
    const baseTop = rect.top - next.y;
    return {
      x: clamp(
        next.x,
        VIEWPORT_EDGE - baseLeft,
        window.innerWidth - rect.width - VIEWPORT_EDGE - baseLeft,
      ),
      y: clamp(
        next.y,
        VIEWPORT_EDGE - baseTop,
        window.innerHeight - rect.height - VIEWPORT_EDGE - baseTop,
      ),
    };
  }, []);

  useEffect(() => {
    const keepInViewport = () => {
      setOffset((current) => containOffset(current));
    };

    keepInViewport();
    window.addEventListener("resize", keepInViewport);
    return () => window.removeEventListener("resize", keepInViewport);
  }, [containOffset, open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      window.setTimeout(() => toggleRef.current?.focus(), 0);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    const openFromCommand = (event: Event) => {
      const detail = (event as CustomEvent<{ question?: string }>).detail;
      const prepared = detail?.question?.trim().slice(0, 400) ?? "";
      setOpen(true);
      setMode("jarvis");
      if (prepared) setQuestion(prepared);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    };

    window.addEventListener(JARVIS_PROMPT_EVENT, openFromCommand);
    return () => window.removeEventListener(JARVIS_PROMPT_EVENT, openFromCommand);
  }, []);

  useEffect(() => {
    const openCalls = () => {
      setMode("calls");
      setOpen(true);
    };
    window.addEventListener("thrive:phone-panel", openCalls);
    return () => window.removeEventListener("thrive:phone-panel", openCalls);
  }, []);

  function beginDrag(event: ReactPointerEvent<HTMLElement>, source: DragSource) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: offset.x,
      y: offset.y,
      baseLeft: rect.left - offset.x,
      baseTop: rect.top - offset.y,
      width: rect.width,
      height: rect.height,
      source,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function moveModeFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
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
    const nextMode = tabs[next]?.dataset.presenceMode;
    if (nextMode !== 'jarvis' && nextMode !== 'calls') return;
    setMode(nextMode);
    tabs[next].focus();
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return;
    drag.moved = true;
    event.preventDefault();

    setOffset({
      x: clamp(
        drag.x + deltaX,
        VIEWPORT_EDGE - drag.baseLeft,
        window.innerWidth - drag.width - VIEWPORT_EDGE - drag.baseLeft,
      ),
      y: clamp(
        drag.y + deltaY,
        VIEWPORT_EDGE - drag.baseTop,
        window.innerHeight - drag.height - VIEWPORT_EDGE - drag.baseTop,
      ),
    });
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.source === "toggle" && drag.moved) {
      suppressToggleClickRef.current = true;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
  }

  function nudge(event: ReactKeyboardEvent<HTMLButtonElement>) {
    const step = event.shiftKey ? 48 : 24;
    const delta =
      event.key === "ArrowLeft"
        ? { x: -step, y: 0 }
        : event.key === "ArrowRight"
          ? { x: step, y: 0 }
          : event.key === "ArrowUp"
            ? { x: 0, y: -step }
            : event.key === "ArrowDown"
              ? { x: 0, y: step }
              : null;
    if (!delta) return;

    event.preventDefault();
    setOffset((current) => containOffset({ x: current.x + delta.x, y: current.y + delta.y }));
  }

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
    <div
      ref={rootRef}
      className={`presence${dragging ? " presence-dragging" : ""}`}
      style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
    >
      <section
          className="presence-panel"
          role="dialog"
          aria-labelledby="presence-title"
          aria-describedby={mode === "jarvis" ? "presence-fine" : "browser-phone-boundary"}
          hidden={!open}
        >
          <header className="presence-head">
            <button
              type="button"
              className="presence-drag-handle"
              aria-label="Move J.A.R.V.I.S. assistant"
              aria-describedby="presence-drag-help"
              title="Drag or use arrow keys to move"
              onPointerDown={(event) => beginDrag(event, "handle")}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={nudge}
            >
              <span className="presence-grip" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
            </button>
            <PresenceFace size={26} />
            <div className="presence-head-copy">
              <strong id="presence-title">{mode === "jarvis" ? "J.A.R.V.I.S. Presence" : "IMO Calls"}</strong>
              <small>{mode === "jarvis" ? "Ask about IMO and this portal" : "Browser phone · primary tab only"}</small>
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

          <div className="presence-tabs" role="tablist" aria-label="J.A.R.V.I.S. panel modes" onKeyDown={moveModeFocus}>
            <button
              type="button"
              role="tab"
              id="presence-tab-jarvis"
              data-presence-mode="jarvis"
              aria-selected={mode === "jarvis"}
              aria-controls="presence-panel-jarvis"
              tabIndex={mode === "jarvis" ? 0 : -1}
              onClick={() => setMode("jarvis")}
            >
              J.A.R.V.I.S.
            </button>
            <button
              type="button"
              role="tab"
              id="presence-tab-calls"
              data-presence-mode="calls"
              aria-selected={mode === "calls"}
              aria-controls="presence-panel-calls"
              tabIndex={mode === "calls" ? 0 : -1}
              onClick={() => setMode("calls")}
            >
              Calls <span className={`presence-call-state presence-call-state-${phonePhase}`} aria-hidden="true" />
            </button>
          </div>

          <div className="presence-jarvis-mode" id="presence-panel-jarvis" role="tabpanel" aria-labelledby="presence-tab-jarvis" hidden={mode !== "jarvis"}>
          <div className="presence-log" ref={logRef} aria-live="polite">
            {lines.length === 0 ? (
              <p className="presence-line presence-line-presence">
                Hi {""}— I answer questions about IMO, this portal, and your
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
              ref={inputRef}
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

          <div className="presence-status" aria-label="J.A.R.V.I.S. boundaries">
            <span>Text only</span>
            <span>No microphone</span>
            <span>No external actions</span>
          </div>
          <p className="presence-fine" id="presence-fine">
            A helper, not a person — no legal, tax, or coverage advice, and no
            quotes. When configured, questions use the protected in-portal
            Presence endpoint; conversations are logged to the portal audit
            trail.
          </p>
          </div>
          <div className="presence-calls-mode" id="presence-panel-calls" role="tabpanel" aria-labelledby="presence-tab-calls" hidden={mode !== "calls"}>
            <BrowserPhone onPhase={setPhonePhase} panelActive={open && mode === "calls"} />
          </div>
          <span className="sr-only" id="presence-drag-help">
            Use the arrow keys to nudge the assistant. Hold Shift for larger steps.
          </span>
        </section>

      <button
        ref={toggleRef}
        type="button"
        className={`presence-toggle${open ? " presence-toggle-open" : ""}${["ringing", "connecting", "connected"].includes(phonePhase) ? " presence-toggle-call" : ""}`}
        onPointerDown={(event) => beginDrag(event, "toggle")}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={() => {
          if (suppressToggleClickRef.current) {
            suppressToggleClickRef.current = false;
            return;
          }
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label={open ? "Close the JARVIS and Calls panel" : "Open the JARVIS and Calls panel"}
        title="JARVIS and Calls"
      >
        <PresenceFace />
      </button>
    </div>
  );
}
