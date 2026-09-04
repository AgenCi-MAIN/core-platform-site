import Link from "next/link";
import { PortalShell } from "../components";
import { requireFounder } from "../access";

export const dynamic = "force-dynamic";

async function probeWorkerDashboard(): Promise<{ state: "online" | "offline"; detail: string }> {
  try {
    const response = await fetch("http://127.0.0.1:5000/", {
      cache: "no-store",
      signal: AbortSignal.timeout(900),
    });
    return response.ok
      ? { state: "online", detail: "Live localhost probe" }
      : { state: "offline", detail: `Responded ${response.status}` };
  } catch {
    return { state: "offline", detail: "No localhost response" };
  }
}

const workers = [
  ["Codex / Vera", "Coordinator and final inspection", "active"],
  ["Worker Zero", "Primary cloud heavy-lift lane", "configured"],
  ["Worker A", "Dispatch, order, and verdict", "bounded"],
  ["Worker B", "Implementation and test evidence", "bounded"],
  ["Worker C", "Independent read-only review", "bounded"],
  ["Worker D / Bionic", "Local tools and approved heavy runs", "active"],
] as const;

const connections = [
  ["CORE relay", "Canonical gateway", "OAuth and tool contract verified earlier in this workflow"],
  ["Codex", "Six tools", "Last verified after Codex restart"],
  ["Cursor Cloud", "Connected", "Last verified through GitHub OAuth"],
  ["Bionic", "Connected", "Last verified through the protected local connector"],
] as const;

export default async function PersonalControlPage() {
  const session = await requireFounder("/portal/personal-control", "personal-control.view");
  const workerDashboard = await probeWorkerDashboard();

  return (
    <PortalShell session={session} current="/portal/personal-control" section="Personal Control">
      <main className="portal-main personal-control" id="personal-control-top">
        <header className="personal-hero">
          <div>
            <p className="personal-kicker">Private localhost control plane</p>
            <h1>One desk. Five lanes. No invented telemetry.</h1>
            <p>A personal view of worker routing, MCP connectivity, usage evidence, verification, and protected release gates. Live probes and recorded evidence are labeled separately.</p>
          </div>
          <div className="personal-hero-actions">
            <a href="http://localhost:5000/" target="_blank" rel="noreferrer">Open Worker D</a>
            <Link href="/portal/command">Open Command Center</Link>
          </div>
        </header>

        <section className="personal-summary" aria-label="Current control summary">
          <article><span>Active goal</span><strong>Local dashboard consolidation</strong><small>Isolated branch</small></article>
          <article><span>Validation</span><strong>162 tests passed</strong><small>TypeScript clean</small></article>
          <article><span>Worker D</span><strong className={`personal-${workerDashboard.state}`}>{workerDashboard.state}</strong><small>{workerDashboard.detail}</small></article>
          <article><span>Release gate</span><strong>Protected review</strong><small>Merge and deploy not authorized</small></article>
        </section>

        <div className="personal-grid">
          <section className="personal-lane personal-lane-command">
            <div className="personal-lane-head"><span>01</span><div><p>Command</p><h2>Codex coordination</h2></div></div>
            <div className="personal-feature"><strong>Current objective</strong><p>Combine both worker-control views into one private, truthful localhost dashboard.</p></div>
            <div className="personal-flow" aria-label="Worker workflow"><span>Owner goal</span><i /><span>Dispatch</span><i /><span>Heavy lift</span><i /><span>Review</span><i /><span>Gate</span></div>
          </section>

          <section className="personal-lane personal-lane-workers">
            <div className="personal-lane-head"><span>02</span><div><p>Workers</p><h2>Six named seats</h2></div></div>
            <div className="personal-worker-grid">
              {workers.map(([name, role, state]) => <article key={name}><div><strong>{name}</strong><em className={`personal-state-${state}`}>{state}</em></div><p>{role}</p></article>)}
            </div>
          </section>

          <section className="personal-lane personal-lane-connections">
            <div className="personal-lane-head"><span>03</span><div><p>Connections</p><h2>One canonical MCP</h2></div></div>
            <div className="personal-table">
              {connections.map(([name, value, evidence]) => <article key={name}><strong>{name}</strong><span>{value}</span><small>{evidence}</small></article>)}
            </div>
            <p className="personal-truth-note">Statuses above are last-verified evidence unless explicitly marked as a live probe.</p>
          </section>

          <section className="personal-lane personal-lane-evidence">
            <div className="personal-lane-head"><span>04</span><div><p>Evidence</p><h2>Local verification</h2></div></div>
            <div className="personal-evidence-list">
              <p><b>PASS</b><span>TypeScript check</span><small>Verified in the isolated checkout</small></p>
              <p><b>PASS</b><span>Full test suite</span><small>162 of 162 tests</small></p>
              <p><b>PASS</b><span>Diff integrity</span><small>No whitespace errors</small></p>
              <p><b>PUSHED</b><span>Focused branch</span><small>Published for review; not landed</small></p>
            </div>
          </section>

          <section className="personal-lane personal-lane-gates">
            <div className="personal-lane-head"><span>05</span><div><p>Gates</p><h2>Owner-controlled actions</h2></div></div>
            <div className="personal-gates">
              <article><span>Push</span><strong>Complete</strong></article><article><span>Protected review</span><strong>PR open</strong></article>
              <article><span>Merge</span><strong>Not authorized</strong></article><article><span>Deployment</span><strong>Not authorized</strong></article>
              <article><span>Production data</span><strong>Untouched</strong></article>
            </div>
          </section>
        </div>

        <footer className="personal-footer"><span>Personal Control</span><p>Private by server-side founder identity. No credentials or customer data rendered.</p></footer>
      </main>
    </PortalShell>
  );
}
