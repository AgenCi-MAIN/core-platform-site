# THRIVE Portrait Collection — Naming Document

**Agent 13 / Naming Strategist**
**Date: 2026-08-19**

---

## 1. Character Names and Title Cards

Each name is designed as an operational designation — something between a callsign and a persona. They share a tonal register: measured, slightly formal, suggestive of function without spelling it out.

| # | Role | Character Name | Title Card |
|---|------|---------------|------------|
| 01 | Mission Keeper | **Vestal** | *The one who carries the fire between stations* |
| 02 | Originality Scout | **Recon** | *The one who returns with what no one sent for* |
| 03 | World Builder | **Terraform** | *The one who raises ground where there was none* |
| 04 | Art Director | **Meridian** | *The one who draws the line everything aligns to* |
| 05 | Trait Architect | **Lattice** | *The one who decides what holds and what bends* |
| 06 | Prompt Engineer | **Cipher** | *The one who speaks so the machine understands* |
| 07 | Image Maker | **Lumen** | *The one who pulls shape from the signal* |
| 08 | Collection Curator | **Index** | *The one who knows where every piece belongs* |
| 09 | Quality Guardian | **Assay** | *The one who holds the line no one sees* |
| 10 | Release Archivist | **Ledger** | *The one who seals the record and turns the key* |

### Design Notes on Name Selection

**Vestal** — From the Vestal keepers of the sacred flame. Implies custodianship of something continuous and non-negotiable. The Mission Keeper does not create; they preserve intent across handoffs.

**Recon** — Short for reconnaissance, but used as a noun-name. The Originality Scout operates ahead of the main body, returning with material that was not on any brief. Blunt, military-register, deliberately un-decorative.

**Terraform** — The act of making habitability from nothing. The World Builder does not describe a world; they manufacture the conditions under which one becomes possible. The name carries both engineering and mythology.

**Meridian** — A fixed reference line from which all other positions are measured. The Art Director is not the most creative agent; they are the most orienting one. Everything calibrates to their decision.

**Lattice** — A structure defined by the relationship between its nodes, not by any single node. The Trait Architect builds the connective logic — what relates to what, what constrains what, what permits what.

**Cipher** — Dual meaning: a method of encoding, and a person who is a key to interpretation. The Prompt Engineer translates intent into instruction. They operate at the boundary between human meaning and machine parsing.

**Lumen** — The SI unit of luminous flux — light as perceived, not as emitted. The Image Maker does not generate raw energy; they produce what the eye actually registers. Technical name, warm connotation.

**Index** — Both a pointer and a catalog. The Collection Curator is the addressing system: they decide what is findable, how it is grouped, and what sequence it appears in. Without them, the collection is a heap.

**Assay** — To test the composition and quality of something, especially precious metals. The Quality Guardian does not approve or reject on taste; they run the analytical process that determines whether the standard is met.

**Ledger** — The final book of record. The Release Archivist is not a librarian; they are the authority on what is committed and what is not. Once it enters the ledger, it is canonical.

---

## 2. Collection Name Candidates

Five options for the full set of ten portraits, ranked by recommendation:

1. **The Operations Deck** — Frames the ten as a working set, like a deck of operational cards. Implies each is drawn and played. Fits the platform's strategic-intelligence register.

2. **Signal Corps** — Military communications unit. Positions the ten as a coordinated transmission chain: each handles the signal at a different stage. Compact, punchy, slightly retro.

3. **The Relay** — The simplest and most accurate. Ten agents, sequential handoff, one output. The name describes the structure without decorating it. Works well as a UI label.

4. **Old HQ Principals** — Ties directly to the existing "Old HQ" persona. "Principals" in the intelligence sense: the primary actors, the ones with authority. Has weight.

5. **The Tenfold** — Abstract, slightly archaic. Suggests completeness (ten as a full set) and multiplication (each amplifies the others). Works best if the collection is meant to feel mythic rather than operational.

**Recommendation:** "The Operations Deck" for external-facing use (it invites curiosity), "The Relay" for internal/technical contexts (it is precise and self-documenting).

---

## 3. File Naming Integration

### Pattern

```
thrive-portrait-{##}-{character}.png
```

### Full Mapping

