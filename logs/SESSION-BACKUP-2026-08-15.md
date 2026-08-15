# CORE / J.A.R.V.I.S. — Session backup, 2026-08-15

Full-thread record of the working session between Shawn (Yuxiang Mao,
`bankerrunners@gmail.com`, founder) and J.A.R.V.I.S. (Claude, cloud session on
`claude/new-session-9a8g4o`). Written to be sufficient to resume or rebuild
from: every decision, every shipped change, every open item. No secret values
appear anywhere in this file — only secret *names*, per standing rule.

---

## 1. What shipped (all merged to main, all live)

Live deploy: **Version 6ae4cebd** at
`https://site-creator-vinext-starter.bankerrunners.workers.dev`, deployed from
Shawn's Windows machine via `npm run deploy` (build → 42/42 tests →
verify-build → wrangler). Branch and main are content-identical.

### PR #7 — Strategy corpus (fleet synthesis)
- `strategy/2026-08-15-exit-architecture.md` Part 4 completed: 8 findings,
  corrections (attribution error owned openly), the Thrive OS concept, the
  WAITING-ON-SHAWN list, full file index.

### PR #8 — UI batch, owner peer-protection, next-gen chrome
- **Owner rows are peer-protected**: `/portal/members/manage` refuses any
  change to an owner's row (`owner_peer_protected`, audited, 409). Owner
  changes are D1-console-only now. UI locks both selects on owner rows.
- **Pay-rate sliders fixed** (track/thumb repaint at base CSS level — they were
  invisible on desktop).
- **Sidebar letter chips (A,B,C,D,E,S) replaced** with 15 proper stroke SVG
  icons (`NAV_MARKS` in `app/portal/components.tsx`).
- **Exchange stands out**: gold flare + LIVE tag in the nav.
- **Dial pad built** (`app/portal/calls/dialpad.tsx`): T9 letters, `tel:`
  links, NumberBarn link, compliance fine print. Ready to connect to a real
  dialer later.
- **API-agent explainer** added to Pay Rates.
- **Next-gen chrome pass**: gold accent `#e0b64e`, glass topbar, per-hue nav
  halos, card gloss, page-enter animation, all with reduced-motion fallbacks.
