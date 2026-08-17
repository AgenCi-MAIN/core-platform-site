# Commissioner's Charter — Tournament re-runs & Release 3.0.0
# (Issued by MAIN of the old account — "old HQ" — at the owner's order, 2026-08-17)

The owner has ordered: (1) re-run Tournaments 1 and 2 on the new HQ,
UNCAPPED TOKENS; (2) the old-HQ MAIN holds the seat of JUDGE AND
COMMISSIONER for these re-runs; (3) a Total Upgrade — Release 3.0.0.

## The Commissioner's seat

While the old account lives (≤ ~Sep 10), the owner relays each tournament's
results to old HQ, which renders the verdicts personally. After the old
account dies, THIS CHARTER is the Commissioner — the standards below bind
the re-runs exactly as if the old MAIN were reading them. The new MAIN
executes and administers; VERITY scores; the Commissioner's standards judge.

## Re-run charter — Tournament 1 (platform-marathon-audit)

- Same shape as the original: full-platform adversarial audit, every lane
  fielded per its migration card, subs per standing slots. UNCAPPED tokens
  (owner order — spend still lowers a lane's own production-per-token score;
  the economics ARE the cap).
- **Baselines to beat (the original round, 2026-08-15):** 11 agents, ~877K
  tokens, 18 ranked findings, platform judged security-clean, 2 sub grants
  earned. Champion benchmark: presence-probe's #1 finding at 2nd-leanest
  spend (59K vs 81K median).
- **Judging standard:** production per token, confirmed findings only —
  a claim unverified against real code scores ZERO. Honest clean sheets
  score (authz-matrix's T1 clean sheet at 91K was retained on assurance
  value — that precedent stands). New-vs-old comparison is the point:
  the platform has since shipped the call-review surface, the founder
  migration, and 55 pinned tests — a re-run that finds LESS than 18 may
  simply mean the platform got better; the Commissioner judges finding
  QUALITY against today's smaller attack surface, not raw count.

## Re-run charter — Tournament 2 (forward-build-fleet)

- Same shape: forward-build docket, ranked by build-readiness. UNCAPPED.
- **Baselines:** 13 agents, ~1.21M tokens, 12-item ranked docket, 5
  ready-to-build, 0 sub grants (the bar held). Champion benchmark:
  SUB-deploy-verifier's refutation of its own lead (50.1K, leanest ever).
- **Judging standard:** a docket item scores only if it names files, risks,
  and a verifiable definition of done. The 3.0.0 scope (below) should
  consume this docket — T2's output is 3.0.0's input.
- **Sub grants:** the original bar stands — grants for production that
  changes the plan, not production that fills pages.

## Release 3.0.0 — Total Upgrade (scope contract)

3.0.0 is the REBORN-OPERATION release: everything 2.0.0 was, re-rooted on
the sovereign identity, plus the shipped-but-unversioned work and the held
docket. Candidate scope (new MAIN drafts the release plan; owner approves
scope before build):

1. Identity: btcmao518 founder gate (shipped), migration records, the
   account rebirth — versioned and named.
2. The $5M plan integration: portal surfaces begin serving the plan's
   scoreboard (the weekly founder metrics from
   strategy/2026-08-17-founder-operating-plan-12mo-5m.md §05).
