/**
 * Print the operating budget for a given headcount.
 *
 *   npm run budget          -- 25 seats
 *   npm run budget -- 40    -- any other headcount
 *
 * Reads budget/plan.ts through the TypeScript source directly — Node strips
 * the types, so there is no build step between editing a price and seeing it.
 */
import { LINE_ITEMS, TARGET_SEATS, planFor } from "../budget/plan.ts";

const requested = process.argv[2];
const seats = requested === undefined ? TARGET_SEATS : Number(requested);
if (!Number.isInteger(seats) || seats < 0) {
  console.error(`Not a headcount: ${requested}`);
  process.exit(1);
}

const usd = (n) => `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
const plan = planFor(seats);

const priced = LINE_ITEMS.filter((i) => i.confidence !== "unknown");

console.log(`\nTHRIVE operating budget — ${seats} seats\n`);

if (priced.length === 0) {
  console.log("  Nothing is priced yet. Every line below is still unknown.\n");
} else {
  console.log("  PRICED");
  for (const item of priced) {
    const units = item.basis === "per-seat" ? seats : 1;
    const perYear = item.cadence === "monthly" ? 12 : 1;
    const annual = item.amountUsd * units * perYear;
    const shape =
      item.basis === "per-seat"
        ? `${usd(item.amountUsd)}/${item.cadence === "monthly" ? "mo" : "yr"} x ${seats} seats`
        : `${usd(item.amountUsd)}/${item.cadence === "monthly" ? "mo" : "yr"}`;
    console.log(`    ${item.label} (${item.vendor})`);
    console.log(`      ${shape}  ->  ${usd(annual)}/yr   [${item.confidence}]`);
  }
  console.log("");
}

console.log("  TOTALS");
console.log(`    Confirmed                ${usd(plan.confirmedAnnualUsd)} / yr`);
console.log(`    Estimated                ${usd(plan.estimatedAnnualUsd)} / yr`);
console.log(`    Known so far             ${usd(plan.knownAnnualUsd)} / yr`);
console.log(`    Set aside each month     ${usd(plan.monthlySetAsideUsd)}`);
if (plan.perSeatAnnualUsd !== null) {
  console.log(`    Per seat                 ${usd(plan.perSeatAnnualUsd)} / yr`);
}
console.log("");

if (!plan.complete) {
  console.log(`  NOT PRICED YET — ${plan.unpriced.length} line${plan.unpriced.length === 1 ? "" : "s"}`);
  console.log("  Until these carry a number, the totals above are a FLOOR, not a budget.\n");
  for (const item of plan.unpriced) {
    console.log(`    - ${item.label} (${item.vendor})${item.basis === "per-seat" ? " - per seat" : ""}`);
    console.log(`        ${item.note}`);
  }
  console.log("");
  console.log("  Fill one in: set amountUsd, set confidence, and record where the");
  console.log("  number came from in `source`. See budget/plan.ts.\n");
} else {
  console.log("  Every line is priced. This total is the whole bill.\n");
}
