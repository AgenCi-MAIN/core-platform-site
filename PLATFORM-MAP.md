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

**Reorganized 2026-09-02 (second pass):** the menu moved from three groups
(Work / Resources / Administration) to five — Today, Clients, Selling,
Standing, Administration — grouped by what a member is doing rather than by
kind of content. The "Coming online: Book of Business · Team · Leadership"
footer is retired; Book of Business and Team are now gated placeholder rows
inside the menu and Leadership is a normal gated row to its live surface
(routes and guards unchanged). "Exchange" was relabelled "Marketplace"
(label only; the route is still `/portal/shop`). Reagan AI was removed
entirely — from the menu, from the Tool Directory's "Contracting &
licensing" category, and from the client relabel. Script Vault received its
first real content (see its row). The three-group edition lives in git
history.

## The five menu groups and their meaning

| Group | Subtitle in the menu | Meaning | Who sees it |
|---|---|---|---|
| **Today** | "Answer, log & check in" | The daily loop: dashboard, calls, announcements, radio | every member (per capability) |
| **Clients** | "Callbacks, book & follow-up" | People already reached: the callback queue and the book of business | every member (per capability) |
| **Selling** | "Train, quote & carrier tools" | Getting ready to sell and the tools used while selling: training, scripts, quoter, marketplace, tool directory, carrier and upline portals | every member (per capability) |
| **Standing** | "Numbers, rank & pay" | Where a member stands: stats, leaderboard, team, leadership, commission, library | every member (per capability) |
| **Administration** | "Roster, audit & command" | Governance: comp modeling, roster, audit, the Command Center, the Operations Deck | leadership / founder / Command Center set |

The menu (`NAV` / `NAV_GROUPS` in `app/portal/components.tsx`) is the single
categorization now — the dashboard mission lanes (`MISSION_GROUPS` /
`MISSION_LABELS`) were deleted with the old dashboard. Book of Business
(Clients) and Team (Standing) are **gated placeholder rows**: each carries
honest "source not connected" copy, keeps its original route and guard, and
fills in when its source lands. Leadership (Standing) is a normal gated row
to its live surface.
The old plain-text "Coming online" footer is gone (decision 2026-09-02,
second pass).

Menu order within each group:

| Group | Rows, in menu order |
|---|---|
| Today | Dashboard (`/portal`) · Calls (`/portal/calls`) · Inbound Status (`/portal/inbound`) · Announcements (`/portal/announcements`) · Radio (`/portal/music`) |
| Clients | Callback Queue (`/portal/calls?tab=voicemail`) · Book of Business (`/portal/book`, placeholder) |
| Selling | Training · Script Vault (`/portal/scripts`) · Quoter · Marketplace (`/portal/shop`) · Tool Directory (`/portal/tools`) · Aetna carrier portal (external) · Ethos carrier portal (external) · SureLC ×3 (external) |
| Standing | My Stats · Leaderboard · Team (`/portal/team`, placeholder) · Leadership (`/portal/leadership`, live) · Commission Schedule (`/portal/commission`) · Library (`/portal/library`) |
| Administration | Pay Rates · Members · Audit (founder only) · Command Center (Command Center set) · Operations Deck (`/portal/gallery`) |

## The dock, the rail, and the placement preference (Dispatch R3, 2026-09-02)

The fixed bottom dock carries **five stable destinations**, each opening one
focused panel: Today (`/portal`), Book (`/portal/book`), Inbound
(`/portal/inbound`), Team (`/portal/team`), Leadership (`/portal/leadership`).
The tuple is `DOCK_DESTINATIONS` in `app/portal/components.tsx`; every entry
is a menu row and passes the same capability filter as the menu before it
renders, so a role without `team.view` has no Team slot rather than a
disabled one. **Calls and Radio left the dock**: both stay in the Today group
of the menu, and Calls is also the Inbound Status panel's own action. The
founder's dock additionally shows an **inert "Dialer · Deferred" slot** — a
span with no link and no handler, rendered only in the founder's markup —
so the map stays honest about a parked surface without offering a door.

**Navigation placement** is a member preference beside colour mode and
performance mode, and it works exactly the way those two do:

