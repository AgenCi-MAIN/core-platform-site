# THRIVE Portraits — Visual Style Sheet v1.0

**Collection:** Ten Agents, Ten Portraits
**Format:** Square, 1024 x 1024 px
**Style lineage:** Geometric portraiture — the precision of architectural rendering married to the warmth of mid-century editorial illustration. Think intelligence briefing dossier portraits reimagined by a design studio that loves color.

---

## 1. COMPOSITION

### Framing

- **Crop:** Head-and-shoulders. The top of the head sits at **y = 80 px** (7.8% from top edge). The bottom crop falls at the **mid-sternum**, approximately **y = 920 px**. Shoulders are visible but may be clipped at the frame edge — they anchor the figure, not define it.
- **Horizontal center of gravity:** The nose bridge sits at **x = 512 px** (dead center) for all ten portraits. No off-center compositions. This grid must read as a formation, not a gallery of candids.
- **Eye line:** Both eyes sit on a horizontal band between **y = 340 px** and **y = 400 px** (33–39% from top). This is slightly above the classical rule-of-thirds line, creating a feeling of alertness and authority.
- **Head scale:** The face (chin to crown) occupies **48–54%** of the vertical canvas (approximately 490–553 px). Variation within this band accommodates different face shapes while keeping the grid uniform at thumbnail scale.
- **Negative space:** Minimum **120 px** of clear background between the outer edge of either shoulder and the frame edge. The head never touches the top — minimum **60 px** clearance above the crown.
- **Gaze:** Direct, into the viewer. No three-quarter turns of the head greater than **8 degrees** off axis. The pupils sit within a **40 px radius** of the horizontal center line between the two eyes.

### Pose

- **Shoulders:** Angled **10–18 degrees** relative to the picture plane (one shoulder slightly forward). Never square-on, never in full profile.
- **Chin:** Neutral to **5 degrees downward**. No chin-up poses. The effect is composed confidence, not defiance.
- **Expression:** Closed-mouth, steady. A trace of warmth — not a smile, but the absence of severity. Eyes carry engagement.

---

## 2. PALETTE

### Primary Palette (backgrounds and dominant accent)

| Token | Hex | Role |
|---|---|---|
| Deep Ink | `#16142b` | Primary background tone. Mixed at 85–100% opacity as the base of every background. |
| Violet | `#6d42e5` | Hero accent. Used for the strongest single color note in each portrait — a collar, a rim-light bloom, a geometric background element. |
| Warm Paper | `#fffaf2` | Highlight tone. The brightest value in any portrait. Used for specular catchlights in eyes, the peak of forehead highlights, and any typographic or UI overlay if needed. |

### Secondary Palette (per-portrait accent rotation)

Each portrait receives **one** secondary accent drawn from this set. No two adjacent portraits in the final grid share the same secondary accent.

| Token | Hex | Usage |
|---|---|---|
| Coral | `#ff7062` | Warm accent — clothing detail, earring, background shape, or reflected fill light. |
| Gold | `#f4bd4f` | Warm accent — same application pool as coral. |
| Mint | `#58c7a2` | Cool accent — same application pool. |
| Blue | `#3d7edb` | Cool accent — same application pool. |

### Skin Tone Rendering

- Skin tones are **never desaturated to gray.** They must read as living, warm surfaces even in the predominantly dark palette.
- Base skin midtones sit in the range **L\* 45–65** (CIELAB lightness). Highlights push to **L\* 75–82**. Shadows drop to **L\* 25–35** but retain chroma — shadows tint toward `#2a1f3d` (a warm violet-black), never toward neutral gray or pure black.
- A subtle **violet bias** (`#6d42e5` at 4–8% opacity) is overlaid on all shadow regions of the skin. This is the single strongest unifying device across diverse skin tones and it ties every face to the brand.
- Specular highlights on skin carry a **warm paper** tint (`#fffaf2`), not pure white (`#ffffff`). Pure white appears only in the eye catchlight and nowhere else in the entire portrait.

### Color Proportions (by area)

- Background / Deep Ink tones: **55–65%**
- Skin and hair: **25–32%**
- Violet accent: **5–8%**
- Secondary accent: **3–6%**
- Warm Paper highlights: **1–3%**

---

## 3. LIGHTING

### Key Light

