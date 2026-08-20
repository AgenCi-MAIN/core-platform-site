# Ten Agents, Ten Portraits — Release Archive Template

**Project:** THRIVE Platform Profile Portraits
**Archive Version:** 1.0
**Date Prepared:** 2026-08-19
**Role:** Agent 10 — Release Archivist

---

## 1. File Naming Convention

### 1.1 Portrait Files

Pattern:

```
thrive-portrait-{NN}-{role}-v{X}.png
```

| Field    | Description                                                        | Example            |
|----------|--------------------------------------------------------------------|---------------------|
| `{NN}`   | Two-digit sequence number, `01` through `10`                      | `03`               |
| `{role}` | Lowercase kebab-case role slug, max 24 characters                  | `data-steward`     |
| `{X}`    | Final version number selected for release (integer, starts at 1)   | `2`                |

Full example: `thrive-portrait-03-data-steward-v2.png`

If a portrait has no assigned role, use `unassigned` as the role slug.

### 1.2 Supporting Files

| File                        | Name                                          |
|-----------------------------|-----------------------------------------------|
| Contact sheet               | `thrive-portraits-contact-sheet.png`          |
| Trait archive (JSON)        | `thrive-portraits-trait-archive.json`         |
| Prompt provenance log       | `thrive-portraits-provenance.json`            |
| Disclosure document         | `thrive-portraits-disclosure.md`              |
| Alt text reference          | `thrive-portraits-alt-text.md`                |
| This release checklist      | `thrive-portraits-release-checklist.md`       |

### 1.3 Directory Structure

```
thrive-portraits-release/
  portraits/
    thrive-portrait-01-{role}-v{X}.png
    thrive-portrait-02-{role}-v{X}.png
    ...
    thrive-portrait-10-{role}-v{X}.png
  contact-sheet/
    thrive-portraits-contact-sheet.png
  metadata/
    thrive-portraits-trait-archive.json
    thrive-portraits-provenance.json
  docs/
    thrive-portraits-disclosure.md
    thrive-portraits-alt-text.md
    thrive-portraits-release-checklist.md
```

All portrait PNGs must be RGB, 8-bit, sRGB color profile, minimum 1024x1024 pixels. No embedded EXIF geolocation or camera metadata.

---

## 2. AI-Made Disclosure Templates

### 2.1 Short Disclosure (one line, for social media bios and avatar captions)

```
AI-made portrait created with {generation_tool}, human-directed by {director_name}.
This image depicts a fictional character, not a real person.
```

Fill-in fields:
- `{generation_tool}` — the name and version of the image generation platform (e.g., "DALL-E 3", "Midjourney v6.1", "Stable Diffusion XL 1.0")
- `{director_name}` — the human who directed the creative process

### 2.2 Medium Disclosure (paragraph, for about pages and profile sections)

```
This portrait was generated entirely by AI using {generation_tool}. The creative
direction — including character concept, visual traits, color palette, and
composition — was provided by {director_name} as part of the THRIVE platform's
"Ten Agents, Ten Portraits" project. Ten AI agents each contributed a distinct
phase of the process, from personality definition through trait assignment, style
direction, prompt engineering, generation, critique, refinement, and final
archival. The depicted character is fictional and does not represent any real
individual. No photographs of real people were used as inputs, references, or
seeds at any stage of generation.
```

### 2.3 Long Disclosure (for documentation, licensing, and provenance records)

