import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchesShortcut, parseShortcut } from '../../src/ui/format.ts'

test('parseShortcut: mod+key', () => {
  const p = parseShortcut('mod+s')
  assert.equal(p.mod, true)
  assert.equal(p.shift, false)
  assert.equal(p.key, 's')
})

test('parseShortcut: mod+shift+key', () => {
  const p = parseShortcut('mod+shift+z')
  assert.equal(p.mod, true)
  assert.equal(p.shift, true)
  assert.equal(p.key, 'z')
})

test('parseShortcut: case-insensitive', () => {
  const p = parseShortcut('MOD+S')
  assert.equal(p.mod, true)
  assert.equal(p.key, 's')
})

test('parseShortcut: bare key (help toggle)', () => {
  const p = parseShortcut('?')
  assert.equal(p.mod, false)
  assert.equal(p.shift, false)
  assert.equal(p.key, '?')
})

test('matchesShortcut: mod matches ctrlKey', () => {
  assert.equal(matchesShortcut({ key: 's', ctrlKey: true, metaKey: false, shiftKey: false }, 'mod+s'), true)
})

test('matchesShortcut: mod matches metaKey', () => {
  assert.equal(matchesShortcut({ key: 's', ctrlKey: false, metaKey: true, shiftKey: false }, 'mod+s'), true)
})

test('matchesShortcut: requires a mod key when the spec has one', () => {
  assert.equal(matchesShortcut({ key: 's', ctrlKey: false, metaKey: false, shiftKey: false }, 'mod+s'), false)
})

test('matchesShortcut: shift must match exactly (undo vs redo)', () => {
  assert.equal(matchesShortcut({ key: 'z', ctrlKey: true, metaKey: false, shiftKey: true }, 'mod+z'), false)
  assert.equal(matchesShortcut({ key: 'z', ctrlKey: true, metaKey: false, shiftKey: true }, 'mod+shift+z'), true)
})

test('matchesShortcut: case-insensitive key comparison', () => {
  assert.equal(matchesShortcut({ key: 'S', ctrlKey: true, metaKey: false, shiftKey: false }, 'mod+s'), true)
})

test('matchesShortcut: mod+y also matches redo spec', () => {
  assert.equal(matchesShortcut({ key: 'y', ctrlKey: true, metaKey: false, shiftKey: false }, 'mod+y'), true)
})

test('matchesShortcut: bare "?" with no mod', () => {
  assert.equal(matchesShortcut({ key: '?', ctrlKey: false, metaKey: false, shiftKey: false }, '?'), true)
  assert.equal(matchesShortcut({ key: '?', ctrlKey: true, metaKey: false, shiftKey: false }, '?'), false)
})