| | |
|---|---|
| Values | `dock` (default) · `rail` |
| Storage | browser `localStorage`, key `core-portal-nav` — **local-only, never sent to the server, no table, no migration** |
| Restored | by the pre-paint boot script in `app/portal-chrome.tsx`, onto `data-portal-nav`, so there is no flash |
| Control | `app/nav-control.tsx`, in the topbar next to the theme control |
| Rule | exactly `"rail"` opts in; anything else stored is the dock (`app/nav-placement.ts`, pinned in `tests/rendered-html.test.mjs`) |
| Narrow widths | below **960px** the compact bottom dock is used whatever is stored — the rail rules live only inside `@media (min-width: 960px)`, and the control hides there |

**Limitation, stated plainly:** a preference follows the browser profile,
not the member. Two devices can disagree, a cleared profile forgets, and a
private window starts from the default. That is how the colour mode already
behaves; giving the preference a server-side home would be a new table and a
migration, which is a governance decision this change does not make.

## The dashboard (rebuilt 2026-09-02 — founder's three blocks)

`app/portal/page.tsx`, guard `dashboard.view.self`, plus server-only data
assembly in `app/portal/dashboard-data.ts` and week arithmetic in
`app/portal/week.ts`. Every rendered number is computed from records the
platform holds for the signed-in member; a metric with no source says
"source pending", and an unreadable table says so (`readRows` fail-closed) —
never a zero, never an invented value.

Under the welcome sits a one-line, role-aware home framing line — a
role-specific orientation sentence, derived from the member's role only. It
introduces no new data source.

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

### Today
| Surface | Folder | Guard | Data source | To inject data |
|---|---|---|---|---|
| Dashboard | `app/portal/page.tsx` | `dashboard.view.self` | see the block table above; the role-aware framing line reads the member's role only | calls live; commitment pends 0013; the rest pend source decisions |
| Calls | `app/portal/calls/` | `calls.answer` (review areas `calls.review`) | D1 `inbound_voice_calls` / `voice_callback_tasks` / `dialer_transfers` + R2 recordings. The founder-gated Collab Dialer carries a temporary, clearly-labelled external link, **"Open Script Library (Temporary Hybrid)"**, to the canonical Google Doc `my script`: opens in a new tab, stores nothing, triggers no call, dial or recording. Script Vault remains the in-product copy | SignalWire webhooks + dialer ingest (E7 counsel gate applies to recording) |
| Inbound Status | `app/portal/inbound/page.tsx` — the daily inbound panel (R3); formerly a redirect into Calls | `calls.answer` (unchanged) | the dashboard's self-scoped call and callback reads (`app/portal/dashboard-data.ts`) plus this member's own `voice_presence` row; team presence protected, not shown | fills itself with voice traffic; "Missed" and "Median answer" pend a timing source |
| Announcements | `app/portal/announcements/` | `dashboard.view.self` | curated in-file | edit page content |
| Radio | `app/portal/music/` | `dashboard.view.self` | R2 `site-creator-r2` under `music/` | upload via the portal (owner) |

### Clients
| Surface | Folder / link | Guard | Data source | To inject data |
|---|---|---|---|---|
| Callback Queue | `/portal/calls?tab=voicemail` — the existing Calls voicemail tab, not a new route | `calls.answer` | D1 `voice_callback_tasks` joined to `inbound_voice_calls` (same scoping as the Calls page) | fills itself when voicemail traffic flows |
| Book of Business | `app/portal/book/` — the customer and policy workspace (R3): `?view=summary\|customers\|policies`, `?customer=<id>` opens the level-two drawer (bottom sheet on phones). Still a "source not connected" menu row: no policy system exists | `book.view.self` | Customers = the member's own open voicemail callbacks, masked (`loadCallbacks`, self-scoped); policies, requirements, persistence, money = Not provisioned. The drawer opens only for an id inside that list — fail-closed, no second query | route and guard unchanged; policy fields fill in when E3 sources land |

