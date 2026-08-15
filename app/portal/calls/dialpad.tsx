"use client";

import { useState } from "react";

/**
 * Dial pad — ready before the dialer is.
 *
 * There is no approved external dialer yet (NumberBarn holds the business
 * line but is not the official dialer). This pad therefore places calls
 * through the device's own phone app via a `tel:` link — the one calling
 * path that needs no credentials, no vendor contract, and no consent
 * machinery, because the phone OS owns the call. When an approved dialer is
 * connected, the Call button is the single seam to rewire.
 *
 * Nothing here stores, logs, or transmits the number anywhere: state lives
 * in this component and dies with the page. Do not add persistence casually
 * — a dialed-numbers log is consumer data and belongs behind the same
 * governance as the transfer inbox, not in localStorage.
 */

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
  // No "+" sublabel: there is no long-press path to enter one, and a label
  // that advertises an input the pad cannot take is a lie in eight pixels.
  { digit: "0", letters: "" },
  { digit: "#", letters: "" },
];

const MAX_DIGITS = 18;

/** Pretty-print NANP-shaped numbers; leave everything else as typed. */
function formatNumber(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (raw.includes("*") || raw.includes("#")) return raw;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d.startsWith("1"))
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return raw;
}

export function DialPad() {
  const [number, setNumber] = useState("");

  const press = (digit: string) => {
    setNumber((n) => (n.length >= MAX_DIGITS ? n : n + digit));
  };

  return (
    <div className="dialpad">
      <output className="dialpad-display" aria-label="Number to dial">
        {number ? formatNumber(number) : <span className="dialpad-hint">Enter a number</span>}
      </output>

      <div className="dialpad-keys" role="group" aria-label="Dial pad keys">
        {KEYS.map((key) => (
          <button
            key={key.digit}
            type="button"
            className="dialpad-key"
            onClick={() => press(key.digit)}
          >
            <span className="dialpad-digit">{key.digit}</span>
            <span className="dialpad-letters" aria-hidden="true">
              {key.letters || " "}
            </span>
          </button>
        ))}
      </div>

      <div className="dialpad-actions">
        {/* Single-click deletes one digit, nothing more: a double-click
            clear-all here turned fast repeated deletes into wiping the
            whole number, which is a trap, not a shortcut. */}
        <button
          type="button"
          className="dialpad-clear"
          onClick={() => setNumber((n) => n.slice(0, -1))}
          disabled={number.length === 0}
          aria-label="Delete last digit"
          title="Delete last digit"
        >
          ⌫
        </button>
        {/* A tel: link hands the number to the device's phone app. It is a
            plain <a> on purpose: there is nothing to prefetch and nothing
            for the portal to intercept. "#" must travel percent-encoded —
            a raw "#" is a URL fragment delimiter even in tel:, and it
            silently truncated service codes at the pound key. */}
        <a
          className={`dialpad-call${number ? "" : " is-idle"}`}
          href={number ? `tel:${number.replace(/[^\d*#]/g, "").replace(/#/g, "%23")}` : undefined}
          aria-disabled={number ? undefined : true}
        >
          Call
        </a>
      </div>

      <p className="portal-fine dialpad-fine">
        Calls are placed through your device&apos;s own phone app for now — no
        approved dialer is connected yet, so the portal records nothing and
        nothing reaches the transfer inbox (your phone still keeps its own
        call history). Company calling policies — do-not-call, consent, and
        state calling rules — still apply to every call, no matter which app
        places it. The business line lives at{" "}
        <a href="https://www.numberbarn.com" target="_blank" rel="noopener noreferrer">
          NumberBarn
        </a>{" "}
        (external, not the official dialer; sign in there separately).
      </p>
    </div>
  );
}
