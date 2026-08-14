import { RankMedallion } from "../../rank-medallion";
import { can, requireCapability } from "../access";
import { PortalPageIntro, PortalShell } from "../components";
import { OFFERS } from "./catalogue";
import {
  AVG_PREMIUM,
  BASE_CONTRACT,
  CLOSE_RATE,
  LEAD_COST,
  money,
  tierEconomics,
} from "./economics";

export const dynamic = "force-dynamic";

/**
 * THRIVE Exchange.
 *
 * Agents trade contract points for transferred calls and AI capacity. This page
 * prices the trade; it does not make it. A change to anyone's contract level is
 * a compensation decision, made and recorded by a human outside this system.
 *
 * The margin panel is gated on `leadership.view.all` — agents see what they get
 * and what it costs them, leadership additionally sees whether the agency makes
 * money on it.
 */
export default async function ShopPage() {
  const session = await requireCapability("dashboard.view.self", "/portal/shop");
  const seesMargin = can(session, "leadership.view.all");

  const rows = OFFERS.map((offer) => ({
    offer,
    econ: tierEconomics(offer.giveback, offer.callsPerDay, offer.apiBudget),
  }));

  const chart = rows.filter((r) => r.offer.callsPerDay[1] > 0);
  const peak = Math.max(...chart.map((r) => Math.max(Math.abs(r.econ.agencyMargin), 1)), 1);

  return (
    <PortalShell session={session} current="/portal/shop" section="Exchange">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="THRIVE Exchange"
          title="Trade contract points for volume."
          subtitle="Give up percentage, get transferred calls and AI capacity. Every tier shows exactly what you surrender and what you have to produce to come out ahead."
          compact
        />

        <p className="script-governance" role="note">
          <span className="script-governance-tag">Not a transaction</span>
          <span>
            This is a priced menu, not a checkout. Compensation is an employment
            term — a change to your contract level is agreed with a human and
            recorded outside this system.{" "}
            <strong>Nothing on this page changes your pay.</strong>
          </span>
        </p>

        {/* ---------------- the offers ---------------- */}
        <div className="shop-grid">
          {rows.map(({ offer, econ }) => {
            const profitable = econ.agencyMargin >= 0;
            return (
              <article className={`portal-card shop-card shop-card-${offer.metal}`} key={offer.id}>
                <header className="shop-head">
                  <RankMedallion
                    metal={offer.metal}
                    numeral={offer.giveback ? `-${offer.giveback}` : "0"}
                    size={44}
                  />
                  <div>
                    <h2>{offer.name}</h2>
                    <p>{offer.tagline}</p>
                  </div>
                </header>

                <div className="shop-trade">
                  <div className="shop-trade-side">
                    <span className="shop-trade-label">You give</span>
                    <strong className="shop-give">
                      {offer.giveback ? `${offer.giveback} pts` : "Nothing"}
                    </strong>
                    <small>
                      {offer.giveback
                        ? `${BASE_CONTRACT}% → ${BASE_CONTRACT - offer.giveback}% contract`
                        : "Full contract for your rank"}
                    </small>
                  </div>
                  <span className="shop-trade-arrow" aria-hidden="true">⇄</span>
                  <div className="shop-trade-side">
                    <span className="shop-trade-label">You get</span>
                    <strong className="shop-get">
                      {offer.callsPerDay[1]
                        ? `${offer.callsPerDay[0]}–${offer.callsPerDay[1]} calls/day`
                        : "Own sourcing"}
                    </strong>
                    <small>{offer.api}</small>
                  </div>
                </div>

                <ul className="shop-perks">
                  {offer.perks.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>

                {offer.giveback > 0 ? (
                  <div className="shop-agent-math">
                    <span className="shop-trade-label">What it takes to win</span>
                    <p>
                      The points come off <strong>every</strong> deal, not just the
                      supplied ones. You need{" "}
                      <strong className="shop-uplift">
                        {Math.round((econ.agentUpliftNeeded - 1) * 100)}% more production
                      </strong>{" "}
                      to earn the same, and roughly{" "}
                      <strong>{Math.ceil(econ.dealsMonth)} deals a month</strong> is
                      what this feed should produce.
                    </p>
                  </div>
                ) : null}

                {seesMargin ? (
                  <div className={`shop-margin ${profitable ? "is-good" : "is-bad"}`}>
                    <span className="shop-trade-label">Agency margin</span>
                    <strong>{money(econ.agencyMargin)}/mo</strong>
                    <small>
                      keeps {money(econ.agencyRevenue)} · spends {money(econ.agencyCost)} ·
                      break-even at {econ.breakEvenGiveback.toFixed(1)} pts
                    </small>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {/* ---------------- the graph, leadership only ---------------- */}
        {seesMargin ? (
          <section className="portal-card shop-chart-card">
            <header className="portal-card-header">
              <span className="portal-card-icon" aria-hidden="true">◫</span>
              <div>
                <h2>Agency margin per tier</h2>
                <p>
                  At {money(LEAD_COST)} per transferred call and a{" "}
                  {(CLOSE_RATE * 100).toFixed(0)}% close rate.
                </p>
              </div>
            </header>

            <svg className="shop-chart" viewBox="0 0 720 260" role="img" aria-label="Agency margin by tier">
              {(() => {
                const L = 92;
                const R = 96;
                const zero = L + (720 - L - R) / 2;
                const half = (720 - L - R) / 2;
                const bh = 34;
                const gap = 22;
                return (
                  <>
                    <line x1={zero} y1={14} x2={zero} y2={14 + chart.length * (bh + gap)} className="shop-axis" />
                    <text x={zero} y={14 + chart.length * (bh + gap) + 18} textAnchor="middle" className="shop-glab">
                      break even
                    </text>
                    {chart.map((r, i) => {
                      const y = 14 + i * (bh + gap);
                      const w = Math.max((Math.abs(r.econ.agencyMargin) / peak) * half, 3);
                      const good = r.econ.agencyMargin >= 0;
                      return (
                        <g key={r.offer.id}>
                          <text x={L - 10} y={y + bh / 2 + 5} textAnchor="end" className="shop-glab shop-glab-strong">
                            {r.offer.name}
                          </text>
                          <rect
                            x={good ? zero : zero - w}
                            y={y}
                            width={w}
                            height={bh}
                            rx={6}
                            className={good ? "shop-bar-good" : "shop-bar-bad"}
                          />
                          <text
                            x={good ? zero + w + 10 : zero - w - 10}
                            y={y + bh / 2 + 5}
                            textAnchor={good ? "start" : "end"}
                            className="shop-glab shop-glab-value"
                          >
                            {money(r.econ.agencyMargin)}
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>

            <div className="shop-equation">
              <p className="shop-trade-label">The equation</p>
              <code>margin = (G × AP × N × R) − (L × N) − A</code>
              <p className="portal-fine">
                G giveback · AP average premium · N calls supplied · R close rate ·
                L cost per call · A AI budget.
              </p>
              <code className="shop-equation-key">G* ≈ L ÷ (AP × R)</code>
              <p className="portal-fine">
                Break-even giveback is the lead cost divided by the revenue one
                call generates — {money(LEAD_COST)} ÷{" "}
                {money(AVG_PREMIUM * CLOSE_RATE)} ={" "}
                <strong>{((LEAD_COST / (AVG_PREMIUM * CLOSE_RATE)) * 100).toFixed(1)} points</strong>.
                It does not depend on volume: supplying more calls never rescues a
                tier priced below this line, it only enlarges the loss.
              </p>
            </div>

            <div className="shop-verdict" role="note">
              <p className="shop-trade-label">What this pricing implies</p>
              <p>
                Because break-even is dominated by{" "}
                <strong>lead cost ÷ revenue per call</strong>, it lands at roughly
                the same {((LEAD_COST / (AVG_PREMIUM * CLOSE_RATE)) * 100).toFixed(0)}{" "}
                points for <em>every</em> tier that supplies calls. A smaller feed
                does not justify a smaller giveback — the AI budget is fixed
                overhead, so light tiers are actually the hardest to make work.
              </p>
              <p>
                <strong>Any tier that supplies leads needs 18–20 points minimum.</strong>{" "}
                Differentiate the tiers on volume and AI capacity, not on a
                discounted giveback. A tier priced under the line loses money on
                every agent who takes it, and loses more the better it sells.
              </p>
            </div>
          </section>
        ) : null}

        <section className="portal-card">
          <header className="portal-card-header">
            <span className="portal-card-icon" aria-hidden="true">◇</span>
            <div>
              <h2>What is assumed, and what is measured</h2>
              <p>Nothing on this page is measured. All of it is assumption.</p>
            </div>
          </header>
          <dl className="shop-assumptions">
            <div>
              <dt>Average premium</dt>
              <dd>{money(AVG_PREMIUM)} — owner-supplied</dd>
            </div>
            <div>
              <dt>Cost per transferred call</dt>
              <dd>
                {money(LEAD_COST)} — <strong>placeholder, and the deciding number</strong>
              </dd>
            </div>
            <div>
              <dt>Close rate on a transfer</dt>
              <dd>{(CLOSE_RATE * 100).toFixed(0)}% — assumption, no call data connected</dd>
            </div>
          </dl>
          <p className="portal-fine">
            The portal has no dialer, CRM, or carrier connection, so none of these
            can be verified here. At a {(CLOSE_RATE * 100).toFixed(0)}% close rate
            the Accelerate tier is profitable at {money(15)} per call and loses
            money at {money(20)}.{" "}
            <strong>
              Replace the lead cost with the real figure from THRIVE&apos;s invoices
              before anyone is offered a trade.
            </strong>
          </p>
        </section>
      </main>
    </PortalShell>
  );
}