- **Direction:** Upper-left, positioned at approximately **10 o'clock** when viewed from the front. Azimuth **-40 degrees** from center, elevation **35 degrees** above the eye plane.
- **Quality:** Soft-edged but directional. The shadow boundary on the nose and cheek has a **penumbra width of approximately 30–50 px** at 1024 px canvas size — not a razor edge, not a blown-out glow. Think: a large softbox at moderate distance.
- **Color temperature:** Warm neutral, approximately **4800K**. In hex terms, the key light's color influence reads as `#fff5e6` — a barely perceptible warmth.
- **Intensity:** The key light accounts for **70%** of the total illumination on the face.

### Fill Light

- **Direction:** Lower-right, **4 o'clock**, below the eye plane at approximately **-15 degrees** elevation.
- **Quality:** Very soft, essentially ambient. No distinct shadow edge.
- **Color temperature:** Cool, approximately **7000K**, tinted by the **secondary accent color** of that portrait at **6–10% saturation**. This means the fill side carries a faint color cast that varies per portrait — mint on one, coral on another — creating subtle individuality while the key side stays uniform.
- **Intensity:** **25%** of total illumination. The lighting ratio (key:fill) is approximately **2.8:1**, producing clearly readable shadow shapes without harsh contrast.

### Rim / Edge Light

- **Direction:** Directly behind the subject, **6 o'clock**, at head height.
- **Color:** Always **Violet `#6d42e5`** at **40–60% opacity** over the deep ink background. This is the single most important consistency anchor. Every portrait has a violet rim.
- **Width:** The rim light traces a **3–8 px** edge along the hair, shoulders, and the far cheek (the side away from the key light). It never wraps more than **15% around the form** onto the lit side.
- **Intensity:** Bright enough to separate the figure from the background but never brighter than the key-light highlights on the forehead or nose bridge.

### Shadow

- **Density:** Shadows are **never opaque black**. The darkest shadow region on the face reads as `#1e1a32` (a near-black with violet warmth), maintaining **L\* 12–15** in CIELAB.
- **Core shadow hue:** Shifts toward deep violet-blue (`#2a1f4a`), not toward brown or gray.
- **Cast shadows:** Minimal. The nose shadow is visible but soft. No hard cast shadow from the nose onto the cheek. No under-chin shadow harder than the penumbra width of the key light.

---

## 4. MATERIALS & TEXTURE

### Rendering Philosophy

**Painterly-geometric hybrid.** The portraits sit between photorealism and illustration. Faces are rendered with enough volumetric subtlety to read as three-dimensional, but surfaces carry a visible **brushwork texture** — not photographic skin pores. The effect is closer to a skillfully painted portrait than a photograph, but with the precision and clean edges of digital design.

### Surface Quality

- **Skin:** Matte with soft luminosity. No visible pores, no photorealistic subsurface scattering. The rendering suggests skin through **tonal gradation** (5–7 distinct value steps across the face) rather than through textural detail. Subtle **cross-hatching or directional brush strokes** at 10–15% opacity may be visible in shadow regions, reinforcing the painterly quality.
- **Hair:** Treated as **mass, not strands.** Hair reads as 2–4 large tonal shapes with clean edges between them. Individual strands may appear at the silhouette (where hair meets background) as **5–12 wisps**, but the interior of the hair form is solid shape. Hair catches the violet rim light prominently.
- **Clothing:** Flat to semi-flat. Garments are rendered with **no more than 3 value steps** (shadow, midtone, highlight). Fabric texture is absent. Clothing exists to carry color and anchor the composition, not to display material realism. Collars and necklines are geometrically clean.
- **Eyes:** The most detailed element. Irises have visible color variation (2–3 hues blended). A single **hard-edged circular catchlight** in warm paper (`#fffaf2`) sits at the **10 o'clock position** in each iris, matching the key light direction. The sclera is never pure white — it reads as `#e8e0d6` with faint warm-paper tinting.
- **Accessories (if any):** Glasses, earrings, or pins are rendered as **flat geometric shapes** with a single highlight. No transparency effects on glass. Frames are solid. This keeps accessories from competing with the face for detail density.

### Texture Overlay

