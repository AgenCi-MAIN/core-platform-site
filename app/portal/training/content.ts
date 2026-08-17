/**
 * THRIVE training library — Training · Introductions · Call Angles.
 *
 * CONTENT RULE — identical to the Script Vault's (app/portal/scripts/library.ts),
 * and it is the whole point of this file:
 *
 * Body text is AUTHORED AND OWNED BY THRIVE. J.A.R.V.I.S. must not write,
 * rewrite, reword, shorten, "improve", summarise, or generate any value of the
 * `body` field. A `body: null` entry is a labelled empty slot — the item exists
 * on the page with its real name and an "awaiting content" state, and NOTHING
 * is invented to fill it. Compliance-reviewed language stops being
 * compliance-reviewed the moment an AI edits it.
 *
 * Slot names come from the owner's own category lists (screenshots, 2026-08-17).
 * Two titles were truncated at the source and are marked `titleTruncated` —
 * confirm the full name with the owner before renaming; do not guess the rest.
 *
 * COORDINATION NOTE for other agents on this build: this file is the single
 * source of truth for training content. Add content by filling a `body` with
 * human-approved text verbatim; add slots by appending entries. Do not fork a
 * second content file.
 */

export type TrainingSection = "training" | "introductions" | "angles";

export type TrainingDoc = {
  /** Stable id, used as the React key and the anchor. */
  id: string;
  /** Name as THRIVE refers to it (verbatim from the owner's lists). */
  title: string;
  section: TrainingSection;
  /** The approved words, verbatim — or null for a labelled empty slot. NEVER AI-authored. */
  body: string | null;
  /** True when the source list truncated the name; confirm before renaming. */
  titleTruncated?: boolean;
  /** Named human who owns this content. */
  owner: string;
  status: "approved" | "in_review" | "retired";
  version: string;
  /** ISO date this version took effect. */
  effectiveFrom: string;
};

const OWNER = "Yuxiang Mao (Shawn)";
const SLOT = {
  body: null,
  owner: OWNER,
  status: "in_review" as const,
  version: "—",
  effectiveFrom: "—",
};