```
PROVENANCE DISCLOSURE — THRIVE Portrait #{NN}: {role_name}

This image is an AI-generated portrait produced as part of the "Ten Agents,
Ten Portraits" project for the THRIVE operating platform.

GENERATION DETAILS
  Tool:            {generation_tool} (version {tool_version})
  Generation date: {generation_date}
  Prompt version:  {prompt_version}
  Iteration count: {iteration_count} (number of generation attempts before
                   final selection)
  Final seed:      {seed_value} (if deterministic; "non-deterministic" otherwise)

CREATIVE PROCESS
  This portrait was produced through a ten-agent relay. Each agent operated
  within a defined role:

    Agent 1  — Personality Architect: defined the character's core traits
    Agent 2  — Visual Translator: mapped personality to visual attributes
    Agent 3  — Style Director: established artistic style and medium
    Agent 4  — Palette Designer: selected the color scheme
    Agent 5  — Prompt Engineer: composed the generation prompt
    Agent 6  — Generator/Curator: ran generation and selected candidates
    Agent 7  — Critic: evaluated outputs against the brief
    Agent 8  — Refinement Specialist: directed corrections and final polish
    Agent 9  — Trait Archivist: compiled the trait-to-visual mapping record
    Agent 10 — Release Archivist: prepared this disclosure and release package

  Human direction was provided by {director_name} ({director_email}), who
  defined the project scope, approved the creative brief, reviewed agent
  outputs at each stage, and made the final selection.

FICTIONAL CHARACTER STATEMENT
  The character depicted in this portrait is entirely fictional. It was not
  modeled on, derived from, or intended to resemble any specific real person.
  No photographs, likenesses, or biometric data of real individuals were used
  as inputs, references, seeds, or training-time targets for this specific
  generation.

USAGE RESTRICTIONS
  This portrait is produced for use within the THRIVE platform. Any use
  outside that context requires explicit written permission from the human
  director. The portrait must always be accompanied by at minimum the short
  disclosure (Section 2.1) when displayed publicly. It must never be presented
  as a photograph of a real person.
```

---

## 3. Alt Text Templates

### 3.1 Per-Portrait Alt Text Template

```
AI-generated portrait #{NN} for the THRIVE platform "{role_name}" role.
{composition_description}. {subject_description}. {color_description}.
{style_description}. This is a fictional character, not a real person.
```

Fill-in fields:

| Field                       | Guidance                                                                 | Example                                                        |
|-----------------------------|--------------------------------------------------------------------------|----------------------------------------------------------------|
| `{NN}`                      | Two-digit portrait number                                                | `03`                                                           |
| `{role_name}`               | Platform role this portrait represents                                   | `Data Steward`                                                 |
| `{composition_description}` | Framing and layout (head-and-shoulders, three-quarter view, etc.)        | `Head-and-shoulders view facing slightly left`                 |
| `{subject_description}`     | Key visual features without implying a real identity                     | `A figure with short dark hair and calm expression`            |
| `{color_description}`       | Dominant colors and palette mood                                         | `Warm amber background with cool blue-gray clothing tones`     |
| `{style_description}`       | Artistic style and rendering approach                                    | `Rendered in a soft painterly digital style with visible brushwork` |

### 3.2 Contact Sheet Alt Text

```
Contact sheet displaying all ten AI-generated THRIVE platform portraits in a
2-by-5 grid. Each cell shows one portrait labeled with its sequence number
(01 through 10), assigned role name, and a summary of its dominant visual
traits. All portraits are fictional characters created for the THRIVE project.
Row 1 (top): portraits 01 through 05, left to right.
Row 2 (bottom): portraits 06 through 10, left to right.
```

### 3.3 Accessibility Guidelines for Web Usage

1. **Always provide alt text.** Every `<img>` element rendering a portrait must carry a filled-in alt attribute using the template above. Never leave it empty or set it to the filename.

2. **Do not use portraits as the sole identifier of a user.** Always pair the portrait with a visible text name and role label so that screen reader users and users who cannot load images can still identify the person.

3. **Minimum contrast for labels.** Any text overlaid on or adjacent to a portrait (name, role badge) must meet WCAG 2.1 AA contrast ratio (4.5:1 for normal text, 3:1 for large text). If the portrait's background is unpredictable, use a semi-opaque text backdrop.

4. **Decorative usage.** If a portrait is used purely as decoration (e.g., a background pattern on a team page), mark it with `alt=""` and `role="presentation"` to remove it from the accessibility tree. This case should be rare — portraits almost always carry meaning.

5. **Respect motion preferences.** If any portrait is displayed with animation (fade-in, hover zoom), wrap the animation in a `prefers-reduced-motion` media query and provide a static fallback.

6. **Size and resolution.** Serve appropriately sized images. A 1024x1024 portrait used as a 48x48 avatar wastes bandwidth and delays page load. Use `srcset` or serve pre-scaled variants (48px, 96px, 256px, 1024px).

