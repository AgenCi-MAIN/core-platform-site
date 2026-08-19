
# THRIVE Portrait Set -- Image Generation Specification

## Agent 07 Deliverable -- "Ten Agents, Ten Portraits"

---

## 0. Design Context Extracted from the Codebase

Before any generation begins, the operator must internalize the THRIVE visual language. The following values are drawn directly from the live codebase (`globals.css`, `rank-medallion.tsx`, `theme-control.tsx`, `favicon.svg`, `portal-chrome.tsx`).

**Primary palette (from CSS custom properties):**

| Token | Hex | Usage |
|---|---|---|
| `--ink` | `#0c0a07` | Near-black, primary text, dark backgrounds |
| `--ink-soft` | `#17130d` | Softer dark ground |
| `--paper` | `#f3ecdf` | Warm cream, light backgrounds |
| `--paper-deep` | `#e8dcc8` | Deeper parchment |
| `--white` | `#fffaf1` | Off-white with warm cast |
| `--lime` | `#d9a63a` | Signature gold/amber accent |
| `--mint` | `#f1c75c` | Lighter gold, secondary accent |
| `--orange` | `#c66a22` | Warm alert/emphasis |
| `--red` | `#b9382f` | Danger/critical |

**Thrive theme (navy skin):**

| Token | Hex |
|---|---|
| Navy chrome | `#16202e` |
| Navy gradient (favicon) | `#263a68` to `#131d3a` |
| Gold gradient (favicon) | `#f6e2a0` to `#c9992f` |
| Light workspace | `#eef2f9` |
| Blue accent | `#2563eb` |

**Rank metal palette (from `rank-medallion.tsx`):**

| Metal | Light | Mid | Deep | Edge | Ink |
|---|---|---|---|---|---|
| Bronze | `#f0c9a0` | `#c67c3e` | `#8a4a1c` | `#5c2f10` | `#3a1d09` |
| Silver | `#ffffff` | `#c9d2da` | `#8b98a5` | `#5e6a76` | `#2b333b` |
| Gold | `#fdf3d2` | `#e0b64e` | `#a97b1d` | `#7a5610` | `#3a290a` |
| Diamond | `#ffffff` | `#bfe6f5` | `#6fa8c9` | `#3f7a9c` | `#12303f` |
| Obsidian | `#7b6bb0` | `#3a2f5c` | `#1d1730` | `#100c1c` | `#e6e0ff` |
| Steel | `#e8edf2` | `#9aa7b4` | `#66727e` | `#454f59` | `#232a31` |

**Brand glyph:** A bold "V" with a flame/helix right arm and a four-point sparkle, rendered in gold on a navy rounded-rectangle ground (see `favicon.svg`).

**Typography direction:** Clean, weighted sans-serif (Inter / Segoe UI family). Emphasis set in old-style serif (Baskerville / Georgia). The overall aesthetic is financial-grade, authoritative, warm metals on dark grounds.

---

## 1. Platform Comparison

Each platform is rated 1-5 on five axes relevant to this project.

| Platform | Style Consistency | Prompt Adherence | Square Format | Batch Workflow | Quality Ceiling | Weighted Score |
|---|---|---|---|---|---|---|
| **Midjourney v6.1** | 5 | 4 | 5 | 3 | 5 | **4.4** |
| **DALL-E 3 (via API)** | 3 | 5 | 5 | 5 | 3 | **4.2** |
| **Flux 1.1 Pro** | 4 | 4 | 5 | 5 | 4 | **4.4** |
| **Stable Diffusion XL** | 4 | 3 | 5 | 5 | 4 | **4.2** |
| **Ideogram v2** | 4 | 4 | 5 | 4 | 4 | **4.2** |

**Detailed rationale per axis:**

**Style consistency across a set (weight: 1.5x).** Midjourney v6.1 leads. Its `--sref` (style reference) parameter allows locking a visual "DNA" across all ten images from a single reference. Flux 1.1 Pro achieves consistency through its LoRA/IP-adapter ecosystem but requires more manual tuning. DALL-E 3 has no style-lock mechanism at all -- consistency must be achieved entirely through prompt engineering, which makes it unreliable across ten generations. SDXL achieves consistency through fixed checkpoints and LoRA weights but requires expertise. Ideogram v2 has decent internal consistency but no explicit reference-lock feature.

