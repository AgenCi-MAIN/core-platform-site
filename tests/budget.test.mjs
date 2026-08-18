/**
 * The budget model's one load-bearing property: an unpriced line is never
 * silently worth zero.
 *
 * A spreadsheet cell reading 0 is indistinguishable from a cell nobody has
 * filled in. That is the whole reason this model exists in code, so it is
 * the thing worth pinning — a total that quietly omits a vendor is worse
 * than no total, because you would save against it and come up short.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { LINE_ITEMS, TARGET_SEATS, planFor } from "../budget/plan.ts";

test("an unpriced line is reported, never summed as zero", () => {
  const plan = planFor(TARGET_SEATS);

  // The inventory itself must stay honest: unknown lines carry no number, and
  // priced lines say where the number came from. planFor throws on either
  // violation, but assert it here too so the failure names the real problem
  // rather than surfacing as a thrown error from a script.
  for (const item of LINE_ITEMS) {
    if (item.confidence === "unknown") {
      assert.equal(
        item.amountUsd,
        null,
        `"${item.id}" is marked unknown but carries a price — one of the two is a lie`,
      );
    } else {
      assert.notEqual(item.amountUsd, null, `"${item.id}" is priced as null but not marked unknown`);
      assert.ok(item.source.trim(), `"${item.id}" carries a price with no source`);
    }
  }

  const unknowns = LINE_ITEMS.filter((i) => i.confidence === "unknown");
  assert.equal(
    plan.unpriced.length,
    unknowns.length,
    "every unpriced line must appear in the plan's unpriced list, or the total hides it",
  );
  assert.equal(
    plan.complete,
    unknowns.length === 0,
    "a plan is complete only when nothing is left unpriced",
  );

  // The distinction the whole file exists for.
  assert.equal(
    plan.knownAnnualUsd,
    plan.confirmedAnnualUsd + plan.estimatedAnnualUsd,
    "the known total is confirmed plus estimated and nothing else — unknowns contribute no money",
  );
});

test("a malformed line stops the run instead of quietly costing nothing", () => {
  // The dangerous shape: someone marks a line unknown but leaves a stale
  // price on it, or prices a line and forgets to move it off unknown. Either
  // way the arithmetic silently changes, so it must throw rather than return.
  assert.throws(
    () =>
      planFor(TARGET_SEATS, [
        {
          id: "contradiction",
          label: "x",
          vendor: "x",
          basis: "fixed",
          cadence: "monthly",
          amountUsd: 10,
          confidence: "unknown",
          note: "",
          source: "somewhere",
        },
      ]),
    /inconsistent/,
    "a priced line marked unknown must be rejected",
  );

  assert.throws(
    () =>
      planFor(TARGET_SEATS, [
        {
          id: "unsourced",
          label: "x",
          vendor: "x",
          basis: "fixed",
          cadence: "monthly",
          amountUsd: 10,
          confidence: "confirmed",
          note: "",
          source: "   ",
        },
      ]),
    /no source/,
    "a price with no provenance must be rejected — an unattributed number is a guess",
  );

  assert.throws(() => planFor(-1), /non-negative/);
  assert.throws(() => planFor(2.5), /integer/);
});

test("per-seat lines scale with headcount and fixed lines do not", () => {
  const items = [
    {
      id: "fixed-line",
      label: "fixed",
      vendor: "v",
      basis: "fixed",
      cadence: "monthly",
      amountUsd: 5,
      confidence: "confirmed",
      note: "",
      source: "test",
    },
    {
      id: "seat-line",
      label: "per seat",
      vendor: "v",
      basis: "per-seat",
      cadence: "monthly",
      amountUsd: 2,
      confidence: "confirmed",
      note: "",
      source: "test",
    },
    {
      id: "annual-line",
      label: "annual",
      vendor: "v",
      basis: "fixed",
      cadence: "annual",
      amountUsd: 12,
      confidence: "estimated",
      note: "",
      source: "test",
    },
  ];

  // fixed 5*12 = 60; per-seat 2*12*25 = 600; annual 12. Confirmed 660, estimated 12.
  const plan = planFor(25, items);
  assert.equal(plan.confirmedAnnualUsd, 660);
  assert.equal(plan.estimatedAnnualUsd, 12);
  assert.equal(plan.knownAnnualUsd, 672);
  assert.equal(plan.monthlySetAsideUsd, 56);
  assert.equal(plan.perSeatAnnualUsd, 26.88);

  // Doubling the seats must move only the per-seat line: 60 + 1200 + 12.
  assert.equal(planFor(50, items).knownAnnualUsd, 1272);

  // Zero seats is a real question to ask (what does the platform cost with
  // nobody on it), and per-seat cost is undefined rather than infinite.
  const empty = planFor(0, items);
  assert.equal(empty.knownAnnualUsd, 72);
  assert.equal(empty.perSeatAnnualUsd, null);
});
