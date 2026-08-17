# Identity recovery docket — 2026-08-17

Five-lane fleet round (~382K tokens), owner order: "new Cloudflare or a better
host if possible" + "spawn 5 top performing sub agents." All five lanes
reported; verdict **unanimous**. This file is the durable, self-contained
record of the decision and the runbooks — the chat transcript is ephemeral.

**Situation:** Google LOCKED `bankerrunners@gmail.com`. Downstream: portal
OAuth client dead (`disabled_client`), Gmail/Drive connectors dead, Access
codes to the owner route to a dead inbox. Cloudflare dashboard access
SURVIVES (independent password); wrangler still deploys. New final identity:
`btcmao518@gmail.com`. New Workspace: core-main.com (admin
`yuxiang@core-main.com`, recovery `bankerrunners@pm.me`).

## THE DECISION — unanimous 5/5

**Keep the existing Cloudflare account. Swap its email to btcmao518 in
place. Do not open a new account. Do not change hosts.**

- presence-probe: nothing in code or deploy config references the account
  email; the swap cannot break a deploy. The `bankerrunners` string in the
  URL is LOAD-BEARING (OAuth redirect URI, Access app, installed PWAs) —
  keeping the account is the only option that keeps it byte-identical.
- deploy-integrity: fresh account = "survivable but strictly dominated."
  1–2 days work, permanent URL change orphaning every PWA/bookmark,
  hand-rebuilt Access (no config source of truth in repo), PII dump in
  transit, split-brain window. The real risk of staying — account email is
  a dead inbox for future resets — is defused by the email swap itself.
  No evidence of Cloudflare-account compromise: "a healthy account with a
  dead contact address, not a burned account."
- doc-drift: moving hosts is 4–10+ engineering days, equal-or-higher
  monthly cost, and hands a solo Windows owner permanent ops load.
  "Migrating off the accessible platform toward the inaccessible identity
  provider's ecosystem is exactly backwards." Move justified only if the
  email swap is refused, CF pricing changes materially, or the app
  outgrows D1/R2. None hold.
- data-model: the blast radius is identity, not hosting (map below).
- test-gaps: whatever is decided, take the backups FIRST (runbook below).

## ⏰ THE CLOCK — 7-day cookie cliff

Sessions last 7 days. With no working OAuth client, nobody can mint a new
one. Every owner goes permanently dark as their cookie expires — **portal
fully dark for all four owners by ~2026-08-23** unless the new client ships
first. The OAuth rebuild is a whole-company outage in progress, not an
owner inconvenience.

## ORDER OF OPERATIONS (owner)

1. **OAuth rebuild under btcmao518** (in progress at time of writing —
   project `core-portal`, id `core-portal-505803`): consent screen External
   + Publish; Web client; single redirect URI
   `https://site-creator-vinext-starter.bankerrunners.workers.dev/auth/callback`;
   no JS origins. Then rotate:
   `npx wrangler secret put GOOGLE_CLIENT_ID -c dist/server/wrangler.json`
   and same for `GOOGLE_CLIENT_SECRET`. No code change. ~2 min propagation.
2. **Backups** (test-gaps runbook, §B below) — before any further change.
3. **Cloudflare email swap + hardening** (presence-probe runbook, §A).
4. **Perimeter checks while sessions live** (data-model tonight-list, §C):
   GitHub backup email + 2FA codes; claude.ai + console.anthropic.com login
   method; Inkbox console login method.
5. **Apply `db/sql/0003` via D1 dashboard console** (wrangler
   `d1 execute --remote` has failed before with auth code 10000 — the
   console is the proven path), **merge + deploy** the staged
   FOUNDER_EMAILS build, **sign in as btcmao518**, verify binding.
6. **Out-of-band heads-up to Ryan & Andrew** (phone/text, not email): old
   address locked; future mail from the new address; don't trust
   unverified "new email" claims. Ask Ryan to RE-SEND his 36-month
   blueprint — its only copy is inside the locked Gmail.
7. After verified sign-in: drop bankerrunners from `FOUNDER_EMAILS`
   (one-line change + redeploy) and run the doc sweep for live-instruction
   references (historical records stay untouched).

## §A — Cloudflare email swap runbook (presence-probe)

Phase 0: confirm btcmao518 has NO existing Cloudflare user (private-window
"forgot password" probe → want "no account found").
Phase 1: My Profile → Change email → btcmao518 + current password →
verification link arrives at the NEW inbox. If the flow demands the OLD
(locked) inbox: STOP, open a support ticket from inside the logged-in
dashboard. Then log out/in as btcmao518; confirm account id
`e6f9d0a344a0a7b317601ffbe23f871e` and Workers/D1/R2 unchanged.
Phase 2 hardening: new password; enable 2FA + save backup codes offline;
API-token inventory + roll the Global API Key; Members list = just you;
billing card valid (R2 depends on it); Access policy: ADD btcmao518,
REMOVE bankerrunners (locked inbox = dead weight at the edge; in-app
fallback unaffected); `npx wrangler whoami` after the swap — if it errors,
`wrangler logout` + `login` as btcmao518.
⛔ NEVER touch "Change your workers.dev subdomain" — it renames every
worker URL and breaks OAuth redirect + Access + every installed PWA.
Residual risk (flagged honestly): the operation remains a single-member
Cloudflare account; adding a second Super Administrator is an open
governance question for the owner.

