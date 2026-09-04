const phases = [
  "A signal enters with source, context, and permission state",
  "AgenCi classifies the request and builds an evidence-backed work plan",
  "The system applies scope, policy, and approval gates before external action",
  "Verified outcomes improve the next routing, model, and operating decision",
];

export default function ProcessSection() {
  return (
    <section id="process" aria-labelledby="process-title" className="py-16">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-command-red">
            Agent loop
          </p>
          <h2 id="process-title" className="mt-2 text-3xl font-semibold">
            An AI-native loop with governed execution
          </h2>
          <p className="mt-4 text-sm text-command-muted">
            AgenCi can automate the work inside approved boundaries. It does not
            hide uncertain decisions, impersonate people, or claim authority it
            has not been granted.
          </p>
        </div>
        <ol className="space-y-4" aria-label="Process steps">
          {phases.map((step, index) => (
            <li
              key={step}
              className="card flex items-center gap-4"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-command-red text-sm font-semibold text-white"
              >
                {index + 1}
              </span>
              <p className="text-command-text">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
