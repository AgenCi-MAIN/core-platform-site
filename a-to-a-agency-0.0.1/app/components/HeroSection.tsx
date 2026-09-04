import Link from "next/link";

const highlights = [
  "AI agents work through explicitly bounded workflows",
  "Every outcome keeps an evidence and approval trail",
  "No human impersonation and no invented live-data claims",
];

export default function HeroSection() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative overflow-hidden border-b border-command-frame bg-gradient-to-b from-black via-command-ink to-command-panel/80"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1.25fr_1fr] md:py-28">
        <div>
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-command-red">
            AI-NATIVE COMMAND SYSTEM
          </p>
          <h1
            id="hero-title"
            className="text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl"
          >
            AgenCi
          </h1>
          <p className="mt-6 max-w-xl text-lg text-command-muted">
            A governed AI operating layer for signal intake, analysis, routing,
            and execution. Built to turn direction into traceable work—not to
            imitate a traditional human agency.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="#contact"
              className="focus-ring rounded-lg bg-command-red px-6 py-3 text-sm font-semibold text-white shadow-panel transition hover:brightness-110"
            >
              Explore command state
            </Link>
            <Link
              href="#dashboard"
              className="focus-ring rounded-lg border border-command-frame bg-transparent px-6 py-3 text-sm font-semibold text-command-text hover:border-command-red"
            >
              See the agent loop
            </Link>
          </div>
          <ul className="mt-10 grid gap-2 text-sm text-command-muted md:max-w-md">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1 inline-flex h-2 w-2 rounded-full bg-command-red"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card border-command-red/40">
          <h2 className="text-lg font-semibold text-white">AgenCi Readout</h2>
          <p className="mt-2 text-sm text-command-muted">
            Current operating posture. Runtime figures are intentionally withheld
            until verified sources are connected.
          </p>
          <dl className="mt-6 space-y-4 text-sm">
            <MetricRow label="Agent runtime" value="Prototype" />
            <MetricRow label="Signal sources" value="Not connected" />
            <MetricRow label="External actions" value="Approval-gated" />
            <MetricRow label="Operating record" value="Evidence-first" />
          </dl>
          <p className="mt-6 border-t border-command-frame pt-4 text-xs uppercase tracking-[0.15em] text-command-muted">
            no fabricated live metrics
          </p>
        </div>
      </div>
    </section>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-command-frame bg-command-panel/60 px-4 py-3">
      <dt className="text-command-muted">{label}</dt>
      <dd className="text-2xl font-semibold text-command-red">{value}</dd>
    </div>
  );
}