**Prompt adherence (weight: 1.0x).** DALL-E 3 is the most literal prompt follower -- it rarely ignores instructions and handles detailed compositional requests well. Midjourney v6.1 follows prompts more loosely, favoring its own aesthetic judgment, which can be a strength (it rarely produces ugly output) but occasionally ignores specific requests. Flux and SDXL are good with structured prompts but sensitive to prompt ordering and weighting syntax.

**Square format support (weight: 0.5x).** All platforms handle 1:1 aspect ratio natively. Non-issue.

**Batch workflow (weight: 1.0x).** DALL-E 3 via the OpenAI API is trivially scriptable -- a loop of API calls with stored prompts. Flux via Replicate or fal.ai is equally scriptable. SDXL via ComfyUI or A1111 supports full queue-based batch generation. Midjourney's batch workflow is weaker -- it runs through Discord or the web app, with no official scriptable API. This is its primary disadvantage for a set of ten. Ideogram's API exists but is less mature.

**Quality ceiling (weight: 1.0x).** Midjourney v6.1 produces the most "finished" images -- they look like they were art-directed. DALL-E 3 tends toward a recognizable "AI illustration" quality that is clean but rarely striking. Flux 1.1 Pro is excellent, approaching Midjourney for photorealism and surpassing it for prompt-faithful composition. SDXL with the right checkpoint (e.g., Juggernaut XL, RealVisXL) can match Midjourney on individual images but requires more expertise. Ideogram v2 is solid but not best-in-class for portrait work.

---

## 2. Recommended Workflow

### Primary recommendation: Midjourney v6.1

### Fallback recommendation: Flux 1.1 Pro (via Replicate API)

The fallback is recommended if the operator needs full scriptability, has no Midjourney subscription, or needs more than ~20 iterations without hitting rate limits.

### Step-by-step process

**Phase 1 -- Style Anchor (1 hour)**

1. Generate 4-6 exploratory images in Midjourney using the base prompt template (Section 3) with varied subjects (different genders, ages, ethnicities) to establish the visual register.
2. Select the single best image as the **style anchor**. This image defines the lighting, color treatment, level of abstraction, and finish quality for the entire set.
3. Extract the style reference code: use `/describe` on the anchor image, note the `--sref` value, and record it in the generation log.
4. Generate 2-3 test images using the `--sref` value to confirm consistency holds across different subjects.

**Phase 2 -- Portrait Briefs (30 minutes)**

