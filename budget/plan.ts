/**
 * THRIVE operating budget — the cost model, in code.
 *
 * WHY THIS IS A MODULE AND NOT A SPREADSHEET
 *
 * A spreadsheet cell that says 0 looks exactly like a cell nobody has filled
 * in yet. That is the one failure this file is built to prevent: an unpriced
 * line must never be summed as zero, because a total that quietly omits a
 * vendor is worse than no total at all — you would save against it, and be
 * short. Every line therefore carries a `confidence`, and `unknown` lines are
 * counted, named, and reported SEPARATELY from money. `planFor()` will tell
 * you the floor it can prove and how many lines it could not price; it will
 * never hand you a single confident-looking number built on blanks.
 *
 * This mirrors how the portal itself behaves: fail closed, show honest empty
 * states, never invent a row.
 *
 * HOW TO USE IT
 *
 *   npm run budget          -- 25 seats, the default plan
 *   npm run budget -- 40    -- any other headcount
 *
 * WHEN A PRICE IS CONFIRMED, edit the line: set `amountUsd`, set
 * `confidence: "confirmed"`, and put where the number came from in `source`.
 * That is the whole maintenance loop.
 */

/**
 * How much we actually know about a number.
 *
 * - `confirmed` — taken from a real invoice, contract, or dashboard by a
 *   named person on a named date. `source` says which.
 * - `estimated` — a defensible figure that nobody has verified against a
 *   bill yet. Counted, but reported apart from confirmed money so the two
 *   never blur.
 * - `unknown` — not priced. `amountUsd` MUST be null. Never summed.
 */
export type Confidence = "confirmed" | "estimated" | "unknown";

/** Fixed cost, or one that multiplies with headcount. */
export type Basis = "fixed" | "per-seat";

export type Cadence = "monthly" | "annual";

export interface LineItem {
  readonly id: string;
  readonly label: string;
  readonly vendor: string;
  readonly basis: Basis;
  readonly cadence: Cadence;
  /** USD. Null iff confidence is "unknown". */
  readonly amountUsd: number | null;
  readonly confidence: Confidence;
  /** What this buys, and anything that would change the price. */
  readonly note: string;
  /** Where the number came from. Required once it is not "unknown". */
  readonly source: string;
}

/**
 * The lines.
 *
 * Everything the platform actually depends on appears here, priced or not.
 * A dependency missing from this list is a bill nobody is expecting, so add
 * the line the day a vendor is adopted — with `unknown` if that is the truth.
 */
export const LINE_ITEMS: readonly LineItem[] = [
  {
    id: "cloudflare-workers-paid",
    label: "Workers Paid plan",
    vendor: "Cloudflare",
    basis: "fixed",
    cadence: "monthly",
    amountUsd: 5,
    confidence: "confirmed",
    note:
      "Raises the per-request CPU ceiling from 10 ms to 30 s. NOT optional: " +
      "the portal server-renders React on every page and does not fit in the " +
      "free tier's 10 ms. Running without it is the 2026-08-18 outage.",
    source: "Founder upgraded the thrive18 account, 2026-08-18, after Error 1102.",
  },
  {
    id: "cloudflare-d1",
    label: "D1 database",
    vendor: "Cloudflare",
    basis: "fixed",
    cadence: "monthly",
    amountUsd: null,
    confidence: "unknown",
    note:
      "Included in Workers Paid up to a usage allowance; billed on rows read " +
      "and written beyond it. The live database is ~3.4 MB today, so the " +
      "allowance is very likely enough — but 'likely' is not a number.",
    source: "",
  },
  {
    id: "cloudflare-r2",
    label: "R2 object storage (call recordings)",
    vendor: "Cloudflare",
    basis: "fixed",
    cadence: "monthly",
    amountUsd: null,
    confidence: "unknown",
    note:
      "Billed on stored GB and operations; egress is free. Scales with how " +
      "many calls are recorded and how long they are kept, so it cannot be " +
      "priced until a retention policy exists. That policy is the decision, " +
      "not the price.",
    source: "",
  },
  {
    id: "anthropic-api",
    label: "Claude API (the Presence assistant)",
    vendor: "Anthropic",
    basis: "fixed",
    cadence: "monthly",
    amountUsd: null,
    confidence: "unknown",
    note:
      "Usage-billed per token, so the driver is how often members actually " +
      "talk to the in-portal assistant. Needs one month of real traffic " +
      "before any figure here means anything.",
    source: "",
  },
  {
    id: "twilio",
    label: "Inbound numbers and call minutes",
    vendor: "Twilio",
    basis: "fixed",
    cadence: "monthly",
    amountUsd: null,
    confidence: "unknown",
    note:
      "Per-number rental plus per-minute inbound. The centralised number " +
      "routes to each agent, so minutes scale with total call volume rather " +
      "than with seats.",
    source: "",
  },
  {
    id: "retreaver",
    label: "Call routing and attribution",
    vendor: "Retreaver",
    basis: "fixed",
    cadence: "monthly",
    amountUsd: null,
    confidence: "unknown",
    note: "Routes the central ad-campaign number out to individual agents.",
    source: "",
  },
  {
    id: "leadtech",
    label: "Lead PULL API",
    vendor: "LeadTech",
    basis: "fixed",
    cadence: "monthly",
    amountUsd: null,
    confidence: "unknown",
    note:
      "Deliberately dormant — no key is set and the surface fails closed " +
      "('api kept out for now'). Priced at zero ONLY when someone confirms " +
      "the contract costs nothing while inactive.",
    source: "",
  },
  {
    id: "surancebay",
    label: "SureLC / SuranceBay contracting",
    vendor: "SuranceBay",
    basis: "per-seat",
    cadence: "monthly",
    amountUsd: null,
    confidence: "unknown",
    note:
      "Carrier contracting and licensing. Often billed to the agency per " +
      "producer, which is why it is modelled per-seat rather than fixed.",
    source: "",
  },
  {
    id: "domain",
    label: "Custom domain",
    vendor: "Registrar (undecided)",
    basis: "fixed",
    cadence: "annual",
    amountUsd: null,
    confidence: "unknown",
    note:
      "Still an open follow-up — the portal runs on a workers.dev address " +
      "today. Small, but it is an annual bill that arrives whether or not " +
      "anyone budgeted for it.",
    source: "",
  },
];

