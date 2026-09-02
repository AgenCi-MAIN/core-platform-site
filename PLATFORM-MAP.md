# PLATFORM MAP — where everything lives and where data plugs in

Owner order 2026-08-18: *"categorize everything and organize the data and
organize each portal file and make sure everything lands in the right folder
and the right category when we plug everything in — the next step before we
inject the real workforce."* This file is that categorization, kept current
so a plug-in never lands in the wrong place. When a surface is added, its
row is added here in the same commit.

**Reorganized 2026-09-02:** the menu consolidated from five sidebar groups to
three, the dashboard's mission-lane map was retired with the old dashboard,
and the dashboard itself was rebuilt as the founder's three-block layout.
The five-category edition of this file lives in git history.

## The three menu groups and their meaning

| Group | Subtitle in the menu | Meaning | Who sees it |
|---|---|---|---|
| **Work** | "Answer, train & produce" | The daily loop: dashboard, training, calls, scripts, your numbers | every member (per capability) |
| **Resources** | "References, tools & trades" | Everything consulted rather than worked: content, external tools, the Exchange | every member (per capability) |
| **Administration** | — | Governance: comp modeling, roster, audit, the Command Center | leadership / founder / Command Center set |

The menu (`NAV` / `NAV_GROUPS` in `app/portal/components.tsx`) is the single
categorization now — the dashboard mission lanes (`MISSION_GROUPS` /
`MISSION_LABELS`) were deleted with the old dashboard. Three demoted stubs are
named, unlinked, in the menu footer: **"Coming online: Book of Business ·
Team · Leadership"** (decision 2026-09-02). Their routes and guards live on
untouched and they re-enter the menu when their sources land; plain text on
purpose, so the gated-absence tests stay clean.

## The dashboard (rebuilt 2026-09-02 — founder's three blocks)

`app/portal/page.tsx`, guard `dashboard.view.self`, plus server-only data
assembly in `app/portal/dashboard-data.ts` and week arithmetic in
`app/portal/week.ts`. Every rendered number is computed from records the
platform holds for the signed-in member; a metric with no source says
"source pending", and an unreadable table says so (`readRows` fail-closed) —
never a zero, never an invented value.

| Block | What it shows | Data source |
|---|---|---|
| 1 — Production tiles (`portal-prod-grid`) | Policies sold · Calls answered · Active clients · Cost per policy, with day/week/month views and a week-over-week delta | Calls answered is LIVE: D1 `inbound_voice_calls` (answered, per member) + `dialer_transfers` (per agent email). The other three have **no source system** and render "source pending" |
| 2 — Weekly commitment (`portal-week-panel`) | The member's own stated plan: lead budget + call target, bars and pace line; visually a lighter, dashed panel because it is PLAN, never actual | D1 `weekly_commitments` — **table pending `db/sql/0013`** (see DEPLOYMENT.md); until applied the panel renders the honest not-provisioned copy. Written only by `POST /portal/checkin` (self-scoped, current week only, audited) |
| 3 — Book of Business tile (`portal-bob-tile`) | Open voicemail callbacks (count + three soonest-due, masked numbers), links to the Calls page | D1 `voice_callback_tasks` joined to `inbound_voice_calls`, bootstrap-route scoping (member sees own + shared queue only) |

`POST /portal/checkin` is the commitment panel's one writer: presence-route
guard pattern, capability every member holds, `member_id` and `week_key`
decided server-side (forged body fields ignored), bounds mirrored by CHECK
constraints in 0013, every outcome audited. Listed in `PROTECTED_ROUTES`;
its GET redirects a signed-in member home and refuses anonymous like every
guarded route.

## Surface inventory — file, guard, data source, plug-in step

### Work
| Surface | Folder | Guard | Data source | To inject data |
|---|---|---|---|---|
| Dashboard | `app/portal/page.tsx` | `dashboard.view.self` | see the block table above | calls live; commitment pends 0013; the rest pend source decisions |
| Training | `app/portal/training/` | `dashboard.view.self` | `library.ts` — HUMAN-APPROVED, byte-verbatim pinned | new scripts land as new approved slots in `library.ts`; the STEP/SCRIPT:/PURPOSE: format self-highlights; tests pin byte-fidelity |
| Calls | `app/portal/calls/` | `calls.answer` (review areas `calls.review`) | D1 `inbound_voice_calls` / `voice_callback_tasks` / `dialer_transfers` + R2 recordings | SignalWire webhooks + dialer ingest (E7 counsel gate applies to recording) |
| Script Vault | `app/portal/scripts/` | `scripts.manage` | pending import | governed script import |
| My Stats | `app/portal/stats/` | `dashboard.view.self` (self-scoped query) | D1 `dialer_transfers` per `agent_email` | fills itself when call traffic flows |
| Leaderboard | `app/portal/leaderboard/` | `dashboard.view.self` | same | same — no manual entry exists |