## §B — Backup runbook (test-gaps) — condensed commands

PII rule (F2): D1 export + Access screenshots contain member emails →
OUTSIDE the repo, never committed, never in chat, NOT Google Drive
(locked). Backup homes tonight: this PC + USB and/or OneDrive.

```powershell
cd C:\dev\core-platform-site
$BK = "C:\dev\CORE-BACKUP-2026-08-17"
New-Item -ItemType Directory -Force -Path "$BK\r2" | Out-Null
# 1. D1 export (proven path; 08-15 baseline was 193,967 bytes — tonight ≥ that)
npx wrangler d1 export site-creator-d1 --remote --output="$BK\d1-backup-2026-08-17.sql"
(Get-Item "$BK\d1-backup-2026-08-17.sql").Length
Select-String -Path "$BK\d1-backup-2026-08-17.sql" -Pattern "CREATE TABLE" | % Line
# 2. Restore drill (local scratch, touches nothing live)
npx wrangler d1 execute site-creator-d1 -c dist\server\wrangler.json --local --persist-to "$BK\restore-drill" --file="$BK\d1-backup-2026-08-17.sql"
npx wrangler d1 execute site-creator-d1 -c dist\server\wrangler.json --local --persist-to "$BK\restore-drill" --command "SELECT COUNT(*) FROM portal_members; SELECT COUNT(*) FROM audit_events;"
# 3. R2 — wrangler has NO `r2 object list`; enumerate calls/ from D1,
#    music/ from the dashboard listing, then per key:
#    npx wrangler r2 object get "site-creator-r2/<key>" --remote --file "$BK\r2\<key>"
#    Verify: zero zero-byte files; one recording + one track actually play.
# 4. Repo bundle independent of GitHub (GitHub also points at locked email)
git bundle create "$BK\core-platform-site-ALL.bundle" --all
git bundle verify "$BK\core-platform-site-ALL.bundle"
# 5. Secrets: names only — values are write-only; re-mint sources:
npx wrangler secret list -c dist\server\wrangler.json
#    GOOGLE_* → new client under btcmao518 (old pair dead with account)
#    SESSION_SECRET → regenerate any time (signs everyone out, nothing else)
#    ANTHROPIC_API_KEY → console.anthropic.com (optional; 503 if absent)
# 6. Access config is NOT in the repo — screenshot the Zero Trust app +
#    every policy rule + team name tonight; store in $BK (PII).
# 7. Second copy off this machine (USB / OneDrive; never Google Drive).
```

Do-NOTs: no drizzle/ migrations against live (two-paths trap); no secret
rotation "as backup"; no frozen-snapshot dirs; no values in chat/commits.

## §C — Blast-radius map (data-model) — ranked

1. OAuth client → ALL sign-ins (CRITICAL, breaks now; cliff ~08-23).
2. Cloudflare account email + Access policy (HIGH; §A defuses).
3. GitHub `bankerrunners` (HIGH latent — add live backup email, download
   2FA recovery codes, confirm non-Google password TONIGHT while signed in;
   repo content itself safe: 4 copies).
4. claude.ai / console.anthropic.com — the AI staff's own home (HIGH if
   Google-SSO; verify login method tonight).
5. Gmail/Drive connectors (dead now; re-authorize under new identity later).
6. Portal owner identity + founder gates (half-mitigated: 0003 + 
   FOUNDER_EMAILS staged; needs console apply + deploy + sign-in proof).
7. Drive backup copy + Gmail history (MEDIUM: Ryan's 36-month blueprint
   exists ONLY in the locked Gmail thread — ask Ryan to re-send; re-share
   WORKFORCE.md from the new account).
8. Partner trust (MEDIUM: out-of-band heads-up BEFORE new-address mail).
9. Inkbox console login/billing email (MEDIUM-LOW: verify method).
10. NumberBarn (NEGLIGIBLE: Proton-registered; lapse already decided D2).
11. Audit trail + historical rows (NONE — never rewrite, ever).
12. Doc references (COSMETIC: live-instruction sweep AFTER sign-in proof;
    historical records untouched).
13. workers.dev subdomain name (COSMETIC: defer to custom-domain decision).
14. core-main.com Workspace (healthy landing zone; NOT the portal identity
    — btcmao518 is, by owner order; no member row for yuxiang@ without a
    fresh order).

## Option B (fresh account) — held as tested contingency

Full sequencing lives in the fleet report (deploy-integrity lane,
2026-08-17). Trigger conditions: the email swap is refused by Cloudflare's
flow, Cloudflare-account compromise is suspected (no evidence today), or an
owner clean-slate order accepting the churn. First move if triggered: mint
the new Google OAuth client against the NEW url so the client is built once.
Insurance already taken under §B (D1 export + R2 pull + bundle).
