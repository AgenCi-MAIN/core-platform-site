# Ten Agents, Ten Portraits — QA Checklist and Inspection Protocol

**Agent 09: Quality Guardian**
**Date:** 2026-08-19
**Version:** 1.0
**Status:** Active — nothing ships without sign-off from this protocol.

---

## 1. Per-Portrait Inspection Checklist

Apply every check below to each of the 10 portraits. A single FAIL on any critical check blocks that portrait from release.

### 1.1 Anatomy Check (Critical)

| # | Check | Criteria | Severity |
|---|-------|----------|----------|
| A1 | Finger count | Exactly 5 per visible hand; no fused, forked, or stub digits | Critical |
| A2 | Limb count | No extra arms, shoulders, or phantom limbs behind the figure | Critical |
| A3 | Facial symmetry | Eye line level within 2 degrees of horizontal; no drifting iris | Critical |
| A4 | Ear consistency | Both ears match in size, shape, and vertical placement when visible | Major |
| A5 | Proportions | Head-to-shoulder ratio natural for the style; no pinched necks or oversized craniums | Major |
| A6 | Teeth and mouth | If visible: correct count range, no floating teeth, no double lip line | Major |
| A7 | Hair boundary | Hairline transitions naturally into forehead/temples; no hard-cut paste edge | Minor |
| A8 | Pose plausibility | Shoulders, neck, and head orientation form a physically possible pose | Critical |

### 1.2 Edge Quality (Critical)

| # | Check | Criteria | Severity |
|---|-------|----------|----------|
| E1 | Silhouette cleanliness | Outline is smooth and intentional at 100% zoom; no jagged stairstepping | Critical |
| E2 | Color fringing | No chromatic halos (green, magenta, cyan) along contrast edges | Major |
| E3 | Background bleed | No background color leaking into hair, ears, or clothing edges | Major |
| E4 | Alpha channel | If transparency is used: no stray semi-transparent pixels outside the figure | Major |
| E5 | Artifact zones | Inspect ears, jawline, hair tips, and collar specifically — these are the most common failure sites | Major |

### 1.3 Text Detection (Critical)

| # | Check | Criteria | Severity |
|---|-------|----------|----------|
| T1 | Embedded text | No legible letters, numbers, or word fragments anywhere in the image | Critical |
| T2 | Texture text | Clothing, backgrounds, and accessories contain no accidental glyphs | Critical |
| T3 | Watermarks | No visible watermarks, model signatures, or generation IDs | Critical |
| T4 | Steganographic metadata | Strip all EXIF/XMP before release; no generation prompt leakage in metadata | Major |

### 1.4 Symbol Scan (Critical)

| # | Check | Criteria | Severity |
|---|-------|----------|----------|
| S1 | Brand marks | No shapes resembling known corporate logos (Nike swoosh, Apple, etc.) | Critical |
| S2 | Religious symbols | No crosses, crescents, stars, mandalas, or other religious iconography unless explicitly specified | Critical |
| S3 | Political symbols | No flags, emblems, partisan colors, or gesture-based political signals | Critical |
| S4 | Hate symbols | Cross-reference ADL hate symbol database categories; zero tolerance | Critical |
| S5 | Accidental iconography | Jewelry, patterns, and background shapes reviewed for unintended resemblance | Major |

### 1.5 Style Match

| # | Check | Criteria | Severity |
|---|-------|----------|----------|
| SM1 | Rendering technique | Matches the style sheet's specified rendering approach (e.g., flat illustration, soft 3D, painterly) | Critical |
| SM2 | Line weight | Consistent with style sheet specification (if line art: uniform weight; if lineless: no stray outlines) | Major |
| SM3 | Shading model | Light direction, shadow softness, and highlight placement match the style sheet | Major |
| SM4 | Level of detail | Neither over-rendered nor under-rendered relative to the collection standard | Minor |
| SM5 | Stylistic outlier test | Place the portrait in the grid; if it visually "pops out" as a different style, it fails | Major |

### 1.6 Trait Verification

