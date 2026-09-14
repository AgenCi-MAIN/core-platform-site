#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { extname } from "node:path";

// Inventory only. No file contents, addresses, identifiers, or filenames are
// emitted. Findings require review; a clean result is not a security guarantee.
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--check")) {
  process.stderr.write("Usage: node scripts/audit-source-privacy.mjs [--check]\n");
  process.exit(2);
}
const tracked = spawnSync("git", ["ls-files", "-z"], {
  encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
});
if (tracked.error || tracked.status !== 0) {
  process.stderr.write("Cannot enumerate tracked files. Run inside the repository.\n");
  process.exit(2);
}
const extensions = new Set([".md", ".json", ".jsonc", ".sql", ".ts", ".tsx", ".mjs", ".js", ".yaml", ".yml", ".txt"]);
const rules = [
  { kind: "personal-email-candidate", regex: /[A-Z0-9._%+-]+@(gmail\.com|pm\.me|outlook\.com|hotmail\.com|yahoo\.com|icloud\.com)\b/gi },
  { kind: "windows-user-path", regex: /C:(?:\\{1,2}|\/)Users(?:\\{1,2}|\/)[^\s\\/"'`]+/gi },
  // Account identifiers are not credentials. This broad signal also matches
  // hashes and other IDs, so it must not be presented as a credential finding.
  { kind: "hex-identifier-candidate", regex: /\b[0-9a-f]{32}\b/gi },
];
const totals = rules.map(({ kind }) => ({ kind, files: 0, occurrences: 0 }));
let inspected = 0;
let skipped = 0;
let errors = 0;
for (const file of tracked.stdout.split("\0").filter(Boolean)) {
  if (!extensions.has(extname(file)) || /(?:package-lock|pnpm-lock|yarn\.lock)/.test(file)) continue;
  try {
    const stat = lstatSync(file);
    if (!stat.isFile() || stat.size > 5 * 1024 * 1024) { skipped++; continue; }
    const content = readFileSync(file, "utf8");
    if (content.includes("\0")) { skipped++; continue; }
    inspected++;
    for (const [index, rule] of rules.entries()) {
      const count = Array.from(content.matchAll(rule.regex)).length;
      if (count) { totals[index].files++; totals[index].occurrences += count; }
    }
  } catch { errors++; }
}
process.stdout.write(JSON.stringify({
  scope: "tracked working-tree text; excludes history, binary files, and untracked files",
  inspected, skipped, errors, findings: totals,
}, null, 2) + "\n");
if (errors) process.exitCode = 2;
else if (args.includes("--check") && totals.some(({ files }) => files > 0)) process.exitCode = 1;
