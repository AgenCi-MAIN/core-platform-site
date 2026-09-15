import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildPacks } from '../scripts/build-packs.ts'
import { FAMILIES, VARIANTS } from '../src/families.ts'
import type { ThemeIndex } from '../src/index.ts'

async function walk(dir: string, base: string = dir): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      Object.assign(out, await walk(full, base))
    } else {
      const rel = full.slice(base.length + 1).split('\\').join('/')
      out[rel] = await readFile(full, 'utf8')
    }
  }
  return out
}

const EXPECTED_COUNT = FAMILIES.length * VARIANTS.length

test('buildPacks writes one JSON file per theme plus index.json, and is byte-identical across two temp dirs', async () => {
  const dirA = await mkdtemp(join(tmpdir(), 'theme-packs-a-'))
  const dirB = await mkdtemp(join(tmpdir(), 'theme-packs-b-'))
  try {
    const resultA = await buildPacks(dirA)
    const resultB = await buildPacks(dirB)

    assert.equal(resultA.count, EXPECTED_COUNT)
    assert.equal(resultB.count, EXPECTED_COUNT)

    const filesA = await walk(dirA)
    const filesB = await walk(dirB)

    const pathsA = Object.keys(filesA).sort()
    const pathsB = Object.keys(filesB).sort()
    assert.deepEqual(pathsA, pathsB, 'both builds must write the same set of files')
    assert.equal(pathsA.length, EXPECTED_COUNT + 1, 'one file per theme, plus index.json')

    for (const path of pathsA) {
      assert.equal(filesA[path], filesB[path], `${path} must be byte-identical across the two builds`)
    }
  } finally {
    await rm(dirA, { recursive: true, force: true })
    await rm(dirB, { recursive: true, force: true })
  }
})

test('buildPacks is idempotent: rebuilding into the same directory reproduces identical files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'theme-packs-idempotent-'))
  try {
    await buildPacks(dir)
    const first = await walk(dir)
    await buildPacks(dir)
    const second = await walk(dir)
    assert.deepEqual(first, second)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('index.json count equals the number of theme files actually written, and every entry path resolves', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'theme-packs-index-'))
  try {
    await buildPacks(dir)
    const files = await walk(dir)
    const index = JSON.parse(files['index.json']!) as ThemeIndex

    const themeFilePaths = Object.keys(files).filter((p) => p !== 'index.json')
    assert.equal(index.count, themeFilePaths.length)
    assert.equal(index.themes.length, themeFilePaths.length)
    assert.equal(index.count, EXPECTED_COUNT)

    const themeFileSet = new Set(themeFilePaths)
    for (const entry of index.themes) {
      assert.ok(themeFileSet.has(entry.path), `index entry path "${entry.path}" has no corresponding file on disk`)
      const onDisk = JSON.parse(files[entry.path]!) as { meta: { id: string; family: string } }
      assert.equal(onDisk.meta.id, entry.id)
      assert.equal(onDisk.meta.family, entry.family)
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
