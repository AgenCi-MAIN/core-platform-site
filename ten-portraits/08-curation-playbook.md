# Curation Playbook — Ten Agents, Ten Portraits

## Agent 08: Collection Curator

---

## 1. SELECTION CRITERIA

Each portrait candidate is scored on five dimensions. Every dimension is rated 1-5. A candidate must score at least 3 on every dimension and achieve a total of 20 or higher (out of 25) to qualify for the final set.

### 1A. Style Adherence (1-5)

Evaluates whether the portrait conforms to the visual style sheet established by the Style Architect.

| Score | Meaning |
|-------|---------|
| 5 | Indistinguishable from the style reference — lighting angle, rendering technique, color grading, and line quality all match exactly |
| 4 | One minor deviation (e.g., slightly warmer color temperature) that would not be noticed without direct comparison |
| 3 | Two minor deviations or one moderate one (e.g., different shadow treatment); still reads as the same family |
| 2 | Clearly the same general genre but noticeably different in execution — would prompt a viewer to ask "different artist?" |
| 1 | Different style entirely; does not belong in the set |

**What to check:** Rendering technique (painterly vs. clean vector vs. photorealistic), lighting direction and quality (hard rim light, soft ambient, dramatic chiaroscuro), level of detail and abstraction, edge treatment (crisp vs. feathered vs. textured), background handling, and any signature stylistic motifs (grain, chromatic aberration, halftone, geometric overlays).

### 1B. Trait Accuracy (1-5)

Evaluates whether the portrait communicates its assigned personality trait combination as defined by the Trait Matrix.

| Score | Meaning |
|-------|---------|
| 5 | A viewer unfamiliar with the brief could name the core traits from the image alone |
| 4 | The primary trait reads immediately; the secondary trait is present but requires a moment |
| 3 | The primary trait reads; the secondary trait is ambiguous but not contradicted |
| 2 | The portrait conveys a mood, but it maps to different traits than those assigned |
| 1 | Blank expression or generic "stock photo" energy — no discernible character |

**What to check:** Facial expression micro-signals (brow tension, mouth set, eye openness), posture and head angle, gaze direction (direct challenge, sidelong assessment, distant focus), and any prop or accessory cues that reinforce the trait.

### 1C. Technical Quality (1-5)

Evaluates the image as a production asset — free from generation artifacts and ready for deployment at the required resolutions.

| Score | Meaning |
|-------|---------|
| 5 | Pixel-clean at 1024x1024 or above. No artifacts of any kind. Clean alpha or background separation if applicable |
| 4 | One cosmetic imperfection visible only at 100% zoom that would vanish at deployment sizes |
| 3 | Minor artifacts present (slight asymmetry, a soft edge that should be hard, minor color banding) — correctable in post without redrawing |
| 2 | Visible artifacts at deployment size — extra fingers, melted accessories, broken symmetry, aliased edges, tiling seams |
| 1 | Unusable — major distortion, corrupted regions, resolution too low to crop |

**Artifact checklist (reject on any):**
- Extra or missing fingers, teeth, or ear structures
- Asymmetric glasses, collars, or other symmetric accessories
- Text or watermark artifacts baked into the image
- Visible seam lines or repeated texture patches
- Eye alignment errors (strabismus unless intentional)
- Hair that merges with background in an unrecoverable way

### 1D. Thumbnail Readability (1-5)

Evaluates whether the portrait is recognizable and distinctive when rendered at avatar sizes (48x48, 64x64, 96x96 pixels).

| Score | Meaning |
|-------|---------|
| 5 | Instantly recognizable at 48x48. Unique silhouette, strong value contrast, face clearly reads |
| 4 | Recognizable at 64x64; at 48x48 the face reads but fine details merge |
| 3 | Recognizable at 96x96; at smaller sizes it becomes a colored blob with a vaguely human shape |
| 2 | Requires 128x128 or larger to parse; too much fine detail, insufficient contrast, or face too small in frame |
| 1 | Unreadable at any reasonable avatar size — overly busy, low contrast, or poor framing |

