/**
 * THRIVE training library.
 *
 * CONTENT RULE — identical to the Script Vault rule.
 *
 * Every loaded body is human-authored and supplied by THRIVE. J.A.R.V.I.S.
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

export const DIRECT_CARRIER_QUESTION_INTRO_BODY = " Inbound Call Process — Variation 1\n\nDirect Carrier Question Introduction | Phase 1: Full Verification & Policy Snapshot\n\n\n\nSTEP 0 — Phone Answer\n\nSCRIPT:\n“Thank you for calling in, this is ___, how can I help you?”\n\n                          Holding\n\nPURPOSE:\nEstablishes professionalism, neutral authority, and immediate control.\n\nSTEP 1 — Carrier Question\n\nIf the caller asks: “Is this ___ Insurance?”\n\nSCRIPT:\n“That’s a carrier I can help you with. Do you have your policy number?”\n\n If YES: “Perfect — go ahead.”\n If NO: “No problem, I can verify you a different way.”\n\nPURPOSE:\nHandles the direct carrier question while maintaining authority and moving the call into verification.\n\n \n\nSTEP 2 — Begin Verification (Use the Word VERIFY)\n\nSCRIPT:\n\n“Verify your first and last name?” → “Could you spell that for me.” -> “Perfect”\n“Verify your date of birth?” -> “Perfect”\n\nPURPOSE:\nUsing the word 'verify' reinforces legitimacy. Saying 'Perfect' confirms completion and maintains authority.\n\n \n\nSTEP 3 — Reason for Call\n\nSCRIPT:\n\n“What can I help you with today?”\n\n\n\nAfter they explain:\n“Okay ___, I can definitely help you with that. I just need to verify a few more pieces of information.”\n\nPURPOSE:\nAcknowledges their concern, builds trust, and gains cooperation before financial verification.\n\n\n\nSTEP 4 — Policy Snapshot Verification (7 Required Pieces)\n\nYou must VERIFY all 7:\n • Name (spelled)\n • Date of Birth\n • Insurance Carrier -> Be careful not to ask if they already stated the company\n • Problem / Reason for Call\n • Monthly Premium\n • Coverage Amount\n • Policy Duration\n\nMonthly Premium:\n“Go ahead and verify your monthly premium for me.” → “Perfect.”\n\nIf client is unsure:\n“Do you have a recent bank statement we can verify that from?”\nIf not:\n“Is it more like under $50 a month or over $100?”\n\nCoverage Amount:\n“Go ahead and verify your coverage amount for me.” → “Perfect.”\n\nIf client is unsure (Range Narrowing Technique):\n“Do you remember if it’s more like $5,000 or $10,000?”\n If not:\n“Or is it more like $100,000 or $200,000?”\n\nPolicy Duration:\n“Just so I can get this pulled up a bit easier — about how long have you had it?” → “Perfect.”\n\n\n\n\n\n\n\nAdditional Policies:\n\n“And I don’t want to get confused when pulling up your info, but do you have any other existing life insurance with any other companies?”\n\nIf Yes, get carrier, monthly premium, coverage amount, and how long ago.\n\nIf not, move on to Step 5.\n\n\nPURPOSE:\nThe goal is categorization, not exact math. Identify policy type and size. Small range (5k–20k) likely Final Expense. Mid range (50k–150k) likely Term. Higher range (200k+) larger coverage. Always maintain calm, analytical authority.\n\n \n\nSTEP 5 — Hold Transition\n\nSCRIPT:\n“Alright [CLIENT NAME], I can definitely help you out with [Re-address the problem]. I just need to put you on a brief hold while I get everything pulled up on my end. And just in case we get disconnected, I will call you back from an [859] #. That’s my direct line, just so you don’t have to start over with someone else. Again, this is [YOUR NAME], I’m here to help. I’ll be right back. I just need about 2-3 minutes.”\n\nPURPOSE:\nCreates professionalism and legitimacy. Allows reset before the analysis phase.\n\nCORE RULES\n\n• Always use the word 'verify'.\n• Always confirm answers with 'Perfect.'\n• Do NOT sell during Phase 1.\n• Follow the order!\n• If the client does not know numbers, narrow the range — do not guess.\n\nEND STATE\n\nThe client believes you are reviewing their policy.\nThe agent has verified all 7 required data points and understands approximate policy type and size.\n\n";

export const INTRODUCTION_SLOTS: readonly TrainingSlot[] = [
  {
    id: "direct-carrier-question-intro",
    label: "Direct Carrier Question Intro",
    purpose:
      "The caller opens by asking which carrier they have reached. Runs full verification and builds the policy snapshot before anything else.",
    state: "approved",
    body: DIRECT_CARRIER_QUESTION_INTRO_BODY,
    source: "Owner-supplied Word document",
  },
  {
    id: "client-states-problem-first",
    label: "Client States Problem First ...",
    purpose:
      "The caller leads with their problem instead of asking who they have reached, so the call starts from the concern rather than from verification.",
    state: "not_loaded",
    labelCompleteness: "truncated",
  },
  { id: "death-claim-discovery-intro", label: "Death Claim Discovery Intro", purpose:
      "The caller is raising a death claim. Establishes what has happened and which policy it concerns before any other question.",
    state: "not_loaded" },
  { id: "non-life-discovery-intro", label: "Non life Discovery Intro", purpose:
      "The caller's product is not life insurance. Separates the call from the life-policy path early.",
    state: "not_loaded" },
  { id: "cancelation-intro", label: "Cancelation intro", purpose:
      "The caller wants to cancel. Covers the opening of a cancellation conversation.",
    state: "not_loaded" },
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
    state: "not_loaded" },
  { id: "term-to-perm", label: "Term To perm", purpose:
      "Conversations about converting term coverage to permanent coverage.",
    state: "not_loaded" },
  { id: "cash-surrender", label: "Cash Surrender", purpose:
      "The caller is asking about surrendering a policy for its cash value.",
    state: "not_loaded" },
  { id: "loan-forgiveness", label: "Loan Forgiveness", purpose:
      "Situations involving an outstanding policy loan.",
    state: "not_loaded" },
  { id: "death-claim-extension", label: "Death Claim Extension", purpose:
      "Death claim matters that continue beyond the first call.",
    state: "not_loaded" },
  { id: "non-insurance-extension", label: "Non Insurance Extension", purpose:
      "Matters the caller raises that fall outside insurance.",
    state: "not_loaded" },
  { id: "consolidation", label: "Consolidation", purpose:
      "Conversations about consolidating more than one policy.",
    state: "not_loaded" },
  { id: "work-policy", label: "Work Policy", purpose:
      "Coverage held through an employer or group plan.",
    state: "not_loaded" },
  { id: "quote-shopper-angle", label: "Quote Shopper Angle", purpose:
      "Callers weighing quotes against what they already hold.",
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
  const boundary = /\n(?=STEP \d+ —|CORE RULES\n|END STATE\n)/g;
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