export interface SeatPlan {
  readonly seats: number;
  /** Confirmed money only. The floor you can actually prove. */
  readonly confirmedAnnualUsd: number;
  /** Estimated money, kept apart from confirmed so the two never blur. */
  readonly estimatedAnnualUsd: number;
  /** confirmed + estimated. Still a FLOOR while unpriced lines remain. */
  readonly knownAnnualUsd: number;
  /** What to set aside each month to have knownAnnualUsd in a year. */
  readonly monthlySetAsideUsd: number;
  /** Known annual cost per seat, or null when seats is 0. */
  readonly perSeatAnnualUsd: number | null;
  /** Lines that carry no price. The reason the total is a floor. */
  readonly unpriced: readonly LineItem[];
  /** True only when every line is priced. */
  readonly complete: boolean;
}

/** One line's annual cost at a given headcount. Unknown lines contribute 0
 *  here and are reported separately — never fold this into a total on its
 *  own. */
function annualCost(item: LineItem, seats: number): number {
  if (item.amountUsd === null) return 0;
  const units = item.basis === "per-seat" ? seats : 1;
  const perYear = item.cadence === "monthly" ? 12 : 1;
  return item.amountUsd * units * perYear;
}

/** Round to whole cents. Money summed in floating point drifts otherwise. */
function cents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * The plan for a given headcount.
 *
 * Throws on a nonsensical seat count rather than returning a number nobody
 * should act on, and throws if a line contradicts itself (a price with
 * `unknown`, or `unknown` with a price) — a malformed line is a budgeting
 * error, not a rendering one, and it should stop the run.
 */
export function planFor(seats: number, items: readonly LineItem[] = LINE_ITEMS): SeatPlan {
  if (!Number.isInteger(seats) || seats < 0) {
    throw new Error(`seats must be a non-negative integer, received ${seats}`);
  }
  for (const item of items) {
    const priced = item.amountUsd !== null;
    if (priced === (item.confidence === "unknown")) {
      throw new Error(
        `line "${item.id}" is inconsistent: confidence "${item.confidence}" with ` +
          `amountUsd ${String(item.amountUsd)}. An unknown line carries no price, ` +
          "and a priced line is not unknown.",
      );
    }
    if (priced && !item.source.trim()) {
      throw new Error(`line "${item.id}" carries a price with no source. Say where it came from.`);
    }
  }

  let confirmed = 0;
  let estimated = 0;
  const unpriced: LineItem[] = [];

  for (const item of items) {
    if (item.confidence === "unknown") {
      unpriced.push(item);
      continue;
    }
    const cost = annualCost(item, seats);
    if (item.confidence === "confirmed") confirmed += cost;
    else estimated += cost;
  }

  const known = cents(confirmed + estimated);
  return {
    seats,
    confirmedAnnualUsd: cents(confirmed),
    estimatedAnnualUsd: cents(estimated),
    knownAnnualUsd: known,
    monthlySetAsideUsd: cents(known / 12),
    perSeatAnnualUsd: seats > 0 ? cents(known / seats) : null,
    unpriced,
    complete: unpriced.length === 0,
  };
}

/** The headcount this plan exists for. */
export const TARGET_SEATS = 25;