### Selling
| Surface | Folder / link | Guard | Data source | To inject data |
|---|---|---|---|---|
| Training | `app/portal/training/` | `dashboard.view.self` | `library.ts` — HUMAN-APPROVED, byte-verbatim pinned | new scripts land as new approved slots in `library.ts`; the STEP/SCRIPT:/PURPOSE: format self-highlights; tests pin byte-fidelity |
| Script Vault | `app/portal/scripts/` | `scripts.manage` | 18 sections imported from the canonical Google Doc `my script` (id `1vV2_B6xix29g-k-IVpXZR5AcTcyjhjlx4S-tJca97WE`) into `app/portal/scripts/library.ts`, in the doc's tab order; every section is labelled DRAFT / LICENSED AND COMPLIANCE REVIEW REQUIRED; bodies are the verbatim export with only markdown backslash-escapes decoded; the page renders them with presentation-only formatting and a byte-fidelity test | a human re-imports from the doc; never AI-edited |
| Quoter | `app/portal/quoter/` | `book.view.self` | client-side calculator (no persistence) | — |
| Marketplace (was "Exchange") | `app/portal/shop/` — label-only rename, route unchanged | `dashboard.view.self` | live (priced menu) | — |
| **Tool Directory** | `app/portal/tools/` | `dashboard.view.self` | curated in-file `TOOL_CATEGORIES` | THE home for every external tool that doesn't earn a menu row: carrier portals, leads & CRM, quoting, team docs, utilities. Adding a tool = one entry in the array |
| Aetna carrier portal (external) | NAV link → `https://www.aetna.com/aimmanageaccount/login` | `dashboard.view.self` | — | sign in there; new tab, `rel="noopener noreferrer"`, stores nothing, no carrier-affiliation claim |
| Ethos carrier portal (external) | NAV link → `https://agents.ethoslife.com/login` | `dashboard.view.self` | — | sign in there; new tab, `rel="noopener noreferrer"`, stores nothing, no carrier-affiliation claim |
| SureLC ×3 (external) | NAV links → surancebay OAuth (owner's exact links, 2026-08-18; unchanged) | `dashboard.view.self` | — | gaId 505 = labeled Heartland (owner to confirm), 862 = Brenda Daly, 323 = Altura of America. One entry per upline, never a shared page |

External rows open in a new tab with `rel="noopener noreferrer"`, store
nothing, and make no claim of carrier affiliation.

### Standing
| Surface | Folder | Guard | Data source | To inject data |
|---|---|---|---|---|
| My Stats | `app/portal/stats/` | `dashboard.view.self` (self-scoped query) | D1 `dialer_transfers` per `agent_email` | fills itself when call traffic flows |
| Leaderboard | `app/portal/leaderboard/` | `dashboard.view.self` | same | same — no manual entry exists |
| Team | `app/portal/team/` — gated placeholder row | `team.view` | none connected (model pending) | route and guard unchanged; fills in when the model lands |
| Leadership | `app/portal/leadership/` | `leadership.view.all` | the live Leadership surface (playbook and leadership view) | route and guard unchanged; a normal gated row, not a placeholder |
| Commission Schedule | `app/portal/commission/` (+ `document/`) | `dashboard.view.self` | `document/schedule.html` baked into the bundle | replace that HTML (keep `commission-site/index.html` — the public copy — byte-identical) |
| Library | `app/portal/library/` | `dashboard.view.self` | curated in-file | edit page content |

### Administration
| Surface | Folder | Guard | Data source |
|---|---|---|---|
| Pay Rates | `app/portal/pay-rates/` | `leadership.view.all` | in-file model |
| Members | `app/portal/members/` | `members.view` / writes `members.manage` | D1 `portal_members` |
| Audit | `app/portal/audit/` | founder only | D1 `audit_events` (append-only) |
| Command Center | `app/portal/command/` | Command Center set (founder + named helpers, A13) | curated in-file |
| Operations Deck | `app/portal/gallery/` | `dashboard.view.self` | curated portraits + Inkbox publish |

### Live routes without a menu entry (guarded as ever; the menu hides doors, never rooms)
| Route | Why unlisted | Guard |
|---|---|---|
| `/portal/leadtech` | dormant integration (E7b) — activates with `LEADTECH_API_KEY` | `leadership.view.all` |
| `/portal/retreaver` | dormant — needs `RETREAVER_API_KEY` + `RETREAVER_COMPANY_ID` | `leadership.view.all` |
| `/portal/twilio` | dormant — needs `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` | `leadership.view.all` |
| `/portal/investigator` | deliberately unlisted — reached via the menu system dot, founder only | founder only |
| `/portal/checkin` | not a page — the commitment panel's POST target (see dashboard section) | capability + self-scope |

`/portal/book`, `/portal/team` and `/portal/leadership` left this table on
2026-09-02 (second pass): they are now listed in the menu as gated
placeholder rows, guards unchanged.

### Named but not yet built (owner to define)
| Name (as spoken) | Status |
|---|---|
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
