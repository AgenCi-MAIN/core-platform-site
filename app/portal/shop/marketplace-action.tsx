"use client";

import { useMemo, useState } from "react";

export function MarketplaceAction({
  productId,
  unitPrice,
  quantityEnabled = false,
}: {
  productId: "transfer-calls" | "recruiting-ads" | "gohighlevel" | "ai-capacity";
  unitPrice: number | null;
  quantityEnabled?: boolean;
}) {
  const [quantity, setQuantity] = useState(quantityEnabled ? 10 : 1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const estimate = useMemo(
    () => (unitPrice === null ? null : unitPrice * Math.max(1, quantity)),
    [unitPrice, quantity],
  );

  async function requestOrder() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/portal/shop/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(payload.error || "Could not record the request.");
      setMessage(payload.message || "Request recorded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not record the request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="marketplace-action">
      {quantityEnabled ? (
        <label className="marketplace-quantity">
          <span>Quantity</span>
          <input
            type="number"
            min={1}
            max={500}
            step={1}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Math.min(500, Number(event.target.value) || 1)))}
          />
        </label>
      ) : null}
      <button type="button" onClick={requestOrder} disabled={busy}>
        {busy ? "Recording…" : "Request order"}
      </button>
      <small className="marketplace-estimate">
        {estimate === null ? "Pricing requires IMO approval" : `Estimated order · $${estimate.toFixed(2)}`}
      </small>
      {message ? <p className="marketplace-message" role="status">{message}</p> : null}
    </div>
  );
}
