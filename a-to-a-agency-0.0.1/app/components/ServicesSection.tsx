const services = [
  {
    title: "Signal Intake Agents",
    details:
      "Normalize incoming signals into structured, source-aware tasks. Untrusted content stays data, never an instruction.",
  },
  {
    title: "Reasoning and Research",
    details:
      "Build evidence-backed briefs, models, and options from approved sources while making uncertainty visible.",
  },
  {
    title: "Routing Control",
    details:
      "Send bounded work to the right specialist, tool, or queue with explicit permission and clear ownership.",
  },
  {
    title: "Continuous Improvement",
    details:
      "Turn verified outcomes into better prompts, playbooks, quality checks, and future operating decisions.",
  },
];

export default function ServicesSection() {
  return (
    <section id="services" aria-labelledby="services-title" className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-command-red">
            AgenCi capabilities
          </p>
          <h2 id="services-title" className="mt-2 text-3xl font-semibold">
            A command system built around AI work, not a human-agency front desk
          </h2>
          <p className="mt-4 text-command-muted">
            Each capability is a governed module with a defined input, an evidence
            trail, and an explicit boundary for what it may do.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {services.map((service) => (
            <article key={service.title} className="card">
              <h3 className="text-lg font-semibold">{service.title}</h3>
              <p className="mt-3 text-sm text-command-muted">{service.details}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
