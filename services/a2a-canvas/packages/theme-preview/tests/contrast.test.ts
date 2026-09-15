import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compositeOver, contrastRatio, hexToRgb, passesContrast, relativeLuminance } from '../src/contrast.ts'

test('contrastRatio of white vs black is 21', () => {
  const ratio = contrastRatio('#FFFFFF', '#000000')
  assert.ok(Math.abs(ratio - 21) < 1e-9, `expected ~21, got ${ratio}`)
})

test('contrastRatio is symmetric regardless of argument order', () => {
  assert.equal(contrastRatio('#123456', '#ABCDEF'), contrastRatio('#ABCDEF', '#123456'))
})

test('contrastRatio of a colour against itself is 1', () => {
  assert.ok(Math.abs(contrastRatio('#A78BFA', '#A78BFA') - 1) < 1e-9)
})

test('relativeLuminance of white is 1 and black is 0', () => {
  assert.ok(Math.abs(relativeLuminance(hexToRgb('#FFFFFF')) - 1) < 1e-9)
  assert.equal(relativeLuminance(hexToRgb('#000000')), 0)
})

test('compositeOver returns the opaque bg at alpha 0 and the fg at alpha 1', () => {
  assert.equal(compositeOver('#FF0000', 0, '#00FF00'), '#00FF00')
  assert.equal(compositeOver('#336699', 1, '#000000'), '#336699')
})

test('passesContrast enforces the WCAG text (4.5) and non-text (3) minimums', () => {
  assert.equal(passesContrast(4.5, 'text'), true)
  assert.equal(passesContrast(4.49, 'text'), false)
  assert.equal(passesContrast(3, 'non-text'), true)
  assert.equal(passesContrast(2.99, 'non-text'), false)
})
