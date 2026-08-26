/**
 * IMO Exchange — the economics behind the catalogue.
 *
 * The whole trade reduces to one question: does the contract percentage an
 * agent surrenders cover what the agency spends to feed them?
 *
 *   AGENCY MARGIN  =  (G × AP × N × R)  −  (L × N)  −  A
 *
 *     G   giveback, as a decimal (0.15 = fifteen points)
 *     AP  average annual premium per deal
 *     N   transferred calls supplied per month
 *     R   close rate on a transferred call
 *     L   cost of one transferred call
 *     A   monthly AI budget attached to the tier
 *
 * Setting margin to zero and solving for G gives the break-even giveback:
 *
 *   G*  =  (L × N + A) / (AP × N × R)
 *
 * The API term is small, so in practice:
 *
 *   G*  ≈  L / (AP × R)   =   lead cost ÷ revenue per call
 *
 * That is the sentence worth remembering. **The giveback has to exceed the lead
 * cost divided by the revenue a call generates.** It does not depend on volume:
 * supplying more calls does not make an unprofitable tier profitable, it makes
 * the loss bigger.
 *
 * Every constant below is an ASSUMPTION, not an observation. The portal has no
 * connection to a dialer, a CRM, or a carrier, so nothing here is measured.
 * `LEAD_COST` in particular decides whether the whole model works, and it is
 * the one number IMO must supply from its actual invoices.
 */

/** Average annual premium per placed deal. Owner-supplied. */
export const AVG_PREMIUM = 700;

/**
 * Cost of one transferred call. **THE DECIDING NUMBER — currently a placeholder.**
 * At a 15% close rate the Accelerate tier is profitable at $15 and loses money
 * at $20. Replace this with the real figure before anyone is offered a trade.
 */
export const LEAD_COST = 15;

/** Close rate on a transferred call. Assumption pending call-review data. */
export const CLOSE_RATE = 0.15;

/** Working days per month. */
export const WORKING_DAYS = 22;

/** Typical contract level used for the agent-side comparison, in points. */
export const BASE_CONTRACT = 110;

export type TierEconomics = {
  callsMonth: number;
  dealsMonth: number;
  premiumMonth: number;
  /** What the agency keeps from the surrendered points. */
  agencyRevenue: number;
  /** Leads plus AI budget. */
  agencyCost: number;
  agencyMargin: number;
  /** Giveback at which this tier breaks even, in points. */
  breakEvenGiveback: number;
  /** Extra production the agent needs to come out ahead, as a multiple. */
  agentUpliftNeeded: number;
  /** Revenue one transferred call generates. */
  revenuePerCall: number;
};

export function tierEconomics(
  givebackPoints: number,
  callsPerDay: [number, number],
  apiBudget: number,
): TierEconomics {
  const perDay = (callsPerDay[0] + callsPerDay[1]) / 2;
  const callsMonth = perDay * WORKING_DAYS;
  const dealsMonth = callsMonth * CLOSE_RATE;
  const premiumMonth = dealsMonth * AVG_PREMIUM;

  const give = givebackPoints / 100;
  const agencyRevenue = premiumMonth * give;
  const agencyCost = callsMonth * LEAD_COST + apiBudget;

  const revenuePerCall = AVG_PREMIUM * CLOSE_RATE;

  // Guard the no-calls tier: with N = 0 there is nothing to break even on.
  const breakEvenGiveback =
    callsMonth > 0
      ? ((LEAD_COST * callsMonth + apiBudget) / (AVG_PREMIUM * callsMonth * CLOSE_RATE)) * 100
      : 0;

  // The giveback applies to EVERY deal, not only the supplied ones, so the
  // agent needs proportionally more production just to stand still.
  const agentUpliftNeeded =
    givebackPoints > 0 ? BASE_CONTRACT / (BASE_CONTRACT - givebackPoints) : 1;

  return {
    callsMonth,
    dealsMonth,
    premiumMonth,
    agencyRevenue,
    agencyCost,
    agencyMargin: agencyRevenue - agencyCost,
    breakEvenGiveback,
    agentUpliftNeeded,
    revenuePerCall,
  };
}

export const money = (n: number) =>
  n < 0 ? `-$${Math.abs(Math.round(n)).toLocaleString()}` : `$${Math.round(n).toLocaleString()}`;