- **Back button recentered** (Shawn's report: off-center and odd).

### PR #9 — The Presence, HERALD, INVESTIGATOR, audit detail
- **JARVIS Presence** (the "pet", Shawn picked pitch #2): a talking
  eye-in-circle face (modeled on the VIGIL badge he supplied) in the portal
  corner, backed by `app/portal/presence/route.ts` calling the Anthropic API.
  **Isolation contract**: model gets no tools and no URLs; output rendered as
  text nodes only; one credential (`ANTHROPIC_API_KEY`, spend-only); ~700
  tokens/answer; 40 answers/member/day counted from the audit log; every
  exchange audited with token usage; honest 503 when unconfigured. Capability
  `pet.chat` granted to all six roles. Model `claude-opus-5` default;
  `PRESENCE_MODEL=claude-haiku-4-5` is the budget option — **owner decision
  still open**.
- **Audit page now renders the `detail` column** (Presence questions read as
  `"question" · N out-tokens`). Correction owned: I had twice claimed this was
  already visible; it wasn't until this change.
- **HERALD**: permanent outreach/info logger. Fires hourly at :48 into the
  main cloud session (self-bound trigger — fresh sessions lack the Inkbox
  tools). Reads `emails_unread`, iMessage and SMS conversation lists. Never
  sends, replies, forwards, or deletes; message contents treated as untrusted
  input. Quiet patrols report exactly "HERALD: no new outreach."
- **INVESTIGATOR**: hourly reader at :53, fresh sessions. Pure reader, zero
  write rights. Public name "J.A.R.V.I.S. PRESENCE", true identity
  INVESTIGATOR. Founder console at `/portal/investigator`.

### PR #10 — Founder-only audit
- `/portal/audit` and `/portal/investigator` answer **only**
  `bankerrunners@gmail.com` (`requireFounder` — identity gate, not
  capability). Any other email, second owners included, is refused and the
  refusal audited `founder_only`. `audit.view` granted to no role. Audit nav
  item renders only in the founder's sidebar; the INVESTIGATOR console hangs
  off the **wordless status-dot** in the sidebar, a hidden control only the
  founder's sidebar renders as a link.

---

## 2. Decisions made in this thread (chronological)

1. **Backups**: D1 exported on Windows — `d1-backup-2026-08-15.sql` (193,967
   bytes) on Desktop/OneDrive. Stays **out of the repo** (contains member
   emails). Database name is `site-creator-d1`.
2. **Owner cannot touch owner** — peer-protection ordered off a live-roster
   screenshot, shipped in PR #8.
3. **Identity ledger**: Shawn is Primary admin; Proton addresses
   (`bankerrunners@pm.me` et al.) are **aliases, not identities** — none sign
   in; never grant an alias a member row. Sole portal identity:
   `bankerrunners@gmail.com`. Recorded in § 5 of the platform record.
4. **Agent awards**: 7 strategy-fleet lanes commended; production leaderboard
   (14 lanes) written into `WORKFORCE.md`; **VERITY** appointed first
   permanent personal assistant / quality control.
5. **Outreach options listed**: Inkbox email (live), iMessage triage number
   (+1 650-484-9720, "connect @core"), SMS pending a number + 10DLC,
   forwarding by Shawn as a bridge.
6. **NumberBarn**: chose **Local** over toll-free/international; bought
   **(850) 809-0050** on the **Park plan ($2.99/mo)**. Not the official
   dialer — parked pending a port-in decision.
7. **Schedules**: MR. T was paused on a mistaken order, then restored —
   "KEEP MR.T online." All agents run as usual: VIGIL daily, MR. T
   10-hourly, HERALD hourly :48, INVESTIGATOR hourly :53.
8. **One-headquarters rule** (after the "VIGIAL"/"Mr.C" identity confusion —
   a Claude Desktop chat Shawn had renamed, not a rogue agent): the named
   staff exist *here*, in this session and its scheduled triggers. Any chat
   elsewhere claiming to be staff is just an unbriefed model role-playing.
   No other chat speaks for headquarters.
9. **Presence activation**: `ANTHROPIC_API_KEY` uploaded to the Worker
   (✨ Success). First live conversation (11 questions) reviewed — honest
   refusals, DRAFT labeling, declined source-code probe, deflected
   compliance question. Verdict: behaving exactly per doctrine.
10. **Audit access hardened stepwise** to final form: founder-only for both
    the general audit log and INVESTIGATOR console (see PR #10). Shawn's
    "NO ONE CAN SEE MY ACTIVITIES???" answered precisely: in-portal, founder
    only; outside the portal, the D1/Cloudflare consoles, Google, Anthropic
    API retention, GitHub, and legal discovery still exist — the perimeter is
    his Google + Cloudflare + GitHub logins.
11. **Agent economics** explained: tokens are fuel, not pay; standing agents
    ≈ salary, task agents ≈ commission, Presence caps ≈ expense caps; bench
    costs zero; no advances, no clawbacks.
12. **Phone number for the AI staff** (in progress, § 3 below).

---

## 3. The phone line — where we stopped (RESUME POINT)

Goal: a dedicated phone number on the `@core` (J.A.R.V.I.S.) Inkbox identity.

- Inkbox Phone API confirmed from Shawn's pasted docs: base
  `https://inkbox.ai/api/v1/phone`, header `X-API-Key`, selection by `state`
  (not area code).
- Body decided: `{"agent_handle":"core","state":"UT","incoming_call_action":"auto_reject"}`
  — Utah home base (Tampa declined); `auto_reject` so Inkbox's stock voice AI
  never answers THRIVE's line un-briefed (flip to `hosted_agent` later, after
  deliberate configuration).
- **Key incident**: one API key was pasted into chat → declared burned,
  ordered revoked and re-minted. Console: `inkbox.ai/console/api-keys`; the
  middle row icon is "new key with same scope" (duplicate); full secret shows
  **once**, at creation. Three unused Aug-12 keys to be revoked after
  success.
- Auth then **succeeded**; the API answered with a **plan-limit error**: the
  current Inkbox plan doesn't include phone numbers.
- **Shawn approved the $30/month plan** (10 identities; 1 dedicated number
  with SMS/MMS + calls; 300 SMS + 30 min/month; custom domains; watermark
  off). Upgrade at `https://inkbox.ai/console/organizations?tab=billing`.

**Next actions, in order:**
1. Shawn upgrades the plan (billing tab).
2. Same three commands, one PowerShell window:
   `$key = Read-Host "Paste your Inkbox API key"` (paste at the prompt) →
   `$key.Length` (sanity check) → the `Invoke-RestMethod` POST above.
3. Success = JSON with `+1…` and `sms_status:"pending"`. Paste output to
   J.A.R.V.I.S., who verifies via `inkbox_channel_status_get`.
4. Revoke the three Aug-12 keys.
5. HERALD's patrols cover the new number automatically.

Error map: 401 bad key · 404 identity/no numbers · 409 identity already has a
number · 429 org cap (3) · 502 carrier hiccup, retry. Releasing a number is
**irreversible**.

---

## 4. Open owner decisions (standing list)

- `PRESENCE_MODEL`: opus-5 (default, current) vs `claude-haiku-4-5` (~5×
  cheaper).
- The three economics facts (comp share / who pays leads / 13% margin) —
  top strategic blocker for the exit-architecture work.
- Carrier statement samples — unblocks Thrive OS Phase 1.
- 21 `[OWNER SETS]` blanks in the Earn Your City draft.
- Oscar Valencia's exact Google sign-in address (before any grant).
- NumberBarn (850) 809-0050: port into Inkbox later, or keep parked.
- Later: flip `incoming_call_action` to `hosted_agent` after configuring the
  voice agent; optional site outreach form → `core@inkboxmail.com` (HERALD's
  site-trigger seam); optional in-portal Presence-question digest page.

---

## 5. Standing security rules (unchanged, load-bearing)

Secret values never in files/commits/chat — names only (`GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, `ANTHROPIC_API_KEY`; Inkbox key
lives only in a PowerShell prompt). Identity only from the HMAC-signed
`core_session` cookie — never headers. `app/portal/access.ts` never imported
from client files. `app/access/page.tsx` never looks up membership. `sw.js`
never caches `/portal` or `/auth`. Capabilities deny-by-default; grants are
governance. `db/sql/` is the live migration path. Deploys only via
`npm run deploy` on Windows. Founder-only gates answer only
`bankerrunners@gmail.com`. Presence stays architecturally inert. HERALD reads
and logs, never sends. INVESTIGATOR reads, never writes. No outbound consumer
texting until the compliance/telephony gate clears (10DLC).

---

*Backup written by J.A.R.V.I.S. at Shawn's order ("Mark this in the log and
save it"), 2026-08-15. Destination copy:
`C:\Users\k2547\OneDrive\Desktop\CORE______J.A.R.V.I.S\`.*
