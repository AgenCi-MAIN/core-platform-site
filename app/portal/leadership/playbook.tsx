import type { PortalSession } from "../access";

/**
 * The Playbook — how to use CORE, and who does what.
 *
 * SERVER-ONLY, and behind `leadership.view.all` (owner, admin, manager) by
 * virtue of living on the Leadership page. Reviewer, agent and support do not
 * reach it, which is the founder's "Manager or Above" stated in the one place
 * that enforces it rather than in a document nobody reads.
 *
 * CONTENT RULE. Everything here describes the platform as it actually is on
 * the date stamped at the foot of the page: real roster rows, real
 * capabilities, real surfaces, and — the half that matters — the things that
 * are NOT connected and the things that are blocked on a named person. A
 * playbook that flatters the platform is worse than no playbook, because
 * somebody will plan a week around it.
 */
export function LeadershipPlaybook({ session }: { session: PortalSession }) {
  return (
    <div className="playbook">
      <section className="portal-card playbook-lede">
        <h2>How CORE works, and who does what</h2>
        <p>
          Written for the four people who use it. It describes the platform as
          it stands today — including what is not connected yet, because a
          plan built on a surface that has no data behind it is a wasted week.
        </p>
        <p className="playbook-you">
          You are signed in as <strong>{session.email}</strong> ·{" "}
          <span className="playbook-role">{session.role}</span>. This page is
          visible to managers and above; agents, reviewers and support do not
          see it.
        </p>
      </section>

      <section className="portal-card" id="playbook-gates">
        <h3>Why it asks who you are twice</h3>
        <p>
          Three independent checks run in order, and any one of them can refuse
          you. That is deliberate, and worth understanding because it explains
          nearly every &quot;why can&apos;t I get in&quot; question.
        </p>
        <ol className="playbook-steps">
          <li>
            <strong>Cloudflare Access, at the edge.</strong> Before the portal
            runs at all. Google sign-in only, against a named list of
            addresses. An anonymous request never reaches the application.
          </li>
          <li>
            <strong>Sign in with Google.</strong> Proves you are you. It proves
            nothing else — anyone with a Google account can complete this step.
          </li>
          <li>
            <strong>Your row on the member roster.</strong> This is what grants
            access. Identity and membership are separate on purpose: being able
            to sign in is not the same as belonging here.
          </li>
        </ol>
        <div className="playbook-note">
          <strong>It fails closed.</strong> If the database cannot be reached,
          the portal refuses everyone rather than assuming. A locked door that
          jams shut is doing its job; one that jams open is not.
        </div>
      </section>

      <section className="portal-card" id="playbook-roles">
        <h3>Who holds what</h3>
        <div className="playbook-tablewrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Role</th>
                <th scope="col">Holds</th>
                <th scope="col">Does not hold</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Yuxiang Mao (Shawn)</strong><span className="playbook-sub">founder</span></td>
                <td>owner</td>
                <td>Everything, plus the founder-only surfaces: the audit log, Investigator, the <code>/go/*</code> handoffs, and the Command Center with no code.</td>
                <td>—</td>
              </tr>
              <tr>
                <td><strong>Ryan Davidson</strong></td>
                <td>owner</td>
                <td>Every member-facing surface, the roster, and the ability to grant and change access for non-owners.</td>
                <td>The founder-only surfaces. Not an oversight — those answer one identity by design.</td>
              </tr>
              <tr>
                <td><strong>Andrew Davidson</strong><span className="playbook-sub">development</span></td>
                <td>owner</td>
                <td>The same as Ryan, plus eligibility for the Command Center.</td>
                <td>The Command Center will not open on his name alone — he needs a single-use code from Shawn each session.</td>
              </tr>
              <tr>
                <td><strong>Nate Nguyen</strong></td>
                <td>manager</td>
                <td>The portal, his dashboard and book, call review, team and leadership views, and sight of the roster.</td>
                <td>Changing the roster, and editing approved call language.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="playbook-note">
          <strong>No owner can change another owner.</strong> Not Ryan, not
          Andrew, not Shawn — the portal refuses it and the change has to be
          made directly against the database. That protects every owner from
          every other one, including the founder.
        </div>
      </section>

      <section className="portal-card" id="playbook-truth">
        <h3>When the portal says it does not know</h3>
        <p>
          Several surfaces are deliberately empty. They are not broken and they
          are not waiting on a bug fix — they have no data source connected,
          and they say so rather than showing a comforting zero.
        </p>
        <ul className="playbook-list">
          <li><strong>Book of Business</strong> — no CRM is connected.</li>
          <li><strong>LeadTech, Retreaver, Twilio</strong> — read-only; the control plane that would route a call is not connected.</li>
          <li><strong>Leaderboard premium and close figures</strong> — no policy or financial feed exists.</li>
        </ul>
        <div className="playbook-note">
          <strong>Read the difference.</strong> A <code>0</code> means we
          counted and there were none. A <code>—</code> means we have no source
          and are not guessing. The whole database is four tables today:
          members, the audit record, call transfers, and Command Center codes.
        </div>
      </section>

      <section className="portal-card" id="playbook-blocked">
        <h3>Waiting on a person</h3>
        <p>
          These are not in progress. Each one is stopped until a named human
          does something only they can do.
        </p>
        <div className="playbook-tablewrap">
          <table className="portal-table">
            <thead>
              <tr><th scope="col">What</th><th scope="col">Who</th><th scope="col">Cost of leaving it</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Add the messaging tools to the two scheduled routines&apos; allowlists</td>
                <td>Shawn</td>
                <td>The daily 8:30 brief fires and sends nothing. It has likely never arrived.</td>
              </tr>
              <tr>
                <td>Apply the Command Center code migration</td>
                <td>Shawn</td>
                <td>Andrew meets a locked door with no working keyhole.</td>
              </tr>
              <tr>
                <td>Apply the two roster migrations</td>
                <td>Shawn</td>
                <td>Three access decisions are live in the database and absent from the permanent record.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
