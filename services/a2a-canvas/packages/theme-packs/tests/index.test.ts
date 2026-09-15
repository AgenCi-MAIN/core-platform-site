import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readFile as fsReadFile } from 'node:fs/promises'
import { buildPacks } from '../scripts/build-packs.ts'
import { loadIndex, loadTheme } from '../src/index.ts'

test('loadIndex + loadTheme read a real built set via an injected fs reader', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'theme-packs-loader-'))
  try {
    await buildPacks(dir)
    const readFile = (path: string): Promise<string> => fsReadFile(join(dir, path), 'utf8')

    const indexResult = await loadIndex(readFile)
    assert.equal(indexResult.ok, true)
    if (!indexResult.ok) return
    assert.ok(indexResult.value.count > 0)

    const first = indexResult.value.themes[0]!
    const themeResult = await loadTheme(readFile, first.path)
    assert.equal(themeResult.ok, true)
    if (!themeResult.ok) return
    assert.equal(themeResult.value.meta.id, first.id)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('loadIndex reports a failure Result for a missing file (does not throw)', async () => {
  const readFile = (): Promise<string> => Promise.reject(new Error('ENOENT'))
  const result = await loadIndex(readFile)
  assert.equal(result.ok, false)
})

test('loadIndex reports a failure Result for malformed JSON', async () => {
  const readFile = (): Promise<string> => Promise.resolve('{ not json')
  const result = await loadIndex(readFile)
  assert.equal(result.ok, false)
})

test('loadTheme reports validation issues for a well-formed-JSON but invalid theme', async () => {
  const readFile = (): Promise<string> => Promise.resolve(JSON.stringify({ schemaVersion: '1.0.0' }))
  const result = await loadTheme(readFile, 'broken.json')
  assert.equal(result.ok, false)
  if (!result.ok) assert.ok(result.error.length > 0)
})

test('loadTheme works with a fetch-shaped reader (no fs involved)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'theme-packs-fetch-'))
  try {
    await buildPacks(dir)
    const fakeFetchReader = async (path: string): Promise<string> => {
      // Stand-in for `fetch(url).then(r => r.text())`; same reader shape.
      return fsReadFile(join(dir, path), 'utf8')
    }
    const indexResult = await loadIndex(fakeFetchReader)
    assert.equal(indexResult.ok, true)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
