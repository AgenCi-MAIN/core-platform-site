# PLATFORM MAP — where everything lives and where data plugs in

Owner order 2026-08-18: *"categorize everything and organize the data and
organize each portal file and make sure everything lands in the right folder
and the right category when we plug everything in — the next step before we
inject the real workforce."* This file is that categorization, kept current
so a plug-in never lands in the wrong place. When a surface is added, its
row is added here in the same commit.

## The five categories (sidebar groups) and their meaning

| Category | Meaning | Who sees it |
|---|---|---|
| **Workspace** | Daily home base: dashboard, reference, ambience | every member |
| **Calls** | The work itself: training language, live call review, scripts | per capability |
| **Team** | People and production: who we are, how we're doing | per capability |
| **API** | External sources & tools — everything that talks to the outside | per capability |
| **Administration** | Governance: roster, comp modeling, the audit trail | leadership / founder |

Dashboard **mission lanes** are the second categorization of the same
surfaces (01 Operating Floor · 02 Signal & Intelligence · 03 Economics Lab ·
04 Governance Layer), defined in `app/portal/components.tsx`
(`MISSION_GROUPS` / `MISSION_LABELS`). A new surface gets BOTH a sidebar
group and a lane (or a deliberate note that it's lane-exempt, like Radio).

## Surface inventory — file, guard, data source, plug-in step

### Workspace
| Surface | Folder | Guard | Data source | To inject data |
|---|---|---|---|---|
| Dashboard | `app/portal/page.tsx` | `dashboard.view.self` | D1 (members, announcements) | live |
| Command Center | `app/portal/command/` | `requireCommandCenter` (founder + Andrew, A13) | curated in-file | edit page content |
| Announcements | `app/portal/announcements/` | `dashboard.view.self` | curated in-file | edit page content |
| Library | `app/portal/library/` | `dashboard.view.self` | curated in-file | edit page content |
| Commission Schedule | `app/portal/commission/` (+ `document/`) | `dashboard.view.self` | `document/schedule.html` baked into the bundle | replace that HTML (keep `commission-site/index.html` — the public Vercel/Pages copy — byte-identical) |
| Radio | `app/portal/music/` | `dashboard.view.self` | R2 `site-creator-r2` under `music/` | upload via the portal (owner) — old account's tracks need re-upload |

### Calls
| Surface | Folder | Guard | Data source | To inject data |
|---|---|---|---|---|
| Training | `app/portal/training/` | `dashboard.view.self` | `library.ts` — HUMAN-APPROVED, byte-verbatim pinned | new scripts land as new approved slots in `library.ts`; the STEP/SCRIPT:/PURPOSE: format self-highlights; tests pin byte-fidelity |
| Call Lab | `app/portal/calls/` | `calls.review` | D1 `dialer_transfers` + R2 recordings | dialer webhook → transfers rows (E7 counsel gate applies to recording) |
| Script Vault | `app/portal/scripts/` | `scripts.manage` | pending import | governed script import |

### Team
| Surface | Folder | Guard | Data source | To inject data |
|---|---|---|---|---|
| Book of Business | `app/portal/book/` | `book.view.self` | pending (E3: carrier statements + CPL) | source decision E3 |
| Team | `app/portal/team/` | `team.view` | pending model | model decision |
| Leaderboard | `app/portal/leaderboard/` | `dashboard.view.self` | D1 `dialer_transfers` per `agent_email` | fills itself when call traffic flows — no manual entry exists |
| My Stats | `app/portal/stats/` | `dashboard.view.self` (self-scoped query) | same | same |
| Leadership | `app/portal/leadership/` | `leadership.view.all` | pending sources | source decisions |

### API — external sources & tools
| Surface | Folder / link | Guard | Dormant until | To activate |
|---|---|---|---|---|
| LeadTech (GoHighLevel) | `app/portal/leadtech/` (3 tabs) | `leadership.view.all` | `LEADTECH_API_KEY` unset (E7b counsel gate) | `wrangler secret put LEADTECH_API_KEY` (v2 token, `pit-…`) + deploy |
| Retreaver | `app/portal/retreaver/` | `leadership.view.all` | needs BOTH `RETREAVER_API_KEY` + `RETREAVER_COMPANY_ID` | two secret puts + deploy |
| Twilio | `app/portal/twilio/` | `leadership.view.all` | needs `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` | two secret puts + deploy |
| Exchange | `app/portal/shop/` | `dashboard.view.self` | live (priced menu) | — |
| Quoter (external) | NAV link → insurancetoolkits | `book.view.self` | — | sign in there |
| AI Underwriter (external) | NAV link → insurancetoolkits | `book.view.self` | — | sign in there; tile states advisory-only |
| SureLC — Heartland (external) | NAV link → surancebay | `dashboard.view.self` | **generic login URL is a placeholder** | owner supplies Heartland's branded link (`…/sbweb/ui/login?gaId=…`) → swap the href. **More SureLC instances**: each upline gets its own NAV entry in the API group, label `SureLC (<upline>)` — one entry per link, never a shared page |

### Administration
| Surface | Folder | Guard | Data source |
|---|---|---|---|
| Pay Rates | `app/portal/pay-rates/` | `leadership.view.all` | in-file model |
| Members | `app/portal/members/` | `members.view` / writes `members.manage` | D1 `portal_members` |
| Audit | `app/portal/audit/` | `requireFounder` | D1 `audit_events` (append-only) |
| Investigator | `app/portal/investigator/` | `requireFounder` | deliberately unlisted in NAV — reached via the sidebar system dot, founder only |

### Named but not yet built (owner to define)
| Name (as spoken) | Status |
|---|---|
| "Reagan AI" / "Ringy AI"(?) | awaiting the owner's definition — what it is decides its category (API tool link vs. built surface). Do NOT build until defined |
| Additional SureLC uplines | awaiting each upline's branded link; pattern defined above |

## The rules that keep organization honest when plugging in

1. **A new surface = one folder under `app/portal/<name>/`** with exactly one
   guard, a NAV entry (group = its category), a mission-lane entry (or a
   recorded exemption), a `PROTECTED_ROUTES` row, and a row in this file —
   all in the same commit.
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
