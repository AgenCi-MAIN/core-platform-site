"use client";

import { useState } from "react";

type Availability = "available" | "offline";

export function InboundAvailabilityControl({
  initialStatus,
  updatedLabel,
}: {
  initialStatus: Availability;
  updatedLabel: string;
}) {
  const [status, setStatus] = useState<Availability>(initialStatus);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle() {
    const next = status !== "available";
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/portal/inbound/availability", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ available: next }),
      });
      const payload = (await response.json()) as { error?: string; status?: Availability };
      if (!response.ok || !payload.status) {
        throw new Error(payload.error || "Could not save availability.");
      }
      setStatus(payload.status);
      setMessage(
        payload.status === "available"
          ? "Saved. You are marked ready in CORE; the carrier's rotation is unchanged."
          : "Saved. You are marked offline in CORE; the carrier's rotation is unchanged.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save availability.");
    } finally {
      setBusy(false);
    }
  }

  const available = status === "available";

  return (
    <section className={`inbound-availability-card ${available ? "is-available" : "is-offline"}`}>
      <div className="inbound-availability-copy">
        <div className="inbound-availability-kicker">
          <span className="inbound-live-dot" aria-hidden="true" />
          Agent availability
        </div>
        <strong>{available ? "Ready for inbound" : "Offline"}</strong>
        <p>
          Recorded in CORE as your stated readiness and read back here. It is not sent to SignalWire — the carrier picks who rings from its own console — so this does not put you in or out of the rotation.
        </p>
        <small>{updatedLabel}</small>
      </div>
      <div className="inbound-availability-actions">
        <button type="button" onClick={toggle} disabled={busy}>
          {busy ? "Saving…" : available ? "Go offline" : "Go available"}
        </button>
        <span className="inbound-routing-caveat">Not sent to the carrier</span>
      </div>
      {message ? <p className="inbound-save-message" role="status">{message}</p> : null}
    </section>
  );
}
