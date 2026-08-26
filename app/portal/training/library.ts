/**
 * IMO training library.
 *
 * CONTENT RULE — identical to the Script Vault rule.
 *
 * Every loaded body is human-authored and supplied by IMO. J.A.R.V.I.S.
 * may arrange, label, and render these records, but must never write, rewrite,
 * shorten, complete, or otherwise transform a body. A screenshot label without
 * supplied wording remains a labelled empty slot.
 *
 * Keep this module server-only: importing it from a `"use client"` file would
 * place protected training language in a public immutable asset.
 */

type ApprovedTrainingSlot = {
  id: string;
  label: string;
  /**
   * What this slot is for, in one line: which caller it covers and when it is
   * used. This is DESCRIPTION, not wording — it names the situation, never
   * what an agent says in it. It exists so a slot awaiting approved language
   * still tells a reader what belongs there. Keeping it a separate field from
   * `body` is the point: nothing here can be mistaken for approved language,
   * and the content rule above still governs `body` alone.
   */
  purpose?: string;
  state: "approved";
  body: string;
  source: string;
  labelCompleteness?: "complete" | "truncated";
};

type EmptyTrainingSlot = {
  id: string;
  label: string;
  /** See ApprovedTrainingSlot.purpose — description of the slot, never wording. */
  purpose?: string;
  state: "not_loaded";
  body?: never;
  source?: never;
  labelCompleteness?: "complete" | "truncated";
};

export type TrainingSlot = ApprovedTrainingSlot | EmptyTrainingSlot;

export const INTRODUCTION_SLOTS: readonly TrainingSlot[] = [
  {
    id: "direct-carrier-question-intro",
    label: "Direct Carrier Question Intro",
    purpose:
      "The caller opens by asking which carrier they have reached. Runs full verification and builds the policy snapshot before anything else.",
    state: "not_loaded",
  },
  {
    id: "client-states-problem-first",
    label: "Client States Problem First ...",
    purpose:
      "The caller leads with their problem instead of asking who they have reached, so the call starts from the concern rather than from verification.",
    state: "not_loaded",
    labelCompleteness: "truncated",
  },
  {
    id: "death-claim-discovery-intro",
    label: "Death Claim Discovery Intro",
    purpose:
      "The caller is raising a death claim. Establishes what has happened and which policy it concerns before any other question.",
    state: "not_loaded",
  },
  {
    id: "cancelation-intro",
    label: "Cancelation intro",
    purpose:
      "The caller wants to cancel. Covers the opening of a cancellation conversation.",
    state: "not_loaded",
  },
  {
    id: "quote-shopper-intro-for-cs",
    label: "Quote Shopper Intro for CS...",
    purpose:
      "The caller is comparison-shopping quotes rather than raising a problem with an existing policy.",
    state: "not_loaded",
    labelCompleteness: "truncated",
  },
  { id: "intro-tips-and-tricks", label: "Intro Tips and Tricks", purpose:
      "General guidance on handling openings. A reference for agents rather than a script read on a call.",
    state: "not_loaded" },
];

export const CALL_ANGLE_SLOTS: readonly TrainingSlot[] = [
  { id: "standard-to-preferred", label: "Standard To Preferred", purpose:
      "Conversations about moving a policy from a standard rating class to preferred.",
    state: "not_loaded",
  },
  { id: "term-to-perm", label: "Term To perm", purpose:
      "Conversations about converting term coverage to permanent coverage.",
    state: "not_loaded",
  },
  { id: "cash-surrender", label: "Cash Surrender", purpose:
      "The caller is asking about surrendering a policy for its cash value.",
    state: "not_loaded",
  },
  { id: "loan-forgiveness", label: "Loan Forgiveness", purpose:
      "Situations involving an outstanding policy loan.",
    state: "not_loaded",
  },
  { id: "death-claim-extension", label: "Death Claim Extension", purpose:
      "Death claim matters that continue beyond the first call.",
    state: "not_loaded",
  },
  { id: "non-insurance-extension", label: "Non Insurance Extension", purpose:
      "Matters the caller raises that fall outside insurance.",
    state: "not_loaded",
  },
  { id: "consolidation", label: "Consolidation", purpose:
      "Conversations about consolidating more than one policy.",
    state: "not_loaded",
  },
  { id: "work-policy", label: "Work Policy", purpose:
      "Coverage held through an employer or group plan.",
    state: "not_loaded",
  },
  { id: "quote-shopper-angle", label: "Quote Shopper Angle", purpose:
      "Callers weighing quotes against what they already hold.",
    state: "not_loaded",
  },
  { id: "three-option-close", label: "Three Option Close", purpose:
      "Coverage selection mid-application, where three priced options are put in front of the caller.",
    state: "not_loaded",
  },
  { id: "billing-page", label: "Billing Page", purpose:
      "The payment stage of the application: verifying payment details and setting up the draft.",
    state: "not_loaded",
  },
];

export const CLOSING_SLOTS: readonly TrainingSlot[] = [
  { id: "life-summary-and-consent", label: "Life Summary & Consent", purpose:
      "The compliance step before an application is submitted: the verbatim summary and the recorded verbal consent.",
    state: "not_loaded" },
];

/**
 * Split an approved body into the snippets an agent works from on a live call.
 *
 * This is a SPLIT, never a rewrite. Every character of `body` lands in exactly
 * one snippet, in order, including each snippet's own heading line and its
 * trailing whitespace — so `splitApprovedBody(b).map(s => s.text).join("") === b`
 * holds for any input. That identity is the whole safety argument: presentation
 * can rearrange where the text sits on the page, and still cannot add, drop, or
 * reorder a byte of approved language. A test asserts it against the rendered
 * HTML, not just against this function.
 *
 * Boundaries are the document's own section markers — STEP n, CORE RULES,
 * END STATE — so the snippets are the author's structure, not one imposed here.
 */
export type ScriptSnippet = { id: string; text: string };

export function splitApprovedBody(body: string): readonly ScriptSnippet[] {
  // `\d+[A-Z]?` and the leading-whitespace allowance are both load-bearing.
  // The Cancelation script branches at STEP 5A / STEP 5B — two mutually
  // exclusive paths an agent picks between on a live call — and one of them
  // is indented a single space in the source. A stricter `STEP \\d+ ` missed
  // both, fusing three steps into one 35-line snippet, so the branches could
  // not be separated on the page. It looked fine, too: the line classifier
  // bolds any line starting "STEP ", so the headings rendered correctly while
  // the split behind them was wrong. Match what the documents actually
  // contain, not what they were assumed to contain.
  const boundary = /\n(?=[ \t]*STEP \d+[A-Z]? —|CORE RULES\n|END STATE\n)/g;
  const parts: string[] = [];
  let cursor = 0;
  for (const match of body.matchAll(boundary)) {
    const index = match.index ?? 0;
    // +1 keeps the newline with the PRECEDING snippet, so nothing is dropped.
    parts.push(body.slice(cursor, index + 1));
    cursor = index + 1;
  }
  parts.push(body.slice(cursor));

  const snippets = parts
    .map((text, order) => ({ id: `part-${order}`, text }))
    .filter((snippet) => snippet.text.length > 0);

  // Fail loudly rather than render a silently lossy script.
  const rejoined = snippets.map((snippet) => snippet.text).join("");
  if (rejoined !== body) {
    throw new Error("splitApprovedBody lost or altered text — refusing to render");
  }
  return snippets;
}
