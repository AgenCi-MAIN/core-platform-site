# CAPABILITY JOURNAL — CORE / J.A.R.V.I.S.

The chronological record of who can do what, and when each grant or governance
decision was made. Capabilities are **deny-by-default**: a role holds exactly
what is listed and nothing more, enforced server-side (not merely hidden in the
UI). Adding a capability to a role is a governance decision, never a
convenience — this journal is where those decisions live.

Sourced from `CORE_PLATFORM_RECORD.md §4`, `app/portal/access.ts`, and the
session record. No secret values appear here — only names.

---

## The capability matrix (current)

| Capability | owner | admin | manager | reviewer | agent | support |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `portal.access` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `dashboard.view.self` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `book.view.self` | ✅ | ✅ | ✅ | — | ✅ | — |
| `calls.review` | ✅ | ✅ | ✅ | ✅ | — | — |
| `scripts.manage` | ✅ | ✅ | — | ✅ | — | — |
| `team.view` | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| `leadership.view.all` | ✅ | ✅ | ✅ | — | — | — |
| `members.view` | ✅ | ✅ | ✅ | — | — | — |
| `members.manage` | ✅ | ✅ | — | — | — | — |
| `pet.chat` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

`audit.view` is granted to **no role** — the audit log and INVESTIGATOR
console are founder-only by identity gate (`requireFounder`), not capability.

## Identity gates (above capability)

- **`requireFounder`** — `/portal/audit` and `/portal/investigator` answer
  exactly one identity: `btcmao518@gmail.com` (the founder since the
  2026-08-17 migration; originally the seed `bankerrunners@gmail.com`, retired
  when Google locked it). A second owner with every capability is still
  refused; the refusal is audited `founder_only`. Identity comes from the
  HMAC-signed `core_session` cookie, never a header.

## Standing invariants (not capabilities, but load-bearing)

- **Owner rows are peer-protected** — no owner or admin can change another
  owner's role/status from `/portal/members/manage` (refused
  `owner_peer_protected`, audited). Owner changes are D1-console only.
- **`app/access/page.tsx` performs no membership lookup** — an unauthenticated
  page reporting membership would be a roster-enumeration oracle.
- **`app/portal/access.ts` is never imported from a `"use client"` file** —
  authorization stays server-only.
- **`public/sw.js` never caches `/portal` or `/auth`** — a cached portal page
  would answer without re-resolving the session.

---

## Journal — grants & governance decisions, chronological

**2026-08-13** — Portal provisioned. `bankerrunners@gmail.com` seeded as the
sole initial owner (the founder). This is the one identity every founder gate
answers.

**2026-08-14** — Owners added by the founder from the portal:
`ryandavidson.zenith@gmail.com` (Ryan Davidson), `epiclife.nguyen@gmail.com`
(Nate Nguyen, confirmed on the live roster 2026-08-15).

**2026-08-15** — `pet.chat` capability created and granted to **every role**.
Governance basis: the JARVIS Presence is the one model-powered surface members
may talk to, and it is safe because architecturally inert (no tools, no URLs,
text-node output, one spend-only credential, capped and audited). A prompt
injection through it yields words in a chat bubble.

**2026-08-15** — `audit.view` **removed from every role**. The audit log and
INVESTIGATOR console became founder-only by identity (`requireFounder`), by the
owner's order. The capability name survives only as the audit-row action.

**2026-08-15** — **Owner peer-protection** instituted. `/portal/members/manage`
refuses any change to an owner row. Subsumes the earlier last-active-owner rule.

**2026-08-15** — Identity ledger recorded: the founder's Proton addresses are
**aliases, not identities** — none sign in; never grant an alias a member row.
Sole portal identity for the founder is `bankerrunners@gmail.com`.

**2026-08-15** — `ANTHROPIC_API_KEY` secret added (name only) to power the
Presence. Optional: absent → honest 503. Governance: adding a tool or a write
path to the Presence route is a governance decision, not a feature.

**2026-08-16** — **Andrew Davidson** (`andrew.davidson.zenith@gmail.com`,
Ryan's brother) — owner seat **APPROVED** by the founder. **PENDING** the
portal grant (the founder executes it in Members; MAIN then marks the record
row live). Verify the exact Google sign-in address before granting.

**2026-08-17 — correction to the entry above (appended; the original line
stands as written).** The grant did not stay pending: CORE_PLATFORM_RECORD.md
§5 and the owner ledger record it executed from the portal on 2026-08-15 and
the first sign-in bound on 2026-08-16 — LIVE, roster screenshot verified by
the owner.

**PENDING (unresolved):** Oscar Valencia — named as an owner but his sign-in
address was never confirmed. No grant until confirmed.

---

## The four secrets (names only — values live in Cloudflare/Google)

| Secret | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth client id |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `SESSION_SECRET` | Signs the session cookie (rotating it signs everyone out, breaks nothing else) |
| `ANTHROPIC_API_KEY` | Powers the Presence; spend-only |

A future partner-ingest socket (LeadTech, Retention AI) will add
`DIALER_INGEST_TOKEN` (name) — not yet applied. A credential ever pasted into
chat/files is **burned** and rotated before use.

**2026-08-17** — Founder identity migrated. Google locked
`bankerrunners@gmail.com`; the owner designated `btcmao518@gmail.com` as the
final sign-in identity. Executed additively: owner row via `db/sql/0003`, a
two-identity `FOUNDER_EMAILS` transition set, new OAuth client under the new
identity, then — after verified sign-in, binding, and a founder-gate read of
the live audit log — the old identity was removed from the founder set. The
retired address keeps its owner row for the record but can never mint a
session. Historical entries above naming the old address are truthful and
deliberately unedited.

---

*Maintained by MAIN (Mr. T). Every grant above is a governance decision on the
record — adding a capability or an identity to any gate is amended here first.*
