
# TEN AGENTS, TEN PORTRAITS -- Integration Manifest

**Agent 15 / Integration Coordinator**
**Date: 2026-08-19**
**Repository: `bankerrunners/core-platform-site`**
**Status: MASTER COORDINATION DOCUMENT**

---

## 1. DELIVERABLE REGISTRY

| # | Agent Role | Deliverable | File Name | Status | Dependencies | Downstream Consumers |
|---|---|---|---|---|---|---|
| 01 | Mission Keeper | Collection brief | `01-collection-brief.md` | DRAFT | None (relay origin) | 02, 03, 04, 05, 06, 07 |
| 02 | Originality Scout | Inspiration and avoid map | `02-inspiration-avoid-map.md` | DRAFT | 01 | 03, 04, 06 |
| 03 | World Builder | World bible | `03-world-bible.md` | DRAFT | 01, 02 | 04, 05, 06, 13 |
| 04 | Art Director | Visual style sheet | `04-visual-style-sheet.md` | DRAFT | 01, 02, 03 | 05, 06, 07, 08, 09, 11, 12 |
| 05 | Trait Architect | Trait matrix (10 rows) | `05-trait-matrix.md` | DRAFT | 01, 03 | 06, 07, 08, 09, 13 |
| 06 | Prompt Engineer | Prompt pack (10 prompts) | `06-prompt-pack.md` | DRAFT | 01, 02, 03, 04, 05 | 07, 09, 10 |
| 07 | Image Maker | Image generation spec | `07-image-generation-spec.md` | DRAFT | 04, 06 | 08, 09, 10 |
| 08 | Collection Curator | Curation playbook | `08-curation-playbook.md` | DRAFT | 04, 05, 07 | 09, 10, 11, 12 |
| 09 | Quality Guardian | QA checklist | `09-qa-checklist.md` | DRAFT | 04, 05, 06, 07, 08 | 10, 14 |
| 10 | Release Archivist | Release archive template | `10-release-archive-template.md` | DRAFT | 06, 07, 08, 09 | 11, 12, 14 |
| 11 | Gallery Builder | Gallery HTML page | `11-gallery.html` | DRAFT | 04, 08, 10 | Portal integration |
| 12 | Contact Sheet Builder | Contact sheet HTML page | `12-contact-sheet.html` | DRAFT | 04, 08, 10 | Portal integration (admin) |
| 13 | Identity Designer | Character names and identity cards | `13-identity-cards.md` | DRAFT | 03, 05 | 11, 12, 14 |
| 14 | Accessibility Author | Accessibility documentation | `14-accessibility.md` | DRAFT | 09, 10, 13 | 11, 12, Portal integration |

---

## 2. FILE STRUCTURE

```
ten-portraits/
|-- index.html                          # Existing article: the field plan (already live)
|-- README.md                           # Existing project README (already live)
|-- INTEGRATION-MANIFEST.md             # THIS DOCUMENT (Agent 15)
|
|-- deliverables/
|   |-- 01-collection-brief.md          # Agent 01 output
|   |-- 02-inspiration-avoid-map.md     # Agent 02 output
|   |-- 03-world-bible.md              # Agent 03 output
|   |-- 04-visual-style-sheet.md       # Agent 04 output
|   |-- 05-trait-matrix.md             # Agent 05 output
|   |-- 06-prompt-pack.md             # Agent 06 output
|   |-- 07-image-generation-spec.md    # Agent 07 output
|   |-- 08-curation-playbook.md        # Agent 08 output
|   |-- 09-qa-checklist.md            # Agent 09 output
|   |-- 10-release-archive-template.md # Agent 10 output
|   |-- 11-gallery.html               # Agent 11 output
|   |-- 12-contact-sheet.html         # Agent 12 output
|   |-- 13-identity-cards.md          # Agent 13 output
|   |-- 14-accessibility.md           # Agent 14 output
|
|-- images/
|   |-- drafts/                        # Working image drafts from generation
|   |   |-- portrait-01-v1.png
|   |   |-- portrait-01-v2.png
|   |   |-- ...
|   |-- final/                         # QA-approved final portraits
|   |   |-- portrait-01.png
|   |   |-- portrait-02.png
|   |   |-- ...
|   |   |-- portrait-10.png
|   |-- contact-sheet.png              # Composite grid of all 10
|
|-- provenance/
|   |-- prompt-log.json                # Every prompt fired, with timestamps and settings
|   |-- qa-report.json                 # Structured QA pass/fail per portrait
|   |-- generation-settings.json       # Model, seed, dimensions, cfg, sampler per run
```

