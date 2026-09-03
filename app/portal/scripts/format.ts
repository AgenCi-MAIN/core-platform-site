/**
 * Presentation-only formatting for imported script bodies.
 *
 * The bodies in library.ts are the verbatim export of the canonical document,
 * which carries Markdown-style markers: `#` heading prefixes, and `*`/`**`/
 * `***` emphasis pairs. This module turns those markers into STRUCTURE (a
 * heading level, bold, italic) and nothing else. It never adds, drops,
 * reorders, or rewords a character of the words themselves.
 *
 * THE FIDELITY CONTRACT. `plainText(body)` is the deterministic projection of
 * a body with exactly the recognised markers removed. The page renders a body
 * through `formatBody`, and a runtime test asserts that the rendered <pre>'s
 * text content equals `plainText(body)` byte for byte for all eighteen
 * scripts. So presentation can bold a phrase or size a heading, and still
 * cannot change what an agent reads.
 *
 * Only WELL-FORMED emphasis pairs are recognised: the same run of one to
 * three asterisks on both sides, on one line, wrapping text that neither
 * starts nor ends with a space or an asterisk, and with neither delimiter
 * touching a word character or another asterisk on its outer side. Anything
 * else — a lone `*`, a run like `****` the export produced around a line
 * break, the `$***` blanks in the angle scripts — is left in the text exactly
 * as it is. A marker the rule cannot read is shown, never silently eaten, and
 * because a removed pair can never create a new pair, the projection is
 * idempotent (a test asserts it).
 *
 * Pure and import-free: usable from the server page and from tests alike.
 */

export type Segment = { text: string; bold: boolean; italic: boolean };

export type FormattedLine = {
  /** `heading` when the line opened with `# `…`###### `; otherwise `text`. */
  kind: "heading" | "text";
  /** 1–6 for a heading, 0 for text. */
  level: number;
  segments: Segment[];
};

const HEADING = /^(#{1,6}) (.*)$/;

/**
 * Same-length delimiter on both sides (backreference), non-empty inner text,
 * no asterisk inside, no leading or trailing space or asterisk.
 */
const EMPHASIS = /(?<![\w*])(\*{1,3})([^\s*](?:[^*\n]*?[^\s*])?)\1(?![\w*])/g;

function segmentsOf(text: string): Segment[] {
  const out: Segment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(EMPHASIS)) {
    const index = match.index ?? 0;
    if (index > cursor) out.push({ text: text.slice(cursor, index), bold: false, italic: false });
    const run = match[1].length;
    out.push({ text: match[2], bold: run >= 2, italic: run === 1 || run === 3 });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), bold: false, italic: false });
  return out;
}

export function formatLine(line: string): FormattedLine {
  const heading = line.match(HEADING);
  if (heading) {
    return { kind: "heading", level: heading[1].length, segments: segmentsOf(heading[2]) };
  }
  return { kind: "text", level: 0, segments: segmentsOf(line) };
}

export function formatBody(body: string): FormattedLine[] {
  return body.split("\n").map(formatLine);
}

/** The text an agent reads: the body with exactly the recognised markers removed. */
export function plainText(body: string): string {
  return formatBody(body)
    .map((line) => line.segments.map((segment) => segment.text).join(""))
    .join("\n");
}