A unified paper-grain texture is composited over the final portrait at **4–7% opacity**, blending mode **Multiply** for darks and **Screen** for lights (or **Overlay** at reduced opacity as a single-pass equivalent). The grain is **fine** (approximately 2–3 px noise at 1024 px), not coarse. This is the "warm paper" quality — it softens the digital precision and gives every portrait the same tactile feeling, as if printed on the same stock.

---

## 5. LINE LANGUAGE

### Edge Treatment

- **Silhouette edges** (figure against background): **Sharp and clean**, with a maximum of **1 px anti-aliasing**. The rim light reinforces the silhouette, but the edge itself is decisive. No feathering, no lost edges on the figure outline.
- **Interior edges** (features within the face): **Soft gradations**, not lines. The nose, lips, and brow are defined by **value change**, not by drawn outlines. Exception: the upper eyelid carries a **1–2 px defined edge** in a color **20% darker than the surrounding skin shadow**.
- **Geometric accent edges** (background shapes, clothing lines, accessory outlines): **Crisp and hard**, with **0 px feathering**. These elements are deliberately flat and graphic, contrasting with the soft volumetric face.

### Outline Weight

- There is **no continuous outline** around the figure. This is not a cel-shaded or comic-book style. The figure is separated from the background by value contrast and the rim light, not by a drawn border.
- If any linear element appears (a collar line, a geometric pattern), its stroke weight is **2–3 px** at 1024 px canvas size.

### Detail Density Distribution

- **High detail zone** (60% of rendering effort): Eyes, nose, mouth — the **central face triangle** bounded by the outer corners of the eyes and the chin.
- **Medium detail zone** (25%): Forehead, cheeks, jawline, ears, hair mass.
- **Low detail zone** (15%): Shoulders, clothing, background. These are deliberately simplified to keep visual hierarchy focused on the face.

---

## 6. BACKGROUND TREATMENT

### Base

Every background begins with a **radial gradient** centered on the head:
- Center color: `#1e1a38` (a warmer, slightly lifted deep ink)
- Edge color: `#16142b` (pure deep ink)
- The gradient radius extends to **70% of the canvas diagonal** before reaching the edge color.
- This creates a subtle vignette that focuses attention on the face without visible darkening at the corners.

### Geometric Elements

Each background contains **1–2 abstract geometric shapes** positioned in the **lower-right and/or upper-left quadrant** (diagonally opposite each other). These shapes:

- Are drawn from a vocabulary of: **circles, semicircles, straight horizontal or vertical lines, and chevrons (>) only.** No organic or irregular shapes.
- Are filled or stroked in the portrait's **secondary accent color** at **12–20% opacity**. They are felt, not seen — visible at full screen, nearly invisible at thumbnail size.
- Never overlap the face. They occupy the **outer 200 px margin** of the canvas.
- **Scale:** The largest shape spans no more than **280 px** in any dimension. The smallest is no less than **40 px**.
- Lines (if used) are **1–2 px** weight, running the full width or height of the canvas, passing **behind** the figure.

### Variation Rules

The geometric elements rotate with the secondary accent color: coral portraits get coral shapes, mint portraits get mint shapes. The **number, position, and type** of shapes vary per portrait, but the vocabulary and opacity rules do not. This gives each background a slightly different character while keeping the grid unified.

### What Is Forbidden

- No environmental backgrounds (rooms, skylines, desks).
- No photographic or photorealistic elements behind the figure.
- No text or typography in the background.
- No gradients using more than the two specified deep-ink variants.
- No background element brighter than the subject's skin midtone.

---

## 7. CONSISTENCY ANCHORS

These five elements are **mandatory in every portrait, no exceptions.** They are what makes ten different people read as one team.

### Anchor 1: Violet Rim Light
Every portrait has a `#6d42e5` rim/edge light at **40–60% opacity** tracing the figure's silhouette on the side opposite the key light. This is the collection's signature.

### Anchor 2: Deep Ink Background with Radial Lift
Every background uses the `#16142b` to `#1e1a38` radial gradient described in Section 6. No solid fills, no alternative background colors.

### Anchor 3: Warm Paper Grain Overlay
Every portrait receives the same **4–7% opacity** fine paper-grain texture overlay. The grain pattern itself should be identical across all ten (same noise seed or texture file), applied at the same scale and opacity.