5. Receive (or assemble from upstream agents' output) the ten individual portrait briefs. Each brief should specify at minimum:
   - Subject archetype (not a real person's likeness)
   - Distinguishing visual trait or accessory
   - Mood / expression direction
   - Any rank-metal color accent to incorporate

6. Map each brief to a numbered prompt using the template structure in Section 3.

**Phase 3 -- Generation (2-3 hours)**

7. Generate each portrait in the fixed order (01 through 10). For each:
   - Submit the prompt with `--sref [anchor code]`, `--ar 1:1`, `--s 250`, `--q 2`.
   - From the 4-image grid, select the best candidate.
   - Upscale the selected candidate to maximum resolution.
   - If no candidate in the grid passes the quality baseline (Section 5), re-roll once with the same prompt. If still failing, proceed to the iteration protocol (Section 4).

8. After every third portrait, compare the latest output against the style anchor and the first completed portrait. If drift is visible, regenerate with an increased `--sw` (style weight) value.

**Phase 4 -- Review and Polish (1-2 hours)**

9. Lay out all ten portraits in a contact sheet (2 rows of 5). Evaluate as a set:
   - Does the color temperature hold across all ten?
   - Is the level of detail consistent? (No single portrait should look significantly more or less "finished" than its neighbors.)
   - Do the backgrounds maintain a coherent family resemblance?
   - Is demographic representation appropriate and non-stereotypical?

10. Re-generate any outliers using the iteration protocol.

11. Export final files per the naming convention in Section 6.

**Phase 5 -- Handoff**

12. Deliver the ten final PNGs, the generation log, and the contact sheet to the downstream agent (Agent 08 or the integration lead).

---

## 3. Consistency Strategy

### 3.1 Prompt Template

Every portrait prompt must follow this structure. Fields in `[brackets]` are per-portrait variables; everything else is fixed across the set.

```
Professional portrait of [SUBJECT DESCRIPTION], [EXPRESSION/MOOD],
[DISTINGUISHING DETAIL]. Shot against a [deep navy / warm dark]
background with subtle warm gold rim lighting. Painterly-photographic
hybrid rendering, shallow depth of field, warm amber and navy color
grade. Corporate portraiture with editorial quality. Skin has natural
texture, no airbrushing. Eye-level camera angle. --ar 1:1 --sref [ANCHOR]
--sw 100 --s 250 --q 2 --v 6.1
```

**Fixed elements (never change between portraits):**
- Background tone: deep navy, tied to the platform's `#16202e` / `#1b2a52` range
- Lighting: warm gold rim light (derived from the `--lime` / `--mint` accent colors)
- Rendering style: "painterly-photographic hybrid" -- this phrase controls the level of abstraction, keeping portraits out of both uncanny-valley photorealism and obviously-illustrated territory
- Camera angle: eye-level
- Color grade: warm amber and navy
- Quality modifiers: "corporate portraiture with editorial quality", "skin has natural texture, no airbrushing"

**Variable elements (change per portrait):**
- Subject description: age range, gender, ethnicity, build, hair
- Expression/mood: confident, contemplative, warm, determined, etc.
- Distinguishing detail: a specific accessory, clothing detail, or pose variation

### 3.2 Style Reference Management

| Parameter | Value | Purpose |
|---|---|---|
| `--sref` | [extracted from anchor image] | Locks visual DNA |
| `--sw` | 100 (default), increase to 200 if drift appears | Style weight |
| `--s` | 250 | Stylization level -- high enough for polish, not so high that prompt is overridden |
| `--q` | 2 | Maximum quality |
| `--v` | 6.1 | Model version -- do NOT mix versions within the set |

### 3.3 Generation Order

Portraits are generated in this order, designed to catch consistency problems early:

1. **Portrait 03** (median complexity brief) -- first real output after the anchor
2. **Portrait 07** (highest contrast to 03 in subject demographics) -- tests style lock across very different subjects
3. **Portrait 01** -- if 01, 03, and 07 look coherent, the style lock is working
4. Remaining portraits in numeric order: 02, 04, 05, 06, 08, 09, 10

This front-loads the diversity stress test. If portraits 03 and 07 look like they belong together, the remaining eight almost certainly will.

### 3.4 Background Consistency

All ten portraits must share the same background treatment. The target is:

- Deep navy-to-dark gradient, approximately `#1b2a52` at center fading to `#0c0a07` at edges
- No environmental details (no bookshelves, no offices, no landscapes)
- Subtle warm light spill on the background behind the subject's head, creating a soft halo effect consistent with the gold rim lighting
- No text, no logos, no watermarks

If a generation introduces an environment or object in the background, that image fails the quality baseline and must be re-rolled.

### 3.5 Skin Tone and Representation Notes

The set must represent visible diversity without tokenizing. Do not assign rank metals to specific ethnicities. Do not use prompt language that stereotypes. Use neutral, descriptive language for skin tone (e.g., "warm brown skin", "fair complexion with freckles", "deep brown complexion") rather than ethnic or national labels.

---

## 4. Iteration Protocol

When a portrait does not pass the quality baseline (Section 5), follow this exact sequence.

### Attempt 1: Re-roll (same prompt)

- Submit the identical prompt again. Midjourney's randomization may produce a passing result without any changes.
- If Flux: re-submit with a different random seed.
- **Decision point:** If any image in the new grid passes, select and upscale it. Done.

### Attempt 2: Prompt micro-adjustment

- Identify the specific failure (see Section 5 rubric).
- Adjust ONLY the failing element in the prompt. Do not rewrite the entire prompt.
- Common adjustments:

| Failure | Adjustment |
|---|---|
| Background too busy | Prepend "minimalist portrait, solid dark background," |
| Expression wrong | Replace expression phrase; add "natural expression, not posed" |
| Too illustrated / too flat | Add "photographic lighting, volumetric" |
| Color too cold | Add "warm color temperature, amber tones" |
| Inconsistent with set | Increase `--sw` to 150 or 200 |
| Anatomical error (hands, ears) | Reframe to exclude the problem area: "head and shoulders only, no hands visible" |

### Attempt 3: Prompt restructure

- Rewrite the variable portion of the prompt from scratch while keeping ALL fixed elements identical.
- Generate a new 4-image grid.

### Attempt 4: Inpainting (Midjourney only)

- If the composition and subject are correct but a localized defect exists (a smeared ear, a doubled eye), use Midjourney's Vary (Region) to regenerate only the defective area.

### Attempt 5: Escalation

- If four attempts have not produced a passing image, **stop**. Flag the portrait number in the generation log with status `BLOCKED` and a description of the persistent failure. Notify the project lead (the relay coordinator or the upstream brief author) before spending more credits.
- Maximum total attempts per portrait before escalation: **5 generations** (each producing 4 candidates = 20 images evaluated).

---

## 5. Quality Baselines

Each portrait is evaluated against this rubric at two checkpoints.

### Checkpoint A: Grid Selection (before upscale)

Evaluate each of the 4 grid candidates. A candidate must score YES on every mandatory criterion to be selected.

| # | Criterion | Mandatory? | Check |
|---|---|---|---|
| 1 | Subject matches brief description | YES | Does the rendered subject plausibly match the described archetype? |
| 2 | Background is clean navy/dark | YES | No environment, no objects, no text |
| 3 | Color temperature is warm | YES | Gold/amber rim light visible; no blue-cold cast |
| 4 | No anatomical errors | YES | Correct finger count, symmetric ears, no merged features |
| 5 | Expression is natural | YES | Not blank, not exaggerated, not unsettling |
| 6 | Consistent with anchor image style | YES | Side-by-side with anchor: same rendering approach, same finish level |
| 7 | No watermarks or text artifacts | YES | Clean image, no embedded text |
| 8 | Square composition works | NO (prefer) | Subject is well-framed in 1:1; not awkwardly cropped |
| 9 | Distinguishing detail is present | NO (prefer) | The brief's specified accessory or trait is visible |

### Checkpoint B: Final Review (after upscale, before export)

Evaluate the upscaled portrait at full resolution.

| # | Criterion | Pass Threshold |
|---|---|---|
| 1 | Resolution | Minimum 1024x1024 px; target 2048x2048 px or higher |
| 2 | Upscale artifacts | No visible blocky upscale halos, no sharpening rings |
| 3 | Detail fidelity | Skin texture, hair strands, fabric weave are resolved (not smeared) |
| 4 | Color accuracy | Rim light still reads as gold/amber, not shifted by upscaler |
| 5 | Set cohesion | When placed in the contact sheet, this portrait does not "pop" as an outlier in style, finish, or color |

### Subjective Style Match Score

For set cohesion evaluation, use this 1-5 scale:

| Score | Meaning | Action |
|---|---|---|
| 5 | Indistinguishable from anchor style | Ship |
| 4 | Minor deviation, reads as same set | Ship |
| 3 | Noticeable but not jarring | Regenerate if time allows |
| 2 | Clearly different treatment | Must regenerate |
| 1 | Wrong style entirely | Discard, restart from prompt template |

Minimum passing score: **4**. A set with any portrait scoring 3 or below should not be delivered without sign-off from the project lead.

---

## 6. File Management

### 6.1 Naming Convention

```
thrive-portrait-{NN}-v{V}.png
```

| Component | Format | Example |
|---|---|---|
| `NN` | Two-digit portrait number, 01-10 | `05` |
| `V` | Version number, starting at 1 | `1`, `2`, `3` |

Examples:
- `thrive-portrait-01-v1.png` -- first accepted version of portrait 1
- `thrive-portrait-07-v3.png` -- third attempt at portrait 7

**The delivered file drops the version suffix:**
- `thrive-portrait-07.png` -- final delivered version

### 6.2 Directory Structure

```
thrive-portraits/
  anchor/
    style-anchor-v1.png          # The style reference image
    style-anchor-sref.txt        # The --sref code, plain text
  drafts/
    thrive-portrait-01-v1.png
    thrive-portrait-01-v2.png    # If regenerated
    ...
  final/
    thrive-portrait-01.png       # Delivered versions
    thrive-portrait-02.png
    ...
    thrive-portrait-10.png
    contact-sheet.png             # All 10 in a 2x5 grid
  logs/
    generation-log.csv            # See 6.3
```

### 6.3 Generation Log

A CSV file with one row per generation attempt (not per portrait -- every re-roll gets a row).

| Column | Description |
|---|---|
| `portrait_num` | 01-10 |
| `attempt` | Sequential attempt number for this portrait |
| `timestamp` | ISO 8601 UTC |
| `platform` | `midjourney-v6.1`, `flux-1.1-pro`, etc. |
| `prompt` | Full prompt text |
| `sref` | Style reference code used |
| `sw` | Style weight used |
| `seed` | Seed value (if available; Midjourney exposes this post-generation) |
| `selected_index` | Which of the 4 grid images was chosen (1-4), or `none` |
| `quality_score` | Subjective 1-5 style match score |
| `status` | `selected`, `rejected`, `blocked` |
| `notes` | Free-text: why rejected, what was adjusted |

### 6.4 Metadata to Embed

Each delivered PNG should carry the following in its EXIF/XMP metadata (use `exiftool` or equivalent):

- **Title:** `THRIVE Portrait {NN}`
- **Creator:** `THRIVE / J.A.R.V.I.S. Creative Relay`
- **Description:** The portrait brief text
- **Source:** Platform and model version used
- **Rights:** `Internal use only -- THRIVE platform`

---

## 7. Settings Matrix

### 7.1 Midjourney v6.1 (Primary)

| Parameter | Value | Notes |
|---|---|---|
| Model version | `--v 6.1` | Do not use v5, v6.0, or niji |
| Aspect ratio | `--ar 1:1` | Square, native support |
| Stylization | `--s 250` | High polish without overriding prompt |
| Quality | `--q 2` | Maximum quality, longer generation |
| Style reference | `--sref [anchor code]` | Extracted from Phase 1 |
| Style weight | `--sw 100` | Default; increase to 200 if drift |
| Chaos | `--c 0` | Minimum variation within a grid |
| Weird | `--w 0` | No weird mode |
| Tile | not used | Not tiling |
| Upscaler | Default (2x or 4x) | Use "Upscale (Subtle)" for portraits |
| Output resolution | 2048x2048 (after upscale) | Native grid images are 1024x1024 |

### 7.2 Flux 1.1 Pro via Replicate (Fallback)

| Parameter | Value | Notes |
|---|---|---|
| Model | `black-forest-labs/flux-1.1-pro` | Latest stable |
| Width | 1024 | Square |
| Height | 1024 | Square |
| Guidance scale | 3.5 | Flux default; do not exceed 5.0 for portraits |
| Num inference steps | 28 | Good quality/speed tradeoff |
| Seed | Record per generation; fix for iteration | Explicit seed control is the primary consistency tool |
| Output format | PNG | Lossless |
| Safety tolerance | Platform default | Do not disable |
| Prompt upsampling | Disabled | Use exact prompts, not expanded ones |

### 7.3 DALL-E 3 via OpenAI API (Tertiary / Verification)

| Parameter | Value | Notes |
|---|---|---|
| Model | `dall-e-3` | |
| Size | `1024x1024` | Only supported square size |
| Quality | `hd` | Higher detail |
| Style | `natural` | Not `vivid`; portraits should not be hyper-saturated |
| n | 1 | One image per call (DALL-E 3 limitation) |
| Response format | `b64_json` | Decode and save as PNG |
| Revised prompt | Log it | DALL-E 3 rewrites prompts internally; log the revised version for debugging |

### 7.4 Stable Diffusion XL (Specialist Use Only)

Only use SDXL if a specific checkpoint (e.g., RealVisXL, Juggernaut XL) is needed for a portrait that neither Midjourney nor Flux can land.

| Parameter | Value | Notes |
|---|---|---|
| Checkpoint | `RealVisXL V4.0` or `Juggernaut XL v9` | Portrait-specialized |
| Width | 1024 | |
| Height | 1024 | |
| Sampler | DPM++ 2M Karras | Best balance for portraits |
| Steps | 30 | |
| CFG scale | 7.0 | |
| Seed | Record and fix for iteration | |
| Negative prompt | `watermark, text, deformed, blurry, low quality, oversaturated, cartoon, anime, 3d render, out of frame, cropped, bad anatomy, extra fingers, mutated hands` | |
| Clip skip | 2 | Standard for SDXL |
| VAE | SDXL default (baked in) | |
| Refiner | SDXL refiner at 0.8 denoise | Optional, for fine detail |
| LoRA | Portrait-specific if available | Record name and weight |

---

## 8. Color Alignment Procedure

After generation, each portrait's color profile should be checked against the THRIVE palette. This is a post-processing step, not a generation parameter.

1. Open the final portrait in an image editor with a color picker.
2. Sample the darkest background region. It should fall within `deltaE < 15` of `#16202e` (THRIVE navy) or `#0c0a07` (ink).
3. Sample the rim light highlight. It should fall within `deltaE < 20` of `#d9a63a` (lime/gold) or `#e0b64e` (gold mid).
4. If colors are substantially off, apply a subtle color grade in post:
   - Shadows: push toward navy (`#1b2a52`)
   - Highlights: push toward warm gold (`#e0b64e`)
   - Midtones: leave neutral
   - Keep adjustments under 15% intensity to avoid an obviously-filtered look.

Do NOT color-correct skin tones. Only background and lighting colors are adjusted.

---

## 9. Platform-Specific Traps

| Platform | Trap | Mitigation |
|---|---|---|
| Midjourney | `--sref` codes expire when the model updates | Record the anchor image itself, not just the code; re-extract if needed |
| Midjourney | Discord bot rate limits during batch work | Space generations 15-20 seconds apart; use the web app for faster throughput |
| Midjourney | "Vary (Region)" can shift the overall style | After inpainting, re-check set cohesion score |
| DALL-E 3 | Internally rewrites your prompt | Always log the revised prompt; if it deviates too far, rephrase your input to steer the rewriter |
| DALL-E 3 | Refuses certain portrait prompts as "public figure" | Use abstract descriptions, never proper names; never reference real people |
| Flux | Guidance scale above 5 produces oversaturated, "fried" results | Stay at 3.5 for portraits |
| Flux | No native style reference mechanism | Consistency comes from fixed seeds + identical prompt structure |
| SDXL | Checkpoint quality varies wildly | Test with the recommended checkpoints above; do not experiment mid-set |
| SDXL | NSFW safety filters may false-positive on close-up portraits | Use a portrait-specific checkpoint that is calibrated for this |
| All | AI-generated portraits can reproduce demographic biases | Review the full set for stereotyping before delivery |

---

## 10. Budget Estimate

| Platform | Cost per Image | 10 Portraits (est. 3x iterations avg) | Total |
|---|---|---|---|
| Midjourney (Pro plan, $30/mo) | ~$0.10 per generation | 30 generations | Already covered by subscription |
| Flux 1.1 Pro (Replicate) | ~$0.04 per image | 30 generations | ~$1.20 |
| DALL-E 3 (OpenAI API) | $0.080 per image (HD 1024) | 30 generations | ~$2.40 |
| SDXL (self-hosted) | GPU cost only | 30 generations | ~$0.50 (cloud GPU) |

Total estimated cost for the recommended Midjourney workflow: covered by a $30/month Pro subscription, with substantial headroom for iteration.

---

## 11. Delivery Checklist

Before handing off to the downstream agent:

- [ ] All 10 portraits exist in `thrive-portraits/final/`
- [ ] Every portrait is minimum 1024x1024 px (target 2048x2048)
- [ ] Every portrait passes Checkpoint B (Section 5)
- [ ] Every portrait scores 4 or 5 on the style match rubric
- [ ] Contact sheet (`contact-sheet.png`) is generated showing all 10 in a 2x5 grid
- [ ] Generation log (`generation-log.csv`) is complete with all attempts recorded
- [ ] Style anchor image and `--sref` code are preserved in `thrive-portraits/anchor/`
- [ ] EXIF metadata is embedded in each delivered PNG
- [ ] File names follow the convention: `thrive-portrait-{01-10}.png`
- [ ] No portrait contains text, watermarks, or environmental backgrounds
- [ ] The set has been reviewed for demographic representation and visual stereotyping
- [ ] Color alignment procedure (Section 8) has been applied where needed

---

*End of specification. Agent 07 -- IMAGE MAKER -- complete.*