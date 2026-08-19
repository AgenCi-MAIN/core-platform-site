# Ten Agents, Ten Portraits -- Collection Brief

**Agent 01 / MISSION KEEPER**
**Date:** 2026-08-19
**Creative Director:** Yuxiang Mao (Shawn), Founder, THRIVE Companies
**Project:** AI-generated profile picture collection for the THRIVE agent workforce

---

## 1. Audience

These portraits will be seen by three concentric rings:

- **Inner ring (daily users):** The five portal members and the standing staff agents (Mr. T, HERALD, VIGIL, VERITY, INVESTIGATOR, the Morning Brief) who operate inside the THRIVE portal at `thrive18.workers.dev`. They see these portraits in the sidebar, the Team page, the Command Center, and the Leaderboard. For them, the portraits are functional -- they identify who or what they are talking to.

- **Middle ring (near-term team):** The managers, reviewers, agents, and support staff who will be onboarded as THRIVE scales toward its 2,000-active-writer target. These people are insurance professionals -- licensed agents selling final expense, IUL, and annuity products. For them, the portraits signal that this operation is built, not improvised.

- **Outer ring (strategic):** Carrier partners, potential PE investors, and acquirers who will encounter THRIVE's materials during relationship-building or due diligence. For them, the portraits contribute to the impression of an institutional-grade distribution platform, not a startup running on defaults.

**Key constraint:** The primary audience is professionals in insurance and finance. The portraits must read as serious and intentional, not as novelty or decoration.

---

## 2. Mood

The emotional register is **controlled intensity** -- the feeling of a well-run operations floor where consequential decisions happen quietly and on schedule.

Visual tone guidelines:

- **Precise, not cold.** The operation runs on exact identity checks, HMAC-signed sessions, and append-only audit logs. The portraits should feel engineered, not generic.
- **Ambient authority.** These are not avatars for a game. They represent agents that handle real data, guard real boundaries, and answer to a real founder. The mood should convey earned trust.
- **Dark-field elegance.** The portal already runs in a dark theme with careful capability gating. Portraits should feel native to an interface where the background is dark, the typography is precise, and every element is load-bearing.
- **Human-adjacent, not human-imitating.** The THRIVE workforce includes both human members and AI agents (the ELITE_8, VIGIL, HERALD, etc.). The portraits should occupy a visual space that is clearly constructed -- acknowledging these are designed identities, not photographs of people.

Reference moods (direction, not imitation): the card art of a serious strategy game; the character portraits in a film's opening credits where each face holds for two seconds; the employee badge photos of an organization that cares about its badges.

---

## 3. Boundaries

These are hard constraints. Violating any one disqualifies a portrait from the collection.

- **No imitation of real artists' signature styles.** Do not prompt for "in the style of [living artist]." Visual influence from broad traditions (portraiture, technical illustration, brutalist design) is acceptable; copying a recognizable individual's technique is not.
- **No photorealistic human faces.** The collection must never be mistakable for photographs of real people. This is both an ethical constraint (these portraits should not imply the existence of humans who do not exist) and a practical one (the THRIVE workforce includes AI agents, and the portraits should be honest about that).
- **No misleading professional credentials.** Portraits must not include visible badges, licenses, certifications, regulatory logos, or institutional insignia that would imply a specific professional credential the depicted entity does not hold.
- **No carrier or company branding.** No logos, wordmarks, or trade dress from any insurance carrier, any competitor, or any technology vendor. The THRIVE name may appear only as subtle environmental detail, never as a prominent label.
- **No culturally appropriative imagery.** The portraits represent operational roles, not ethnicities or cultures. Avoid costumes, symbols, or visual tropes borrowed from specific cultural traditions.
- **No weapons, no violence, no threat displays.** The "agent" metaphor is operational, not military. Guard imagery should suggest vigilance, not force.
- **Content rating: professional.** Every portrait must be suitable for display in a business environment, on a phone screen during a client call, or in a slide deck shown to a carrier partner.

---

## 4. Format

