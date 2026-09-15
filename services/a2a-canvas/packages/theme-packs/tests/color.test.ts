import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SCALE_STEPS } from '../../shared/src/theme-tokens.ts'
import {
  parseHex,
  formatHex,
  rgbToHsl,
  hslToRgb,
  relativeLuminance,
  contrastRatio,
  compositeOverBackground,
  generateScale,
  colorDistance,
  isHexColor,
} from '../src/color.ts'

test('parseHex / formatHex round-trip', () => {
  assert.deepEqual(parseHex('#A78BFA'), { r: 0xa7, g: 0x8b, b: 0xfa })
  assert.equal(formatHex({ r: 167, g: 139, b: 250 }), '#A78BFA')
  assert.equal(formatHex(parseHex('#11121A')), '#11121A')
})

test('isHexColor rejects malformed input', () => {
  assert.equal(isHexColor('#11121A'), true)
  assert.equal(isHexColor('#fff'), false)
  assert.equal(isHexColor('11121A'), false)
  assert.equal(isHexColor(123), false)
  assert.equal(isHexColor(null), false)
})

test('contrast ratio: black vs white is exactly 21', () => {
  assert.equal(contrastRatio('#000000', '#FFFFFF'), 21)
  assert.equal(contrastRatio('#FFFFFF', '#000000'), 21)
})

test('contrast ratio: identical colours is 1', () => {
  assert.equal(contrastRatio('#A78BFA', '#A78BFA'), 1)
})

test('relative luminance: black is 0, white is 1', () => {
  assert.equal(relativeLuminance(parseHex('#000000')), 0)
  assert.equal(relativeLuminance(parseHex('#FFFFFF')), 1)
})

test('hsl <-> rgb round-trips for representative hues/saturations/lightnesses', () => {
  for (const h of [0, 40, 120, 189, 258, 300, 359]) {
    for (const s of [0, 25, 60, 100]) {
      for (const l of [5, 25, 50, 75, 95]) {
        const rgb = hslToRgb({ h, s, l })
        const back = rgbToHsl(rgb)
        const rgb2 = hslToRgb(back)
        // Round-trip through 8-bit RGB loses sub-degree/percent precision;
        // assert the *colour* round-trips, not the exact HSL numbers.
        assert.ok(Math.abs(rgb.r - rgb2.r) <= 1, `r drifted for h=${h} s=${s} l=${l}`)
        assert.ok(Math.abs(rgb.g - rgb2.g) <= 1, `g drifted for h=${h} s=${s} l=${l}`)
        assert.ok(Math.abs(rgb.b - rgb2.b) <= 1, `b drifted for h=${h} s=${s} l=${l}`)
      }
    }
  }
})

test('compositeOverBackground: alpha 1 is the foreground, alpha 0 is the background', () => {
  assert.equal(compositeOverBackground('#A78BFA', 1, '#11121A'), '#A78BFA')
  assert.equal(compositeOverBackground('#A78BFA', 0, '#11121A'), '#11121A')
})

test('compositeOverBackground matches the standard alpha-blend formula', () => {
  const result = compositeOverBackground('#FFFFFF', 0.5, '#000000')
  assert.equal(result, '#808080')
})

test('generateScale: every step is a valid hex, and 500 is the exact hue/saturation anchor', () => {
  const scale = generateScale(258, 68) as unknown as Record<string, string>
  for (const s of SCALE_STEPS) {
    assert.ok(isHexColor(scale[String(s)]), `step ${s} should be a valid hex`)
  }
  assert.equal(scale['500'], formatHex(hslToRgb({ h: 258, s: 68, l: 50 })))
})

test('generateScale: luminance strictly decreases from step 50 to step 950', () => {
  const cases: Array<[number, number]> = [
    [258, 68],
    [0, 100],
    [120, 50],
    [220, 10],
    [48, 92],
    [0, 0], // fully desaturated (grayscale) must still be monotonic
  ]
  for (const [hue, sat] of cases) {
    const scale = generateScale(hue, sat) as unknown as Record<string, string>
    const luminances = SCALE_STEPS.map((s) => relativeLuminance(parseHex(scale[String(s)])))
    for (let i = 1; i < luminances.length; i += 1) {
      assert.ok(
        luminances[i]! < luminances[i - 1]!,
        `luminance should strictly decrease at step ${SCALE_STEPS[i]} for hue=${hue} sat=${sat}: ${luminances}`,
      )
    }
  }
})

test('colorDistance: 0 for identical colours, 1 for black vs white', () => {
  assert.equal(colorDistance('#A78BFA', '#A78BFA'), 0)
  assert.equal(colorDistance('#000000', '#FFFFFF'), 1)
})
