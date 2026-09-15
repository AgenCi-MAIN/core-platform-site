import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createMemoryPersistence, createLocalStoragePersistence, type StorageLike } from '../../src/state/persist.ts'
import { createSeedFactory } from '../../src/state/seeds.ts'
import { asId } from '../../../../packages/shared/src/ids.ts'
import { isOk, isErr } from '../../../../packages/shared/src/result.ts'

test('memory persistence round-trips a valid doc', () => {
  const persistence = createMemoryPersistence()
  const seeds = createSeedFactory()
  const doc = seeds.defaultDoc(asId<'ThemeId'>('theme-1'))

  const empty = persistence.load()
  assert.ok(isOk(empty))
  if (isOk(empty)) assert.equal(empty.value, null)

  const saved = persistence.save(doc)
  assert.ok(isOk(saved))
  if (isOk(saved)) {
    assert.ok(saved.value.bytes > 0)
    assert.equal(typeof saved.value.savedAt, 'string')
  }

  const loaded = persistence.load()
  assert.ok(isOk(loaded))
  if (isOk(loaded)) assert.deepEqual(loaded.value, doc)

  const cleared = persistence.clear()
  assert.ok(isOk(cleared))
  const afterClear = persistence.load()
  assert.ok(isOk(afterClear))
  if (isOk(afterClear)) assert.equal(afterClear.value, null)
})

test('load() rejects malformed JSON with an err', () => {
  const backing = new Map<string, string>()
  const storage: StorageLike = {
    getItem: (k) => backing.get(k) ?? null,
    setItem: (k, v) => { backing.set(k, v) },
    removeItem: (k) => { backing.delete(k) },
  }
  storage.setItem('a2a-canvas.doc.v1', '{not valid json')
  const persistence = createLocalStoragePersistence(storage)

  const result = persistence.load()
  assert.ok(isErr(result))
})

test('load() rejects a well-formed but wrong-shaped document with an err', () => {
  const backing = new Map<string, string>()
  const storage: StorageLike = {
    getItem: (k) => backing.get(k) ?? null,
    setItem: (k, v) => { backing.set(k, v) },
    removeItem: (k) => { backing.delete(k) },
  }
  storage.setItem('a2a-canvas.doc.v1', JSON.stringify({ hello: 'world' }))
  const persistence = createLocalStoragePersistence(storage)

  const result = persistence.load()
  assert.ok(isErr(result))
})

test('a storage whose setItem throws yields err, not an exception', () => {
  const throwingStorage: StorageLike = {
    getItem: () => null,
    setItem: () => {
      throw new Error('QuotaExceededError')
    },
    removeItem: () => {},
  }
  const persistence = createLocalStoragePersistence(throwingStorage)
  const seeds = createSeedFactory()
  const doc = seeds.defaultDoc(asId<'ThemeId'>('theme-1'))

  let threw = false
  let result
  try {
    result = persistence.save(doc)
  } catch {
    threw = true
  }
  assert.equal(threw, false)
  assert.ok(result && isErr(result))
})

test('a storage whose getItem throws yields err on load, not an exception', () => {
  const throwingStorage: StorageLike = {
    getItem: () => {
      throw new Error('SecurityError')
    },
    setItem: () => {},
    removeItem: () => {},
  }
  const persistence = createLocalStoragePersistence(throwingStorage)

  let threw = false
  let result
  try {
    result = persistence.load()
  } catch {
    threw = true
  }
  assert.equal(threw, false)
  assert.ok(result && isErr(result))
})
