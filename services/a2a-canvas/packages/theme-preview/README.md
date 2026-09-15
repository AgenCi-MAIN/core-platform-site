# theme-preview

A static preview renderer. Given `ThemeTokens` (+ mode), it produces a
self-contained HTML string showing a sample of the A2A canvas UI — a glass
rail with buttons in every state, a lane with all six shape nodes and curved
connectors, an inspector card with fields, a status line, and a toast — so a
theme can be judged before it's applied.

## Where it's used

- **The live canvas.** A "preview" node calls `renderPreview(tokens, { mode })`
  and drops the returned HTML into an iframe (`srcdoc`) or equivalent
  sandboxed container. The output is a complete `<!doctype html>` document
  with its own `<style>` block, so it never leaks CSS into or out of the host
  page.
- **The gallery.** `scripts/build-gallery.ts` calls `renderGallery` to build a
  human-facing page listing every known theme with its mini preview and
  computed contrast ratios. `previews/` is generated output — see below.

## Modules

- `src/contrast.ts` — WCAG luminance/contrast/composite helpers (pure).
- `src/svg.ts` — builders for the six node shapes (rect, rounded, circle,
  diamond, pentagon, hexagon) and a curved connector with an arrowhead.
  Self-contained: does not import from the live canvas app.
- `src/css.ts` — `tokensToCss(tokens, mode)`: the same CSS custom-property
  names `apps/live-canvas/styles.css` defines, plus a compact stylesheet for
  the preview's own components.
- `src/render.ts` — `renderPreview` and `renderGallery`.
- `src/sample-theme.ts` — `SAMPLE_THEME`, a built-in fixture theme filled out
  from the owner's charcoal/cyan reference values, used whenever
  `packages/theme-packs/themes/index.json` isn't available yet (or fails to
  parse) and as a test fixture.
- `src/index.ts` — public exports.
- `scripts/build-gallery.ts` — writes the `previews/` directory.

## `previews/` is generated

Everything under `previews/` is build output, written by
`scripts/build-gallery.ts`:

- `gallery-dark.html`, `gallery-light.html` — every known theme, one mode per
  page, mini preview + the six most important contrast ratios (pass/fail
  against WCAG minimums).
- `<theme-id>.html` — one full-size dark-mode preview per theme.

Regenerate with:

```bash
node packages/theme-preview/scripts/build-gallery.ts
```

from `services/a2a-canvas`. The script is deterministic: same tokens in, same
HTML out, no timestamps unless a caller passes one explicitly.
