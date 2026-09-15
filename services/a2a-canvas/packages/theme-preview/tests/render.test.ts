import assert from 'node:assert/strict'
import { test } from 'node:test'
import { asId } from '../../shared/src/ids.ts'
import { renderGallery, renderPreview } from '../src/render.ts'
import { SAMPLE_THEME } from '../src/sample-theme.ts'
import { NODE_SHAPE_KINDS } from '../src/svg.ts'

test('renderPreview output contains the CSS var block', () => {
  const html = renderPreview(SAMPLE_THEME, { mode: 'dark' })
  assert.match(html, /<style>[\s\S]*--c-bg:[\s\S]*<\/style>/)
  assert.match(html, /--c-accent:/)
  assert.match(html, /--font-mono:/)
})

test('renderPreview escapes a malicious title', () => {
  const malicious = '<script>alert(1)</script>"&'
  const html = renderPreview(SAMPLE_THEME, { title: malicious })
  assert.ok(!html.includes('<script>alert(1)</script>'), 'raw script tag must not appear in the output')
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
  assert.ok(html.includes('&quot;'))
  assert.ok(html.includes('&amp;'))
})

test('renderPreview is deterministic for the same inputs', () => {
  const a = renderPreview(SAMPLE_THEME, { mode: 'dark', title: 'Fixed Title', width: 900 })
  const b = renderPreview(SAMPLE_THEME, { mode: 'dark', title: 'Fixed Title', width: 900 })
  assert.equal(a, b)
})

test('renderPreview includes all six node shapes', () => {
  const html = renderPreview(SAMPLE_THEME, { mode: 'dark' })
  for (const kind of NODE_SHAPE_KINDS) {
    assert.match(html, new RegExp(`data-shape="${kind}"`), `missing shape ${kind}`)
  }
})

test('renderPreview shows a selected node (ring + keyline) and every button state', () => {
  const html = renderPreview(SAMPLE_THEME, { mode: 'dark' })
  assert.match(html, /class="node selected"/)
  assert.match(html, /node-keyline/)
  assert.match(html, /class="btn primary"/)
  assert.match(html, /data-state="hover"/)
  assert.match(html, /data-state="focus"/)
  assert.match(html, /<button class="btn" type="button" disabled>/)
})

test('renderPreview includes a status line and a toast', () => {
  const html = renderPreview(SAMPLE_THEME, { mode: 'dark' })
  assert.match(html, /class="status" data-kind="ok"/)
  assert.match(html, /class="status" data-kind="error"/)
  assert.match(html, /class="toast"/)
})

test('renderPreview differs between light and dark mode', () => {
  const dark = renderPreview(SAMPLE_THEME, { mode: 'dark' })
  const light = renderPreview(SAMPLE_THEME, { mode: 'light' })
  assert.notEqual(dark, light)
  assert.match(light, /data-preview-mode="light"/)
  assert.match(dark, /data-preview-mode="dark"/)
})

test('renderGallery lists every theme id and name', () => {
  const second = {
    ...SAMPLE_THEME,
    meta: { ...SAMPLE_THEME.meta, id: asId<'ThemeId'>('theme_second_fixture'), name: 'Second Fixture' },
  }
  const html = renderGallery([SAMPLE_THEME, second], 'dark')
  assert.ok(html.includes(SAMPLE_THEME.meta.id), 'missing first theme id')
  assert.ok(html.includes(second.meta.id), 'missing second theme id')
  assert.ok(html.includes('Second Fixture'))
  assert.ok(html.includes(SAMPLE_THEME.meta.name))
})

test('renderGallery includes a contrast table with pass/fail marks', () => {
  const html = renderGallery([SAMPLE_THEME], 'dark')
  assert.match(html, /class="contrast"/)
  assert.ok(html.includes('PASS') || html.includes('FAIL'))
})

test('renderGallery is deterministic', () => {
  const a = renderGallery([SAMPLE_THEME], 'dark')
  const b = renderGallery([SAMPLE_THEME], 'dark')
  assert.equal(a, b)
})