7. **Fictional-character notice.** On any page where portraits appear for the first time (e.g., a team directory), include a visible note: "Profile portraits are AI-generated fictional characters and do not depict real individuals."

---

## 4. Prompt Provenance Archive

### 4.1 What to Record

For each portrait, the provenance record must capture:

| Field                 | Required | Description                                                              |
|-----------------------|----------|--------------------------------------------------------------------------|
| `portrait_id`         | Yes      | Sequence number (`01`-`10`)                                              |
| `role_slug`           | Yes      | Role this portrait represents                                            |
| `prompt_version`      | Yes      | Versioned prompt text (the exact string sent to the generator)           |
| `prompt_version_id`   | Yes      | Semantic version of the prompt (e.g., `1.0`, `1.3`, `2.0`)              |
| `generation_platform` | Yes      | Name and version of the generation tool                                  |
| `platform_settings`   | Yes      | All non-default settings: resolution, quality, style mode, guidance scale, sampler, steps |
| `seed`                | Yes      | Seed value if the platform supports deterministic replay; `null` if non-deterministic |
| `iteration_count`     | Yes      | Total number of generation attempts before the final image was selected  |
| `selected_from`       | Yes      | How many candidate images the final was selected from in the last round  |
| `selection_rationale`  | Yes     | Free-text explanation of why this image was chosen over alternatives     |
| `generation_date`     | Yes      | ISO 8601 date of the final generation                                    |
| `agent_chain`         | Yes      | Ordered list of agent roles that contributed to this portrait's pipeline |
| `human_director`      | Yes      | Name and contact of the human who authorized the final selection         |
| `trait_inputs`        | Yes      | Reference to the trait-archive entry that fed prompt construction        |
| `revision_notes`      | No       | Notes on any post-generation refinement (inpainting, upscaling, color correction) |

### 4.2 JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "THRIVE Portrait Provenance Record",
  "description": "Metadata for one AI-generated portrait in the Ten Agents, Ten Portraits project.",
  "type": "object",
  "required": [
    "portrait_id",
    "role_slug",
    "prompt_version",
    "prompt_version_id",
    "generation_platform",
    "platform_settings",
    "seed",
    "iteration_count",
    "selected_from",
    "selection_rationale",
    "generation_date",
    "agent_chain",
    "human_director",
    "trait_inputs"
  ],
  "properties": {
    "portrait_id": {
      "type": "string",
      "pattern": "^(0[1-9]|10)$",
      "description": "Two-digit portrait sequence number, 01 through 10."
    },
    "role_slug": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]{0,23}$",
      "description": "Lowercase kebab-case role identifier."
    },
    "prompt_version": {
      "type": "string",
      "minLength": 1,
      "description": "The exact prompt text sent to the generation platform."
    },
    "prompt_version_id": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+$",
      "description": "Semantic version of the prompt (e.g., 1.0, 2.3)."
    },
    "generation_platform": {
      "type": "object",
      "required": ["name", "version"],
      "properties": {
        "name": { "type": "string" },
        "version": { "type": "string" }
      },
      "additionalProperties": false
    },
    "platform_settings": {
      "type": "object",
      "properties": {
        "resolution": { "type": "string", "description": "e.g., 1024x1024" },
        "quality": { "type": "string", "description": "e.g., hd, standard" },
        "style_mode": { "type": "string", "description": "e.g., vivid, natural" },
        "guidance_scale": { "type": "number" },
        "sampler": { "type": "string" },
        "steps": { "type": "integer" }
      },
      "additionalProperties": true,
      "description": "All non-default generation settings."
    },
    "seed": {
      "type": ["integer", "null"],
      "description": "Seed for deterministic replay, or null if non-deterministic."
    },
    "iteration_count": {
      "type": "integer",
      "minimum": 1,
      "description": "Total generation attempts before final selection."
    },
    "selected_from": {
      "type": "integer",
      "minimum": 1,
      "description": "Number of candidates in the final selection round."
    },
    "selection_rationale": {
      "type": "string",
      "minLength": 1,
      "description": "Why this image was chosen over alternatives."
    },
    "generation_date": {
      "type": "string",
      "format": "date",
      "description": "ISO 8601 date of the final generation."
    },
    "agent_chain": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["agent_number", "role"],
        "properties": {
          "agent_number": { "type": "integer", "minimum": 1, "maximum": 10 },
          "role": { "type": "string" }
        },
        "additionalProperties": false
      },
      "minItems": 1,
      "description": "Ordered list of agents that contributed."
    },
    "human_director": {
      "type": "object",
      "required": ["name"],
      "properties": {
        "name": { "type": "string" },
        "contact": { "type": "string" }
      },
      "additionalProperties": false
    },
    "trait_inputs": {
      "type": "object",
      "required": ["personality_traits", "visual_attributes"],
      "properties": {
        "personality_traits": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Core personality traits that informed the portrait."
        },
        "visual_attributes": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Visual attributes derived from personality traits."
        }
      },
      "additionalProperties": true
    },
    "revision_notes": {
      "type": "string",
      "description": "Notes on post-generation refinement, if any."
    }
  },
  "additionalProperties": false
}
```

The full provenance file (`thrive-portraits-provenance.json`) is an array of ten such objects:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "THRIVE Portraits Provenance Archive",
  "type": "array",
  "items": { "$ref": "#/$defs/portrait_provenance" },
  "minItems": 10,
  "maxItems": 10,
  "$defs": {
    "portrait_provenance": {
      "...": "(the schema above)"
    }
  }
}
```