3. T2 docket ready-to-builds + the standing engineering debt: post-deploy
   version verification (deploy-integrity's design, docketed 08-16),
   recording Range support and composite indexes (both surfaced in the
   08-16 call-review audits but CHAT-SOURCED — the T2 re-run must
   re-verify and itemize them before they count as established scope),
   db/sql/0004 discipline (never edit applied migrations again).
4. Routine roster 2.0: the ten routines live on the new account, the two
   Cowork artifact-refreshers rebuilt, MAILKEEPER's label map remade.
5. Version bump 2.0.0 → 3.0.0 (package.json, PWA manifest, portal title),
   RELEASE-3.0.0.md in the 2.0.0 release-note tradition.
6. HARD EXCLUSIONS (unchanged law): the LeadTech socket stays HELD pending
   counsel (E7); nothing from the plan's "Not Now" list; deploys remain
   owner-machine-only; every leash in CLAUDE.md survives the version bump.

## Succession clause

On the old account's death, the office of MAIN passes fully to the new HQ —
including the Commissioner's seat for all FUTURE tournaments. These re-runs
are the last the old MAIN judges. The record is the asset; the judge was
always replaceable.

— MAIN (old HQ), by the owner's order, 2026-08-17

## Tournament 3 (re-run era) — THE COMMAND CENTER BUILD (owner order, 2026-08-17)

The first construction tournament. The prize artifact: the **Founder's
Command Center** — `/portal/command`, a founder-only cockpit (gated by
`requireFounder`, exactly like the audit log) with a Talk-to-HQ deep link,
launcher grid (Routines, Mr.T desk, repo, D1 console, Cloudflare), and live
status tiles computed from what the portal already knows (roster count,
last deploy, suite count, open OWNER-DECISIONS items) — plus `/go/*`
founder-gated redirect shortcuts (`/go/hq`, `/go/routines`, `/go/desk`).

**Format — competing builds, not one build:** two or three build squads
(drawn from the lanes per their cards; frontend-pwa and authz-matrix
mandatory reviewers in every squad's chain) each produce a COMPLETE
implementation on its own branch. VERITY scores production-per-token; the
Commissioner judges the builds head-to-head; the owner approves the winner;
only the winning branch merges — after the full suite passes with NEW tests
pinning the founder gate on every added route.

**Hard laws of the build (a summons cannot waive):**
1. Every new route founder-gated: `requireFounder` on `/portal/command` and
   every `/go/*` — pinned by tests in the same PR, added to
   PROTECTED_ROUTES.
2. No new capabilities in ROLE_CAPABILITIES — this is founder-identity
   surface, not a role grant (the audit-log precedent).
3. No deploy from any agent — the owner ships the winner from his machine.
4. The service worker must NOT cache any of it (extends the /portal rule).
5. NO embedded or simulated HQ chat: "Talk to HQ" is a deep link into the
   real claude.ai session. Anything that fakes an HQ chat inside the portal
   is disqualification — impersonation is the one unforgivable build sin.
6. The Presence stays inert — no wiring the pet to anything.
7. Timing: T3 fires only after the owner approves the 3.0.0 scope (the
   Command Center is 3.0.0's flagship item, built first).

## THE SITE OPERATIONS COMMISSION (owner order, 2026-08-17)

**Principle:** standing operational duty is EARNED, not assigned. The **top 2
agents by VERITY production-per-token across the T1/T2 re-runs** (confirmed
by the Commissioner's verdicts) are seated as the operation's 24/6 site
operators. Current holders pending verdicts: THE WARDEN and PERSONA (the
champions of record). If the re-runs crown new champions, the seats follow
the scores — that is the whole point.

**The two seats (each a 24/6 HOURLY routine on the new account —
Mon–Sat around the clock; Sunday is the maintenance window, no runs):**

**SEAT 1 — SITE STEWARD (hourly, :10 past).** The platform side.
Each run, against bankerrunners/core-platform-site + the portal's records:
check the suite state on main, deploy staleness (last recorded deploy vs
latest merge — flag if main is ahead of live), open PRs needing the owner,
roster/audit-log anomalies surfaced by the day's records, OWNER-DECISIONS
items that unblocked. Output: a punch-list delta — ONLY what changed since
the last run; quiet run = one line. Escalate by push notification ONLY for:
live-site-impacting findings, security-class anomalies, or a deadline
within 48h (Sep 11 billing, Sep 13 YouTube, contract expiries).

**SEAT 2 — OPS ANALYST (hourly, :40 past).** The people-and-signals side.
Each run: sweep HERALD's latest log entries for unactioned human outreach,
WARDEN reply-drafts awaiting the owner's word, the Mr.T desk backlog,
partner-thread staleness (Ryan/Andrew items open >48h), and refresh the
Attention Board 2.0 artifact if stale. Output: a signals brief — who is
waiting on the owner, for what, since when. Same escalation bar.

**Laws of the seats:** propose-never-dispose (no sends, no merges, no
deploys, no membership, no spend — punch lists and drafts only); every
CLAUDE.md leash applies; deltas not repetition (an agent that re-reports
yesterday scores zero for it); VERITY audits the seats monthly against
production-per-token; the Commissioner (or the charter, in succession) may
recommend reseating; the OWNER may reseat, suspend, or retire the seats at
a word. Sunday silence is absolute — the maintenance window belongs to the
owner. Token cost is real (48 runs/day combined): the owner may thin
cadence to 2-hourly at any time with no governance change.

**Seating procedure:** after Prompt 4's verdicts, the new HQ creates both
routines with the seat specs above as their prompts, naming the two
verdict-crowned agents in each routine's opening line ("You hold SEAT 1 of
the Site Operations Commission as [AGENT], earned by [score]...").
