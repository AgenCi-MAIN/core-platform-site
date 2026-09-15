// Folds the Vite build in dist/ into two single-file outputs:
//   dist/index.html    — standalone page (doctype, head, body) for local opening
//   dist/artifact.html — body fragment (title + style + markup + inline script),
//                        the shape the claude.ai Artifact publisher expects.
// Run after `vite build`: node scripts/inline.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dist = join(here, '..', 'dist')
const htmlPath = join(dist, 'index.html')
if (!existsSync(htmlPath)) throw new Error('dist/index.html missing — run vite build first')
let html = readFileSync(htmlPath, 'utf8')
const assets = join(dist, 'assets')
const files = existsSync(assets) ? readdirSync(assets) : []
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

for (const f of files) {
  const body = readFileSync(join(assets, f), 'utf8')
  if (f.endsWith('.js')) {
    html = html.replace(new RegExp(`<script[^>]*src="\\./assets/${esc(f)}"[^>]*></script>`), () => `<script type="module">\n${body.replace(/<\/script/g, '<\\/script')}\n</script>`)
  } else if (f.endsWith('.css')) {
    html = html.replace(new RegExp(`<link[^>]*href="\\./assets/${esc(f)}"[^>]*>`), () => `<style>\n${body}\n</style>`)
  }
}
writeFileSync(htmlPath, html)
if (files.length) rmSync(assets, { recursive: true, force: true })

// Artifact fragment: <title>, every <style>, the body markup, then every inline module script
// (Vite places the script in <head>, so it is collected from the whole document).
const title = (html.match(/<title>[\s\S]*?<\/title>/) || [''])[0]
const styles = [...html.matchAll(/<style>[\s\S]*?<\/style>/g)].map((m) => m[0]).join('\n')
const scripts = [...html.matchAll(/<script type="module">[\s\S]*?<\/script>/g)].map((m) => m[0]).join('\n')
const bodyInner = ((html.match(/<body[^>]*>([\s\S]*)<\/body>/) || ['', ''])[1]).replace(/<script type="module">[\s\S]*?<\/script>/g, '').trim()
writeFileSync(join(dist, 'artifact.html'), `${title}\n${styles}\n${bodyInner}\n${scripts}\n`)
console.log(`inlined ${files.length} asset(s) → dist/index.html (${html.length} bytes), dist/artifact.html`)
