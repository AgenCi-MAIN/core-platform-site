/**
 * Preflight for `wrangler deploy`. Refuses to let a deploy proceed when the
 * artifact on disk is not the artifact you think it is.
 *
 * This exists because of a failure that already happened here and was expensive
 * precisely because it was silent. The npm scripts once began with Unix-only
 * inline environment syntax (`FOO=bar vinext build`), which cmd.exe cannot
 * parse. `npm run build` failed instantly and near-invisibly, and every
 * subsequent `wrangler deploy` shipped whatever `dist/` last held — for days,
 * reporting the placeholder database id long after the real one was committed.
 * Nothing in that loop ever said "this is stale". A deploy looked successful
 * every time.
 *
 * Every check below is one that would have caught it, or catches the next
 * version of it. All of them are cheap; none of them touch the network or need
 * Cloudflare credentials, so this is safe to run anywhere.
 *
 *   node scripts/verify-build.mjs        # from the repository root
 *
 * Exits non-zero with an explanation on the first failure, so it can sit in the
 * middle of a `&&` chain.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const PLACEHOLDER_D1 = "00000000-0000-4000-8000-000000000000";

/** Source trees whose changes must be reflected in dist/ before a deploy. */
const SOURCE_DIRS = ["app", "db", "build", "worker", "public"];
const SOURCE_FILES = [
  "next.config.ts",
  "vite.config.ts",
  "package.json",
  ".openai/hosting.json",
];

/** Files the client bundle must carry for the installable app to work. */
const REQUIRED_ASSETS = [
  "sw.js",
  "offline.html",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "apple-touch-icon.png",
];

const problems = [];

function fail(headline, detail) {
  problems.push({ headline, detail });
}

async function newestMtime(target) {
  let newest = 0;
  let newestPath = target;
  const entry = await stat(target).catch(() => null);
  if (!entry) return { mtime: 0, file: target };
  if (entry.isFile()) return { mtime: entry.mtimeMs, file: target };

  const stack = [target];
  while (stack.length) {
    const dir = stack.pop();
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const item of entries) {
      // Build output and dependencies are not sources.
      if (item.name === "node_modules" || item.name === ".wrangler") continue;
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        stack.push(full);
        continue;
      }
      const info = await stat(full).catch(() => null);
      if (info && info.mtimeMs > newest) {
        newest = info.mtimeMs;
        newestPath = full;
      }
    }
  }
  return { mtime: newest, file: newestPath };
}

/* ---------------- 1. the artifact exists at all ---------------- */

const wranglerPath = path.join(root, "dist/server/wrangler.json");
const workerPath = path.join(root, "dist/server/index.js");

const wranglerRaw = await readFile(wranglerPath, "utf8").catch(() => null);
if (wranglerRaw === null) {
  fail(
    "No build output.",
    `${path.relative(root, wranglerPath)} does not exist. Run \`npm run build\` first — deploying now would ship nothing or something ancient.`,
  );
}

const workerStat = await stat(workerPath).catch(() => null);
if (!workerStat) {
  fail(
    "No worker bundle.",
    `${path.relative(root, workerPath)} does not exist. The build did not finish.`,
  );
} else if (workerStat.size < 10_000) {
  fail(
    "The worker bundle is implausibly small.",
    `${path.relative(root, workerPath)} is ${workerStat.size} bytes. A real build of this app is far larger; something failed partway.`,
  );
}

/* ---------------- 2. the bindings are the real ones ---------------- */

let built = null;
if (wranglerRaw !== null) {
  try {
    built = JSON.parse(wranglerRaw);
  } catch {
    fail("The generated wrangler config is not valid JSON.", `Rebuild: \`npm run build\`.`);
  }
}

const hostingRaw = await readFile(path.join(root, ".openai/hosting.json"), "utf8").catch(
  () => null,
);
const hosting = hostingRaw ? JSON.parse(hostingRaw) : null;

if (built) {
  const d1 = built.d1_databases?.[0];
  if (!d1) {
    fail(
      "No D1 binding in the built config.",
      "The portal fails closed without a database, so every member would be refused. Check `.openai/hosting.json`.",
    );
  } else if (d1.database_id === PLACEHOLDER_D1) {
    fail(
      "The build carries the placeholder database id.",
      `This is the exact stale-build failure documented in CORE_PLATFORM_RECORD.md § 9.2. The build did not pick up \`.openai/hosting.json\`, or it did not run at all. Deploying this points the live worker at a database that does not exist.`,
    );
  } else if (hosting?.d1_database_id && d1.database_id !== hosting.d1_database_id) {
    fail(
      "The built database id does not match the committed one.",
      `Built: ${d1.database_id}\nCommitted in .openai/hosting.json: ${hosting.d1_database_id}\nThe build output is stale. Rebuild before deploying.`,
    );
  }

  if (hosting?.r2 && !built.r2_buckets?.some((bucket) => bucket.binding === hosting.r2)) {
    fail(
      `No ${hosting.r2} R2 binding in the built config.`,
      "Call recordings and music uploads write to R2. Without the binding they fail at runtime, not at deploy.",
    );
  }

  if (built.assets?.directory !== "../client") {
    fail(
      "The assets directory is not what the build normally emits.",
      `Found: ${JSON.stringify(built.assets?.directory)}. Static files — including the service worker — may not be served.`,
    );
  }
}

/* ---------------- 3. the build is newer than the source ---------------- */

if (workerStat) {
  let newest = { mtime: 0, file: "" };
  for (const target of [...SOURCE_DIRS, ...SOURCE_FILES]) {
    const found = await newestMtime(path.join(root, target));
    if (found.mtime > newest.mtime) newest = found;
  }
  // A second of slack: some filesystems round mtimes, and the build itself
  // touches nothing under the source trees.
  if (newest.mtime > workerStat.mtimeMs + 1000) {
    fail(
      "The build output is older than the source.",
      `${path.relative(root, newest.file)} was modified after the last build.\nDeploying now would ship the previous version of the site and report success. Run \`npm run build\`.`,
    );
  }
}

/* ---------------- 4. the installable app shipped ---------------- */

const clientDir = path.join(root, "dist/client");
const clientFiles = new Set(await readdir(clientDir).catch(() => []));
const missingAssets = REQUIRED_ASSETS.filter((name) => !clientFiles.has(name));
if (clientFiles.size === 0) {
  fail("dist/client is empty or missing.", "No static assets would be served at all.");
} else if (missingAssets.length > 0) {
  fail(
    "Installable-app files are missing from the build.",
    `Missing: ${missingAssets.join(", ")}\nAnyone who already installed the portal to a phone keeps the old service worker and gets no updated icons.`,
  );
}

/* ---------------- report ---------------- */

if (problems.length === 0) {
  const id = built?.d1_databases?.[0]?.database_id ?? "unknown";
  console.log("Build verified — safe to deploy.");
  console.log(`  worker    dist/server/index.js (${Math.round((workerStat?.size ?? 0) / 1024)} KB)`);
  console.log(`  database  ${id}`);
  console.log(`  assets    ${clientFiles.size} files in dist/client`);
  process.exit(0);
}

console.error(`\nDeploy blocked — ${problems.length} problem${problems.length === 1 ? "" : "s"} with the build on disk:\n`);
for (const [index, problem] of problems.entries()) {
  console.error(`${index + 1}. ${problem.headline}`);
  for (const line of problem.detail.split("\n")) console.error(`   ${line}`);
  console.error("");
}
process.exit(1);
