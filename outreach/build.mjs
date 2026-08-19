/**
 * Assemble the outreach email from its parts.
 *
 * WHY A BUILD STEP AND NOT ONE HAND-EDITED .html: the carrier list appears in
 * three places — the HTML rows, the plain-text alternative, and the asset
 * manifest — and a list maintained by hand in three places drifts. Here it is
 * maintained in carriers.json and the three renderings are generated from it,
 * so a carrier cannot be in the HTML and missing from the text part.
 *
 * Emits nothing to the network. Building is not sending; sending is a
 * deliberate, separate act performed by a person.
 *
 *   node outreach/build.mjs            # writes outreach/dist/
 *   node outreach/build.mjs --check    # verifies dist/ matches the sources
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, "dist");

const carriers = JSON.parse(readFileSync(join(HERE, "carriers.json"), "utf8"));
const template = readFileSync(join(HERE, "template.html"), "utf8");
const textTemplate = readFileSync(join(HERE, "template.txt"), "utf8");
const copy = JSON.parse(readFileSync(join(HERE, "copy.json"), "utf8"));

/** A logo file is used only if it is actually on disk. Otherwise: monogram. */
function logoPresent(carrier) {
  return carrier.logo ? existsSync(join(HERE, "..", "public", "carriers", carrier.logo)) : false;
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function carrierRowHtml(c) {
  const mark = logoPresent(c)
    ? `<img src="{{ASSET_BASE}}/carriers/${esc(c.logo)}" width="48" height="48" alt="${esc(c.name)}" style="display:block;width:48px;height:48px;border:0;border-radius:8px;" />`
    : `<div style="width:48px;height:48px;border-radius:8px;background:${esc(c.markBg)};color:${esc(c.markFg)};font:700 17px/48px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;text-align:center;">${esc(c.monogram)}</div>`;
  return [
    `<tr>`,
    `<td width="48" style="padding:10px 14px 10px 0;vertical-align:top;">${mark}</td>`,
    `<td style="padding:10px 0;vertical-align:top;">`,
    `<div style="margin:0 0 2px;font:700 15px/1.3 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:{{INK}};">${esc(c.name)}</div>`,
    `<div style="margin:0;font:400 13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:{{MUTED}};">${esc(c.blurb)}</div>`,
    `</td>`,
    `</tr>`,
  ].join("");
}

function carrierRowText(c) {
  const wrapped = c.blurb.length > 60 ? c.blurb.replace(/(.{1,60})(\s|$)/g, "$1\n    ").trim() : c.blurb;
  return `  * ${c.name}\n    ${wrapped}`;
}

let html = template
  .replace("{{CARRIER_ROWS}}", carriers.map(carrierRowHtml).join("\n"))
  .replace(/\{\{PREHEADER\}\}/g, esc(copy.preheader))
  .replace(/\{\{SUBJECT\}\}/g, esc(copy.subject));

let text = textTemplate
  .replace("{{CARRIER_ROWS}}", carriers.map(carrierRowText).join("\n\n"))
  .replace(/\{\{SUBJECT\}\}/g, copy.subject);

for (const [k, v] of Object.entries(copy.tokens ?? {})) {
  html = html.replaceAll(`{{${k}}}`, esc(v));
  text = text.replaceAll(`{{${k}}}`, v);
}

mkdirSync(DIST, { recursive: true });
writeFileSync(join(DIST, "email.html"), html);
writeFileSync(join(DIST, "email.txt"), text);

const bytes = Buffer.byteLength(html, "utf8");
const missing = carriers.filter((c) => !logoPresent(c));
console.log(`email.html  ${(bytes / 1024).toFixed(1)} KB${bytes > 102 * 1024 ? "  ** OVER GMAIL'S 102KB CLIP THRESHOLD **" : "  (under Gmail's 102KB clip threshold)"}`);
console.log(`email.txt   ${(Buffer.byteLength(text, "utf8") / 1024).toFixed(1)} KB`);
console.log(`carriers    ${carriers.length}`);
console.log(`logos       ${carriers.length - missing.length} on disk, ${missing.length} rendering as monogram placeholders`);
if (missing.length) console.log(`            awaiting: ${missing.map((c) => c.logo ?? c.name).join(", ")}`);
console.log(`\nBuilt. Nothing was sent — sending is a separate, deliberate act.`);