### Resources
| Surface | Folder / link | Guard | Data source | To inject data |
|---|---|---|---|---|
| Announcements | `app/portal/announcements/` | `dashboard.view.self` | curated in-file | edit page content |
| Library | `app/portal/library/` | `dashboard.view.self` | curated in-file | edit page content |
| Commission Schedule | `app/portal/commission/` (+ `document/`) | `dashboard.view.self` | `document/schedule.html` baked into the bundle | replace that HTML (keep `commission-site/index.html` — the public copy — byte-identical) |
| Radio | `app/portal/music/` | `dashboard.view.self` | R2 `site-creator-r2` under `music/` | upload via the portal (owner) |
| Operations Deck | `app/portal/gallery/` | `dashboard.view.self` | curated portraits + Inkbox publish | — |
| Exchange | `app/portal/shop/` | `dashboard.view.self` | live (priced menu) | — |
| Quoter | `app/portal/quoter/` | `book.view.self` | client-side calculator (no persistence) | — |
| SureLC ×3 (external) | NAV links → surancebay OAuth (owner's exact links, 2026-08-18) | `dashboard.view.self` | — | gaId 505 = labeled Heartland (owner to confirm), 862 = Brenda Daly, 323 = Altura of America. One entry per upline, never a shared page |
| Reagan AI (external) | NAV link → reagan.ai agent portal | `dashboard.view.self` | — | sign in there |
| **Tool Directory** | `app/portal/tools/` | `dashboard.view.self` | curated in-file `TOOL_CATEGORIES` | THE home for every external tool that doesn't earn a menu row: carrier portals, leads & CRM, quoting, team docs, utilities. Adding a tool = one entry in the array |

### Administration
| Surface | Folder | Guard | Data source |
|---|---|---|---|
| Pay Rates | `app/portal/pay-rates/` | `leadership.view.all` | in-file model |
| Members | `app/portal/members/` | `members.view` / writes `members.manage` | D1 `portal_members` |
| Audit | `app/portal/audit/` | founder only | D1 `audit_events` (append-only) |
| Command Center | `app/portal/command/` | Command Center set (founder + named helpers, A13) | curated in-file |

### Live routes without a menu entry (guarded as ever; the menu hides doors, never rooms)
| Route | Why unlisted | Guard |
|---|---|---|
| `/portal/book` | demoted stub — named in the "Coming online" footer until E3 sources land | `book.view.self` |
| `/portal/team` | demoted stub — same footer, pending model | `team.view` |
| `/portal/leadership` | demoted stub — same footer, pending sources | `leadership.view.all` |
| `/portal/leadtech` | dormant integration (E7b) — activates with `LEADTECH_API_KEY` | `leadership.view.all` |
| `/portal/retreaver` | dormant — needs `RETREAVER_API_KEY` + `RETREAVER_COMPANY_ID` | `leadership.view.all` |
| `/portal/twilio` | dormant — needs `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` | `leadership.view.all` |
| `/portal/investigator` | deliberately unlisted — reached via the menu system dot, founder only | founder only |
| `/portal/checkin` | not a page — the commitment panel's POST target (see dashboard section) | capability + self-scope |

### Named but not yet built (owner to define)
| Name (as spoken) | Status |
|---|---|
| "Reagan AI" / "Ringy AI"(?) | awaiting the owner's definition — what it is decides its category (API tool link vs. built surface). Do NOT build until defined |
| Additional SureLC uplines | awaiting each upline's branded link; pattern defined above |

## The rules that keep organization honest when plugging in

1. **A new surface = one folder under `app/portal/<name>/`** with exactly one
   guard, a NAV entry (group = its category, or a recorded footer/unlisted
   note), a `PROTECTED_ROUTES` row, and a row in this file — all in the same
   commit.
2. **External tools are NAV links, never pages** — `external: true`, open in
   a new tab, "sign in there separately" in the description. One tool, one
   entry; variants (multiple SureLCs) are separate entries.
3. **Data arrives through one of exactly four doors**: a D1 table (via
   migration in `db/sql/`, additive, numbered), an R2 object, a deployment
   secret (names only in code — the name goes in `worker-env.d.ts` with a
   fail-closed note), or a curated in-file edit (human-reviewed content like
   Training). Nothing else. If a plug-in doesn't fit a door, it's a design
   conversation, not a commit.
4. **Dormant-until-keyed is the standard for external APIs**: fail closed,
   honest empty states, zero outbound calls without credentials, defensive
   parsers, PII masked server-side. LeadTech/Retreaver/Twilio are the
   templates — copy them.
5. **Approved language is never transformed** — presentation-only formatting
   with output-level byte-fidelity tests (Training is the template).
6. **When the humans arrive**: each new member is seated in TWO places —
   the `portal_members` roster AND the Cloudflare Access allow policy
   (see DEPLOYMENT.md 2026-08-18). Role per `ROLE_CAPABILITIES`; capability
   additions are governance (OWNER-DECISIONS row), never convenience.
