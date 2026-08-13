/**
 * THRIVE live call script library.
 *
 * CONTENT RULE — this is the whole point of this file.
 *
 * Script text is AUTHORED AND OWNED BY THRIVE. J.A.R.V.I.S. must not write,
 * rewrite, reword, shorten, "improve", summarise, or generate any value of the
 * `body` field. Presentation is free to change; the words agents say on a live
 * call are not. Compliance-reviewed language stops being compliance-reviewed
 * the moment an AI edits it.
 *
 * If a script needs changing, a human changes it and records the revision.
 *
 * To add a script: append an entry below with the text exactly as approved.
 * The vault renders whatever is here. When the list is empty it renders a
 * labelled empty state rather than inventing filler.
 */

export type CallScript = {
  /** Stable id, used as the React key and the anchor. */
  id: string;
  /** Script name as THRIVE refers to it. */
  title: string;
  /** Where in a call this is used. */
  stage: string;
  /** The approved words, verbatim. NEVER AI-authored or AI-edited. */
  body: string;
  /** Named human who owns this script's content. */
  owner: string;
  /** Compliance review state, set by a human. */
  status: "approved" | "in_review" | "retired";
  /** Version label THRIVE maintains. */
  version: string;
  /** ISO date this version took effect. */
  effectiveFrom: string;
};

export const CALL_SCRIPTS: readonly CallScript[] = [];

export const SCRIPT_STATUS_LABELS: Record<CallScript["status"], string> = {
  approved: "Approved",
  in_review: "In review",
  retired: "Retired",
};
