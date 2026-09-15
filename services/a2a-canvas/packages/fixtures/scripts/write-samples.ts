/**
 * Writes one pretty-printed samples/<id>.json per fixture in ../src/samples.ts,
 * plus samples/index.json — the manifest loadSample() and any sample picker
 * read. Deterministic: the fixtures themselves have no clock or randomness
 * left in them by the time they reach here (see src/builders.ts), so running
 * this twice in a row produces byte-identical files; nothing should move in
 * a diff unless a fixture actually changed.
 *
 * Run from services/a2a-canvas:
 *   node packages/fixtures/scripts/write-samples.ts
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SAMPLES } from '../src/samples.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const samplesDir = path.join(here, '..', 'samples')

interface IndexEntry {
  id: string
  title: string
  description: string
  file: string
}

async function main(): Promise<void> {
  await mkdir(samplesDir, { recursive: true })

  const index: IndexEntry[] = []
  for (const fixture of SAMPLES) {
    const file = `${fixture.id}.json`
    const json = `${JSON.stringify(fixture.doc, null, 2)}\n`
    await writeFile(path.join(samplesDir, file), json, 'utf8')
    index.push({ id: fixture.id, title: fixture.title, description: fixture.description, file })
  }

  const indexJson = `${JSON.stringify(index, null, 2)}\n`
  await writeFile(path.join(samplesDir, 'index.json'), indexJson, 'utf8')

  console.log(`write-samples: wrote ${SAMPLES.length} sample(s) + index.json to ${path.relative(process.cwd(), samplesDir)}`)
}

main().catch((error: unknown) => {
  console.error('write-samples: failed:', error)
  process.exitCode = 1
})