**Rationale for the structure:**
- `deliverables/` isolates agent outputs from the existing `index.html` article, which is already deployed and must not be disturbed.
- `images/drafts/` vs `images/final/` enforces the gate between generation and approval. Only files in `final/` are release-ready.
- `provenance/` holds the machine-readable audit trail: which prompt produced which image, what QA said, and what settings were used. This is required by the disclosure rules in the field plan.

---

## 3. EXECUTION ORDER

The relay has a strict dependency graph. Below is the sequenced execution plan with parallelization opportunities noted.

### Phase 1: Foundation (sequential, blocking)

```
Step 1:  Agent 01 -- Collection Brief
         No dependencies. This is the relay origin.
         GATE 1: Creative director approves the brief before anything else runs.
```

### Phase 2: Creative Territory (parallelizable after Step 1)

```
Step 2a: Agent 02 -- Inspiration and Avoid Map
         Requires: 01
         
Step 2b: (wait for 02 before proceeding -- 02 informs the creative boundaries)
```

### Phase 3: World and Visual Definition (sequential)

```
Step 3:  Agent 03 -- World Bible
         Requires: 01, 02
         
Step 4:  Agent 04 -- Visual Style Sheet
         Requires: 01, 02, 03
```

### Phase 4: Character Design (parallelizable after Steps 3-4)

```
Step 5a: Agent 05 -- Trait Matrix
         Requires: 01, 03
         
Step 5b: Agent 13 -- Character Names and Identity Cards
         Requires: 03, 05
         NOTE: 13 depends on 05, so these are sequential within Phase 4:
         05 first, then 13.
```

### Phase 5: Prompt Engineering (sequential, needs all of Phases 2-4)

```
Step 6:  Agent 06 -- Prompt Pack
         Requires: 01, 02, 03, 04, 05
         This is the convergence point where all creative inputs fuse
         into executable prompts.
```

### Phase 6: Generation and Curation (sequential)

```
Step 7:  Agent 07 -- Image Generation Specification
         Requires: 04, 06
         
Step 8:  Agent 08 -- Curation Playbook
         Requires: 04, 05, 07
```

### Phase 7: Quality and Archive (sequential)

```
Step 9:  Agent 09 -- QA Checklist
         Requires: 04, 05, 06, 07, 08
         
Step 10: Agent 10 -- Release Archive Template
         Requires: 06, 07, 08, 09
```

### Phase 8: Presentation Layer (parallelizable after Step 10)

```
Step 11a: Agent 11 -- Gallery HTML Page
          Requires: 04, 08, 10, 13
          
Step 11b: Agent 12 -- Contact Sheet HTML Page
          Requires: 04, 08, 10, 13
          
Step 11c: Agent 14 -- Accessibility Documentation
          Requires: 09, 10, 13
          
          All three can run in parallel once their inputs exist.
```

### Phase 9: Integration (this document -- Agent 15)

```
Step 12: Agent 15 -- Integration Manifest (THIS DOCUMENT)
         Requires: awareness of all 14 deliverables (not their content)
         Runs concurrently with Phase 8 agents.
```

### Critical Path

```
01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07 -> 08 -> 09 -> 10 -> 11/12/14
```

The longest sequential chain is 11 steps. Agents 13, 11, 12, and 14 can run in parallel at the end, and Agent 15 (this manifest) can run independently.

---

## 4. HANDOFF PROTOCOL

Each agent consumes specific data from upstream agents and produces a defined artifact for downstream agents. The exact data flow:

### 01 (Mission Keeper) -> 02, 03, 04, 05, 06, 07

**Passes forward:** The approved collection brief containing:
- Target audience definition
- Mood and tone keywords
- Hard boundaries (what is forbidden)
- Format specification (square, profile-picture use case)
- Definition of success (coherent family, readable at avatar size)

**Consumed by:** Every subsequent agent reads the brief as the foundational constraint document. No agent may contradict the brief without escalation.

### 02 (Originality Scout) -> 03, 04, 06

**Passes forward:** The inspiration/avoid map containing:
- Visual references that define the lane (inspiration, not imitation)
- Named artists, styles, and collections to actively avoid
- Cliche catalog: overused tropes in AI portrait collections
- The "distinctive lane" definition: what makes this collection unlike others

**Consumed by:** 03 uses it to set world boundaries. 04 uses it to choose a palette and composition strategy that avoids flagged territory. 06 uses it to write negative prompts.

