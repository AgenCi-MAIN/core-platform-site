# Session log — 2026-08-14

What happened, what was decided, and what was left open. Written so the next
session — or the next person — does not have to reconstruct it.

Chronological. Where a decision was made, the reasoning is recorded with it,
because the reasoning is the part that is hard to recover later.

---

## 1. The security finding, and the auth replacement

**What was found.** The portal took identity from `oai-authenticated-user-*`
request headers injected by the hosting platform it was originally built for.
That was safe only while that platform stood in front and stripped those headers
from inbound requests. The moment the site was self-hosted on Cloudflare — which
is what owning the deployment requires — the protection disappeared. **Anyone
who knew an owner's email address could have sent it as a header and been
admitted as that owner.**

**What replaced it.** A first-party Sign in with Google flow, built into the
application:

- `app/google-auth.ts` — session cookie (`core_session`), HMAC-SHA256 signed
  under `SESSION_SECRET`, 7-day expiry, plus cookie and return-path helpers
- `app/auth/signin/route.ts` — OAuth 2.0 authorization-code flow with PKCE
- `app/auth/callback/route.ts` — server-side code exchange, ID token validation
  (issuer, audience, expiry, `email_verified`), session mint
- `app/auth/signout/route.ts` — clears the session
- `app/chatgpt-auth.ts` — deleted

**Decisions worth keeping.**

- *Only `email_verified: true` addresses are accepted.* An unverified address can
  be claimed by anyone at the provider. Since the allowlist is keyed by email,
  admitting one would let a stranger register a member's address and inherit
  their access.
- *Subjects are prefixed `google:`.* If the identity provider ever changes again,
  subject IDs cannot silently collide across providers.
- *Failed sign-ins redirect to `/access` and disclose nothing.* The reason is
  logged server-side. A failure message that distinguishes "not a member" from
  "wrong account" is a roster oracle.
- *The retired headers are ignored entirely* rather than merely unused. A request
  carrying them is anonymous.

**How it is held closed.** Two test suites send exactly the request that would
have worked before, and fail the build if it ever succeeds again. A forged,
tampered, and expired cookie are each tested the same way. 29 tests total, all
passing. The lesson is enforced by machinery rather than memory.

## 2. Self-hosting on Cloudflare