export const TRAINING_DOCS: readonly TrainingDoc[] = [
  // ── Introductions ────────────────────────────────────────────────────────
  {
    id: "direct-carrier-question-intro",
    title: "Direct Carrier Question Intro",
    section: "introductions",
    // Verbatim from the owner's upload my_script_1.docx (2026-08-17),
    // extracted character-for-character including source spacing.
    body: " Inbound Call Process \u2014 Variation 1\nDirect Carrier Question Introduction | Phase 1: Full Verification & Policy Snapshot\n\nSTEP 0 \u2014 Phone Answer\nSCRIPT:\u201cThank you for calling in, this is ___, how can I help you?\u201d\n                          Holding\nPURPOSE:Establishes professionalism, neutral authority, and immediate control.\nSTEP 1 \u2014 Carrier Question\nIf the caller asks: \u201cIs this ___ Insurance?\u201dSCRIPT:\u201cThat\u2019s a carrier I can help you with. Do you have your policy number?\u201d If YES: \u201cPerfect \u2014 go ahead.\u201d If NO: \u201cNo problem, I can verify you a different way.\u201dPURPOSE:Handles the direct carrier question while maintaining authority and moving the call into verification.\n \nSTEP 2 \u2014 Begin Verification (Use the Word VERIFY)\nSCRIPT:\u201cVerify your first and last name?\u201d \u2192 \u201cCould you spell that for me.\u201d -> \u201cPerfect\u201d\u201cVerify your date of birth?\u201d -> \u201cPerfect\u201dPURPOSE:Using the word 'verify' reinforces legitimacy. Saying 'Perfect' confirms completion and maintains authority.\n \nSTEP 3 \u2014 Reason for Call\nSCRIPT:\n\u201cWhat can I help you with today?\u201d\n\nAfter they explain:\u201cOkay ___, I can definitely help you with that. I just need to verify a few more pieces of information.\u201dPURPOSE:Acknowledges their concern, builds trust, and gains cooperation before financial verification.\n\nSTEP 4 \u2014 Policy Snapshot Verification (7 Required Pieces)\nYou must VERIFY all 7: \u2022 Name (spelled) \u2022 Date of Birth \u2022 Insurance Carrier -> Be careful not to ask if they already stated the company \u2022 Problem / Reason for Call \u2022 Monthly Premium \u2022 Coverage Amount \u2022 Policy DurationMonthly Premium:\u201cGo ahead and verify your monthly premium for me.\u201d \u2192 \u201cPerfect.\u201dIf client is unsure:\u201cDo you have a recent bank statement we can verify that from?\u201dIf not:\u201cIs it more like under $50 a month or over $100?\u201dCoverage Amount:\u201cGo ahead and verify your coverage amount for me.\u201d \u2192 \u201cPerfect.\u201dIf client is unsure (Range Narrowing Technique):\u201cDo you remember if it\u2019s more like $5,000 or $10,000?\u201d If not:\u201cOr is it more like $100,000 or $200,000?\u201dPolicy Duration:\u201cJust so I can get this pulled up a bit easier \u2014 about how long have you had it?\u201d \u2192 \u201cPerfect.\u201d\n\n\n\nAdditional Policies:\n\u201cAnd I don\u2019t want to get confused when pulling up your info, but do you have any other existing life insurance with any other companies?\u201d\nIf Yes, get carrier, monthly premium, coverage amount, and how long ago.\nIf not, move on to Step 5.\nPURPOSE:The goal is categorization, not exact math. Identify policy type and size. Small range (5k\u201320k) likely Final Expense. Mid range (50k\u2013150k) likely Term. Higher range (200k+) larger coverage. Always maintain calm, analytical authority.\n \nSTEP 5 \u2014 Hold Transition\nSCRIPT:\u201cAlright [CLIENT NAME], I can definitely help you out with [Re-address the problem]. I just need to put you on a brief hold while I get everything pulled up on my end. And just in case we get disconnected, I will call you back from an [859] #. That\u2019s my direct line, just so you don\u2019t have to start over with someone else. Again, this is [YOUR NAME], I\u2019m here to help. I\u2019ll be right back. I just need about 2-3 minutes.\u201dPURPOSE:Creates professionalism and legitimacy. Allows reset before the analysis phase.\nCORE RULES\n\u2022 Always use the word 'verify'.\u2022 Always confirm answers with 'Perfect.'\u2022 Do NOT sell during Phase 1.\u2022 Follow the order!\u2022 If the client does not know numbers, narrow the range \u2014 do not guess.\nEND STATE\nThe client believes you are reviewing their policy.The agent has verified all 7 required data points and understands approximate policy type and size.\n",
    owner: OWNER,
    status: "approved",
    version: "Variation 1",
    effectiveFrom: "2026-08-17",
  },
  { id: "client-states-problem-first", title: "Client States Problem First …", section: "introductions", titleTruncated: true, ...SLOT },
  { id: "death-claim-discovery-intro", title: "Death Claim Discovery Intro", section: "introductions", ...SLOT },
  { id: "non-life-discovery-intro", title: "Non life Discovery Intro", section: "introductions", ...SLOT },
  { id: "cancelation-intro", title: "Cancelation intro", section: "introductions", ...SLOT },
  { id: "quote-shopper-intro-for-cs", title: "Quote Shopper Intro for CS…", section: "introductions", titleTruncated: true, ...SLOT },
  { id: "intro-tips-and-tricks", title: "Intro Tips and Tricks", section: "introductions", ...SLOT },

  // ── Call Angles ──────────────────────────────────────────────────────────
  { id: "standard-to-preferred", title: "Standard To Preferred", section: "angles", ...SLOT },
  { id: "term-to-perm", title: "Term To perm", section: "angles", ...SLOT },
  { id: "cash-surrender", title: "Cash Surrender", section: "angles", ...SLOT },
  { id: "loan-forgiveness", title: "Loan Forgiveness", section: "angles", ...SLOT },
  { id: "death-claim-extension", title: "Death Claim Extension", section: "angles", ...SLOT },
  { id: "non-insurance-extension", title: "Non Insurance Extension", section: "angles", ...SLOT },
  { id: "consolidation", title: "Consolidation", section: "angles", ...SLOT },
  { id: "work-policy", title: "Work Policy", section: "angles", ...SLOT },
  { id: "quote-shopper-angle", title: "Quote Shopper Angle", section: "angles", ...SLOT },

  // ── Training ─────────────────────────────────────────────────────────────
  // No modules named yet. The section renders a labelled empty state until a
  // human supplies them; entries go here when they do.
];

export const TRAINING_SECTION_LABELS: Record<TrainingSection, { title: string; description: string }> = {
  training: { title: "Training", description: "Core training modules, in the order THRIVE teaches them." },
  introductions: { title: "Introductions", description: "Approved call openings — one per inbound situation." },
  angles: { title: "Call Angles", description: "Approved angles for the analysis phase, by policy situation." },
};

export const TRAINING_STATUS_LABELS: Record<TrainingDoc["status"], string> = {
  approved: "Approved",
  in_review: "Awaiting content",
  retired: "Retired",
};