### 03 (World Builder) -> 04, 05, 06, 13

**Passes forward:** The world bible containing:
- Character archetype definition
- Setting and visual lore
- Rules that make portraits feel related (shared universe constraints)
- Naming conventions and personality dimensions

**Consumed by:** 04 translates lore into visual rules. 05 draws trait options from the archetype. 06 embeds world details into prompt language. 13 assigns names and backstories consistent with the lore.

### 04 (Art Director) -> 05, 06, 07, 08, 09, 11, 12

**Passes forward:** The visual style sheet containing:
- Exact palette (hex values, usage rules)
- Composition grid (head-and-shoulders silhouette spec)
- Lighting direction and temperature
- Line language and material textures
- Typography rules (if any text appears)
- Dimensions and resolution target

**Consumed by:** The most widely consumed deliverable. 05 constrains trait colors to the palette. 06 encodes visual rules into prompt syntax. 07 uses it for generation settings. 08 uses it as the coherence benchmark. 09 checks against it. 11 and 12 style their HTML pages to match.

### 05 (Trait Architect) -> 06, 07, 08, 09, 13

**Passes forward:** The 10-row trait matrix containing:
- Per-portrait: expression, primary color accent, accessory, background variant
- Uniqueness constraints (no two portraits share the same combination)
- Variation budget: which traits can differ, which are invariant

**Consumed by:** 06 writes one prompt variant per row. 07 generates one image per row. 08 checks that the curated set covers all 10 rows. 09 verifies uniqueness. 13 maps names to trait rows.

### 06 (Prompt Engineer) -> 07, 09, 10

**Passes forward:** The versioned prompt pack containing:
- One master prompt (the invariant backbone)
- Ten variant prompts (one per trait row)
- Negative prompt (shared across all 10)
- Prompt versioning metadata (hash or version number)

**Consumed by:** 07 feeds each prompt to the generation model. 09 cross-references prompts against outputs. 10 archives prompts as provenance.

### 07 (Image Maker) -> 08, 09, 10

**Passes forward:** The image generation specification containing:
- Model name and version
- Generation settings (dimensions, cfg scale, sampler, seed strategy)
- Per-prompt output log (which prompt produced which draft file)
- Naming convention for draft files

**Consumed by:** 08 selects from the drafts. 09 inspects the drafts for defects. 10 records settings as provenance.

### 08 (Collection Curator) -> 09, 10, 11, 12

**Passes forward:** The curation playbook containing:
- The selected candidate for each of the 10 slots
- Selection rationale per slot
- Coherence assessment (the full grid judgment)
- Rejected candidates and why

**Consumed by:** 09 QAs the curated set (not all drafts). 10 packages the curated set. 11 displays the curated set in the gallery. 12 displays the curated set in the contact sheet.

### 09 (Quality Guardian) -> 10, 14

**Passes forward:** The QA checklist containing:
- Per-portrait pass/fail on: anatomy, edges, unwanted text, accidental symbols, policy, thumbnail readability
- Similarity matrix (no two portraits too alike)
- Failure routing: which failures go back to which agent
- Final disposition: approved or blocked, with reasons

**Consumed by:** 10 only archives portraits that pass QA. 14 documents any accessibility issues flagged during QA.

### 10 (Release Archivist) -> 11, 12, 14