---

## 5. Contact Sheet Specification

### 5.1 Layout

```
+-------+-------+-------+-------+-------+
|  01   |  02   |  03   |  04   |  05   |
| role  | role  | role  | role  | role   |
| trait | trait | trait | trait | trait  |
+-------+-------+-------+-------+-------+
|  06   |  07   |  08   |  09   |  10   |
| role  | role  | role  | role  | role   |
| trait | trait | trait | trait | trait  |
+-------+-------+-------+-------+-------+
```

- Grid: 5 columns, 2 rows
- Reading order: left to right, top to bottom, portraits 01-05 in row 1, 06-10 in row 2

### 5.2 Cell Contents

Each cell contains:
1. **Portrait thumbnail** — the full portrait scaled to fit the cell, maintaining aspect ratio
2. **Sequence label** — top-left corner, white text on semi-transparent dark badge: `#01`, `#02`, etc.
3. **Role name** — centered below the portrait, 14pt minimum, high-contrast text
4. **Trait summary** — one line below the role name, a comma-separated list of the top three personality traits (from the trait archive), 11pt minimum, muted color

### 5.3 Dimensions and Format

| Property          | Value                                |
|-------------------|--------------------------------------|
| File format       | PNG, 8-bit RGB, sRGB profile         |
| Total dimensions  | 5120 x 2560 px (5 cols x 1024, 2 rows x 1280 including label area) |
| Cell size         | 1024 x 1280 px (1024x1024 portrait + 256px label zone below) |
| Gutter            | 0 px (cells are edge-to-edge; a 1px hairline border separates them) |
| Background        | Neutral gray (#2A2A2A) or white (#FFFFFF), chosen to contrast with the majority of portrait backgrounds |
| DPI               | 144 (suitable for print at approximately 36x18 inches or screen at 2x) |

### 5.4 Annotation Layer

An optional second file, `thrive-portraits-contact-sheet-annotated.png`, adds a translucent overlay to each cell showing:
- The full trait-to-visual mapping (personality trait on the left, visual attribute on the right, connected by a thin line)
- The color palette swatch (five circles showing the portrait's dominant colors)
- The prompt version ID in the lower-right corner

This annotated version is for internal review only and must not be published externally.

---

## 6. Release Checklist

Each item must be confirmed by the human director before the release is considered complete. No item may be skipped.

### 6.1 Files Present and Named Correctly

- [ ] `portraits/` contains exactly 10 PNG files
- [ ] Each file matches the pattern `thrive-portrait-{NN}-{role}-v{X}.png`
- [ ] Sequence numbers run `01` through `10` with no gaps or duplicates
- [ ] All files are RGB, 8-bit, sRGB, minimum 1024x1024 px
- [ ] No files contain embedded EXIF geolocation or camera metadata
- [ ] Contact sheet exists at `contact-sheet/thrive-portraits-contact-sheet.png`
- [ ] Contact sheet dimensions match specification (5120 x 2560 px)
- [ ] Annotated contact sheet exists (if produced) at `contact-sheet/thrive-portraits-contact-sheet-annotated.png`

### 6.2 Metadata Complete

- [ ] `metadata/thrive-portraits-provenance.json` exists and contains exactly 10 entries
- [ ] Provenance JSON validates against the schema in Section 4.2
- [ ] Every `portrait_id` in the provenance file has a corresponding portrait PNG in `portraits/`
- [ ] Every `role_slug` in the provenance file matches the role slug in the corresponding filename
- [ ] `metadata/thrive-portraits-trait-archive.json` exists and contains entries for all 10 portraits
- [ ] Trait archive entries match the `trait_inputs` referenced in the provenance records

### 6.3 Disclosures Written and Reviewed

- [ ] `docs/thrive-portraits-disclosure.md` exists
- [ ] Short disclosure template is filled in for each portrait (or a single version covering all ten, with tool and director named)
- [ ] Medium disclosure template is filled in
- [ ] Long disclosure template is filled in for each portrait individually
- [ ] All disclosures name the correct generation tool and version
- [ ] All disclosures name the correct human director
- [ ] All disclosures include the fictional-character statement
- [ ] No disclosure implies or suggests the portraits depict real people
- [ ] Disclosures have been reviewed by the human director for accuracy

### 6.4 Alt Text Complete

- [ ] `docs/thrive-portraits-alt-text.md` exists
- [ ] One alt text entry exists per portrait (10 total)
- [ ] Each alt text follows the template in Section 3.1 with all fields filled
- [ ] Contact sheet alt text is included
- [ ] No alt text references a real person's name or likeness
- [ ] Alt text has been reviewed for clarity and accuracy by someone who has not seen the images (comprehension check)

### 6.5 Provenance Archive Matches Final Set

- [ ] The `prompt_version` in each provenance entry is the exact prompt that produced the released portrait (not an earlier draft)
- [ ] The `generation_date` is accurate
- [ ] The `seed` (if recorded) can reproduce the image (verified for at least one portrait if the platform supports deterministic replay)
- [ ] The `iteration_count` and `selected_from` numbers are accurate
- [ ] The `selection_rationale` for each portrait is substantive (not a placeholder)

### 6.6 Human Director Sign-Off

- [ ] The human director has viewed all 10 final portraits at full resolution
- [ ] The human director has reviewed and approved the contact sheet
- [ ] The human director has reviewed and approved all disclosure text
- [ ] The human director has reviewed and approved all alt text
- [ ] The human director has confirmed no portrait resembles a specific real individual
- [ ] The human director has confirmed the release is ready

### 6.7 Release Boundary

- [ ] **No automated publishing.** The release archive is a staging package. Publication to the THRIVE platform, social media, or any external channel is a manual human action taken after this checklist is complete.
- [ ] The release archive has been delivered to the human director in a format they can inspect offline (zip file, shared drive folder, or equivalent)
- [ ] The human director understands that publishing is their decision and action, not an automated step

---

## Appendix: Quick-Reference Summary

| Item | Count | Location |
|------|-------|----------|
| Portrait PNGs | 10 | `portraits/` |
| Contact sheet | 1 (+ 1 annotated, optional) | `contact-sheet/` |
| Provenance JSON | 1 file, 10 entries | `metadata/` |
| Trait archive JSON | 1 file, 10 entries | `metadata/` |
| Disclosure document | 1 file, 3 tiers | `docs/` |
| Alt text document | 1 file, 10 + 1 entries | `docs/` |
| Release checklist | 1 file | `docs/` |
| Total release files | 17-18 | `thrive-portraits-release/` |

---

*This template was prepared by Agent 10 (Release Archivist) on 2026-08-19 as the final station in the Ten Agents, Ten Portraits relay. It defines the structure, standards, and verification steps for the release package. No portraits are published until the human director completes Section 6 and takes the manual release action.*