Deployed to `https://site-creator-vinext-starter.bankerrunners.workers.dev` on
the owner's own Cloudflare account. D1 database `site-creator-d1`
(`e00c30f0-7017-49d8-9f81-446cef9e32c3`), R2 bucket `site-creator-r2`, three
secrets set (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`).

Schema and the owner seed were applied through the **Cloudflare dashboard's D1
console**, not wrangler — `wrangler d1 execute --remote` failed with
`Authentication error [code: 10000]` on wrangler 4.92.0 despite a Super
Administrator token. Either path produces the same database.

**The bug that cost the most time.** `npm run build` failed instantly on Windows
because the npm scripts began with `WRANGLER_LOG_PATH=... vinext build` —
Unix-only inline-env syntax that cmd.exe cannot parse. The failure was quiet
enough that `wrangler deploy` kept shipping a stale `dist/`, so deploys reported
the *placeholder* database id long after the real one was committed. Fixed in
`d9830f0` by removing the prefix (vite.config.ts already defaults the log path).
**If a deploy ever names `00000000-0000-4000-8000-000000000000` again, the build
did not run.**

## 3. Members

| Email | Name | Role | Status |
| --- | --- | --- | --- |
| `bankerrunners@gmail.com` | Yuxiang Mao (Shawn) | owner | seeded and signed in |
| `ryandavidson.zenith@gmail.com` | Ryan Davidson | owner | granted, confirmed applied |
| `epiclife.nguyen@gmail.com` | Nate Nguyen | owner | **SQL prepared — application not confirmed** |
| Oscar Valencia | — | owner | address never confirmed |

Nate's grant was written and handed over but **no confirmation was received that
it was executed**. Verify before assuming he has access:

```sql
SELECT email, display_name, role, status FROM portal_members;
```

The grant SQL and the suspend/revoke SQL both live in
[CORE_PLATFORM_RECORD.md](CORE_PLATFORM_RECORD.md) § 5.

**Note on owner as a role.** Every grant so far has been `owner`, which holds all
ten capabilities including `members.manage` — meaning each of these people can
grant and revoke access for the others, including the person who granted them.
That may be exactly right for founders. It is worth being deliberate about, since
it is the one role with no ceiling above it.

## 4. The sidebar / route correction

A note was written claiming the deployed site carried surfaces the repository did
not — Call Lab, Script Vault, Quoter. **That was wrong**, and it would have sent
the next reader hunting for code that was never missing.

The sidebar uses operator-facing labels that differ from directory names: Call
Lab is `/portal/calls`, Script Vault is `/portal/scripts`, Exchange is
`/portal/shop`, Radio is `/portal/music`. The mapping lives in
`app/portal/components.tsx`. Full table in `CORE_PLATFORM_RECORD.md` § 10a.

**The one real finding:** *Quoter is not a route.* It is an outbound link to
`https://app.insurancetoolkits.com/fex/quoter`. A member who follows it leaves
the access model entirely — no capability checked, no audit row written, and
whatever happens there is governed by that vendor's terms. That may be fine, but
it is a seam in an otherwise closed boundary and should be a decision rather than
an oversight.

## 5. The board presentation

Four self-contained pieces in `presentation/`, with the reasoning behind each in
`presentation/README.md`. Also published as private artifacts on claude.ai.

The rule they all follow, and which should survive whatever replaces them: state
what runs today as fact, label what is planned as planned, and say out loud what
the technology cannot do. The pitch opens on the security flaw rather than the
achievements, and answers the board's real question with *"No. It does not run
the business without you."* A board that finds overstatement on its own stops
believing the accurate parts too.

## 6. Open items

- [ ] **Confirm Nate Nguyen's grant was applied.** SQL prepared; execution
      unconfirmed.
- [ ] **Rotate `SESSION_SECRET`.** A candidate value was pasted into a chat
      transcript during setup. If that value is in use, replace it:
      `npx wrangler secret put SESSION_SECRET -c dist/server/wrangler.json`.
      Rotating signs everyone out and breaks nothing else.
- [ ] **Delete the stray D1 database `8`** (`5bc64b69-1c83-4826-adf8-dcad4f576885`),
      created by accident and empty: `npx wrangler d1 delete 8`.
- [ ] **Confirm Oscar Valencia's Google sign-in address**, then grant.
- [ ] **Decide on the Quoter seam** — leave it, or bring quoting inside the
      access model.
- [ ] **Wire member management into the portal UI** so grants stop requiring the
      database console. `members.manage` is already the gate; the write actions
      were deliberately deferred.
- [ ] **Merge PR #1.**

## 7. What could not be done from here, and why

This session ran in a cloud container with no path to the owner's machine and no
Cloudflare credentials. Three things were therefore handed over as commands
rather than performed:

- **Writing to the Desktop** (`MAINBACK`, `UNKNOW WATER`) — no filesystem access
  to the local machine. Everything was committed to this repository instead, with
  a `robocopy` command to pull it across.
- **Running SQL against D1** — no Cloudflare credentials. All grants were
  prepared as SQL for the dashboard console or wrangler.
- **Generating audio or video** — no such tool exists in this session. The
  narration script was written instead, with a self-playing browser briefing that
  can be screen-recorded, and instructions for local or ElevenLabs synthesis.

Recorded because "why didn't it just do it" is the first question the next reader
will have.

---

# Second sitting — 2026-08-15

The same cloud session, continued. Everything below is committed, tested, and
merged; PR #1 landed on `main` as `4aa8f7f` with the full 17-commit history.

## 8. What was built

- **Member management went live in the portal.** `/portal/members` grants,
  changes roles, and changes status through `/portal/members/manage`, which
  re-resolves the session and asserts `members.manage` on every request. Three
  governance defaults were settled and documented in the route header: single
  approver, no self-modification, last active owner protected. A later review
  found the selects fired one write per arrow keypress on Windows — a real
  governance defect, not a nit — and the controls became pick-then-Save.
- **The portal became installable (PWA).** Manifest, icons rendered from the
  favicon with zlib and geometry (no imaging library existed here), an offline
  page, and a service worker whose one load-bearing property — it never caches
  `/portal` or `/auth` — is pinned by a test character for character after a
  mutation walked through the first, looser version of that test.
- **The deploy became one gated command.** `npm run deploy` is build → tests →
  preflight → wrangler. `scripts/verify-build.mjs` refuses stale output, the
  placeholder D1 id, missing bindings, and missing installable-app files. Every
  check was mutation-tested. This exists because a silent stale build once cost
  days.
- **Three audits ran in parallel** (access model, mobile/a11y, feature
  completeness), then six more agents in a second wave, including an
  adversarial verifier that killed four of eight security findings before any
  time was spent on them. Confirmed and fixed: rank economics were readable in
  a public client chunk without any session (moved server-side, pinned by a
  bundle-scan test); the audit log's request path was caller-authored via
  `x-invoke-path` (now stated by the guards themselves); three pages returned
  500 stack traces where fail-closed explanations belonged (`read-guard.ts`);
  the Vite build manifest was publicly served; the music stream cached
  authenticated audio for an hour after suspension; dark mode rendered the
  grant controls white-on-white; and the first safe-area/touch pass introduced
  regressions its own review then caught.

## 9. Standing staff created

All on the owner's account, visible under Routines at claude.ai/code, one
click to pause or delete:

| Name | Cadence | Speaks when | Job |
| --- | --- | --- | --- |
| VIGIL | daily ~13:08 UTC | only on regression | eight security invariants, suite, deployability |
| MR. T | every 10 hours | when something changed | dated content, placeholder drift, stale record, unconfirmed grants, placeholder numbers |
| Morning Brief | daily 12:00 UTC | every day | pre-existing |

Mr. T carries the session's full doctrine, may investigate at his own
discretion, and may prepare mechanical fixes on `mr-t/<date>` branches — but
merges nothing, edits no owner-authored copy, and makes no governance
decisions. VIGIL reports and never edits. Neither can deploy.

## 10. Open items, corrected

- [x] ~~Wire member management into the portal UI~~ — done, tested, merged.
- [x] ~~Merge PR #1~~ — merged 2026-08-15, `4aa8f7f`.
- [x] ~~Deploy~~ — done by the owner, 2026-08-15, via the gated `npm run
      deploy` (version `c988662c`). The gate earned its keep on the first run:
      it refused once on a genuinely failing test (a Windows line-ending bug in
      the test itself, fixed as `bf294be`) and shipped only when green.
- [x] ~~Rotate `SESSION_SECRET`~~ — done by the owner, 2026-08-15, value undisclosed.
- [x] ~~Delete stray D1 database `8`~~ — deleted by the owner, 2026-08-15.
- [ ] **Confirm Nate Nguyen's and Oscar Valencia's sign-in addresses**, then
      grant — from Portal → Members after the deploy, not the console.
- [ ] **Owner content decisions before or at deploy:** the pinned announcement
      names products that do not exist in the codebase; three Library
      documents are unapproved drafts; the approved incentive doc expires
      Aug 31; `LEAD_COST = 15` is a placeholder the Exchange math turns on.
- [ ] **Two governance calls:** `portal.access` (real per-role gate, or out of
      the matrix) and `music.manage` (split from `members.manage`; drafted).
- [ ] **The Quoter seam** (unchanged).

## 11. The Mac

Setup of a local Claude Code session on a MacBook began at the end of this
sitting: Homebrew → node + gh → clone → `wrangler login` → `claude` in the
repo. A local session is an inheritor, not a copy — it reads this file,
CLAUDE.md, and the record, and gains the one power this container never had:
deploying. The owner was advised, and the advice stands in writing: sleep off,
screen lock on and short, and no unattended sessions with permissions bypassed
on a machine that holds deploy credentials.

---

# Third sitting — 2026-08-16

## 12. Identity rebuild: CORE-J.A.R.V.I.S 2.0.0

The system identity was formally consolidated under **CORE-J.A.R.V.I.S 2.0.0**
as the overseeing intelligence for THRIVE. Changes committed as `70239cc`:

- `package.json` — name: `core-jarvis`, version: `2.0.0`
- `app/layout.tsx` — page title and applicationName updated to `CORE-J.A.R.V.I.S 2.0.0`
- `app/manifest.ts` — PWA name and short_name updated to `CORE-J.A.R.V.I.S 2.0.0`
- `CAPABILITY-JOURNAL.md` — created; evidence log for reusable operating lessons
- `WORKFORCE.md` — three verification sub-agents added to the bench:
  - **JARVIS-101** — Capability Cross-Reference Auditor
  - **JARVIS-102** — Session & Training Consistency Checker
  - **JARVIS-103** — Evaluation Suite Validator
- `SESSION-BACKUP-2026-08-16.md` — full point-in-time state snapshot created

**What did not change:** Auth model, deploy gate, service worker exclusions, test
suite, database schema, capability matrix. No structural changes — identity
rename only.

**Still pending (owner action required):** Worker rename on Cloudflare to
`core-jarvis` requires dashboard action + `npm run deploy`. Do not rename
`.openai/hosting.json` until ready — mismatch breaks the live site.

## 13. Open items carried forward

- [ ] Confirm Nate Nguyen's and Oscar Valencia's sign-in addresses, then grant
- [ ] Owner content decisions (pinned announcement, library drafts, incentive doc expiry Aug 31, `LEAD_COST`)
- [ ] Governance: `portal.access` gate and `music.manage` split
- [ ] Quoter seam decision
- [ ] Worker rename on Cloudflare when ready