**Passes forward:** The release archive template containing:
- Final file naming convention (`portrait-01.png` through `portrait-10.png`)
- AI disclosure text (plain language, per the field plan's honesty rule)
- Alt text per portrait
- Prompt provenance mapping (final file -> prompt version -> trait row)
- Contact sheet composite specification

**Consumed by:** 11 uses alt text and file names. 12 uses file names and contact sheet spec. 14 uses alt text and disclosure text as the accessibility baseline.

### 13 (Identity Designer) -> 11, 12, 14

**Passes forward:** Character names and identity cards containing:
- One name per portrait
- Short character biography
- Personality keywords
- How the name relates to the trait row

**Consumed by:** 11 labels gallery entries with names. 12 labels the contact sheet. 14 includes names in alt text and descriptions.

### 14 (Accessibility Author) -> 11, 12

**Passes forward:** Accessibility documentation containing:
- WCAG compliance notes for the portrait collection
- Recommended alt text refinements
- Color contrast assessment against the style sheet palette
- Screen reader guidance for the gallery and contact sheet pages

**Consumed by:** 11 and 12 incorporate accessibility guidance into their HTML. Note: 14 runs in parallel with 11/12, so its guidance may arrive as a revision pass rather than an input to the first draft.

---

## 5. PORTAL INTEGRATION PLAN

The THRIVE portal (`app/portal/`) is a permissioned surface guarded by `requireCapability` on every page (see `app/portal/access.ts`). Integrating the ten portraits requires respecting this access model.

### 5.1 Avatar Component in the Command Center

**Location:** `app/portal/command/cloud/page.tsx` (Cloud AI Agent Command Center)

The Command Center currently displays agent sessions, environments, routines, and pipelines. The ten portraits can serve as avatar icons for agent sessions or team members.

**Integration approach:**
- Add a `portraits` static data array to the Command Center page, mapping portrait IDs to their image paths.
- Reference final images from `public/ten-portraits/` (copied from `ten-portraits/images/final/` at build time, or served as static assets).
- The `AgentRow` component already has a dot-column layout (`cacc-agent-dot-col`). Replace or supplement the status dot with a portrait thumbnail when an agent session has an assigned portrait.
- Guard: No new capability needed. The Command Center already gates on `command.cloud` via `requireCommandCenter`. Portraits are decorative, not a new permission surface.

**File changes required:**
- Copy final portraits to `public/ten-portraits/portrait-01.png` through `portrait-10.png`.
- Add an `avatar` field to the `AgentSession` type in `app/portal/command/cloud/page.tsx`.
- Add a `<img>` element in `AgentRow` with `width={40} height={40}` and the portrait's alt text from deliverable 10.

### 5.2 Gallery Page Accessible from the Portal

**Location (new):** `app/portal/gallery/page.tsx`

**Integration approach:**
- Create a new portal page at `/portal/gallery` that displays the ten portraits in a responsive grid.
- Gate with `requireCapability("dashboard.view.self", "/portal/gallery")` so that all active members can view it (every role from `agent` through `owner` holds `dashboard.view.self`).
- The gallery page content is adapted from `ten-portraits/deliverables/11-gallery.html`, rewritten as a React server component that follows the `PortalShell` pattern used by every other portal page.
- Character names (from deliverable 13) and alt text (from deliverable 10/14) are embedded.
- The page must NOT cache via the service worker. The existing `sw.js` exclusion for `/portal` already covers this, but the test suite pins this behavior.

**File changes required:**
- `app/portal/gallery/page.tsx` (new file)
- Add a "Gallery" link to the portal navigation in `app/portal/components.tsx` (the `PortalWorkspaceDirectory` component).

### 5.3 Contact Sheet in the Admin View

**Location (new):** `app/portal/gallery/contact-sheet/page.tsx`

**Integration approach:**
- Create a nested page under the gallery at `/portal/gallery/contact-sheet`.
- Gate with `requireCapability("members.manage", "/portal/gallery/contact-sheet")` so that only `owner`, `admin`, and `manager` roles can access it. The contact sheet is an operational tool (curation review, QA reference), not a member-facing display.
- Content is adapted from `ten-portraits/deliverables/12-contact-sheet.html`.
- Includes the full provenance chain: portrait -> prompt -> trait row -> QA status.
- The admin contact sheet should also display the QA report data from deliverable 09 and the prompt provenance from deliverable 10.

**File changes required:**
- `app/portal/gallery/contact-sheet/page.tsx` (new file)
- Add a conditional "Contact Sheet" sub-link in the gallery page, visible only to users with `members.manage`.

### 5.4 Relationship Between `ten-portraits/` and `app/`

```
ten-portraits/                          app/portal/
|                                       |
|-- deliverables/                       |-- gallery/
|   |-- (14 markdown/html files)        |   |-- page.tsx         (public gallery)
|   |   source of truth for content     |   |-- contact-sheet/
|                                       |       |-- page.tsx     (admin contact sheet)
|-- images/final/                       |
|   |-- portrait-01.png ... 10.png      public/ten-portraits/
|   |   original master files           |-- portrait-01.png ... 10.png
|                                       |   (build-time copy, served as static assets)
|-- provenance/
|   |-- prompt-log.json
|   |-- qa-report.json
|   |-- generation-settings.json
```

**The boundary is clear:**
- `ten-portraits/` is the creative workspace and archival record. It holds the full provenance chain, all drafts, and all deliverable documents. It does not serve live traffic.
- `public/ten-portraits/` holds the final images for web serving. These are copied from `ten-portraits/images/final/` after approval.
- `app/portal/gallery/` holds the React server components that display the images to authenticated portal members. These components read from `public/ten-portraits/` via standard Next.js static asset paths.
- The existing `ten-portraits/index.html` field plan article remains untouched. It is a standalone HTML document and is not part of the portal.

---

## 6. STATUS DASHBOARD SPEC

Each deliverable moves through five states. The status is tracked per deliverable.

### State Machine

```
PLANNED --> DRAFTED --> REVIEWED --> APPROVED --> INTEGRATED
   |           |           |
   |           |           +--> REVISION (returns to DRAFTED)
   |           |
   |           +--> BLOCKED (returns to PLANNED or escalates)
   |
   +--> SKIPPED (only with creative director approval)
```

### State Definitions

| State | Meaning | Who transitions out |
|---|---|---|
| PLANNED | Agent assigned, dependencies not yet met | Automatic (when dependencies are DRAFTED or better) |
| DRAFTED | Agent has produced the deliverable | Creative director begins review |
| REVIEWED | Creative director has read and annotated | Creative director approves or requests revision |
| APPROVED | Deliverable is locked; downstream agents may consume it | Integration coordinator marks it INTEGRATED after portal wiring |
| INTEGRATED | Deliverable is wired into the portal and deployed | Terminal state |
| REVISION | Returned to the authoring agent with notes | Agent re-drafts; returns to DRAFTED |
| BLOCKED | Cannot proceed; dependency failed or escalation needed | Creative director unblocks |

### Current Status Tracker

```
AGENT  DELIVERABLE                       STATUS     BLOCKER / NOTE
-----  --------------------------------  ---------  ----------------------------
  01   Collection brief                  PLANNED    Relay origin; no dependencies
  02   Inspiration and avoid map         PLANNED    Waiting on 01
  03   World bible                       PLANNED    Waiting on 01, 02
  04   Visual style sheet                PLANNED    Waiting on 01, 02, 03
  05   Trait matrix                      PLANNED    Waiting on 01, 03
  06   Prompt pack                       PLANNED    Waiting on 01-05
  07   Image generation spec             PLANNED    Waiting on 04, 06
  08   Curation playbook                 PLANNED    Waiting on 04, 05, 07
  09   QA checklist                      PLANNED    Waiting on 04-08
  10   Release archive template          PLANNED    Waiting on 06-09
  11   Gallery HTML page                 PLANNED    Waiting on 04, 08, 10, 13
  12   Contact sheet HTML page           PLANNED    Waiting on 04, 08, 10, 13
  13   Character names / identity cards  PLANNED    Waiting on 03, 05
  14   Accessibility documentation       PLANNED    Waiting on 09, 10, 13
  15   Integration manifest              DRAFTED    THIS DOCUMENT
```

**Progress summary:** 0 of 14 creative deliverables drafted. 1 of 15 total deliverables drafted (this manifest). The relay has not yet started its first step.

---

## 7. NEXT STEPS

Concrete action items for the creative director after all drafts land. Ordered by priority.

### 7.1 Review Order

Review deliverables in dependency order so that approval of an upstream document does not need to be revisited after a downstream document reveals a problem.

1. **01 - Collection brief** -- Review first. This is Gate 1 from the field plan. Nothing else proceeds until the brief is approved. Read it for completeness: does it define audience, mood, boundaries, format, and success criteria?

2. **02 - Inspiration and avoid map** -- Review for legal and ethical safety. Are the "avoid" entries specific enough to be actionable? Are the "inspiration" references used for direction, not imitation?

3. **03 - World bible** -- Review for internal consistency with 01 and 02. Does the lore create a coherent universe without contradicting the brief's boundaries?

4. **04 - Visual style sheet** -- Review for technical precision. Are hex values specified? Is the composition grid clear enough for a prompt engineer to encode? Does the palette avoid territory flagged in 02?

5. **05 - Trait matrix** -- Review the 10 rows. Is every combination unique? Does the variation budget (what changes vs. what stays constant) produce enough diversity without breaking coherence?

6. **13 - Identity cards** -- Review names and bios for taste, cultural sensitivity, and consistency with the world bible.

7. **06 - Prompt pack** -- Review for prompt engineering quality. Do the negative prompts cover the avoid map? Do the invariant sections actually repeat across all 10 variants? Is the prompt version-controlled?

8. **07 - Image generation spec** -- Review for reproducibility. Can someone else generate from these settings?

9. **08 - Curation playbook** -- Review selection criteria. Is "coherence" defined measurably?

10. **09 - QA checklist** -- Review for completeness. Does it cover anatomy, edges, unwanted text, accidental symbols, similarity, policy, and thumbnail readability (all six from the field plan)?

11. **10 - Release archive template** -- Review the disclosure text. Does it say "AI-made" or "AI-assisted" honestly, as the field plan requires?

12. **11 - Gallery HTML**, **12 - Contact sheet HTML**, **14 - Accessibility docs** -- Review as a group. Do the HTML pages match the style sheet? Does the contact sheet include provenance? Does the accessibility doc cover WCAG basics?

### 7.2 Approval Gates

Three gates from the field plan, mapped to deliverable states:

| Gate | Field Plan Name | Trigger | What Gets Approved |
|---|---|---|---|
| Gate 1 | Direction | 01 reaches REVIEWED | The collection brief. Approval moves 01 to APPROVED and unblocks Phases 2-5. |
| Gate 2 | Contact sheet | 08 reaches REVIEWED and the curated images exist | The curated set of 10, viewed together on the contact sheet. Approval moves 08 to APPROVED and unblocks Phase 7. |
| Gate 3 | Release | 10 reaches REVIEWED and all 10 portraits pass QA | The final archive. Approval moves 10 to APPROVED and triggers portal integration work. |

**No image is generated before Gate 1 clears.** No image is finalized before Gate 2 clears. No image is deployed to the portal before Gate 3 clears.

### 7.3 What Triggers Actual Image Generation

Image generation is **not automatic**. The relay produces the specification; a human triggers the generation.

**Preconditions for generation:**
1. Deliverables 01 through 06 are all APPROVED.
2. Deliverable 07 (image generation spec) is APPROVED, providing the exact model, settings, and procedure.
3. The creative director has confirmed the prompt pack (deliverable 06) by reading each of the 10 variant prompts.

**Generation procedure:**
1. Run each of the 10 prompts from deliverable 06 using the settings from deliverable 07.
2. Save all outputs to `ten-portraits/images/drafts/` using the naming convention from deliverable 07.
3. Log every generation run to `ten-portraits/provenance/prompt-log.json`.
4. Apply the curation playbook (deliverable 08) to select one candidate per slot.
5. Apply the QA checklist (deliverable 09) to the curated set.
6. Any QA failure routes back to the responsible agent per the failure routing table in deliverable 09.
7. Passing portraits move to `ten-portraits/images/final/`.
8. The release archivist (deliverable 10) packages the archive.
9. Creative director reviews the contact sheet (Gate 2) and the release (Gate 3).

### 7.4 Portal Integration Sequence

After Gate 3 clears and all 10 portraits are in `ten-portraits/images/final/`:

1. Copy final images to `public/ten-portraits/`.
2. Create `app/portal/gallery/page.tsx` using content from deliverables 11, 13, and 14.
3. Create `app/portal/gallery/contact-sheet/page.tsx` using content from deliverables 12, 09, and 10.
4. Add gallery navigation link to `app/portal/components.tsx`.
5. Optionally update `app/portal/command/cloud/page.tsx` to use portraits as agent avatars.
6. Run `npm run lint`, `npm run typecheck`, `npm test` (the access model test suite is the safety net).
7. Run `npm run verify:build` to confirm deployability.
8. Deploy via `npm run deploy` (builds, tests, preflight, wrangler deploy -- chained, failure stops the sequence).

### 7.5 Open Questions for the Creative Director

1. **Capability gating for the gallery:** This manifest recommends `dashboard.view.self` (visible to all active members). Should the gallery be restricted to a narrower set of roles?

2. **Portrait assignment:** Should specific portraits be mapped to specific portal roles or team positions, or are they a general collection?

3. **Static vs. dynamic:** Should the gallery page pull portrait metadata from D1, or is a static data array in the component sufficient? Static is simpler and avoids a migration; dynamic allows future editing without redeployment.

4. **The existing `ten-portraits/index.html`:** Should the field plan article link to the portal gallery once it exists, or remain fully standalone?

---

**End of Integration Manifest -- Agent 15 / Integration Coordinator**

This document is the master coordination record for the Ten Agents, Ten Portraits creative relay. It should be updated as each deliverable transitions through the status pipeline. The deliverable registry (section 1) and the status tracker (section 6) are the two sections that change most frequently; the dependency graph (section 3) and handoff protocol (section 4) are stable unless the relay structure itself changes.