| Specification | Value |
|---|---|
| Aspect ratio | 1:1 (square) |
| Minimum dimensions | 1024 x 1024 px |
| Preferred dimensions | 2048 x 2048 px (allows clean downscaling to 512, 256, 128, 64) |
| File format | PNG with transparency support (alpha channel) |
| Color space | sRGB |
| Background | Transparent or near-black (#0A0A0F to #121218 range) -- must render cleanly against both the portal's dark theme and a white fallback |
| Compression | Lossless PNG; no lossy JPEG conversion in the pipeline |
| Naming convention | `portrait-XX-[AGENT_NAME].png` (e.g., `portrait-01-cardwright.png`) |
| Count | Exactly 10 portraits |

Each portrait must remain legible and identifiable when displayed at 64x64 px (sidebar avatar size). This means: strong silhouette, high contrast core, no fine detail that disappears at small scale.

---

## 5. Theme Direction

### "The Operations Floor"

The unifying concept: each portrait depicts an entity whose role is visible in their bearing, their environment, or their tools -- the way a portrait of a watchmaker shows the loupe and the steady hands without needing a caption.

The THRIVE operation is built on ten standing agents, each owning one question that the system must answer:

| Seat | Name | Domain | Visual Direction |
|---|---|---|---|
| A1 | CARDWRIGHT | Agent cards / capability advertisement | A figure holding or constructing a precisely ruled card -- the maker of identities |
| A2 | SEAL | Machine identity / authentication | A figure with a signet or embossed mark -- the one who certifies |
| A3 | LEASH | Authority boundaries / attenuation | A figure with measured lines or bounded geometry -- the one who draws limits |
| A4 | COURIER | Message contracts / handoff | A figure in transit, carrying something sealed -- the reliable messenger |
| A5 | LATTICE | Topology / routing | A figure surrounded by or composed of connected nodes -- the architect of paths |
| A6 | CAVEAT | Injection defense / confused deputy | A figure examining something with suspicion -- the skeptic at the gate |
| A7 | DEADMAN | Failure detection / silence alarms | A figure with a visible pulse or signal -- the one who watches for silence |
| A8 | LEDGER | Audit / observability | A figure with a visible record or ledger -- the keeper of proof |
| A9 | SPECTRUM | Visual accessibility / contrast | A figure composed of or refracting light -- the one who asks "can this be seen?" |
| A10 | PLAINSPEAK | Truthfulness / honest states | A figure with clear, unadorned bearing -- the one who asks "is this true?" |

**Compositional unity:** All ten portraits should share a consistent rendering approach, color temperature, lighting angle, and level of abstraction. They are a set, not ten separate commissions.

**Color palette direction:** Anchor in deep navy and charcoal blacks. Accent with a single warm tone per portrait (amber, copper, or warm white) to distinguish the individual within the set. Avoid saturated primary colors. The palette should feel like instrument lighting in a well-designed control room.

**Visual language:** Abstract-figurative. Each portrait should suggest a presence -- a silhouette, a posture, a gaze direction -- without rendering anatomical detail. Think of the portraits as somewhere between a chess piece and a bust sculpture: recognizable as an entity with intent, but clearly constructed rather than born.

---

## 6. Definition of Success

The collection is **done** when all of the following are true:

1. **Ten portraits exist**, one for each of the ten ELITE seats (A1 through A10), each clearly distinguishable from the others at 128px display size.

2. **The set reads as a set.** Placing all ten side by side, a viewer immediately understands they belong together -- same world, same studio, same hand.

3. **Each portrait carries its role.** Without reading the name, a viewer familiar with the brief should be able to match at least 7 of 10 portraits to their correct seat based on visual cues alone.

4. **No boundary is violated.** Every portrait passes the full boundary checklist in Section 3, verified by a separate reviewing agent.

5. **Technical specs are met.** Every file passes format validation: 1:1 aspect ratio, minimum 1024px, PNG with alpha, sRGB, correct filename.

6. **The founder approves.** Shawn reviews the final set and confirms it represents the operation he is building.

7. **Portal-ready.** At least one portrait is integrated into a working portal page as a proof of deployment, confirming the format renders correctly in the actual dark-themed interface at sidebar scale.

---

*Mission Keeper -- Agent 01, signing off. The brief is set.*