**Thumbnail test procedure:**
1. Downscale the candidate to 48x48 using bicubic interpolation (not nearest-neighbor).
2. Place the thumbnail on both a white (#FFFFFF) background and a dark (#1A1A2E) background.
3. Place it adjacent to three other candidate thumbnails.
4. The portrait passes if a new viewer can describe which one is "the one with [distinguishing feature]" without hesitation.

### 1E. Emotional Impact (1-5)

Evaluates whether the portrait creates a genuine reaction — whether the viewer feels something about this character beyond visual recognition.

| Score | Meaning |
|-------|---------|
| 5 | Arresting. The viewer pauses. There is a sense of encountering a real person with interior life — you want to know their story |
| 4 | Engaging. The character has presence and a clear emotional register. You remember this face after looking away |
| 3 | Competent. The portrait is "good" but does not linger. Professional headshot energy — technically sound, emotionally neutral |
| 2 | Flat. The image is well-made but the character feels like a mannequin or a composite of stock cues |
| 1 | Repellent or confusing. The uncanny valley, an unsettling expression mismatch, or a complete absence of character |

**Evaluation protocol:** Show the portrait to at least two reviewers for three seconds, then remove it. Ask: "What kind of person is this?" If they can answer with a specific characterization (not just "a man" or "a woman"), score 3 or above. If their characterization aligns with the assigned traits, score 4 or above.

---

## 2. COHERENCE TESTS

Individual excellence is necessary but not sufficient. The ten portraits must function as a unified collection. Run these five tests on the full set.

### 2A. Grid Test

**Setup:** Arrange all ten portraits in a 2x5 grid (2 rows of 5) at equal size, with 8px spacing, on a neutral mid-gray (#808080) background. Also produce a 5x2 variant (5 rows of 2) for vertical display contexts.

**Pass criteria:**
- First impression at arm's length: the grid reads as one project, one vision, one team — not a mood board scraped from ten different sources.
- No single cell draws the eye disproportionately due to brightness, saturation, or stylistic mismatch.
- The overall grid has visual rhythm — the eye moves across it without snagging.

**Fail signals:**
- One portrait is significantly more saturated, brighter, or darker than its neighbors.
- One portrait uses a noticeably different rendering technique.
- The grid looks like "nine of these and one of those."

### 2B. Pair Test

**Setup:** Generate all 45 unique pairings (10 choose 2). Display each pair side by side.

**Pass criteria:** Every pair should look like two members of the same organization, rendered by the same artist, in the same session. They should look *related* without looking *identical*.

**Sampling shortcut:** If full 45-pair review is impractical, test these critical pairs:
- The two most visually similar portraits (to confirm they are still distinguishable)
- The two most visually different portraits (to confirm they still read as the same family)
- Each portrait paired with its immediate grid neighbors

**Fail signal:** Any pair where a viewer would say "these are from different projects."

### 2C. Outlier Test

**Setup:** Show the grid to a reviewer and ask: "If one of these does not belong, which one?" Repeat with at least two reviewers independently.

**Pass criteria:** No portrait is named by more than one reviewer. Ideally, reviewers say "they all belong."

**Fail signal:** Two or more reviewers independently identify the same portrait as the outlier. That portrait must be reworked or replaced.

**Quantitative backup:** Calculate the mean and standard deviation of each portrait's average color (in LAB color space), overall brightness, and saturation. Any portrait more than 1.5 standard deviations from the mean on two or more of these metrics is flagged for manual review.

### 2D. Color Balance

**Purpose:** Ensure the collection's palette is distributed intentionally, not accidentally clustered.

**Procedure:**
1. Extract the dominant 3-color palette from each portrait (background, skin/primary, accent).
2. Plot all 30 colors on a hue wheel.
3. Check for clustering: if more than 4 portraits share the same dominant hue within a 30-degree arc, the set is hue-stacked and needs redistribution.
4. Check for gaps: if any 120-degree arc of the hue wheel is completely empty, the set may feel monotone.

**Acceptable distributions:**
- Analogous cluster with intentional accent breaks (e.g., eight cool-toned portraits with two warm accents)
- Even distribution across the wheel (each portrait occupying its own hue territory)
- Monochromatic with value/saturation variation (if the style sheet specifies a restricted palette)

**Unacceptable:** Accidental clustering where seven portraits are blue-teal and three are randomly warm, with no compositional logic.

### 2E. Diversity Check

**Purpose:** Ensure the ten portraits are instantly distinguishable from each other, even at thumbnail size.

**Procedure:**
1. Render all ten as 48x48 thumbnails in a single row.
2. A viewer should be able to point to any thumbnail and distinguish it from its neighbors within one second.
3. Check for diversity across these axes:
   - **Silhouette:** Hair shape, head angle, shoulder line. No two portraits should have identical silhouettes.
   - **Value key:** Mix of high-key (bright) and low-key (dark) portraits. Not all the same brightness.
   - **Color accent:** Each portrait should have at least one color element that is unique to it in the set.
   - **Expression range:** The set should span at least three distinct emotional registers (e.g., intensity, calm, warmth, suspicion, amusement).
   - **Compositional variety:** Mix of direct gaze, three-quarter, and profile angles. Not all facing the same direction.

**Fail signal:** Two portraits that could be confused for each other at thumbnail size. Remedy: adjust one or both until the confusion is eliminated — typically through a color accent shift, a head angle change, or a silhouette modification.

---

## 3. SELECTION PROCESS

### Overview

The process narrows a pool of candidates to exactly ten final portraits through three rounds. The pipeline assumes that upstream agents generate multiple candidates per character slot.

### Step 1: Candidate Generation Target

Request **3-5 candidates per character slot**, yielding a pool of 30-50 total images. Fewer than 3 per slot does not give enough room for selection; more than 5 per slot introduces diminishing returns and review fatigue.

### Step 2: First Round — Gate Check (per portrait, independent)

Apply the five selection criteria from Section 1 to every candidate independently. This round evaluates each image on its own merits, without considering set composition.

**Elimination rule:** Any candidate scoring below 3 on any single dimension is eliminated. Any candidate with a total score below 20 is eliminated.

**Expected survival rate:** 50-70% of candidates should pass this round. If fewer than 2 candidates per slot survive, request additional generations for that slot before proceeding.

**Output:** A shortlist of 2-3 candidates per slot (20-30 images total).

### Step 3: Second Round — Set Composition (comparative)

Now evaluate the surviving candidates as a collection. For each character slot, test each surviving candidate against the current best picks for the other nine slots.

**Procedure:**
1. Start by selecting the highest-scoring candidate for each slot as the provisional pick.
2. Assemble the provisional set of ten and run the five coherence tests from Section 2.
3. Identify any coherence failures.
4. For each failing portrait, swap in the next-best candidate for that slot and retest.
5. Repeat until all five coherence tests pass, or until candidate options are exhausted for a slot (triggering a re-generation request).

**Priority order when resolving conflicts:**
1. Outlier test failures take precedence (a portrait that does not belong breaks the collection).
2. Color balance failures next (palette clustering is immediately visible in the grid).
3. Diversity check failures next (confusable portraits undermine the purpose of having ten distinct characters).
4. Pair test failures last (subtle style mismatches are the easiest to correct in post-production).

### Step 4: Third Round — Final Ranking and Lock

Once a set of ten passes all coherence tests:

1. Rank the final ten by total score (highest to lowest). This ranking determines the order of presentation to the director but does not change inclusion.
2. For each of the ten, record:
   - The selected candidate's filename/ID
   - Its individual scores (5 dimensions)
   - Its total score
   - One sentence on why it was chosen over alternatives for that slot
   - One sentence on its contribution to set coherence
3. Lock the set. No further changes without invoking the Swap Protocol (Section 4).

### Tie-Breaking Rules

When two candidates for the same slot have identical total scores and both pass coherence tests equally:

1. **Thumbnail readability wins.** The portrait that reads better at 48x48 is selected — deployment context favors small-size clarity.
2. **If still tied, emotional impact wins.** The portrait with greater presence and character is selected.
3. **If still tied, prefer the candidate that contributes more color diversity** to the overall set (measured by hue distance from the nearest neighbor in the grid).
4. **If still tied after all three tiebreakers,** the curator chooses on instinct and documents the reasoning.

---

## 4. SWAP PROTOCOL

### When a Swap Is Triggered

A swap occurs when a locked portrait must be replaced. Valid triggers:

| Trigger | Authority | Urgency |
|---------|-----------|---------|
| Director rejects a portrait in final review | Director (Agent 01) | Immediate |
| Technical defect discovered post-lock (artifact missed in QA) | Any agent | Immediate |
| Trait assignment changes (upstream decision by Agent 03) | Trait Architect | Standard |
| Style sheet revision makes a portrait non-conformant | Style Architect (Agent 02) | Standard |
| Coherence failure discovered after a prior swap destabilized the set | Curator (self-initiated) | Standard |
| Platform requirements change (e.g., new size constraint breaks thumbnail readability) | Platform lead | Standard |

### Swap Procedure

1. **Identify the outgoing portrait.** Record its slot number, scores, and the reason for removal.

2. **Check the bench.** Review the eliminated candidates from Rounds 1-2 for that slot. If a candidate exists that:
   - Passes the gate check (Section 3, Step 2), AND
   - Passes all coherence tests when substituted into the current set (Section 2)
   
   ...then select it. Prefer bench candidates over new generations to minimize churn.

3. **If no bench candidate qualifies,** request 3 new candidates for that slot, specifying:
   - The current style sheet
   - The assigned trait combination
   - The color/silhouette/angle constraints needed to maintain set coherence (derived from the remaining nine portraits)

4. **Run the new candidates through the full selection process** (gate check, then coherence tests against the remaining nine).

5. **After substitution, re-run all five coherence tests** on the complete new set of ten. A swap can destabilize neighbors — the pair test and color balance test are particularly sensitive to single-portrait changes.

6. **If the re-run reveals a new coherence failure,** the swap has cascaded. Do NOT swap a second portrait immediately. Instead:
   - Attempt post-production adjustments on the new portrait (color grading, brightness correction) to resolve the coherence issue without a full replacement.
   - If post-production cannot resolve it, escalate to the director with the specific conflict and two options: (a) accept the minor coherence deviation, or (b) authorize a second swap.

7. **Document the swap** in the selection record: outgoing portrait ID, incoming portrait ID, reason, coherence test results before and after, and any cascading effects.

### Swap Limits

- **Maximum two swaps per review cycle.** More than two swaps in a single cycle indicates a systemic issue (style sheet ambiguity, trait conflicts, generation quality) that should be addressed at the source, not through iterative replacement.
- **A portrait that has been swapped once may not be swapped again in the same cycle** unless the director explicitly overrides.

---

## 5. FINAL CONTACT SHEET SPEC

The contact sheet is the definitive presentation artifact for the director's review.

### Layout

**Primary layout:** 2 rows x 5 columns, landscape orientation.

```
+--------+--------+--------+--------+--------+
|  P-01  |  P-02  |  P-03  |  P-04  |  P-05  |
|        |        |        |        |        |
+--------+--------+--------+--------+--------+
|  P-06  |  P-07  |  P-08  |  P-09  |  P-10  |
|        |        |        |        |        |
+--------+--------+--------+--------+--------+
```

**Dimensions:**
- Each portrait cell: 512x512 pixels
- Gutter between cells: 16px
- Outer margin: 32px
- Total canvas: (512x5 + 16x4 + 32x2) = 2688 x (512x2 + 16x1 + 32x2) = 1104 pixels
- Background: neutral gray (#808080) to avoid biasing color perception

**Alternate layout for vertical review contexts:** 5 rows x 2 columns, portrait orientation, same cell sizes and spacing.

### Labels

Each portrait cell carries a label bar below it, 40px tall, containing:

```
P-[##] | [Trait Primary] / [Trait Secondary] | Score: [##]/25
```

- Font: system sans-serif (or the project's UI font if defined), 14px, white (#FFFFFF) on dark gray (#2A2A2A) label bar
- Slot number is zero-padded two digits (P-01 through P-10)
- Traits are the short-form labels from the Trait Matrix
- Score is the total from the five selection criteria

Example:
```
P-04 | Calculated / Resolute | Score: 23/25
```

### Annotation Format

Below the grid, include a summary block with:

1. **Set Statistics:**
   - Mean score across all ten portraits
   - Lowest individual score and which portrait holds it
   - Highest individual score and which portrait holds it
   - Score standard deviation (lower is better for set consistency)

2. **Coherence Test Results:**
   - Grid test: PASS / FAIL + notes
   - Pair test: PASS / FAIL + any flagged pairs
   - Outlier test: PASS / FAIL + any flagged portraits
   - Color balance: PASS / FAIL + hue distribution summary
   - Diversity check: PASS / FAIL + any confusable pairs

3. **Curator's Note:** 2-3 sentences on the overall character of the set — its visual identity, its strongest portrait, and any known compromises.

### Companion Thumbnail Strip

In addition to the main contact sheet, produce a **thumbnail strip** showing all ten portraits at actual deployment size:

```
[48] [48] [48] [48] [48] [48] [48] [48] [48] [48]
```

- 48x48 pixels each, 4px spacing, on both light (#F5F5F5) and dark (#1A1A2E) backgrounds
- This is the ultimate deployment reality check: if the set does not work here, it does not work.

### File Deliverables

The contact sheet package consists of three files:

| File | Format | Purpose |
|------|--------|---------|
| `contact-sheet-full.png` | PNG, lossless | Primary review artifact at 512px per portrait |
| `contact-sheet-thumbs-light.png` | PNG, lossless | Thumbnail strip on light background |
| `contact-sheet-thumbs-dark.png` | PNG, lossless | Thumbnail strip on dark background |

All three are presented together to the director. The full sheet is for evaluation; the thumbnail strips are for deployment sign-off.

---

## Appendix: Quick Reference Scorecard

For rapid evaluation during selection rounds, use this condensed form per candidate:

```
Slot: P-[##]
Candidate ID: [filename or generation ID]
-------------------------------------------
Style Adherence:      [ ] / 5
Trait Accuracy:        [ ] / 5
Technical Quality:     [ ] / 5
Thumbnail Readability: [ ] / 5
Emotional Impact:      [ ] / 5
-------------------------------------------
TOTAL:                 [ ] / 25
Gate Check:            PASS / FAIL
Notes:
```

---

*End of Curation Playbook — Agent 08, Collection Curator*