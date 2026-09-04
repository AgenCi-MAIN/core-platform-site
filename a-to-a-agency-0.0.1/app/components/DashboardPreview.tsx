const rows = [
  { metric: "Agent runtime", state: "Prototype / local model" },
  { metric: "Knowledge sources", state: "Not connected" },
  { metric: "External execution", state: "Approval-gated" },
  { metric: "Audit posture", state: "Evidence-first" },
];

export default function DashboardPreview() {
  return (
    <section
      id="dashboard"
      aria-labelledby="dashboard-title"
      className="py-16"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="card">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-command-red">
                Dashboard Preview
              </p>
              <h2 id="dashboard-title" className="mt-2 text-3xl font-semibold">
                Command state
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-command-muted">
                AgenCi shows operational truth before activity volume. Connect a
                verified runtime later; do not substitute placeholder counts for
                real evidence.
              </p>
            </div>
            <p className="text-xs uppercase tracking-[0.15em] text-command-muted">
              live runtime not connected
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-command-frame">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                AgenCi command state
              </caption>
              <thead className="bg-command-ink/70 text-command-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Metric
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Current state
                  </th>
                  <th scope="col" className="px-4 py-3">
                    What this means
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.metric}
                    className="border-t border-command-frame text-white"
                  >
                    <th scope="row" className="px-4 py-3 font-medium">
                      {row.metric}
                    </th>
                    <td className="px-4 py-3 text-command-red">{row.state}</td>
                    <td className="px-4 py-3 text-command-muted">
                      {row.metric === "External execution"
                        ? "No action without authorized scope"
                        : "Connect a verified source before reporting activity"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <SystemCard label="Memory" value="Project instructions and verified artifacts" />
            <SystemCard label="Control" value="Permissions, policy gates, and human escalation where required" />
          </div>
        </div>
      </div>
    </section>
  );
}

function SystemCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-command-frame bg-command-ink/60 p-4">
      <p className="text-sm font-semibold text-command-text">{label}</p>
      <p className="mt-2 text-sm text-command-muted">{value}</p>
    </div>
  );
}
