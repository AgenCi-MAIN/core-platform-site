import { access, appendFile, cp, mkdir, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

/**
 * Keeps `dist/client/.vite/manifest.json` out of the deployed assets.
 *
 * Wrangler's asset walker excludes only `.assetsignore`, `_redirects`,
 * `_headers`, and whatever `.assetsignore` itself lists — it has no dotfile or
 * hidden-directory rule, so the Vite build manifest is uploaded and served.
 * That file maps source paths to content-hashed chunk names, including the
 * portal's client components. An anonymous visitor never receives portal HTML
 * and so cannot guess `assets/manager-<hash>.js`; the manifest hands it to
 * them. Nothing secret is inside those chunks — a separate test enforces that —
 * but there is no reason to publish the map.
 *
 * `.assetsignore` is written by the Cloudflare plugin, and `dist/` is rebuilt
 * every time, so the entry is appended here rather than committed.
 */
async function hideBuildManifest(root: string): Promise<void> {
  const ignoreFile = resolve(root, "dist", "client", ".assetsignore");
  if (!(await exists(ignoreFile))) return;

  const current = await readFile(ignoreFile, "utf8");
  if (current.split(/\r?\n/).includes(".vite")) return;

  await appendFile(ignoreFile, current.endsWith("\n") ? ".vite\n" : "\n.vite\n");
}

// Packages Sites metadata and migrations after Vite finishes compiling.
export function sites(): Plugin {
  let root = process.cwd();

  return {
    name: "sites",
    apply: "build",
    configResolved(config) {
      root = config.root;
    },
    async closeBundle() {
      const outputDirectory = resolve(root, "dist", ".openai");
      const hostingConfig = resolve(root, ".openai", "hosting.json");
      const drizzleSource = resolve(root, "drizzle");

      await rm(outputDirectory, { recursive: true, force: true });
      await mkdir(outputDirectory, { recursive: true });

      if (await exists(hostingConfig)) {
        await cp(hostingConfig, resolve(outputDirectory, "hosting.json"));
      }
      if (await exists(drizzleSource)) {
        await cp(drizzleSource, resolve(outputDirectory, "drizzle"), {
          recursive: true,
        });
      }

      await hideBuildManifest(root);
    },
  };
}
