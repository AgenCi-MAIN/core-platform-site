export default function ContactSection() {
  return (
    <section id="access" aria-labelledby="access-title" className="py-16">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-command-red">
            System access
          </p>
          <h2 id="access-title" className="mt-2 text-3xl font-semibold">
            Start with a governed command surface
          </h2>
          <p className="mt-4 max-w-xl text-sm text-command-muted">
            This public page is a product statement, not a live lead form. AgenCi
            will expose an authenticated command surface only after access,
            retention, consent, and authorization controls are configured.
          </p>
          <p className="mt-6 text-xs uppercase tracking-[0.15em] text-command-muted">
            no live intake endpoint is configured
          </p>
        </div>
        <div className="card space-y-4" aria-label="AgenCi access requirements">
          <h3 className="text-lg font-semibold">Activation requirements</h3>
          <AccessState label="Identity" value="Not configured" />
          <AccessState label="Agent runtime" value="Prototype only" />
          <AccessState label="External tools" value="No live permissions" />
          <AccessState label="Data stores" value="No connected customer data" />
        </div>
      </div>
    </section>
  );
}

function AccessState({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-command-frame pb-3 text-sm last:border-0 last:pb-0">
      <span className="text-command-muted">{label}</span>
      <span className="font-medium text-command-red">{value}</span>
    </div>
  );
}