| # | Check | Criteria | Severity |
|---|-------|----------|----------|
| TV1 | Primary trait present | The portrait's assigned primary trait from the matrix is visually identifiable | Critical |
| TV2 | Secondary trait present | The secondary trait is present and does not conflict with the primary | Critical |
| TV3 | No unassigned traits | Portrait does not display traits belonging to another portrait's assignment | Major |
| TV4 | Trait legibility | Traits are recognizable without needing the matrix as a decoder ring | Major |
| TV5 | Trait-to-portrait mapping | Cross-reference the trait combination matrix; confirm this is the correct portrait for this slot | Critical |

### 1.7 Thumbnail Test

| # | Check | Criteria | Severity |
|---|-------|----------|----------|
| TH1 | 48x48 recognition | Downsample to 48x48: the portrait is recognizable as a distinct person/character | Critical |
| TH2 | 48x48 differentiation | At 48x48, this portrait is not confusable with any other portrait in the set | Critical |
| TH3 | 32x32 legibility | At 32x32 (notification badge size): still reads as a face, not a color blob | Major |
| TH4 | Circular crop survival | When cropped to a circle (standard avatar mask), no critical features are lost | Major |
| TH5 | High-contrast readability | Readable against both white and dark backgrounds at thumbnail size | Minor |

### 1.8 Color Accuracy

| # | Check | Criteria | Severity |
|---|-------|----------|----------|
| C1 | Palette compliance | All dominant colors fall within the specified palette (measured by sampling 5 key regions) | Critical |
| C2 | Color tolerance | Sampled values are within deltaE 2000 <= 5 of the target swatch | Major |
| C3 | Skin tone fidelity | Skin tones are natural and match the specified range for this portrait | Critical |
| C4 | Contrast ratio | Foreground-to-background contrast ratio >= 3:1 (WCAG AA for non-text) | Major |
| C5 | Color banding | No visible banding in gradients (check hair, skin shadows, backgrounds) | Minor |
| C6 | Color space | Exported in sRGB; no unclamped wide-gamut values that shift on standard displays | Major |

---

## 2. Collection-Level Checks

These checks apply to the set of 10 as a whole. All 10 individual portraits must pass their per-portrait checks before collection-level review begins.

### 2.1 Similarity Threshold

| # | Check | Criteria | Pass Condition |
|---|-------|----------|----------------|
| SIM1 | Pairwise visual similarity | Compare every pair (45 pairs total) | No pair exceeds 70% structural similarity (SSIM or perceptual hash) |
| SIM2 | Silhouette uniqueness | Overlay silhouettes at normalized scale | No two silhouettes are confusable |
| SIM3 | Color signature uniqueness | Extract dominant 3-color signature per portrait | No two portraits share the same dominant triad |

**Method:** Generate a 45-cell pairwise similarity matrix. Flag any cell above 0.70. Flagged pairs require manual review and a determination of whether differentiation is sufficient for the use context (avatar selection list, grid display).

### 2.2 Diversity Floor

| # | Check | Criteria | Pass Condition |
|---|-------|----------|----------------|
| D1 | Trait space coverage | Map all 10 portraits onto the trait matrix | Every assigned trait combination is represented exactly once |
| D2 | Visual diversity | Inspect the 10 as a lineup | A reasonable observer perceives variety in appearance, not repetition |
| D3 | Pose variety | Catalog head angle, gaze direction, expression per portrait | No more than 3 portraits share the same pose category |
| D4 | Color variety | Plot dominant hues on a color wheel | Hues span at least 180 degrees of the wheel across the full set |

### 2.3 Grid Coherence

| # | Check | Criteria | Pass Condition |
|---|-------|----------|----------------|
| G1 | Family resemblance | Arrange all 10 in a 2x5 or 5x2 grid | A viewer's first impression is "one collection," not "ten random images" |
| G2 | Scale consistency | Measure face-to-frame ratio across all 10 | All faces occupy 55-75% of the vertical frame (or within the style sheet range) |
| G3 | Crop consistency | Check framing: head-top margin, shoulder cutoff point | Margins are uniform within 5% of frame height |
| G4 | Background treatment | Compare background approach across all 10 | Backgrounds follow one consistent strategy (solid, gradient, textured, or none) |
| G5 | Rendering fidelity parity | Check detail level and rendering quality | No portrait is noticeably more or less polished than the others |

