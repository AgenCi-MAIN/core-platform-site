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

/**
 * Absolute origin the email's <img> tags point at. It MUST NOT be the portal
 * worker domain: Cloudflare Access fronts that host, an inbox fetches images
 * anonymously, and Gmail re-fetches through its own proxy — so every logo would
 * be answered with a redirect to a login page and render as a broken image for
 * every recipient. Point this at a public origin with no Access policy.
 */
const ASSET_BASE = process.env.OUTREACH_ASSET_BASE ?? "https://REPLACE-WITH-PUBLIC-ORIGIN.example";

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

/**
 * One carrier row: a fixed 120x40 mark box, then the name and descriptor.
 *
 * The box is LANDSCAPE and uniform because carrier logos are wordmarks whose
 * native art here runs 46-120px tall. Dropped in at native size they sit on
 * different baselines and the column looks broken, so every file is fitted and
 * centred on one 240x80 canvas (2x of the display box) at build time.
 *
 * The canvas is OPAQUE WHITE, not transparent, which is the opposite of the
 * right answer on the web. Dark-mode clients recolour backgrounds but cannot
 * recolour pixels inside an image, so a transparent PNG of a navy wordmark
 * becomes invisible ink on a dark surface. An opaque tile keeps the mark legible
 * and keeps the carrier's colours exact, which is what brand guidelines require.
 *
 * alt="" is deliberate and is NOT a missing attribute. The carrier's name sits
 * beside the logo as live text, so a non-empty alt makes a screen reader say
 * the name twice, twenty-nine times over. An image whose information is already
 * present as text is decorative. Note the distinction that matters: alt=""
 * prunes the image from the accessibility tree silently, whereas OMITTING alt
 * makes readers fall back to announcing the src URL character by character.
 */
function carrierRowHtml(c) {
  const box = logoPresent(c)
    ? `<img src="${esc(ASSET_BASE)}/carriers/${esc(c.logo)}" width="120" height="40" alt="" style="display:block; width:120px; height:40px; border:0; outline:none; text-decoration:none; background-color:#ffffff; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:40px; font-weight:bold; text-align:center; color:#241b10;" />`
    : `<div style="width:120px; height:40px; background-color:${esc(c.markBg)}; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:40px; font-weight:bold; letter-spacing:2px; text-align:center; color:${esc(c.markFg)};">${esc(c.monogram)}</div>`;

  return `                <tr>
                  <td class="dm-rule" style="padding:11px 0; border-bottom:1px solid #e8dcc8;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;">
                      <tr>
                        <td width="120" valign="middle" bgcolor="#ffffff" style="width:120px; background-color:#ffffff; border:1px solid #e8dcc8; border-radius:5px;">${box}</td>
                        <td width="14" style="width:14px; font-size:0; line-height:0;">&nbsp;</td>
                        <td valign="middle" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                          <div class="dm-ink" style="font-size:15px; line-height:20px; mso-line-height-rule:exactly; font-weight:bold; color:#241b10;">${esc(c.name)}</div>
                          <div class="dm-muted" style="margin-top:3px; font-size:13px; line-height:18px; mso-line-height-rule:exactly; color:#5f5340;">${esc(c.blurb)}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`;
}

/** Plain text, wrapped at 72 columns as the text part requires. */
function carrierRowText(c) {
  const words = c.blurb.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > 60) { lines.push(line.trim()); line = w; }
    else line = (line + " " + w).trim();
  }
  if (line) lines.push(line.trim());
  return `  * ${c.name}\n${lines.map((l) => "      " + l).join("\n")}`;
}

let html = template
  .replace("{{CARRIER_ROWS}}", carriers.map(carrierRowHtml).join("\n"))
  .replaceAll("{{PREHEADER}}", esc(copy.preheader))
  .replaceAll("{{SUBJECT}}", esc(copy.subject));

let text = textTemplate.replace("{{CARRIER_ROWS}}", carriers.map(carrierRowText).join("\n\n"));

// Copy tokens are authored content, not untrusted input, so they go in as
// written — the HTML copy may legitimately contain entities like &mdash;, and
// escaping here would print the entity rather than the dash. Carrier fields
// above ARE escaped, because that is data and the two must not be confused.
for (const [k, v] of Object.entries(copy.tokens ?? {})) {
  html = html.replaceAll(`{{${k}}}`, v);
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
