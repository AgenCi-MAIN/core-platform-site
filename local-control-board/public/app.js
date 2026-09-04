const THIS_AGENT = "bc-ba101046-1271-4c57-93d4-ca62046a34f6";

function show(name) {
  document.querySelectorAll(".panel").forEach((el) => {
    el.classList.toggle("active", el.dataset.panel === name);
  });
  document.querySelectorAll(".lane").forEach((el) => {
    el.classList.toggle("active", el.dataset.panel === name);
  });
}

async function loadAssignments() {
  const res = await fetch("/api/assignments", { cache: "no-store" });
  const data = await res.json();
  const list = document.getElementById("jobs");
  list.innerHTML = "";
  for (const item of data.items || []) {
    const mine = item.assignee_id === THIS_AGENT;
    const el = document.createElement("article");
    el.className = "job";
    el.innerHTML = `
      <div class="status">${item.status} · ${mine ? "this agent" : item.assignee_name}</div>
      <h3></h3>
      <p></p>
      <div class="actions">
        <button data-id="${item.id}" data-status="working">Working</button>
        <button data-id="${item.id}" data-status="done">Done</button>
        <button data-id="${item.id}" data-status="held">Held</button>
      </div>
    `;
    el.querySelector("h3").textContent = item.title;
    el.querySelector("p").textContent = item.detail || "";
    list.appendChild(el);
  }
}

async function patchStatus(id, status) {
  await fetch("/api/assignments/" + id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  await loadAssignments();
}

document.addEventListener("click", (event) => {
  const lane = event.target.closest(".lane");
  if (lane) show(lane.dataset.panel);
  const btn = event.target.closest(".actions button");
  if (btn) patchStatus(btn.dataset.id, btn.dataset.status);
});

document.getElementById("assign-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = document.getElementById("title").value.trim();
  const detail = document.getElementById("detail").value.trim();
  const res = await fetch("/api/assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, detail }),
  });
  if (!res.ok) {
    document.getElementById("assign-msg").textContent = "Could not assign.";
    return;
  }
  document.getElementById("title").value = "";
  document.getElementById("detail").value = "";
  document.getElementById("assign-msg").textContent = "Assigned to this agent.";
  await loadAssignments();
});

loadAssignments();