### 2.4 Color Distribution

| # | Check | Criteria | Pass Condition |
|---|-------|----------|----------------|
| CD1 | Palette coverage | Map all portrait dominant colors onto the master palette | Every palette region is used by at least one portrait |
| CD2 | No palette domination | Count portraits per palette region | No single palette region accounts for more than 40% of portraits |
| CD3 | Warm/cool balance | Classify each portrait as warm-dominant or cool-dominant | Split is between 3:7 and 7:3 |
| CD4 | Value distribution | Measure average lightness per portrait | Range spans at least 30 lightness points (L* scale) |

### 2.5 Mood Consistency

| # | Check | Criteria | Pass Condition |
|---|-------|----------|----------------|
| M1 | Emotional register | Classify each portrait's emotional tone | All fall within the defined mood range (e.g., "approachable-professional" to "warm-confident") |
| M2 | No tonal outliers | Check for any portrait that reads as hostile, sad, anxious, or comedic if outside spec | Zero outliers |
| M3 | Energy level | Rate each portrait's perceived energy (calm to dynamic) | Range stays within 2 adjacent levels on a 5-point scale |

---

## 3. Policy and Safety Review

Every check in this section is **severity: Critical**. A single failure blocks the entire collection.

### 3.1 Real Person Likeness

| # | Check | Method |
|---|-------|--------|
| P1 | Known public figure | Two independent reviewers assess whether any portrait could be mistaken for a specific real person |
| P2 | Composite resemblance | Check that no portrait is a recognizable composite of identifiable individuals |
| P3 | Reverse image search | Run each portrait through reverse image search; no strong matches to real photographs |

**Standard:** If any reviewer flags a likeness, the portrait is held until the concern is resolved or the portrait is regenerated.

### 3.2 Cultural Sensitivity

| # | Check | Method |
|---|-------|--------|
| CS1 | Stereotyping | No portrait relies on cultural stereotypes for its visual identity |
| CS2 | Sacred imagery | No use of culturally sacred patterns, garments, or markings outside their context |
| CS3 | Exoticization | No portrait treats cultural markers as decorative novelty |
| CS4 | Color associations | Skin tones, hair, and features are not paired with traits in ways that reinforce bias |

### 3.3 Copyright Compliance

| # | Check | Method |
|---|-------|--------|
| CR1 | Copyrighted character resemblance | No portrait resembles a copyrighted fictional character |
| CR2 | Artistic style copying | The style is original or within licensed parameters; not a direct copy of a specific artist's signature style |
| CR3 | Asset provenance | Any referenced materials (palettes, style guides) are licensed or original |

### 3.4 Representation and Diversity

| # | Check | Method |
|---|-------|--------|
| R1 | Representation breadth | The collection as a whole does not default to a narrow demographic presentation |
| R2 | Feature variety | Variety in hair texture, face shape, skin tone, and body type where visible |
| R3 | Ability representation | If the trait matrix includes varied presentations, verify they are handled with dignity |
| R4 | Age range | If specified, age presentations span the intended range |

### 3.5 AI-Made Disclosure

| # | Check | Method |
|---|-------|--------|
| AI1 | Metadata disclosure | Image metadata includes a field indicating AI generation |
| AI2 | Platform labeling | Wherever these portraits are displayed, accompanying text or UI identifies them as AI-generated |
| AI3 | No deceptive framing | Portraits are not presented in a context that implies they depict real team members |

---

## 4. Failure Routing Table

When a check fails, route the failure to the responsible upstream agent with the information they need.

