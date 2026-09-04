function showPanel(name) {
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === name);
  });
  document.querySelectorAll(".lane").forEach((lane) => {
    lane.classList.toggle("active", lane.dataset.panel === name);
  });
}

document.addEventListener("click", (event) => {
  const lane = event.target.closest(".lane");
  if (lane) showPanel(lane.dataset.panel);
});

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function observationLabel(record) {
  const time = Date.parse(record?.observed_at);
  if (!Number.isFinite(time) || time > Date.now()) return "Observation time unavailable";
  return `${Date.now() - time > 300000 ? "stale" : "recent snapshot"} · ${new Date(time).toLocaleString()}`;
}

function applyStatus(data) {
  setText("runtime-chip", "LOCAL ONLINE");
  setText("generated-at", `Updated ${new Date(data.generated_at).toLocaleTimeString()}`);
  setText("runtime-state", data.runtime.state);
  setText("runtime-detail", data.runtime.detail);
  setText("relay-state", data.relay.state);
  setText("relay-detail", data.relay.detail);
  setText("worker-state", data.worker_d_source.state);
  setText("worker-detail", data.worker_d_source.detail);
  setText("relay-row-state", data.relay.state.toUpperCase());
  setText("relay-row-detail", data.relay.detail);
  setText("usage-state", `Usage ${data.usage.state}`);
  setText("usage-detail", data.usage.detail);
  const telemetry = data.telemetry || {};
  const inventory = telemetry.inventory;
  if (inventory && Number.isFinite(Date.parse(inventory.observed_at))) {
    const age = Date.now() - Date.parse(inventory.observed_at);
    setText("inventory-freshness", age > 300000 ? "STALE" : "SNAPSHOT");
    setText("inventory-evidence", `${inventory.file_count} files · ${inventory.total_bytes} bytes · ${inventory.anomaly_count} reported anomalies. ${inventory.label}. Observed ${new Date(inventory.observed_at).toLocaleString()}. Source: ${inventory.source}.`);
    setText("inventory-hash", `Inventory SHA-256: ${inventory.inventory_sha256}`);
  } else {
    setText("inventory-freshness", "UNAVAILABLE");
    setText("inventory-evidence", "No inventory observation available.");
    setText("inventory-hash", "");
  }
  const provenance = observationLabel(telemetry.codex);
  if (telemetry.codex) {
    setText("usage-state", `Codex: ${telemetry.codex.used_percent}% used · ${telemetry.codex.remaining_percent}% remaining`);
    setText("usage-detail", `Account-wide ${telemetry.codex.window_minutes / 1440}-day allowance. Resets ${new Date(telemetry.codex.resets_at * 1000).toLocaleString()}. ${provenance}. This is a saved reading, not a continuously connected usage feed.`);
  }
  setText("codex-row-state", telemetry.relay_client ? telemetry.relay_client.state.toUpperCase() : "UNAVAILABLE");
  setText("codex-row-detail", telemetry.relay_client ? `${telemetry.relay_client.detail} ${observationLabel(telemetry.relay_client)}` : "No authenticated relay observation available.");
  setText("usage-evidence", `Codex account usage: ${provenance}. Worker B Heavy remains a separate, unmeasured account.`);
  setText("evidence-branch", data.evidence.branch);
  setText("evidence-source", data.evidence.contract);
}

async function refreshStatus() {
  try {
    const response = await fetch("/api/status", { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    applyStatus(await response.json());
  } catch {
    setText("runtime-chip", "STATUS ERROR");
    setText("generated-at", "Local status endpoint unavailable");
    ["runtime-state", "relay-state", "worker-state", "relay-row-state", "codex-row-state", "inventory-freshness"].forEach((id) => setText(id, "UNAVAILABLE"));
    ["runtime-detail", "relay-detail", "worker-detail", "relay-row-detail", "codex-row-detail", "usage-detail", "usage-evidence", "inventory-evidence"].forEach((id) => setText(id, "Status refresh failed; previous reading cleared."));
    setText("usage-state", "Usage unavailable");
    setText("inventory-hash", "");
  }
}

async function pollStatus() {
  await refreshStatus();
  setTimeout(pollStatus, 30000);
}
pollStatus();
