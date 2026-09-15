import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseHex, toHex, hexToRgb, rgbToHex, hexToRgbTriplet, compositeOver, relativeLuminance, contrastRatio, mix, lighten, darken } from '../../src/theme/color.ts'

test('parseHex / toHex round-trip', () => {
  assert.deepEqual(parseHex('#A78BFA'), { r: 167, g: 139, b: 250 })
  assert.equal(toHex({ r: 167, g: 139, b: 250 }), '#A78BFA')
  // works without the leading #, and is case-insensitive
  assert.deepEqual(parseHex('a78bfa'), { r: 167, g: 139, b: 250 })
})

test('rgbToHex / hexToRgb are aliases of toHex / parseHex', () => {
  assert.equal(rgbToHex(17, 18, 26), '#11121A')
  assert.deepEqual(hexToRgb('#11121A'), { r: 17, g: 18, b: 26 })
})

test('hexToRgbTriplet formats space-separated decimal channels', () => {
  assert.equal(hexToRgbTriplet('#24193A'), '36 25 58')
  assert.equal(hexToRgbTriplet('#11121A'), '17 18 26')
})

test('compositeOver applies alpha exactly once and is deterministic', () => {
  // The reference glass surface (#24193A) over the reference canvas bg
  // (#11121A) at 0.82 alpha — hand-computed: round(0.82*36+0.18*17)=33=0x21,
  // round(0.82*25+0.18*18)=24=0x18, round(0.82*58+0.18*26)=52=0x34.
  assert.equal(compositeOver('#24193A', 0.82, '#11121A'), '#211834')
  // fully opaque fg composites to itself; fully transparent to the bg
  assert.equal(compositeOver('#A78BFA', 1, '#11121A'), '#A78BFA')
  assert.equal(compositeOver('#A78BFA', 0, '#11121A'), '#11121A')
})

test('relativeLuminance: white is 1, black is 0', () => {
  assert.ok(Math.abs(relativeLuminance('#FFFFFF') - 1) < 1e-9)
  assert.ok(Math.abs(relativeLuminance('#000000') - 0) < 1e-9)
})

test('contrastRatio of white on black is 21', () => {
  assert.ok(Math.abs(contrastRatio('#FFFFFF', '#000000') - 21) < 0.01)
  // order-independent
  assert.ok(Math.abs(contrastRatio('#000000', '#FFFFFF') - 21) < 0.01)
  // identical colours have a ratio of 1
  assert.ok(Math.abs(contrastRatio('#A78BFA', '#A78BFA') - 1) < 1e-9)
})

test('mix / lighten / darken', () => {
  assert.equal(mix('#000000', '#FFFFFF', 0), '#000000')
  assert.equal(mix('#000000', '#FFFFFF', 1), '#FFFFFF')
  assert.equal(mix('#000000', '#FFFFFF', 0.5), '#808080')
  assert.equal(lighten('#000000', 1), '#FFFFFF')
  assert.equal(darken('#FFFFFF', 1), '#000000')
  assert.equal(lighten('#000000', 0), '#000000')
})