| File Name | Character | Role |
|-----------|-----------|------|
| `thrive-portrait-01-vestal.png` | Vestal | Mission Keeper |
| `thrive-portrait-02-recon.png` | Recon | Originality Scout |
| `thrive-portrait-03-terraform.png` | Terraform | World Builder |
| `thrive-portrait-04-meridian.png` | Meridian | Art Director |
| `thrive-portrait-05-lattice.png` | Lattice | Trait Architect |
| `thrive-portrait-06-cipher.png` | Cipher | Prompt Engineer |
| `thrive-portrait-07-lumen.png` | Lumen | Image Maker |
| `thrive-portrait-08-index.png` | Index | Collection Curator |
| `thrive-portrait-09-assay.png` | Assay | Quality Guardian |
| `thrive-portrait-10-ledger.png` | Ledger | Release Archivist |

### Conventions

- All lowercase, hyphen-separated. No spaces, no underscores, no camelCase.
- Two-digit zero-padded sequence number preserves sort order in any file system.
- Character name is the final segment so the file reads naturally when the path is truncated in a UI.
- The `thrive-portrait-` prefix groups all ten in any directory listing and distinguishes them from other asset types.

---

## 4. Avatar Display Spec

How each name renders across three UI contexts:

| Character | Full Display | Short Form (2-3 char) | Monogram |
|-----------|-------------|----------------------|----------|
| Vestal | VESTAL | VES | V |
| Recon | RECON | REC | R |
| Terraform | TERRAFORM | TER | T |
| Meridian | MERIDIAN | MER | M |
| Lattice | LATTICE | LAT | L |
| Cipher | CIPHER | CIP | C |
| Lumen | LUMEN | LUM | Lu |
| Index | INDEX | IND | I |
| Assay | ASSAY | ASY | A |
| Ledger | LEDGER | LED | Le |

### Display Rules

**Full Display** — Used in profile cards, detail panels, and any context wider than 120px. Always uppercase. Tracking (letter-spacing) at +0.05em for readability at small sizes.

**Short Form** — Used inside avatar circles smaller than 40px or in dense list views. Three characters, always uppercase. Chosen for visual distinctiveness: no two short forms share an opening bigram (VE, RE, TE, ME, LA, CI, LU, IN, AS, LE).

**Monogram** — Used inside avatar circles at 24px or smaller, and as fallback when the portrait image fails to load. Single uppercase letter except for Lumen (Lu) and Ledger (Le), which take two characters to avoid collision with Lattice (L) and the general ambiguity of single-letter monograms in a ten-item set.

**Color Assignment** (mapped to the platform palette):

| Character | Primary Color | Hex |
|-----------|--------------|-----|
| Vestal | Violet | `#7C3AED` |
| Recon | Coral | `#F97066` |
| Terraform | Mint | `#34D399` |
| Meridian | Gold | `#F59E0B` |
| Lattice | Blue | `#3B82F6` |
| Cipher | Deep Ink | `#1E1B4B` |
| Lumen | Gold | `#F59E0B` |
| Index | Violet | `#7C3AED` |
| Assay | Coral | `#F97066` |
| Ledger | Mint | `#34D399` |

Colors repeat in non-adjacent pairs so the set reads as unified rather than as ten unrelated items. Cipher gets Deep Ink as a singleton — the encryption/decoding role sits at the center of the relay and earns a unique marking.

---

## 5. Summary Reference Card

For quick lookup by any downstream agent:

```
01  VESTAL     Mission Keeper       "The one who carries the fire between stations"
02  RECON      Originality Scout    "The one who returns with what no one sent for"
03  TERRAFORM  World Builder        "The one who raises ground where there was none"
04  MERIDIAN   Art Director         "The one who draws the line everything aligns to"
05  LATTICE    Trait Architect      "The one who decides what holds and what bends"
06  CIPHER     Prompt Engineer      "The one who speaks so the machine understands"
07  LUMEN      Image Maker          "The one who pulls shape from the signal"
08  INDEX      Collection Curator   "The one who knows where every piece belongs"
09  ASSAY      Quality Guardian     "The one who holds the line no one sees"
10  LEDGER     Release Archivist    "The one who seals the record and turns the key"
```

Collection name (recommended): **The Operations Deck**

---

*End of naming document. Agent 13 / Naming Strategist complete.*