| Failed Check Category | Route To | Required Information in Failure Report |
|---|---|---|
| **Anatomy (A1-A8)** | Agent 04 (Portrait Renderer) | Portrait ID, specific defect, annotated screenshot with the defect circled, the check ID that failed |
| **Edge Quality (E1-E5)** | Agent 04 (Portrait Renderer) | Portrait ID, edge zone location, 200% crop of the defect area, whether re-render or post-process fix is needed |
| **Text Detection (T1-T3)** | Agent 04 (Portrait Renderer) | Portrait ID, location of text/watermark, crop showing the text, re-render required |
| **Text Detection (T4)** | Agent 07 (Asset Packager) | Portrait ID, metadata field containing the leak, required stripping action |
| **Symbol Scan (S1-S5)** | Agent 04 (Portrait Renderer) | Portrait ID, symbol identified, reference image of the real symbol for comparison, severity assessment |
| **Style Match (SM1-SM5)** | Agent 03 (Style Director) + Agent 04 (Portrait Renderer) | Portrait ID, deviation description, side-by-side with a passing portrait, the style sheet spec that was violated |
| **Trait Verification (TV1-TV5)** | Agent 02 (Trait Architect) + Agent 04 (Portrait Renderer) | Portrait ID, assigned trait combo, what is present vs. what is missing, the matrix row reference |
| **Thumbnail Test (TH1-TH5)** | Agent 04 (Portrait Renderer) + Agent 06 (Composition Lead) | Portrait ID, the downsampled image, description of the legibility problem, suggested fix direction |
| **Color Accuracy (C1-C6)** | Agent 05 (Color Specialist) + Agent 04 (Portrait Renderer) | Portrait ID, sampled color values vs. target values, deltaE measurements, palette swatch reference |
| **Similarity Threshold (SIM1-SIM3)** | Agent 06 (Composition Lead) | Both portrait IDs, similarity score, the similarity matrix, recommendation on which to revise |
| **Diversity Floor (D1-D4)** | Agent 02 (Trait Architect) + Agent 06 (Composition Lead) | Gap description, which trait/visual dimension is under-represented, current distribution map |
| **Grid Coherence (G1-G5)** | Agent 06 (Composition Lead) | The full grid image, the outlier portrait ID(s), the specific coherence metric that failed |
| **Color Distribution (CD1-CD4)** | Agent 05 (Color Specialist) | Color wheel plot, distribution histogram, which portraits to shift and in which direction |
| **Mood Consistency (M1-M3)** | Agent 03 (Style Director) | Outlier portrait ID, its perceived mood vs. the target range, the collection mood map |
| **Policy: Real Person (P1-P3)** | Agent 01 (Creative Director) | Portrait ID, the resemblance concern, reference photo if applicable, mandatory re-generate order |
| **Policy: Cultural (CS1-CS4)** | Agent 01 (Creative Director) | Portrait ID, the concern, cultural context explanation, mandatory revision order |
| **Policy: Copyright (CR1-CR3)** | Agent 01 (Creative Director) | Portrait ID, the resemblance or source material, mandatory revision order |
| **Policy: Representation (R1-R4)** | Agent 01 (Creative Director) + Agent 02 (Trait Architect) | Collection-level gap description, recommended rebalancing, which portraits to revise |
| **Policy: AI Disclosure (AI1-AI3)** | Agent 07 (Asset Packager) + Agent 08 (Integration Lead) | Which disclosure is missing, required action, platform-specific labeling instructions |

### Failure Report Template (for routing)

```
FAILURE REPORT — [Check ID]
Portrait ID:     [P01-P10 or "Collection"]
Check:           [Full check name]
Severity:        [Critical / Major / Minor]
Routed to:       [Agent name and number]
Finding:         [Plain description of what failed]
Evidence:        [Screenshot crop, measurement, or reference]
Expected:        [What the spec requires]
Actual:          [What was observed]
Fix guidance:    [Suggested remediation approach]
Deadline:        [Based on severity — Critical: immediate; Major: before next QA pass; Minor: before final release]
```

---

## 5. Sign-Off Template

### 5.1 Per-Portrait Sign-Off

One row per portrait, one column per check category. Mark P (Pass), F (Fail), or W (Waived with justification).

