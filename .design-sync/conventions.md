# thrive-brand-marks

This bundle is **not** a general design system. It ships exactly three brand
glyphs pulled from the THRIVE portal application (`core-platform-site`):
`ThriveMark`, `RankMedallion`, and `KeyGlyph`. Reach for these when a design
needs THRIVE's actual logo mark, rank/tier iconography, or the "access" key
motif — not as a starting point for buttons, cards, forms, or any other UI,
which this bundle has no opinion on. Build the rest of the design with normal
HTML/CSS or another library; only import from here for these specific marks.

## No wrapper needed

None of the three components read from context or need a provider. Import
and render them directly:

```jsx
import { ThriveMark } from 'thrive-brand-marks';

<ThriveMark size={20} />
```

## Styling idiom: real class names, pre-styled — don't invent new ones

These aren't utility-class or design-token components. Each renders with a
small, fixed set of class names that `styles.css` already styles — do not add
Tailwind-style utility classes to them and do not invent new class names:

| Component | Class(es) it renders with | What the shipped CSS does |
|---|---|---|
| `KeyGlyph` | `.key-glyph` | Sets the SVG's transform-origin and transition; `a:hover > .key-glyph` / `button:hover > .key-glyph` (also `:focus-visible`) rotate it 90° — put `<KeyGlyph />` as a **direct child** of the interactive element (link/button) to get the turn-on-hover behavior for free. |
| `RankMedallion` | `.rank-medallion`, `.rank-medallion-<metal>`, `.rank-medallion-shine` | Base drop-shadow, a per-metal colored drop-shadow (gold/diamond/bronze/obsidian only — silver/steel fall back to the base shadow), and an infinite sweeping "shine" animation across the coin face. All automatic from the `metal` prop; nothing to add. |
| `ThriveMark` | none (pure `currentColor` SVG, no external CSS) | Set `color` on a wrapping element to recolor it — see the `Topbar`/`AccessGate` examples in its preview cards for the gold-on-dark treatment used across the real app. |

Both `.key-glyph` and `.rank-medallion*` are motion-reduced (`prefers-reduced-motion`) automatically — no prop needed.

## Where the truth lives

- `styles.css` (imports `_ds_bundle.css`, which carries the two rule blocks
  above) — read it before styling around these components.
- Each component's `<Name>.prompt.md` and `<Name>.d.ts` for the exact prop
  contract (all three take a `size?: number` in px; `RankMedallion` also
  requires `metal` and `numeral`).

## Idiomatic build snippet

```jsx
import { KeyGlyph, RankMedallion } from 'thrive-brand-marks';

<a href="/access" style={{
  display: 'inline-flex', alignItems: 'center', padding: '12px 18px',
  borderRadius: 8, background: '#d9a63a', color: '#241b10', fontWeight: 800,
}}>
  Portal access
  <KeyGlyph label="Sign in" />
</a>

<RankMedallion metal="gold" numeral="3" size={44} title="Gold" />
```
