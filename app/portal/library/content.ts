/**
 * IMO portal library — the documents members read.
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
 * describes how IMO works from the operating model already recorded; it does
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

/**
 * PENDING — emptied 2026-08-26 for the IMO Operating Portal changeover.
 *
 * These documents described the previous operator and its operating model.
 * They are not deleted, only unpublished: the full set is restorable from the
 * git ref `backup/thrive-content-2026-08-26`. The incoming IMO's own documents
 * go here, each one added deliberately rather than carried over.
 */
export const LIBRARY: readonly LibraryDocument[] = [];
