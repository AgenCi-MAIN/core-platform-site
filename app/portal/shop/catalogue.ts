import type { Metal } from "../../rank-medallion";

/**
 * THRIVE Exchange — the catalogue of what an agent can trade contract points for.
 *
 * NOTHING HERE TRANSACTS. This is a priced menu and a calculator. Compensation
 * is an employment term, so a change to anyone's contract level is a human
 * decision made and recorded outside this system. The portal's job is to make
 * the trade legible before anyone agrees to it — not to execute it.
 *
 * The economics are in `economics.ts`. Every figure a member sees is derived
 * from the assumptions there, so a wrong assumption is visibly wrong rather
 * than quietly baked into a hard-coded number.
 */

export type Offer = {
  id: string;
  name: string;
  tagline: string;
  metal: Metal;
  /** Contract points surrendered, in points (15 = fifteen points). */
  giveback: number;
  /** Transferred calls provided per working day: [low, high]. */
  callsPerDay: [number, number];
  /** Agent-facing description of the AI grant. */
  api: string;
  /** Monthly API budget backing that grant, in dollars. 0 = none. */
  apiBudget: number;
  perks: readonly string[];
};

export const OFFERS: readonly Offer[] = [
  {
    id: "standard",
    name: "Standard",
    tagline: "Your contract, untouched.",
    metal: "steel",
    giveback: 0,
    callsPerDay: [0, 0],
    api: "None",
    apiBudget: 0,
    perks: [
      "Full contract level for your rank",
      "You source your own conversations",
      "Portal, Library, and Script Vault included at every rank",
    ],
  },
  {
    id: "boost",
    name: "Boost",
    tagline: "A steady feed while you build.",
    metal: "bronze",
    giveback: 8,
    callsPerDay: [3, 5],
    api: "Assistant — drafting, summaries, objection prep",
    apiBudget: 25,
    perks: [
      "3–5 transferred calls per working day",
      "AI assistant with a $25 monthly budget",
      "Call review turnaround inside 24 hours",
    ],
  },
  {
    id: "accelerate",
    name: "Accelerate",
    tagline: "Volume, with the tools to hold it.",
    metal: "silver",
    giveback: 15,
    callsPerDay: [5, 8],
    api: "Full — assistant, call analysis, book intelligence",
    apiBudget: 90,
    perks: [
      "5–8 transferred calls per working day",
      "Full AI toolset with a $90 monthly budget",
      "Priority routing on transferred calls",
      "Weekly coaching review",
    ],
  },
  {
    id: "max",
    name: "Max",
    tagline: "Everything the system can give you.",
    metal: "gold",
    giveback: 25,
    callsPerDay: [7, 10],
    api: "Unlimited — every agent, no per-task cap",
    apiBudget: 350,
    perks: [
      "7–10 transferred calls per working day",
      "Unlimited AI agents, $350 monthly budget",
      "First position in the transfer queue",
      "Dedicated coaching and script input",
    ],
  },
] as const;
