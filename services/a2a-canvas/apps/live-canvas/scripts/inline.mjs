// Folds the Vite build in dist/ into two single-file outputs:
//   dist/index.html    — standalone page (doctype, head, body) for local opening
//   dist/artifact.html — body fragment (title + style + markup + inline script),
//                        the shape the claude.ai Artifact publisher expects.
// Run after `vite build`: node scripts/inline.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dist = join(here, '..', 'dist')
const htmlPath = join(dist, 'index.html')
if (!existsSync(htmlPath)) throw new Error('dist/index.html missing — run vite build first')
let html = readFileSync(htmlPath, 'utf8')
const assets = join(dist, 'assets')
const files = existsSync(assets) ? readdirSync(assets) : []

for (const f of files) {
  const body = readFileSync(join(assets, f), 'utf8')
  if (f.endsWith('.js')) {
    const re = new RegExp(`<script[^>]*src="\\./assets/${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*></script>`)
    html = html.replace(re, () => `<script type="module">\n${body.replace(/<\/script/g, '<\\/script')}\n</script>`)
  } else if (f.endsWith('.css')) {
    const re = new RegExp(`<link[^>]*href="\\./assets/${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`)
    html = html.replace(re, () => `<style>\n${body}\n</style>`)
  }
}
writeFileSync(htmlPath, html)

// Artifact fragment: strip the document skeleton, keep <title>, <style>, markup, scripts.
const title = (html.match(/<title>[\s\S]*?<\/title>/) || [''])[0]
const styles = [...html.matchAll(/<style>[\s\S]*?<\/style>/g)].map((m) => m[0]).join('\n')
const bodyInner = (html.match(/<body[^>]*>([\s\S]*)<\/body>/) || ['', ''])[1]
writeFileSync(join(dist, 'artifact.html'), `${title}\n${styles}\n${bodyInner.trim()}\n`)
console.log(`inlined ${files.length} asset(s) → dist/index.html, dist/artifact.html`)
