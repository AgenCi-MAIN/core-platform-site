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
  setText("evidence-branch", data.evidence.branch);
  setText("evidence-source", data.evidence.contract);
}

async function refreshStatus() {
  try {
    const response = await fetch("/api/status", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    applyStatus(await response.json());
  } catch {
    setText("runtime-chip", "STATUS ERROR");
    setText("generated-at", "Local status endpoint unavailable");
  }
}

refreshStatus();
setInterval(refreshStatus, 30000);
