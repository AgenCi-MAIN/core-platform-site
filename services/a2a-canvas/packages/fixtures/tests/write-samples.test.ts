import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateDoc } from '../src/validate.ts'
import { SAMPLES } from '../src/samples.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const pkgRoot = path.join(here, '..')
const scriptPath = path.join(pkgRoot, 'scripts', 'write-samples.ts')
const samplesDir = path.join(pkgRoot, 'samples')

function runWriteSamples(): void {
  execFileSync(process.execPath, [scriptPath], { cwd: pkgRoot, stdio: 'pipe' })
}

async function snapshotSamplesDir(): Promise<Record<string, string>> {
  const files = (await readdir(samplesDir)).filter((f) => f.endsWith('.json')).sort()
  const out: Record<string, string> = {}
  for (const f of files) out[f] = await readFile(path.join(samplesDir, f), 'utf8')
  return out
}

test('write-samples produces one JSON file per fixture plus index.json', () => {
  runWriteSamples()
})

test('every written sample file is valid JSON that passes validateDoc', async () => {
  for (const fixture of SAMPLES) {
    const text = await readFile(path.join(samplesDir, `${fixture.id}.json`), 'utf8')
    const parsed: unknown = JSON.parse(text)
    const result = validateDoc(parsed)
    assert.equal(result.ok, true, result.ok ? '' : `${fixture.id}.json: ${result.error.join('; ')}`)
  }
})

test('samples/index.json lists every fixture with id, title, description and file', async () => {
  const text = await readFile(path.join(samplesDir, 'index.json'), 'utf8')
  const index = JSON.parse(text) as { id: string; title: string; description: string; file: string }[]
  assert.equal(index.length, SAMPLES.length)
  for (const fixture of SAMPLES) {
    const entry = index.find((e) => e.id === fixture.id)
    assert.ok(entry, `index.json missing entry for ${fixture.id}`)
    assert.equal(entry?.title, fixture.title)
    assert.equal(entry?.description, fixture.description)
    assert.equal(entry?.file, `${fixture.id}.json`)
  }
})

test('running write-samples twice in a row is byte-for-byte deterministic', async () => {
  runWriteSamples()
  const first = await snapshotSamplesDir()
  runWriteSamples()
  const second = await snapshotSamplesDir()
  assert.deepEqual(second, first)
})
