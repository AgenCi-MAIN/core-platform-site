/**
 * THRIVE portal library — the documents members read.
 *
 * CONTENT PROVENANCE RULE
 *
 * Every document carries a `status`:
 *   - "approved"  Owner-supplied or owner-signed. Rendered verbatim. J.A.R.V.I.S.
 *                 must not reword it.
 *   - "draft"     Drafted for the owner to edit or approve. Displayed with a
 *                 visible DRAFT marker so no member mistakes it for policy.
 *
 * Nothing here may state a figure, a date, a carrier term, a compensation
 * promise, or a company fact that the owner has not supplied. Draft copy
 * describes how THRIVE works from the operating model already recorded; it does
 * not invent history, headcount, results, or commitments.
 */

export type LibraryBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "list"; items: readonly string[] }
  | { kind: "numbered"; items: readonly { title: string; body: string }[] }
  | { kind: "quote"; text: string };

export type LibraryDocument = {
  id: string;
  title: string;
  summary: string;
  icon: string;
  status: "approved" | "draft";
  /** Where the content came from. Required. */
  provenance: string;
  /** Set when the content is time-limited, so it cannot quietly go stale. */
  expires?: string;
  blocks: readonly LibraryBlock[];
};

export const LIBRARY: readonly LibraryDocument[] = [
  {
    id: "who-is-thrive",
    title: "Who is THRIVE",
    summary: "What this agency is, and what it is deliberately not.",
    icon: "◆",
    status: "draft",
    provenance:
      "Drafted from the recorded operating model. Awaiting owner approval.",
    blocks: [
      {
        kind: "paragraph",
        text: "THRIVE is an insurance agency built around a simple bet: that an agency which owns its demand, measures its own work honestly, and gives its people a real path will outperform one that rents leads and hopes.",
      },
      {
        kind: "paragraph",
        text: "Most agencies buy attention. They pay for leads, dial them until the list is exhausted, and buy more. The economics only work while the lead price stays low and the people stay cheap. THRIVE is built the other way around — to turn every conversation into something the agency keeps.",
      },
      { kind: "heading", text: "What that means day to day" },
      {
        kind: "list",
        items: [
          "You are not judged on dials. Volume is noise; a verified signal is the unit of work that matters.",
          "The system remembers. Every call, every carrier answer, and every outcome becomes something the next agent does not have to rediscover.",
          "Advancement is defined before you start, not decided after the fact. Five ranks, published criteria, measured the same way for everyone.",
          "Compliance is not the department that says no at the end. It is a condition of the work being real in the first place.",
        ],
      },
      { kind: "heading", text: "What THRIVE is not" },
      {
        kind: "list",
        items: [
          "Not a lead mill. Buying attention is a cost, not a strategy.",
          "Not a place where the top of the org chart is the only one with information. If you can be measured on it, you can see it.",
          "Not a company that promises what it has not built. Where a system is not connected yet, this portal says so plainly instead of showing you a number that looks impressive.",
        ],
      },
      {
        kind: "quote",
        text: "We invest in you. You grow with us.",
      },
    ],
  },
  {
    id: "beliefs",
    title: "Beliefs",
    summary: "The operating principles behind every decision here.",
    icon: "✦",
    status: "draft",
    provenance:
      "Drafted from the recorded operating model and governance rules. Awaiting owner approval.",
    blocks: [
      {
        kind: "paragraph",
        text: "These are not slogans. Each one changes what actually gets built and what gets refused.",
      },
      {
        kind: "numbered",
        items: [
          {
            title: "Volume is noise. Verified signal is the work.",
            body: "A hundred dials that produce nothing you can act on is not effort — it is waste dressed as effort. We fund the signal, not the noise around it.",
          },
          {
            title: "Own the demand.",
            body: "Rented demand disappears the moment you stop paying. Owned demand compounds. Everything we build is aimed at moving from the first to the second.",
          },
          {
            title: "Compliance takes priority over production.",
            body: "A sale that should not have happened is a liability, not revenue. Licensed work stays with licensed people. This is not negotiable and it is not a slowdown — it is what makes the rest durable.",
          },
          {
            title: "Say what is real.",
            body: "If a system is not connected, we say it is not connected. No modelled figure is ever presented as an operating result. An honest empty state beats an impressive lie every single time.",
          },
          {
            title: "The path is published before you walk it.",
            body: "Ranks, criteria, and expectations are written down in advance. Nobody should have to guess what advancement requires, or find out the rules changed after they hit the number.",
          },
          {
            title: "Memory is an asset.",
            body: "What one agent learns on a hard call should make the next agent's call easier. If the knowledge leaves when the person leaves, we built it wrong.",
          },
          {
            title: "Access is assigned, never assumed.",
            body: "Every person sees exactly what their role grants and nothing more. Not because we distrust anyone — because a system that cannot say who saw what cannot be trusted with anyone's information.",
          },
        ],
      },
    ],
  },
  {
    id: "training",
    title: "Training",
    summary: "How new agents get up to speed, and what support looks like.",
    icon: "◈",
    status: "draft",
    provenance:
      "Structure drafted for the owner to complete. Curriculum content, schedules, and certification requirements must be supplied by THRIVE.",
    blocks: [
      {
        kind: "paragraph",
        text: "This page is the frame. The curriculum itself is written by THRIVE and added here once approved — it is not generated.",
      },
      { kind: "heading", text: "What is already in place" },
      {
        kind: "list",
        items: [
          "Your first deal is closed by a manager, so you earn while you are still learning the motion.",
          "Your first two weeks of business expenses are covered, so learning is not competing with your rent.",
          "Call review is permissioned and coaching-oriented — recordings are reviewed to make you better, under the access controls described in Plans.",
        ],
      },
      { kind: "heading", text: "To be supplied by THRIVE" },
      {
        kind: "list",
        items: [
          "Week-by-week onboarding schedule and who owns each session.",
          "Licensing and appointment steps, by state and by carrier.",
          "Product training modules and the order they are taken in.",
          "Certification checkpoints and what happens if one is not met.",
          "The approved script set — see the Script Vault, which renders THRIVE's wording verbatim.",
        ],
      },
      {
        kind: "paragraph",
        text: "Until those are added, this page states what is missing rather than filling the space with generic advice.",
      },
    ],
  },
  {
    id: "incentive-plan",
    title: "Incentive Plan",
    summary: "Current agent incentives, as published by the agency.",
    icon: "◉",
    status: "approved",
    provenance:
      "Transcribed verbatim from the agency's published Incentive Plan graphic supplied by the owner on August 13, 2026. Figures are the agency's, not calculated here.",
    expires:
      "The $1,000 bonus is stated for August. Confirm whether it continues past August 31 or is removed.",
    blocks: [
      { kind: "quote", text: "We invest in you. You grow with us." },
      {
        kind: "numbered",
        items: [
          {
            title: "First 2 weeks of business expenses covered",
            body: "Less stress coming into a sales job so you can actually relax and learn to be self sufficient.",
          },
          {
            title: "Your first deal closed by a manager",
            body: "New agents that are onboarding will have their first deal closed by a manager to make sure you get paid as soon as you start the job and gain momentum.",
          },
          {
            title: "New agents reaching $5,000 in weekly submission during August personally get a flat $1,000 cash bonus",
            body: "Paid to the agent personally on reaching $5,000 in weekly submission during August.",
          },
        ],
      },
      {
        kind: "quote",
        text: "Your success is our mission. Let's win together.",
      },
      {
        kind: "paragraph",
        text: "Questions about eligibility, timing, or payment go to your manager or recruiter. This page reproduces the published plan; it does not interpret it, and it is not a contract.",
      },
    ],
  },
];