### Anchor 4: 10 O'Clock Eye Catchlight
Every pair of eyes contains a single hard-edged circular catchlight at the **10 o'clock position** in the iris, in warm paper (`#fffaf2`). The catchlight diameter is **8–12 px** in the nearer eye, **6–10 px** in the farther eye (accounting for the 10-degree-max head angle). This catchlight is the viewer's unconscious proof that all ten subjects are in the same room, under the same light.

### Anchor 5: Violet Shadow Bias
Every portrait's shadow regions carry a **4–8% violet (`#6d42e5`) overlay**, pushing skin shadows toward `#2a1f3d` to `#2a1f4a` regardless of the subject's skin tone. This shared shadow temperature is the color-theory equivalent of a uniform — it harmonizes diverse palettes.

---

## 8. STYLE REFERENCES (Prompt-Ready Description)

The following paragraph is a self-contained style description that can be used directly in an image generation prompt or as a brief for a human illustrator:

> **Style:** A contemporary digital portrait in a painterly-geometric hybrid style. The rendering falls between editorial illustration and architectural visualization — faces are volumetrically modeled with soft tonal gradations (5–7 value steps, no photorealistic texture), while clothing and accessories are flat, graphic, and geometrically precise. Visible brush-stroke directionality in shadow regions at low opacity gives the surface a hand-painted quality, but edges are digitally clean. The palette is dark and saturated: deep blue-black backgrounds (`#16142b`) with a warm radial lift at center, rich true-to-life skin tones biased toward violet in the shadows, and single-accent pops of vivid color (coral, gold, mint, or blue) appearing in one clothing element or accessory per portrait. Lighting is cinematic — a warm soft key from upper-left, a cool tinted fill from lower-right, and a signature violet (`#6d42e5`) rim light tracing the figure's silhouette. Hair is massed into 2–4 bold shapes, not rendered strand-by-strand. Eyes are the most detailed feature, with a single hard catchlight at 10 o'clock. A fine paper-grain texture at low opacity unifies the surface. Subtle geometric shapes (circles, lines, chevrons) float in the background at 12–20% opacity in the accent color. The overall impression is of a high-end strategy consultancy's internal dossier — authoritative, warm, designed, and unmistakably part of a matched set.

### Tone Keywords

For prompt engineering, append any combination of these modifiers to reinforce the style:

- `painterly digital portrait`
- `editorial illustration style`
- `geometric flat clothing`
- `cinematic three-point lighting`
- `deep violet-black background`
- `violet rim light`
- `matte skin, no specular highlights except eye catchlight`
- `paper grain overlay`
- `head-and-shoulders crop, direct gaze`
- `mid-century modern color sensibility with contemporary rendering`
- `strategy dossier portrait`
- `warm shadows with violet bias`

---

## APPENDIX: Quick-Reference Checklist

Before any portrait is approved into the collection, verify:

| # | Check | Pass Criteria |
|---|---|---|
| 1 | Canvas size | Exactly 1024 x 1024 px |
| 2 | Eye line | y = 340–400 px |
| 3 | Head scale | Face (chin to crown) = 48–54% of canvas height |
| 4 | Violet rim light present | `#6d42e5`, 40–60% opacity, opposite key-light side |
| 5 | Background gradient | `#16142b` edge to `#1e1a38` center, radial |
| 6 | Paper grain overlay | 4–7% opacity, fine (2–3 px), uniform across set |
| 7 | Eye catchlight | 10 o'clock, warm paper `#fffaf2`, 8–12 px diameter |
| 8 | Shadow violet bias | 4–8% `#6d42e5` overlay in all shadow regions |
| 9 | Secondary accent | One of coral/gold/mint/blue; differs from grid neighbors |
| 10 | No pure black | Darkest value no darker than `#16142b` (L* >= 8) |
| 11 | No pure white | Only eye catchlight reaches `#fffaf2`; no `#ffffff` anywhere |
| 12 | Gaze | Direct, within 8 degrees of center axis |
| 13 | Background shapes | 1–2 geometric elements, outer 200 px margin, 12–20% opacity |
| 14 | Clothing rendering | Maximum 3 value steps, no fabric texture |
| 15 | Shoulder angle | 10–18 degrees off square |

---

This style sheet is the single source of truth for the collection. Agents downstream: reference specific section numbers when requesting clarification. Any deviation from the specifications above requires an explicit override logged against the relevant section number and anchor.