/**
 * Rank economics — the seed data behind the Pay Rates studio.
 *
 * THIS FILE EXISTS FOR AN ACCESS REASON, NOT AN ORGANISATIONAL ONE.
 *
 * These values previously sat as a `const` inside `studio.tsx`, which carries
 * `"use client"`. That compiled them into a browser chunk under `/assets/`,
 * served by the static-asset binding with `Cache-Control: immutable` and no
 * session check of any kind — the worker never sees the request. Contract
 * levels, API grant counts, and per-rank headcount were readable by anyone who
 * fetched the file, including an anonymous visitor, and no audit row was
 * written. The page above it argued at length that it was safe because
 * `leadership.view.all` is enforced server-side, which was true and beside the
 * point: the data it was protecting had already left.
 *
 * So the numbers live here, on the server, and reach the interactive component
 * as props from the guarded page. The component keeps its state and its maths;
 * only the seed moved. `page.tsx` is what decides whether anyone gets to see it.
 *
 * Do not re-inline these into a `"use client"` file, and do not import this
 * module from one.
 *
 * The figures themselves remain a projection. Contract levels are employment
 * terms agreed with a human and recorded outside this system; nothing here
 * changes anyone's pay.
 */

export type Rank = {
  id: string;
  name: string;
  tier: string;
  metal: string;
  contract: number;
  grants: number;
  people: number;
};

export const START_RANKS: readonly Rank[] = [
  { id: "bronze", name: "Bronze", tier: "Entry", metal: "#c67c3e", contract: 90, grants: 0, people: 8 },
  { id: "iron", name: "Iron", tier: "Producer", metal: "#9aa7b4", contract: 100, grants: 1, people: 10 },
  { id: "ember", name: "Ember", tier: "Established", metal: "#e0764a", contract: 110, grants: 3, people: 10 },
  { id: "apex", name: "Apex", tier: "Senior", metal: "#e0b64e", contract: 120, grants: 7, people: 5 },
  { id: "obsidian", name: "Obsidian", tier: "Leader", metal: "#7b6bb0", contract: 140, grants: 15, people: 3 },
  { id: "zenith", name: "Zenith", tier: "Principal", metal: "#bfe6f5", contract: 140, grants: 20, people: 2 },
];

/**
 * Opening positions for the dials.
 *
 * `leadCost` is the deciding number and is still a placeholder — it must come
 * from the IMO's own invoices before any of this output is quoted to anyone.
 */
export type StudioInputs = {
  premium: number;
  leadCost: number;
  closeRate: number;
  apiPerAgent: number;
  dealsPerPerson: number;
};

// Declared against the type rather than `as const`: the studio's dials are
// mutable numbers, and literal types here would narrow their state to the
// opening value.
export const START_INPUTS: StudioInputs = {
  premium: 700,
  leadCost: 15,
  closeRate: 15,
  apiPerAgent: 47,
  dealsPerPerson: 8,
};
