# @core/theme-packs

A curated, loadable theme library for the A2A canvas: 27 complete
`ThemeTokens` (see `packages/shared/src/theme-tokens.ts`), one JSON file
each, generated deterministically and checked for accessibility and
distinctness before they ever hit disk. The theme maker's picker lists
`themes/index.json`; the preview renderer (or any consumer) fetches one
theme JSON by the `path` an index entry names.

## How it is generated

Nine **families** (`src/families.ts`) — `obsidian-amethyst`, `daylight-slate`,
`ember`, `sea-glass`, `graphite-mono`, `thrive-sky`, `sunset`, `forest`,
`high-contrast` — each define a hue per palette role, a base saturation, a
focus-ring hue kept deliberately separate from the accent hue, a radius
style and a font stack. Three **variants** (`base`, `soft`, `vivid`) apply
on top of every family: different saturation multipliers, different scale
steps for backgrounds/surfaces/accents, different glass alpha, and a small
accent-hue "tint" blended into the background so even a near-desaturated
family (`graphite-mono`, `high-contrast`) still reads as visibly different
across its own variants. 9 families × 3 variants = **27 themes**.

`src/color.ts` holds the colour math (hex ↔ RGB ↔ HSL, an 11-step scale
generator that is monotonic in luminance by construction, WCAG luminance
and contrast, alpha compositing, and a plain RGB distance). `src/generate.ts`
turns a `(family, variant)` pair into a complete `ThemeTokens`: it derives
every semantic colour from the palette, then nudges `text` toward the
mode's bright/dark extreme, iteratively, until it clears **4.5:1** contrast
against both the flat `bg` and the *composited* surface (surface colour
alpha-blended once over `bg`, per the schema's comment on `surfaceAlpha`) —
so a theme this generator returns can never fail its own contrast rule.
`high-contrast` targets **7:1** (AAA) instead of the 4.5 floor.

`scripts/build-packs.ts` builds all 27 themes with a **seeded id factory**
and a **fixed clock**, validates every one (`src/validate.ts`), checks the
whole set pairwise for near-duplicates, and only then writes
`themes/<family>/<variant>.json` and `themes/index.json`. Because the seed,
clock and family/variant order are all fixed, running it twice — even into
two different directories — produces byte-identical files
(`tests/build-packs.test.ts` asserts this).

Run it from `services/a2a-canvas`:

```bash
node packages/theme-packs/scripts/build-packs.ts
```

## Provenance

Every theme's `meta.provenance` is one of:

- **`reference`** — taken from the owner's Freeform board. Only
  `obsidian-amethyst`'s `base` variant carries this, and its dark mode is
  pinned to the literal reference hexes after the formula runs (`bg`
  `#11121A`, `surface` `#24193A` at 0.82 alpha, `accent` `#A78BFA`, `focus`
  `#67E8F9`, `text` `#F5F3FF`, `muted` `#C4B5FD`) rather than trusting the
  generator to reproduce them exactly. `obsidian-amethyst`'s `soft` and
  `vivid` variants are generated normally and do **not** carry the verbatim
  reference — they're this family's own proposed range.
- **`proposed`** — this swarm's own design choice; every other family.

`meta.generated` is always `true`: nothing in this package is hand-authored
JSON, all 27 files come out of `buildTheme`.

## The dedupe threshold

`generate.ts#distance(themeA, themeB)` takes ten "identity" swatches per
theme (the `primary`/`secondary`/`accent`/`neutral` 500-steps, `dark.bg`,
`dark.surface`, `dark.accent`, `dark.focusRing`, `light.bg`, `light.accent`)
and returns the mean normalized Euclidean RGB distance across them — `0`
for identical colours, `1` for black vs. white on every swatch.
`DEDUPE_THRESHOLD = 0.05`: two themes closer than that are near-duplicates,
and `buildThemeSet`/`build-packs.ts` throw rather than write a set that
contains a pair like that. Across the full 27-theme, 351-pair set the
closest pair sits at `~0.054`, comfortably clear of the threshold; nothing
here is a coin-flip pass.

## Public surface (`src/index.ts`)

- `loadIndex(readFile, path?)` / `loadTheme(readFile, path)` — reader-
  injected loaders (`Result`-returning, never throw) so the same code loads
  `index.json` and a theme JSON under Node (`fs.readFile`) or in the
  browser (`fetch(url).then(r => r.text())`); pass whichever reader fits.
- Everything from `color.ts`, `families.ts`, `generate.ts` and
  `validate.ts` is re-exported, including `buildTheme`, `buildThemeSet`,
  `validateTheme`, `distance`, `FAMILIES` and `VARIANTS`.

## Tests

`tests/color.test.ts` — hex/HSL round-trips, contrast(white, black) === 21,
scale luminance strictly monotonic (including a fully desaturated case).
`tests/generate.test.ts` — every family × variant validates, text contrast
holds in both modes for every theme (7:1 for `high-contrast`), no pair is
within the dedupe threshold, the `obsidian-amethyst` base's dark mode
matches the reference hexes verbatim (and its `soft`/`vivid` siblings do
not). `tests/validate.test.ts` — structural/format/contrast rejections.
`tests/build-packs.test.ts` — two builds into two temp dirs are
byte-identical, a rebuild into the same dir is idempotent, and
`index.json`'s `count` matches the number of theme files actually written.
`tests/index.test.ts` — `loadIndex`/`loadTheme` against a real built set,
via both an fs-shaped and a fetch-shaped reader, and their `Result` errors
on missing/malformed input.