```
=======================================================================
PORTRAIT QA SIGN-OFF — Ten Agents, Ten Portraits
Date:        ____________
QA Agent:    Agent 09 — Quality Guardian
Pass #:      [ ] First  [ ] Re-inspection after remediation
=======================================================================

PORTRAIT-LEVEL RESULTS
-----------------------------------------------------------------------
ID   | Anat | Edge | Text | Symb | Style | Trait | Thumb | Color | Verdict
-----------------------------------------------------------------------
P01  |      |      |      |      |       |       |       |       |
P02  |      |      |      |      |       |       |       |       |
P03  |      |      |      |      |       |       |       |       |
P04  |      |      |      |      |       |       |       |       |
P05  |      |      |      |      |       |       |       |       |
P06  |      |      |      |      |       |       |       |       |
P07  |      |      |      |      |       |       |       |       |
P08  |      |      |      |      |       |       |       |       |
P09  |      |      |      |      |       |       |       |       |
P10  |      |      |      |      |       |       |       |       |
-----------------------------------------------------------------------
Mark each cell: P = Pass | F = Fail | W = Waived (justification required below)

WAIVER JUSTIFICATIONS (if any):
  [Check ID] — [Portrait ID] — [Reason waiver is acceptable]

INDIVIDUAL FAILURES ROUTED:
  [Check ID] — [Portrait ID] — Routed to [Agent] — [Date sent]
```

### 5.2 Collection-Level Sign-Off

```
=======================================================================
COLLECTION QA SIGN-OFF
=======================================================================

COLLECTION-LEVEL RESULTS
-----------------------------------------------------------------------
Check Category         | Result | Notes
-----------------------------------------------------------------------
Similarity Threshold   |        |
Diversity Floor        |        |
Grid Coherence         |        |
Color Distribution     |        |
Mood Consistency       |        |
-----------------------------------------------------------------------

POLICY AND SAFETY RESULTS
-----------------------------------------------------------------------
Check Category              | Result | Notes
-----------------------------------------------------------------------
Real Person Likeness        |        |
Cultural Sensitivity        |        |
Copyright Compliance        |        |
Representation & Diversity  |        |
AI-Made Disclosure          |        |
-----------------------------------------------------------------------

Mark each: PASS | FAIL | CONDITIONAL PASS (with conditions listed below)

CONDITIONS (if any):
  [Condition] — [Deadline for resolution]
```

### 5.3 Final Verdict

```
=======================================================================
FINAL COLLECTION VERDICT
=======================================================================

[ ] APPROVED FOR RELEASE
    All 10 portraits pass all checks. Collection-level and policy
    checks pass. No open failures.

[ ] CONDITIONAL APPROVAL
    Approved with the following conditions that must be met before
    deployment:
      1. ________________________________________
      2. ________________________________________
    Conditions must be cleared by: [date]

[ ] REJECTED — REVISION REQUIRED
    The following blocking failures must be resolved:
      1. ________________________________________
      2. ________________________________________
    Failure reports routed to upstream agents on [date].
    Re-inspection scheduled for: [date]

[ ] REJECTED — FUNDAMENTAL REWORK
    Collection-level failures require rework beyond individual
    portrait fixes:
      Issue: ________________________________________
      Affected agents: ________________________________________
      Recommended action: ________________________________________

-----------------------------------------------------------------------
Signed:          Agent 09 — Quality Guardian
Date:            ____________
Inspection ID:   QA-[YYYYMMDD]-[sequence]
-----------------------------------------------------------------------
```

---

## Appendix: Inspection Workflow

**Order of operations:**

1. Receive all 10 final portraits from upstream.
2. Run per-portrait checks (Section 1) on each, in portrait-ID order.
3. Any portrait with a Critical failure is immediately routed; do not wait for the full pass to complete.
4. After all 10 individual reviews are done, run collection-level checks (Section 2).
5. Run policy and safety review (Section 3) on the full set.
6. Fill out the sign-off template (Section 5).
7. If any failures exist, route them per the table (Section 4) and schedule re-inspection.
8. Re-inspection follows the same protocol but only re-checks previously failed items plus a spot-check of 2 random passing checks per portrait (regression guard).
9. Final verdict is issued only when all checks pass or are formally waived.

**Escalation:** If the same portrait fails the same Critical check on three consecutive inspection passes, escalate to Agent 01 (Creative Director) for a full regeneration order rather than continued patching.

---

This protocol is the gate. Every portrait and the collection as a whole must clear it before any image is deployed to the THRIVE platform. No exceptions, no shortcuts, no "ship it and fix later."