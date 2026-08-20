# Switchboard fleet — verified integration bundle (2026-08-19)

The complete synthesis of the 22-agent fleet fielded on the founder's order
("spawn at least 20 …"): 11 draft lanes, 9 refute-first verifiers, a
completeness critic, and a synthesis lane. 22/22 reported, zero errors,
all nine clusters PASS_WITH_FIXES; ~1.06M tokens. Verifier corrections are
applied in-text; kills are dropped; every surviving uncertainty carries a
VERIFY-ON-DOCS / VERIFY-ON-SCREEN / confidence label. Law-adjacent content
throughout is informational, not legal advice — counsel confirms (E7b).

The founder-facing rendering is the Switchboard artifact v0.3; this file is
the durable source. The six integration gaps the critic named were closed
by MAIN at integration (console preview reconciled to spec; counsel packet
merged to eleven questions; runbook steps added for media-URL auth and the
balance alert; day-one stubs surfaced) — except the budget-spend sensor,
which remains an open PLAN gap, stated in the artifact.

---

INTEGRATION BUNDLE FOR ARTIFACT v0.3 — synthesis of verified cluster outputs, 2026-08-19. All verifier CORRECTIONS applied in-text; all KILLS dropped. Honesty stamps preserved. Law-adjacent content throughout: informational, not legal advice — counsel confirms (E7b).

═══════════════════════════════════════════════════════════════════
[LAW-DIRECTION]
═══════════════════════════════════════════════════════════════════

INFORMATIONAL, NOT LEGAL ADVICE — E7b COUNSEL CONFIRMS. Orientation for a configuration decision only; nothing turns on before counsel signs the wording (A29).

## 1. All-party ("two-party") consent states — telephone calls

FACT — settled core, treat as all-party:
- California — HIGH. Strictest; its Supreme Court applies it to interstate calls with a CA party (Kearney v. Salomon Smith Barney).
- Florida — HIGH.
- Illinois — HIGH. Post-2014 statute reaches only surreptitious recording of private conversations — an announced recording is doubly outside it.
- Maryland — HIGH.
- Massachusetts — HIGH (bans secret recording; announced recording is permitted).
- Montana — HIGH (all-party "knowledge" — notification suffices).
- New Hampshire — HIGH.
- Pennsylvania — HIGH.
- Washington — HIGH (statute expressly says a recorded announcement at the start establishes consent — RCW 9.73.030(3)).

Nuanced — one line each; treat CT, DE, MI, NV, VT as all-party out of caution. OR and HI appear only to preempt mislisting — they are one-party for phone calls:
- Connecticut — MEDIUM: criminal statute is one-party, but a separate civil statute (§ 52-570d) imposes liability for recording phone calls without all-party consent or notice.
- Delaware — MEDIUM: the wiretap act's consent exception reads one-party (11 Del. C. § 2402(c)(4)), but the separate privacy statute (11 Del. C. § 1335(a)(4)) forbids intercepting a private communication without all-party consent, and the two have never been reconciled; a federal court (United States v. Vespe) has treated Delaware as one-party. Unresolved — treat as all-party. (VERIFY-ON-DOCS for exact citations.)
- Michigan — MEDIUM: statute reads all-party, but state courts have held a participant in the call may record; unresolved.
- Nevada — HIGH for the operative conclusion: treat phone recording as all-party per Lane v. Allstate (Nev. 1998), a state supreme court holding standing ~28 years; the residual uncertainty is only the statute-text/case-law mismatch.
- Vermont — LOW: no recording statute at all; case law unsettled.
- Oregon — MEDIUM: all-party notice applies to in-person conversations; phone calls are one-party — often mislisted as two-party, and NOT all-party for this use.
- Hawaii — MEDIUM: one-party for calls; its all-party rule covers installing devices in private places (noted to preempt confusion).

Missing-state check — FACT (HIGH): no all-party state is missing; the two lists jointly cover every jurisdiction credibly claimed as all-party. Optional LOW note: Puerto Rico (not a state) has constitution-based privacy doctrine sometimes read as all-party — mooted anyway by the announcement-first design.

VERIFY-ON-DOCS: statutes get amended; counsel confirms this list as of go-live.

## 2. The inbound-line rule

FACT (HIGH): Playing a recorded-line announcement before any human joins, and recording only callers who stay on, is the standard implied-consent configuration for business lines. A literal statutory safe harbor exists only in Washington (recorded-announcement provision) and Connecticut (civil-statute notice option); everywhere else this is a strong implied-consent position, not immunity.

FACT (HIGH): The strictest states expressly endorse announcement-based consent — Washington by statute (RCW 9.73.030(3)), Connecticut's civil statute by its notice option (§ 52-570d), and California's Supreme Court said in Kearney that advising callers at the outset brings a business into compliance.

ASSUMPTION (MEDIUM-HIGH): Continuing after a clear announcement establishes consent in every remaining all-party state — a caller who is clearly told and continues is generally treated by courts as having consented. This is widely accepted practice, not squarely adjudicated everywhere; confirming the generalization is exactly counsel Question 1 (E7b).

Timing: consent exists before the first recordable word is spoken, and one configuration satisfies the strictest standard everywhere, so no per-state logic is needed for consent; retention and insurance-code duties (Questions 4–5) may still vary by state.

Limits: the announcement must be audible and comprehensible and must actually precede recording (capture that starts at ring, before the announcement plays, is not covered); it does not cover a transfer to a call leg where the announcement never played, an outbound call-back, or a caller who explicitly objects but stays on. FACT (HIGH): all-party means our own agent on the line is also a party whose consent must exist — the caller-facing announcement does not supply it. ASSUMPTION (HIGH): a written employee/agent acknowledgment at onboarding is the normal cure — counsel Question 6. ASSUMPTION (MEDIUM): the objection case needs a scripted stop-recording path — counsel confirms (Question 3).

## 3. Interstate calls

FACT (HIGH): Federal law is one-party but does not preempt stricter state law, and both the caller's state and the answering state can assert jurisdiction — California has explicitly applied its all-party rule against an out-of-state recorder (Kearney). On an inbound line the caller's true location is unknowable (mobiles, ported numbers, VoIP), so complying with the strictest state on every call is the lowest-risk configuration available; no configuration removes all risk — a failed announcement, an unannounced transfer leg, or a duty outside wiretap law can still create exposure. The announcement-first design delivers strictest-state compliance at near-zero cost.

## 4. Seven questions counsel must answer (E7b) before recording turns on (A29)

1. Is our exact announcement wording sufficient to establish implied consent in every all-party state, including California and Washington?
2. Must the announcement replay after a hold, a transfer, or a second person joining, or does one announcement at answer cover the entire call?
3. If a caller objects to recording mid-call, must we stop recording, delete what was already captured, or both — and what should the agent be scripted to say?
4. Do life-insurance-specific rules (state insurance codes, health information discussed on underwriting calls) add consent, disclosure, or retention duties beyond wiretap law?
5. Does our custody design — Twilio capture, pull-to-R2-then-delete-from-Twilio (A25), in-account transcription — meet state retention and deletion expectations, and what retention period should we set?
6. Does the agent/employee side of each call need separate documented consent, and is an onboarding acknowledgment sufficient?
7. Does transcription or any voice analytics (Workers AI @cf/deepgram/nova-3) trigger biometric or health-data statutes — Illinois BIPA (740 ILCS 14), Texas CUBI, Washington My Health My Data — given health information on underwriting calls? (ASSUMPTION MEDIUM that plain transcription is not a voiceprint under BIPA; the question is cheap and the downside is not.)

Cross-reference (GAPS item 3): the final E7b counsel packet must also fold in the announcement-lane questions ("recorded or monitored," "and may be transcribed," opt-out partial deletion) and the mechanics-lane record-start-timing question — one merged list is the deliverable.

INFORMATIONAL, NOT LEGAL ADVICE — E7b COUNSEL CONFIRMS.

═══════════════════════════════════════════════════════════════════
[ANNOUNCEMENTS]
═══════════════════════════════════════════════════════════════════

RECORDED-LINE ANNOUNCEMENTS — 3 CANDIDATES FOR COUNSEL (E7b)
Informational, not legal advice — counsel confirms (E7b).

FACT: Per A29, recording stays OFF until counsel approves wording. PLAN (design intent, not current behavior): each variant is intended to play as the inbound greeting, before any human joins (posture: receiving-first, inbound only). FACT (HIGH, Twilio platform behavior): the account is a new free trial created today, and trial accounts prepend Twilio's own preamble to inbound calls before any TwiML runs — until upgrade, callers hear Twilio's voice first. Do not let counsel or the owner evaluate timing or first impression off a trial-account test call.

PLAN (A29 sequencing): a recording-notice greeting deploys only when recording flips ON; playing "this call may be recorded" on a never-recorded line is its own counsel question. Until then the live greeting omits the recording sentence.

PLAN (record-start timing): when recording eventually turns ON, configure capture to begin only after the announcement completes — recording that starts at answer captures the caller's first seconds before the notice finishes, the classic all-party-consent trap — or put the timing question to counsel explicitly.

PLAN (transfer legs and callbacks): the greeting covers leg one only; notice/consent state must travel to any transferred or conferenced leg (dialer_transfers exists and calls may hand off), and a callback is a new call with no announcement played.

ASSUMPTION (MEDIUM): timings assume ~150 wpm natural IVR pace.

VERIFY-ON-DOCS / for counsel: whether "THRIVE" alone satisfies entity-identification rules (legal name/DBA); whether implied consent ("by staying on the line") suffices in all-party-consent states; whether "recorded" should read "recorded or monitored" (live QA/coaching listening is monitoring, not recording); whether AI transcription (Workers AI nova-3, per A25) needs "and may be transcribed" — one word each now is cheaper than re-recording prompts later.

--- 1. SHORT — DRAFT — FOR COUNSEL, NOT IN USE ---
Exact words: "Thank you for calling THRIVE. This call may be recorded. Please hold while we connect you."
16 words; est. 7–8 seconds.
Does: gives recording notice before any human joins; names the company; contains no coverage promises, rate claims, or pressure.
Does not: state a purpose, capture express or implied consent, or offer an opt-out; likely thin for strict all-party-consent states.

--- 2. STANDARD — DRAFT — FOR COUNSEL, NOT IN USE ---
Exact words: "Thank you for calling THRIVE, a life insurance agency. This call may be recorded. By staying on the line, you consent to recording. One moment while we connect you."
29 words; est. 12 seconds.
Does: notice plus implied-consent-by-continuation language, and identifies the business type plainly; still neutral, no sales content.
Does not: state a recording purpose or offer an opt-out; implied consent is jurisdiction-dependent — counsel confirms.

--- 3. THOROUGH — DRAFT — FOR COUNSEL, NOT IN USE ---
Exact words: "Thank you for calling THRIVE, a life insurance agency. This call may be recorded for quality assurance and training purposes. By remaining on the line, you consent to being recorded. If you prefer not to be recorded, just tell the person who answers, and we will turn recording off. One moment, please."
52 words; est. 20–21 seconds.
Does: notice, stated purpose, implied consent, and a live opt-out — ASSUMPTION (MEDIUM): the most protective of the three drafts.
Does not: work unless the opt-out is operationally real. PLAN: before this variant goes live, agents need a one-tap stop-recording control tied into the existing consent-gated pipeline (dialer_transfers / CALL_RECORDINGS / A23, A25), or the sentence is a false promise. Additionally: honoring "turn recording off" still leaves the already-captured opening seconds in R2 — counsel says whether opt-out requires discarding the partial. VERIFY-ON-DOCS.

All three end with a neutral hold/connect line; none mention coverage, rates, or urgency.

═══════════════════════════════════════════════════════════════════
[COMPLIANCE]
═══════════════════════════════════════════════════════════════════

# Inbound Life-Insurance Call Compliance Checklist
*Informational, not legal advice — counsel confirms (E7b).*

## 1. State licensing — who may talk
- FACT (HIGH): Soliciting, negotiating, quoting, or selling life insurance requires a producer license in the CALLER's state (resident or non-resident line). The call arriving inbound does not change this — jurisdiction follows the consumer.
- PLAN: Route every quote/recommendation conversation only to an agent licensed in the caller's state; capture caller state before substance. Verify non-resident licenses via NIPR before go-live.
- Caller-state capture gotcha: area code and caller ID do NOT establish the caller's state (number portability), and licensing generally keys to the applicant's residence/application state, not where they are standing. Ask and log state of residence verbally before substance; never infer from the number.
- ASSUMPTION (MEDIUM): Unlicensed staff may greet, take name/callback number, schedule, and transfer, and may not quote premiums, compare products, recommend coverage, discuss suitability, or take applications — but the exact scope of permitted clerical talk varies by state; counsel confirms the script line (E7b).
- FACT (HIGH, verified against GRANDPLAN.md:93 and CAPABILITY-JOURNAL.md:22): approved call language is capability-gated (`scripts.manage`: owner/admin/reviewer; deliberately denied to manager per the A16 parenthetical — the Nate-reinstatement row — and to agent/support). The licensed/unlicensed boundary belongs in the approved script, not agent memory.
- ASSUMPTION (MEDIUM): Most states also require a business-entity license (resident + non-resident) for the agency itself, beyond individual producers. VERIFY-ON-DOCS via NIPR alongside the individual-license check.

## 2. TCPA posture — inbound is the safe direction
- FACT (MEDIUM, deliberately softened): TCPA restricts calls/texts the business ORIGINATES (autodialed/prerecorded/artificial voice, and DNC for solicitations). It does not restrict answering a consumer-initiated call; house posture is receiving-first, inbound only — the compliant-by-design direction. Note: state mini-TCPAs (e.g. Florida's FTSA — relevant given FL-based partners) are outbound-side landmines for any future callback program. VERIFY-ON-DOCS.
- Doctrine, stated cleanly: a manual, human-dialed callback implicates neither ATDS nor prerecorded-voice rules at all. The inquiry EBR (~3 months) is a DNC-REGISTRY exception (TSR/FCC), not a TCPA consent basis — it is what permits calling back a DNC-registered number. Using an autodialer or prerecorded/AI voice for a callback raises the bar toward prior express (or prior express written) consent.
- PLAN: Callbacks are human-dialed, one-off, promptly after the missed call, logged in `dialer_transfers` with the originating inbound call referenced as the basis. No automated outbound of any kind without a separate owner decision.

## 3. Do-Not-Call — the fair-game trap
- FACT (MEDIUM, softened): Federal DNC restricts outbound telephone SOLICITATIONS; it does not restrict answering — an inbound caller on the registry may be answered and served.
- FACT (MEDIUM): The inquiry creates only a limited window (inquiry EBR ~3 months; a purchase extends it ~18 months under FTC TSR). The trap: treating one inbound call as standing permission for later marketing campaigns — once the window lapses, a registered number is off-limits again, and "they called us once" is not a defense.
- Day-one need (not a future-campaign artifact): an inbound caller who says "never contact me again" creates an entity-specific do-not-call demand that must be honored and logged NOW, even with zero outbound program — an internal DNC flag on the `dialer_transfers` row or equivalent. (See GAPS item 6: storage location needs an owner-decision line or schema stub.)
- PLAN: No outbound campaign list is ever built from inbound caller IDs. Any future outbound program is its own governance decision with scrubbing, an internal DNC list, and counsel sign-off (E7b).

## 4. Record-keeping norms
- FACT (MEDIUM): Insurance sales-call norms: who called, when, caller's state, agent (and license) who handled substance, disposition, any recording plus its consent basis, and any quote/application discussed.
- FACT (HIGH, knowledge-based; VERIFY-ON-DOCS against the current 16 CFR 310.5): the FTC's 2024 TSR amendments extended recordkeeping to FIVE YEARS for most records (effective Oct 2024). Note the TSR is substantially exempt for purely inbound calls answering general advertising — a weak anchor for an inbound-only posture; state insurance record rules often run longer and are the real driver.
- Recording-contents gotcha: life-insurance calls capture health details, SSNs, bank details (A25 already worries about spoken bank details). Recordings in R2 are GLBA/state-privacy-regulated records; if card payments are ever taken on a call, PCI-DSS expects pause-recording.
- FACT (HIGH, house record): Infrastructure exists: `dialer_transfers` (D1), `CALL_RECORDINGS` (R2, pull-from-Twilio-then-delete custody, A25), consent-gated playback, per-role review rights (A23), append-only `audit_events`. Recording stays OFF until counsel approves announcement wording (A29/E7b).
- PLAN: Log every inbound call as a row even when unrecorded — the metadata record is the compliance record.

## 5. Carrier retention caveat — standing ask (A24)
- FACT (HIGH, house record): Company policy is two-year retention of recordings/transcripts (A24), but carrier agreements may require holding call records LONGER. The standing ask stands: Aetna, Corebridge, Occidental, and Transamerica each get the question directly, and the governing period is the LONGEST of (carrier contract, caller's-state law, the two-year house policy).
- PLAN: No purge job runs until the four carrier answers land and a `legal_hold` mechanism exists — scheduled deletion over a call under litigation is spoliation (A24).

═══════════════════════════════════════════════════════════════════
[MECHANICS]
═══════════════════════════════════════════════════════════════════

FACT (repo-verified): `dialer_transfers` already carries `transfer_id` (unique index), `external_call_id`, `consent_status` (default `pending`), `recording_object_key`, `recording_mime_type`, and status/direction checks (/home/user/core-platform-site/db/schema.ts:165-207). FACT (repo-verified, corrected): the `CALL_RECORDINGS` R2 binding accessor in /home/user/core-platform-site/app/portal/calls/storage.ts is READ-ONLY by type — `RecordingBucket` exposes only `get()` (storage.ts:10-12); the custody PUT requires a widened server-only accessor. storage.ts itself returns null on a missing binding; the fail-closed 503 lives in the callers.

## 1. Webhook signature validation (spec confirmed against twilio.com/docs/usage/security, fetched 2026-08-19)

- FACT (HIGH): `X-Twilio-Signature` = Base64( HMAC-SHA1( key = Twilio Auth Token, message = the full public webhook URL exactly as configured — scheme, host, port, path, query — with every POST form parameter appended, sorted alphabetically by name, as name+value pairs with no delimiters ) ). GET requests sign the URL alone. JSON bodies instead add a `bodySHA256` query parameter (hex SHA-256 of the body) and sign only the URL; verify the body hash separately.
- PLAN: reconstruct the signed URL from a configured constant (secret NAME: `TWILIO_WEBHOOK_URL`, or derive from a fixed base), never from `Host`/`X-Forwarded-*` headers — the same never-trust-headers rule already load-bearing in this repo.
- FACT (HIGH): comparison must be constant-time. In Workers: `crypto.subtle.importKey`/`sign` then byte-wise XOR-accumulate compare (or `crypto.subtle.verify`). Never `===` on strings.
- PLAN on failure: respond 403 with a static body, write an `audit_events` row (path, timestamp, outcome only), echo nothing the caller sent — not the signature, not `From`, not any identity field. Same 403 for missing and invalid signature.

## 2. Recording custody (A25: pull-to-R2-then-delete) — corrected sequence

1. `recordingStatusCallback` (set on `<Dial record=...>` / `<Record>`) delivers AccountSid/CallSid/RecordingSid/RecordingUrl/RecordingStatus/RecordingDuration/RecordingChannels (+RecordingStartTime, RecordingSource) — CONFIRMED against docs (twiml/dial); events in-progress/completed/absent, default completed, default method POST. Validate signature, ack 200 fast, run custody via `ctx.waitUntil`/queue; Twilio's callback timeout is short (~15s — VERIFY-ON-DOCS). Handle RecordingStatus values other than `completed`: `absent` (call ended, no recording) and `failed` are deliverable — mark the row accordingly, no media fetch.
2. Idempotency (replaces the killed row-exists design): key on `RecordingSid` with an ingest-state predicate — conditional `UPDATE ... WHERE recording_object_key IS NULL` with a rows-affected check, or a dedicated recordings table with `UNIQUE(recording_sid)`. Never overload `transfer_id` with a RecordingSid. Rationale: the transfer row normally exists BEFORE the callback (created at transfer time), so "row exists → no-op" would wrongly no-op a replay arriving after a failed R2 PUT, and a unique-index-as-insert-arbiter never fires on the UPDATE path.
3. Race (explicitly in scope): the callback can arrive BEFORE the transfer row exists for that CallSid. Insert a provisional row, or park the payload for retry — never drop the event after acking 200; with waitUntil, Twilio will not retry for you.
4. Multiple recordings per CallSid (multiple `<Dial>` segments) vs one `recording_object_key` per row: policy must be stated. Recommended: the dedicated recordings table from step 2 — one row per RecordingSid — which resolves both the idempotency arbiter and the clobber risk in one structure.
5. Authenticated media fetch: GET `RecordingUrl` + `.wav`, HTTP Basic `AccountSid:AuthToken`. FACT (HIGH): media URLs are historically fetchable WITHOUT auth unless "Enforce HTTP Auth on Media URLs" is enabled — enable it on the new account DAY ONE. VERIFY-ON-DOCS whether new trials default it on.
6. PUT to R2 under `calls/` (e.g. `calls/{CallSid}/{RecordingSid}.wav`). Confirm durability by buffering and measuring the body, or by using R2 put's checksum option — do NOT compare to `Content-Length` (Twilio media responses may be chunked without one). (MEDIUM)
7. Only after a confirmed durable write: `DELETE /2010-04-01/Accounts/{AccountSid}/Recordings/{RecordingSid}.json` (expect 204 — HIGH, VERIFY-ON-DOCS).
8. Write/patch the row: `recording_object_key`, `recording_mime_type`, duration — RecordingDuration arrives as a STRING; parse before writing durationSeconds (duration_check >= 0). `consent_status` stays `pending` (recording defaults OFF until counsel approves wording — A29/E7b; informational, not legal advice — counsel confirms (E7b)).

Failure handling (corrected for the live CHECK constraint): DIALER_TRANSFER_STATUSES is exactly received|processing|ready|needs_review|failed (db/schema.ts:61-67, pinned by dialer_transfers_status_check) — invented literals like "fetch-failed"/"delete-pending" would violate it. Either map failures onto `failed`/`needs_review` with detail carried elsewhere (a detail column or the dedicated recordings table), or state the schema migration as an explicit step — hand-written db/sql path only; the live database used db/sql and the record forbids mixing migration paths. Media fetch 404 → `failed` + alert, no blind retry (recording may be gone). R2 PUT fails → do NOT delete at Twilio; retry, alert if exhausted. Twilio DELETE fails → `needs_review` + retry queue (cron/Queues) + alert. The portal NEVER serves audio from a Twilio URL — playback reads R2 only, through the existing consent-gated route (consent_status must be "verified" AND status "ready" — /home/user/core-platform-site/app/portal/calls/recording/route.ts:74-103, repo-verified). Any half-completed state is visible in the row, never silent.

## 3. Cloudflare Access seam

FACT: Access answers unauthenticated requests with a 302 to Google login before the Worker runs; Twilio cannot log in, sees HTML/redirect, marks the webhook failed. The ONLY workable seam is a Bypass policy (or excluding the path from the Access app) scoped to the exact webhook path (e.g. `/api/twilio/*`) — nothing wider. Service Auth is NOT viable: it requires CF-Access-Client-Id/Secret headers (or mTLS), and Twilio webhooks cannot attach custom headers (URL Basic auth only). The route then defends itself: POST-only, form-content-type check, signature validation as sole authentication, fail-closed 403 audited, no session/cookie logic. It can only WRITE transfer rows/objects and reads no member/identity data (it does read `dialer_transfers` for idempotency/patching), so a breach of this seam exposes no member data.

## 4. Trial-account bites

- FACT (HIGH from knowledge; VERIFY-ON-DOCS — help article unfetchable): inbound callers to a trial number DO hear Twilio's preamble and must press a key before TwiML runs — the receiving-first caller-experience test is corrupted on trial regardless; plan upgrade before any caller-facing test.
- FACT (HIGH): trial accounts can only dial OUT to verified caller IDs — and forwarding inbound via `<Dial>` to +1 409 549 2092 IS an outbound leg; that number is verified at signup.
- FACT (HIGH; VERIFY-ON-DOCS, Twilio "How does the free trial work"): inbound from arbitrary unverified callers IS accepted on trial.
- Upgrading removes preamble/keypress and the verified-only limit, keeps AccountSid/Auth Token; number retention across upgrade — VERIFY-ON-DOCS.

═══════════════════════════════════════════════════════════════════
[CONSOLE-SPEC]
═══════════════════════════════════════════════════════════════════

# SWITCHBOARD OWNER CONSOLE — specification (PLAN throughout unless labeled; informational, not legal advice — counsel confirms (E7b))

## Storage — one typed row (decision)
D1 table `switchboard_settings`, single row enforced by `id INTEGER PRIMARY KEY CHECK (id = 1)`. Typed columns, not key-value: the setting list is small, fixed, and each needs a distinct type and CHECK constraint, so typed columns let the database itself refuse invalid states and make the call-time read one `SELECT * WHERE id=1`. Key-value pushes all validation into app code and makes "row absent" indistinguishable from "key absent," which muddies the fail-safe logic that matters most here.

Columns:
- `id INTEGER PRIMARY KEY CHECK (id = 1)`
- `recording_enabled INTEGER NOT NULL DEFAULT 0 CHECK (recording_enabled IN (0,1))`
- `recording_counsel_cleared_at TEXT` — NULL until counsel clears the announcement wording (E7b); plus table-level `CHECK (recording_enabled = 0 OR recording_counsel_cleared_at IS NOT NULL)` so the database itself refuses the state A29 forbids.
- `answer_roster TEXT NOT NULL DEFAULT '[]'` — ordered JSON array of `{email, number}` pairs (ring order). NOTE: `portal_members` has no phone column (db/schema.ts:73-107) and no email→E.164 mapping exists anywhere; storing numbers in the roster JSON vs adding a member phone column is a governance/PII decision to record (see GAPS item 6).
- `hours_timezone TEXT NOT NULL DEFAULT 'America/Chicago'` (IANA name; founder is US-TX — ASSUMPTION MEDIUM, VERIFY-ON-DOCS)
- `hours_schedule TEXT NOT NULL` — JSON per-day windows, e.g. `{"mon":[["09:00","18:00"]],...}`; default Mon–Fri 09:00–18:00
- `after_hours_mode TEXT NOT NULL DEFAULT 'polite_message' CHECK (after_hours_mode IN ('polite_message','alternate_number'))`
- `after_hours_number TEXT` — E.164; NULL unless mode is `alternate_number`
- `number_strategy TEXT NOT NULL DEFAULT 'single' CHECK (number_strategy IN ('single','per_state'))`
- `budget_ceiling_cents INTEGER NOT NULL DEFAULT 2000 CHECK (budget_ceiling_cents > 0)`
- `budget_alert_percent INTEGER NOT NULL DEFAULT 80 CHECK (budget_alert_percent BETWEEN 1 AND 99)`
- `updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`, `updated_by TEXT NOT NULL`

## Controls

**1. Recording ON/OFF.** Toggle. Default OFF (FACT: A29 — off until counsel clears announcement wording). Validation: turning ON is blocked in the UI, the write path, AND the schema (`recording_counsel_cleared_at` CHECK above), so the toggle cannot outrun E7b. Fail-safe if unreadable at call time: fail OFF — an unannounced recording is a consent/legality harm that cannot be un-made; a missed recording is merely lost convenience. TwiML is generated per-call, so absence of a readable row simply omits `record`.

**2. Answer roster.** Multi-select with drag ordering, options limited to active `portal_members` (validated server-side on every save; suspended members rejected). Default: founder only (`btcmao518@gmail.com` → dial-through +1 409 549 2092). Empty roster is allowed but the console warns: calls then take the after-hours path — a deliberate "pause answering" lever. Fail-safe if unreadable: dial the founder's number (compiled constant), because receiving-first means a dropped inbound call is the worst outcome.

**3. Answering hours.** Weekly grid + timezone select. Timezone is an explicit IANA string validated by constructing `Intl.DateTimeFormat` (throw = reject); never stored as a UTC offset (DST). Windows validated as `HH:MM` pairs, start < end. Outside hours, default `polite_message`: Twilio `<Say>` a short courtesy line, NO VOICEMAIL — voicemail stores caller audio and would recreate the recording problem A29 defers — then hang up and log a `dialer_transfers` row with `status='missed'` so the portal inbox shows every missed call. SHIP-FIRST DEPENDENCY (FACT, HIGH): `'missed'` is not in DIALER_TRANSFER_STATUSES (db/schema.ts:61-67) and `dialer_transfers_status_check` rejects the INSERT — extend the status list via a NEW hand-written db/sql migration (the live DB used the db/sql path; never mix migration paths), then `npm run db:generate` for the type. Until that migration ships, after-hours calls would be silently unlogged — the exact failure the feature exists to prevent; ship the migration first. `alternate_number` mode `<Dial>`s `after_hours_number` (required non-null, E.164-validated, verified-caller-ID on the trial — FACT HIGH: Twilio trials only dial verified numbers). Fail-safe if unreadable: still answer with the COURTESY GREETING — never the A29 counsel-pending recording announcement — and log the call; fail-open to a greeting, never to silence, and never to recording.

**4. Number strategy.** Radio: `single` (default — one trial number today) vs `per_state`. Switching to `per_state` only marks intent; actual number purchases are separate budget-gated actions and blocked while `single`. Fail-safe: treat as `single`; inbound routing on existing numbers is unaffected either way.

**5. Budget ceiling.** Currency input (whole dollars, stored cents) + alert percent. Default $20.00 / 80% (ASSUMPTION LOW — trial credit ~$15 is its own hard stop; founder sets real value). Validation: ceiling > 0; alert 1–99%. Enforcement, defined precisely: at ceiling, block NUMBER PURCHASES and NEWLY ORIGINATED OUTBOUND CALLS only; the dial-through leg of an inbound call is EXEMPT — receiving-first means inbound answering is never cut off by budget, and that dial-through leg is itself billed outbound minutes, so exempting it is a deliberate choice. (The alternative — degrade to greeting-only at ceiling — is a founder-level choice if a hard cap is preferred; spec one, never both.) A scheduled usage check writes an `audit_events` row at the alert threshold. OPEN (GAPS item 4): how the Worker learns Twilio spend — Usage API poll vs usage-trigger webhook (the latter needing the Access bypass) — is unspecced; without a sensor the dial is unenforceable.

## Who may change — recommendation (corrected)
Mint capability **`switchboard.manage`** — do NOT reuse `calls.review`. FACT: `calls.review` is owner-role-only today (access.ts:75), but it is a READ capability whose obvious future holder is the role literally named "Reviewer / Coach" (ROLE_LABELS); granting it later would silently hand recording/budget/roster CONTROL to a coach. The leadership precedent does not apply: leadership/page.tsx:41-48 reused a guard because the tab lived behind the guard the page already had — a new page with new write powers is the opposite case. Add to `CAPABILITIES` (access.ts:33-61), `ROLE_CAPABILITIES` (access.ts:70-126), and CORE_PLATFORM_RECORD § 4.

FACT (HIGH): a capability on role `owner` is NOT a founder gate — the record lists four owner rows, three able to sign in (btcmao518, ryandavidson.zenith, andrew.davidson.zenith — the latter live and bound per A7; bankerrunners locked). The founder chooses, truthfully presented:
(a) owners-plural: the whole console, recording toggle included, behind `switchboard.manage` on role `owner`; or
(b) split gate: console behind `switchboard.manage`, but the recording toggle specifically behind `requireFounder` with its OWN action string (e.g. `"switchboard.recording"` — never the `"audit.view"` default; access.ts:594-604: "a wrong action here is a false statement nothing can retract later"), matching how A25/A29 were founder-signed decisions.
Either choice is its own governance ledger row (CORE_PLATFORM_RECORD § 4 / OWNER-DECISIONS).

Guard the console page with `requireCapability("switchboard.manage")`, every write with `assertCapability`.

## Audit row on every change (FACT: matches existing `audit_events` shape — AuditInput, access.ts:659-669)
- `action`: `"switchboard.manage"`
- `resource`: `"switchboard_settings.<column>"` (one row per changed field)
- `decision`: `"allow"` (denied attempts write `"deny"` with reason `"capability_not_held"` — the system's only deny reason for this condition, emitted by assertCapability at access.ts:646 and pinned by two tests; never a second spelling)
- `reason`: `"setting_changed"`
- `detail`: JSON `{"field","old","new"}` — settings contain no secret values. Phone numbers here are owner-supplied routing data, not caller PII, and /portal/audit is FOUNDER_EMAILS-gated (rendered-html 294 comment), so unmasked storage is defensible — ASSUMPTION (MEDIUM), owner may prefer masking; note `dialer_transfers` stores `caller_number_masked`, the house precedent for caller PII.

Fail-safe summary: recording → OFF; answering → answer + courtesy greeting + log; roster → founder; strategy → single; budget → block spend, keep answering.

═══════════════════════════════════════════════════════════════════
[INTEGRATION]
═══════════════════════════════════════════════════════════════════

SWITCHBOARD CONSOLE — INTEGRATION SPEC (all citations verified in-repo; guard corrected to the minted capability)

1. Where it lives
PLAN: `app/portal/switchboard/page.tsx` (page) + `app/portal/switchboard/*/route.ts` (writes). FACT: two sweeps force this placement: every `page.tsx` under `app/portal` must call a guard or be named in `UNGUARDED_BY_DESIGN` (tests/rendered-html.test.mjs:254-291), and every guard call must appear in `PROTECTED_ROUTES` (rendered-html.test.mjs:95, 197-205). The `returnTo` should be the double-quoted literal `"/portal/switchboard"` — the scanner parses double-quoted route literals (rendered-html.test.mjs:207-242) and, while it tolerates a template-literal returnTo when the static prefix is covered (rendered-html 224-231), the literal is the right choice for a static page. FACT: the Twilio webhook cannot live here — it arrives cookieless, so it goes outside `/portal` (e.g. `app/hooks/twilio/route.ts`), authenticated by Twilio signature + the Access bypass seam ([MECHANICS] §3), and still writes `recordAudit` rows.

2. Page guard — copy leadership's shape, with the minted capability
FACT, app/portal/leadership/page.tsx:49: `const session = await requireCapability("leadership.view.all", "/portal/leadership");`
PLAN: `const session = await requireCapability("switchboard.manage", "/portal/switchboard");` — capability minted per [CONSOLE-SPEC] (the reuse-`calls.review` option was killed as a governance hole). Adding a capability "is a governance decision and must be recorded in CORE_PLATFORM_RECORD.md § 4" (access.ts:66-69); it goes into `CAPABILITIES` (access.ts:33-61) and `ROLE_CAPABILITIES` (access.ts:70-126). `requireFounder` only if a founder-only pane exists (e.g. the recording toggle under option (b), or Twilio credential status) — and it must pass its own `action` string, never inherit the `"audit.view"` default (access.ts:594-605).

3. Writes re-resolve the session — copy members/manage exactly
FACT, app/portal/members/manage/route.ts:82-103, the full idiom:
```ts
const path = new URL(request.url).pathname;
const access = await resolvePortalAccess(path);
if (!access.ok) {
  return Response.json({ error: "Sign in required." },
    { status: access.denial.kind === "anonymous" ? 401 : 403 });
}
const { session } = access;
try {
  await assertCapability(session, "switchboard.manage", "switchboard_settings", path);
} catch { return Response.json({ error: "…" }, { status: 403 }); }
```
FACT: `assertCapability` throws instead of redirecting and audits allow AND deny (access.ts:635-657). PLAN: every switchboard write uses this shape with resource strings like `"switchboard_settings.<column>"` / `"dialer_transfers"` / `transfer:${id}`.

4. Adjacent surfaces — do not collide
- FACT: an availability toggle already exists at app/portal/inbound/availability/route.ts — self-service under `dashboard.view.self`, audit-stream-persisted. The console's ring-order roster is a different, owner-level control and must not absorb or re-guard that endpoint.
- FACT: `/portal/twilio` already exists, guarded by `leadership.view.all` (page.tsx:36) — owner/admin/manager all see it; do not link or merge the console there.

5. Pinned tests before ship
- Per-role refusal: loop guarded paths asserting 307 for each unentitled role, then check audit rows — pattern at tests/portal-authorization.test.mjs:494-504.
- Audit-write: refused write recorded EXACTLY once — pattern at portal-authorization.test.mjs:1240-1247; membership-write refusal pattern at 1359-1392. Deny reason asserted as `"capability_not_held"` (pinned at 503, 1248).
- Default-state: recording renders OFF (A29 — counsel-pending, so the default is the safety property); consent-gated playback closed to anonymous/forged/suspended with byteless bodies — pattern at 2028-2062.
- Forged-cookie: tampered/expired `core_session` is anonymous (1294-1325).
- Inverse-guard sweep (T4): add `"/portal/switchboard"` to `PROTECTED_ROUTES` (rendered-html.test.mjs:95) or the guard-first completeness scan fails; the T4-1 reverse net (246-291) then proves the page itself calls a guard.

Informational, not legal advice — counsel confirms (E7b) anything touching recording defaults.

═══════════════════════════════════════════════════════════════════
[COSTS]
═══════════════════════════════════════════════════════════════════

FACT (inputs given, all rates ESTIMATE — VERIFY AT twilio.com/pricing); ASSUMPTION (MEDIUM): every answered call carries two simultaneous legs — inbound caller leg plus outbound dial-through to the agent's phone — matching the receiving-first, dialer_transfers posture. All table figures verified arithmetically correct from their stated inputs.

## Formulas

```
per-min (no rec)  = inbound + outbound agent leg = 0.0085 + 0.0140 = $0.0225/min
per-min (rec)     = above + recording            = 0.0225 + 0.0025 = $0.0250/min
per 10-min call   = $0.225 (no rec) | $0.250 (rec)
monthly total     = numbers × 1.15 + calls × 10 × per-min rate
```

R2 storage: ESTIMATE — VERIFY AT cloudflare.com/pricing: even 5,000 recorded min/mo ≈ 2.5 GB at ~0.5 MB/min ≈ $0.04/mo at R2's ~$0.015/GB-mo. The negligibility CONCLUSION is HIGH — and likely stronger: R2's free tier is ~10 GB-mo, so 2.5 GB likely bills $0 (ESTIMATE, VERIFY-ON-DOCS).

## Scenarios (1 number, 10-min avg; all ESTIMATE)

| Calls/mo | Minutes | Voice (no rec) | Total (no rec) | Voice (rec) | Total (rec) |
|---|---|---|---|---|---|
| 20 | 200 | 200×0.0225 = $4.50 | +1.15 = **$5.65** | 200×0.025 = $5.00 | **$6.15** |
| 100 | 1,000 | 1000×0.0225 = $22.50 | **$23.65** | 1000×0.025 = $25.00 | **$26.15** |
| 500 | 5,000 | 5000×0.0225 = $112.50 | **$113.65** | 5000×0.025 = $125.00 | **$126.15** |

Rule of thumb: recording adds ~11% ($0.025/call); usage dwarfs rental past ~5 calls/mo (5×10×0.0225 = $1.125 ≈ $1.15).

## Per-state base (rental only, N × $1.15; ESTIMATE)

| Numbers (N) | 1 | 5 | 10 | 51 (all states + DC) |
|---|---|---|---|---|
| Base $/mo | $1.15 | $5.75 | $11.50 | 51×1.15 = **$58.65** |

Numbers are pure fixed cost — buy per licensed state only when call volume justifies it.

## Trial economics (credit ~$15 — ASSUMPTION MEDIUM, historically $15.50; VERIFY on account creation)

```
credit after 1 number:  15.00 − 1.15               = $13.85
10-min recorded calls:  13.85 / 0.250              = ~55 calls
10-min unrecorded:      13.85 / 0.225              = ~61 calls
2-min recorded tests:   13.85 / (2 × 0.025 = 0.05) = ~277 calls
```

FACT (HIGH): trial accounts dial only verified numbers — fine, since the dial-through target (+1 409 549 2092) gets verified at signup — and play a trial preamble on calls. The credit covers the whole test phase with large margin; real spend risk starts only after upgrading.

## Recommendation

PLAN: set the Twilio balance alert at 70% of whatever monthly ceiling the owner signs (e.g. $30 ceiling → alert at $21). The alert-to-ceiling gap is $30 − $21 = $9; at ~$26/mo per 100 recorded calls (~$0.87/day) that is ~10 days of normal volume to react before the ceiling is hit — less at higher volume.

═══════════════════════════════════════════════════════════════════
[UI-CONSOLE-FRAGMENT]
═══════════════════════════════════════════════════════════════════

Corrected per verifier (banner contrast/z-index fix; aria-live text-swap pattern; killed: .sw-note.sw-show rule + classList toggle + hardcoded note text, the #sw-ceiling aria-label, z-index:999). SYNTHESIS NOTE — unresolved by design, carried in GAPS item 2: this fragment still contradicts [CONSOLE-SPEC] (voicemail default vs the spec's no-voicemail rule, single-select roster vs ordered multi-select, $50 default vs $20, no alternate-number mode or counsel-gate affordance); MAIN must reconcile before v0.3 ships it.

```html
<!-- Switchboard SPEC PREVIEW fragment — self-contained; assumes page-level tokens: --ground --panel --panel-2 --ink --muted --gold --line --fact-green --plan-steel --open-amber -->
<style>
  .sw-wrap{font-family:'IBM Plex Sans',system-ui,sans-serif;color:var(--ink);max-width:64rem;margin:0 auto}
  .sw-banner{position:sticky;top:0;z-index:10;background:var(--ink);color:var(--ground);font-family:'IBM Plex Mono',ui-monospace,monospace;font-weight:700;font-size:.85rem;letter-spacing:.06em;text-transform:uppercase;text-align:center;padding:.7rem 1rem;border-bottom:3px solid var(--gold)}
  .sw-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(17rem,1fr));gap:1rem;padding:1rem 0}
  .sw-card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:1rem 1.1rem}
  .sw-card-title{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.75rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:0 0 .8rem}
  .sw-field{border:0;padding:0;margin:0}
  .sw-field legend{padding:0}
  .sw-sub{font-size:.8rem;color:var(--muted);margin:.5rem 0 0}
  .sw-note{font-size:.8rem;color:var(--open-amber);margin:.5rem 0 0;min-height:1.1em}
  .sw-label{display:block;font-size:.8rem;color:var(--muted);margin:.6rem 0 .25rem}
  .sw-input,.sw-select{background:var(--panel-2);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:.45rem .55rem;font:inherit;font-size:.9rem;max-width:100%}
  .sw-row{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center}
  .sw-toggle{display:inline-flex;align-items:center;gap:.6rem;background:var(--panel-2);border:1px solid var(--line);border-radius:999px;padding:.35rem .9rem .35rem .4rem;cursor:pointer;color:var(--muted);font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.85rem;font-weight:600}
  .sw-toggle-track{display:inline-block;width:2.4rem;height:1.3rem;border-radius:999px;background:var(--ground);border:1px solid var(--line);position:relative;transition:background .15s}
  .sw-toggle-knob{position:absolute;top:.08rem;left:.12rem;width:1.05rem;height:1.05rem;border-radius:50%;background:var(--muted);transition:left .15s,background .15s}
  .sw-toggle[aria-checked="true"]{color:var(--fact-green)}
  .sw-toggle[aria-checked="true"] .sw-toggle-track{background:var(--fact-green)}
  .sw-toggle[aria-checked="true"] .sw-toggle-knob{left:calc(100% - 1.2rem);background:var(--ground)}
  .sw-radio-row{display:flex;gap:.5rem;align-items:baseline;margin:.35rem 0}
  .sw-radio-row label{font-size:.9rem;cursor:pointer}
  .sw-radio-row.sw-picked label{color:var(--gold)}
  .sw-wrap input[type="radio"],.sw-wrap input[type="range"]{accent-color:var(--gold)}
  .sw-money{display:flex;align-items:stretch}
  .sw-money-prefix{font-family:'IBM Plex Mono',ui-monospace,monospace;color:var(--gold);display:flex;align-items:center;padding:0 .55rem;background:var(--panel-2);border:1px solid var(--line);border-right:0;border-radius:6px 0 0 6px}
  .sw-money .sw-input{border-radius:0 6px 6px 0;width:7rem}
  .sw-range{width:100%;margin:.4rem 0 0}
  .sw-alert-out{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.9rem;color:var(--gold)}
  .sw-state{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.75rem;color:var(--plan-steel);background:var(--panel-2);border:1px solid var(--line);border-radius:8px;padding:.6rem .8rem;overflow-x:auto;white-space:nowrap}
  .sw-wrap :focus-visible{outline:2px solid var(--gold);outline-offset:2px;border-radius:4px}
</style>

<div class="sw-wrap">
  <div class="sw-banner" role="note">SPEC PREVIEW — clicks change nothing in production. The real console ships in the portal, owner-gated and audited.</div>

  <div class="sw-grid">
    <section class="sw-card" aria-labelledby="sw-t-rec">
      <h3 class="sw-card-title" id="sw-t-rec">Call recording</h3>
      <button type="button" class="sw-toggle" id="sw-rec" role="switch" aria-checked="false" aria-describedby="sw-rec-sub">
        <span class="sw-toggle-track" aria-hidden="true"><span class="sw-toggle-knob"></span></span>
        <span id="sw-rec-state">OFF</span>
      </button>
      <p class="sw-sub" id="sw-rec-sub">OFF until counsel clears the wording (E7b)</p>
      <p class="sw-note" id="sw-rec-note" aria-live="polite"></p>
    </section>

    <section class="sw-card" aria-labelledby="sw-t-roster">
      <h3 class="sw-card-title" id="sw-t-roster">Answer roster</h3>
      <label class="sw-label" for="sw-roster">First to ring on inbound</label>
      <select class="sw-select" id="sw-roster">
        <option selected>Shawn</option>
        <option>Ryan</option>
        <option>Andrew</option>
        <option>Nate</option>
      </select>
    </section>

    <section class="sw-card" aria-labelledby="sw-t-hours">
      <h3 class="sw-card-title" id="sw-t-hours">Hours</h3>
      <div class="sw-row">
        <span><label class="sw-label" for="sw-open">Open</label>
        <input class="sw-input" type="time" id="sw-open" value="09:00"></span>
        <span><label class="sw-label" for="sw-close">Close</label>
        <input class="sw-input" type="time" id="sw-close" value="18:00"></span>
      </div>
      <label class="sw-label" for="sw-tz">Timezone</label>
      <select class="sw-select" id="sw-tz">
        <option value="America/Chicago" selected>America/Chicago (CT)</option>
        <option value="America/New_York">America/New_York (ET)</option>
        <option value="America/Denver">America/Denver (MT)</option>
        <option value="America/Phoenix">America/Phoenix (AZ)</option>
        <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
      </select>
      <fieldset class="sw-field">
        <legend class="sw-label">After close</legend>
        <div class="sw-radio-row">
          <input type="radio" name="sw-closed" id="sw-closed-vm" value="voicemail" checked>
          <label for="sw-closed-vm">Voicemail → portal review queue</label>
        </div>
        <div class="sw-radio-row">
          <input type="radio" name="sw-closed" id="sw-closed-ann" value="announce">
          <label for="sw-closed-ann">Hours announcement, then hang up</label>
        </div>
      </fieldset>
    </section>

    <section class="sw-card" aria-labelledby="sw-t-num">
      <h3 class="sw-card-title" id="sw-t-num">Number strategy</h3>
      <fieldset class="sw-field">
        <legend class="sw-label">Inbound numbers</legend>
        <div class="sw-radio-row">
          <input type="radio" name="sw-strat" id="sw-strat-one" value="one-line" checked>
          <label for="sw-strat-one">One line — single number everywhere</label>
        </div>
        <div class="sw-radio-row">
          <input type="radio" name="sw-strat" id="sw-strat-state" value="per-state">
          <label for="sw-strat-state">Per-state — local number per licensed state</label>
        </div>
      </fieldset>
    </section>

    <section class="sw-card" aria-labelledby="sw-t-budget">
      <h3 class="sw-card-title" id="sw-t-budget">Budget ceiling</h3>
      <label class="sw-label" for="sw-ceiling">Monthly ceiling</label>
      <div class="sw-money">
        <span class="sw-money-prefix" aria-hidden="true">$</span>
        <input class="sw-input" type="number" id="sw-ceiling" value="50" min="0" step="5" inputmode="decimal">
      </div>
      <label class="sw-label" for="sw-alert">Alert threshold</label>
      <input class="sw-range" type="range" id="sw-alert" min="10" max="95" step="5" value="80">
      <output class="sw-alert-out" id="sw-alert-out" for="sw-alert" aria-live="polite"></output>
    </section>
  </div>

  <div class="sw-state" id="sw-state" aria-live="polite"></div>
</div>

<script>
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var TZ = { 'America/Chicago': 'CT', 'America/New_York': 'ET', 'America/Denver': 'MT', 'America/Phoenix': 'AZ', 'America/Los_Angeles': 'PT' };
  var state = { rec: false, roster: 'Shawn', open: '09:00', close: '18:00', tz: 'America/Chicago', closed: 'voicemail', strat: 'one-line', ceiling: 50, alertPct: 80 };

  function picked(name) {
    var r = document.querySelector('input[name="' + name + '"]:checked');
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (i) {
      i.closest('.sw-radio-row').classList.toggle('sw-picked', i.checked);
    });
    return r ? r.value : '';
  }

  function render() {
    var rec = $('sw-rec');
    rec.setAttribute('aria-checked', String(state.rec));
    $('sw-rec-state').textContent = state.rec ? 'ON' : 'OFF';
    $('sw-rec-note').textContent = state.rec ? 'Preview only — production default stays OFF (A29).' : '';
    var c = isFinite(state.ceiling) ? Math.max(0, state.ceiling) : 0;
    var alertUsd = c * state.alertPct / 100;
    $('sw-alert-out').textContent = state.alertPct + '% → alert at $' + alertUsd.toFixed(2);
    $('sw-state').textContent = 'state (in-memory only) · rec=' + (state.rec ? 'ON' : 'OFF') +
      ' · roster=' + state.roster + ' · hours=' + state.open + '–' + state.close + ' ' + (TZ[state.tz] || state.tz) +
      ' · closed=' + state.closed + ' · numbers=' + state.strat +
      ' · ceiling=$' + c + ' · alert=$' + alertUsd.toFixed(2);
  }

  $('sw-rec').addEventListener('click', function () { state.rec = !state.rec; render(); });
  $('sw-roster').addEventListener('change', function (e) { state.roster = e.target.value; render(); });
  $('sw-open').addEventListener('input', function (e) { state.open = e.target.value || '--:--'; render(); });
  $('sw-close').addEventListener('input', function (e) { state.close = e.target.value || '--:--'; render(); });
  $('sw-tz').addEventListener('change', function (e) { state.tz = e.target.value; render(); });
  document.querySelectorAll('input[name="sw-closed"], input[name="sw-strat"]').forEach(function (r) {
    r.addEventListener('change', function () { state.closed = picked('sw-closed'); state.strat = picked('sw-strat'); render(); });
  });
  $('sw-ceiling').addEventListener('input', function (e) { state.ceiling = parseFloat(e.target.value); render(); });
  $('sw-alert').addEventListener('input', function (e) { state.alertPct = parseInt(e.target.value, 10); render(); });

  state.closed = picked('sw-closed'); state.strat = picked('sw-strat');
  render();
})();
</script>
```

═══════════════════════════════════════════════════════════════════
[UI-LAW-FRAGMENT]
═══════════════════════════════════════════════════════════════════

Corrected per verifier patches 1–4 and kills (hardcoded legal assertions → slots; phantom marker syntax fixed; --sw-law-ground deleted; draft-stamp/h3 overlap fixed). SYNTHESIS RECONCILIATION (resolves the fleet-internal contradiction flagged in GAPS item 1): heading changed "Five questions" → "Seven questions" and the slot count updated to seven, matching [LAW-DIRECTION] correction 9.

```html
<!-- ============================================================
  FRAGMENT: Consent-law direction (E7 / E7b)
  Skeleton + styles only. Verified text from the research lane
  replaces the HTML comments marked "SLOT:" below (grep for
  "SLOT:"). No JS.
============================================================= -->
<style>
  /* ---- tokens (dark-first; --sw-law- namespace to avoid cross-lane collisions) ---- */
  :root {
    --sw-law-panel: #181b21;
    --sw-law-panel2: #1d212a;
    --sw-law-ink: #e8e6df;
    --sw-law-muted: #9a9789;
    --sw-law-gold: #e0b64e;
    --sw-law-line: #2a2d34;
    --sw-law-fact: #7fb069;
    --sw-law-plan: #8aa5c8;
    --sw-law-open: #d08770;
    --sw-law-open-tint: rgba(208, 135, 112, 0.12);
    --sw-law-gold-tint: rgba(224, 182, 78, 0.10);
    --sw-law-plan-tint: rgba(138, 165, 200, 0.10);
  }
  @media (prefers-color-scheme: light) {
    :root:not([data-theme="dark"]) {
      --sw-law-panel: #ffffff;
      --sw-law-panel2: #f1ede4;
      --sw-law-ink: #23241f;
      --sw-law-muted: #6f6a5c;
      --sw-law-gold: #a3792a;
      --sw-law-line: #ddd8cc;
      --sw-law-fact: #4a7c3a;
      --sw-law-plan: #46688f;
      --sw-law-open: #b05c3a;
      --sw-law-open-tint: rgba(176, 92, 58, 0.10);
      --sw-law-gold-tint: rgba(163, 121, 42, 0.09);
      --sw-law-plan-tint: rgba(70, 104, 143, 0.09);
    }
  }
  :root[data-theme="light"] {
    --sw-law-panel: #ffffff;
    --sw-law-panel2: #f1ede4;
    --sw-law-ink: #23241f;
    --sw-law-muted: #6f6a5c;
    --sw-law-gold: #a3792a;
    --sw-law-line: #ddd8cc;
    --sw-law-fact: #4a7c3a;
    --sw-law-plan: #46688f;
    --sw-law-open: #b05c3a;
    --sw-law-open-tint: rgba(176, 92, 58, 0.10);
    --sw-law-gold-tint: rgba(163, 121, 42, 0.09);
    --sw-law-plan-tint: rgba(70, 104, 143, 0.09);
  }

  /* ---- section shell ---- */
  .sw-law-section {
    font-family: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
    color: var(--sw-law-ink);
    line-height: 1.55;
    margin: 2.5rem 0;
  }
  .sw-law-section h2,
  .sw-law-section h3,
  .sw-law-section h4 {
    font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    color: var(--sw-law-ink);
    letter-spacing: 0.04em;
    margin: 0 0 0.75rem;
  }
  .sw-law-section h2 { font-size: 1.35rem; }
  .sw-law-section h3 { font-size: 1rem; }
  .sw-law-section p { margin: 0 0 0.9rem; }
  .sw-law-kicker {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--sw-law-muted);
    margin: 0 0 0.35rem;
  }

  /* ---- stamped disclaimer band ---- */
  .sw-law-stamp-band {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 0.78rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--sw-law-open);
    background: var(--sw-law-open-tint);
    border: 1px dashed var(--sw-law-open);
    border-radius: 4px;
    padding: 0.55rem 0.9rem;
    margin: 0 0 1.4rem;
    text-align: center;
    overflow-wrap: break-word;
  }

  /* ---- FACT / PLAN / ASSUMPTION chips (for the content lane's labels) ---- */
  .sw-law-tag {
    display: inline-block;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 0.66rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: 1px solid currentColor;
    border-radius: 3px;
    padding: 0.05rem 0.4rem;
    margin-right: 0.4rem;
    vertical-align: 0.12em;
  }
  .sw-law-tag-fact { color: var(--sw-law-fact); }
  .sw-law-tag-plan { color: var(--sw-law-plan); }
  .sw-law-tag-open { color: var(--sw-law-open); }

  /* ---- two-column state layout ---- */
  .sw-law-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin: 0 0 1.4rem;
  }
  .sw-law-col {
    background: var(--sw-law-panel);
    border: 1px solid var(--sw-law-line);
    border-radius: 6px;
    padding: 1rem 1.1rem 1.1rem;
    min-width: 0;
  }
  .sw-law-col-allparty { border-top: 3px solid var(--sw-law-open); }
  .sw-law-col-oneparty { border-top: 3px solid var(--sw-law-plan); }
  .sw-law-col-head {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 0.82rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin: 0 0 0.2rem;
  }
  .sw-law-col-allparty .sw-law-col-head { color: var(--sw-law-open); }
  .sw-law-col-oneparty .sw-law-col-head { color: var(--sw-law-plan); }
  .sw-law-col-sub {
    font-size: 0.8rem;
    color: var(--sw-law-muted);
    margin: 0 0 0.75rem;
  }
  .sw-law-col ul {
    margin: 0;
    padding-left: 1.2rem;
  }
  .sw-law-col li { margin: 0 0 0.35rem; }

  /* ---- highlighted practical-rule card ---- */
  .sw-law-rule-card {
    background: var(--sw-law-gold-tint);
    border: 1px solid var(--sw-law-line);
    border-left: 4px solid var(--sw-law-gold);
    border-radius: 6px;
    padding: 1rem 1.2rem;
    margin: 0 0 1.6rem;
  }
  .sw-law-rule-label {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--sw-law-gold);
    margin: 0 0 0.4rem;
  }
  .sw-law-rule-card p:last-child { margin-bottom: 0; }
  .sw-law-rule-card .sw-law-rule-text { font-size: 1.05rem; }

  /* ---- numbered questions for counsel ---- */
  .sw-law-questions {
    list-style: none;
    counter-reset: sw-law-q;
    margin: 0 0 1.6rem;
    padding: 0;
  }
  .sw-law-questions > li {
    counter-increment: sw-law-q;
    position: relative;
    padding: 0.55rem 0 0.55rem 2.6rem;
    border-bottom: 1px solid var(--sw-law-line);
  }
  .sw-law-questions > li:last-child { border-bottom: none; }
  .sw-law-questions > li::before {
    content: "Q" counter(sw-law-q);
    position: absolute;
    left: 0;
    top: 0.62rem;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 0.78rem;
    color: var(--sw-law-gold);
    border: 1px solid var(--sw-law-gold);
    border-radius: 3px;
    padding: 0.05rem 0.32rem;
  }

  /* ---- DRAFT-stamped frame for announcement candidates ---- */
  .sw-law-draft-frame {
    position: relative;
    background: var(--sw-law-panel);
    border: 2px dashed var(--sw-law-open);
    border-radius: 8px;
    padding: 1.2rem 1.2rem 1.3rem;
    margin: 0 0 1rem;
  }
  .sw-law-draft-stamp {
    position: absolute;
    top: 0.75rem;
    right: 0.9rem;
    transform: rotate(-4deg);
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 0.7rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--sw-law-open);
    background: var(--sw-law-open-tint);
    border: 2px solid var(--sw-law-open);
    border-radius: 3px;
    padding: 0.15rem 0.5rem;
  }
  .sw-law-draft-frame > h3 { padding-right: 11rem; }
  .sw-law-draft-note {
    font-size: 0.82rem;
    color: var(--sw-law-muted);
    margin: 0 0 1rem;
    max-width: 46rem;
  }
  .sw-law-candidate {
    background: var(--sw-law-panel2);
    border: 1px solid var(--sw-law-line);
    border-radius: 6px;
    padding: 0.85rem 1rem;
    margin: 0 0 0.8rem;
  }
  .sw-law-candidate:last-child { margin-bottom: 0; }
  .sw-law-candidate-label {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--sw-law-muted);
    margin: 0 0 0.35rem;
  }
  .sw-law-candidate blockquote {
    margin: 0;
    padding-left: 0.85rem;
    border-left: 3px solid var(--sw-law-plan);
    font-size: 0.95rem;
  }

  /* ---- mobile collapse ---- */
  @media (max-width: 640px) {
    .sw-law-cols { grid-template-columns: 1fr; }
    .sw-law-draft-stamp {
      position: static;
      display: inline-block;
      transform: rotate(-2deg);
      margin: 0 0 0.75rem;
    }
    .sw-law-draft-frame > h3 { padding-right: 0; }
  }
</style>

<section class="sw-law-section" id="sw-law-consent">

  <p class="sw-law-stamp-band">Informational — Not Legal Advice · E7b Counsel Confirms</p>

  <p class="sw-law-kicker">E7 · Call recording — consent-law direction</p>
  <h2>Where consent law points us</h2>

  <!-- SLOT: section-intro
       One short paragraph from the research lane framing the two-party /
       one-party distinction for our receiving-first, inbound-only posture.
       May use <span class="sw-law-tag sw-law-tag-fact">FACT</span> etc. -->

  <div class="sw-law-cols">
    <div class="sw-law-col sw-law-col-allparty">
      <h3 class="sw-law-col-head">All-party-consent states</h3>
      <p class="sw-law-col-sub"><!-- SLOT: all-party-def
           One-line verified definition of all-party consent from research lane. --></p>
      <ul>
        <!-- SLOT: all-party-state-list
             Verified <li> entries (state + citation note) from research lane. -->
      </ul>
    </div>
    <div class="sw-law-col sw-law-col-oneparty">
      <h3 class="sw-law-col-head">Everywhere else (one-party)</h3>
      <p class="sw-law-col-sub"><!-- SLOT: one-party-def
           One-line verified gloss (one participant's consent; interstate caveat
           lives in one-party-note). --></p>
      <!-- SLOT: one-party-note
           Verified summary text; may include the interstate-call caveat. -->
    </div>
  </div>

  <div class="sw-law-rule-card">
    <p class="sw-law-rule-label">Practical rule</p>
    <p class="sw-law-rule-text">
      <!-- SLOT: practical-rule
           The single operating rule (e.g. treat every call as all-party;
           announce on every recorded call). Verified text drops here. -->
    </p>
  </div>

  <h3>Seven questions for counsel</h3>
  <ol class="sw-law-questions">
    <!-- SLOT: counsel-questions
         Exactly seven <li> items from the research lane ([LAW-DIRECTION] § 4). -->
  </ol>

  <div class="sw-law-draft-frame">
    <span class="sw-law-draft-stamp">Draft — Not Approved</span>
    <h3>Announcement wording — three candidates</h3>
    <p class="sw-law-draft-note">
      <!-- SLOT: draft-status-note
           Status line (recording defaults OFF per A29 until counsel approves
           wording — E7b). Verified text drops here. -->
    </p>

    <div class="sw-law-candidate">
      <p class="sw-law-candidate-label">Candidate 1</p>
      <blockquote>
        <!-- SLOT: announcement-candidate-1 -->
      </blockquote>
    </div>

    <div class="sw-law-candidate">
      <p class="sw-law-candidate-label">Candidate 2</p>
      <blockquote>
        <!-- SLOT: announcement-candidate-2 -->
      </blockquote>
    </div>

    <div class="sw-law-candidate">
      <p class="sw-law-candidate-label">Candidate 3</p>
      <blockquote>
        <!-- SLOT: announcement-candidate-3 -->
      </blockquote>
    </div>
  </div>

</section>
<!-- END FRAGMENT: Consent-law direction -->
```

ASSUMPTION (MEDIUM, surviving): one DRAFT stamp on the frame enclosing all three candidates is sufficient since the dashed border visually binds them; if candidates are ever excerpted individually, append " · draft" to each .sw-law-candidate-label.

═══════════════════════════════════════════════════════════════════
[DECISIONS-WORDING]
═══════════════════════════════════════════════════════════════════

BLOCK 1 — SWITCHBOARD ARTIFACT: replacement for the "Decisions still the owner's" table

## Decisions — where each stands (2026-08-19)

| Decision | Status | Traces to |
|---|---|---|
| **Recording custody — Twilio's transient hold** | ✅ **SIGNED OFF.** Pull-and-delete is the policy: every recording is pulled into R2 promptly after the call and deleted from Twilio, so R2 stays the only durable home for call audio. (The `calls/` key layout is the strategy doc's PLAN, not part of the signed amendment.) The founder's word, verbatim in the ledger: "A25 sign off is trivial — let's just say a pull and delete policy." | Ledger **A25** (decided 2026-08-18; Twilio custody amendment signed off 2026-08-19); key layout: `strategy/2026-08-19-twilio-inbound-switchboard.md` (PLAN) |
| **The owner console — Switchboard's controls as clickable settings** | ⏳ **ORDERED — spec in draft; portal build pending.** Ordered by the founder: recording on/off, answer roster + hours, one-line vs per-state numbers, and budget ceiling become owner-adjustable controls — spec'd in this artifact first, then built into the portal, owner-gated (whether by the founder gate or a new deny-by-default capability is its own governance line at build time), every change written to `audit_events`, defaults conservative. Fleet fielded to draft the spec; zero portal code exists yet. | Ledger **A29** (ordered 2026-08-19; fleet fielded; spec to artifact; portal build pending) |
| **Consent-recording law — counsel + announcement wording** | ⏳ **OPEN, direction drafted.** Plain-language direction on the all-party-consent law is drafted (informational, not legal advice — counsel confirms; counsel speaks last). Recording stays **OFF by default until the announcement wording clears counsel**. Booking counsel remains the owner's step. | Ledger **E7** (counsel follow-up **E7b** open) and **A29** (direction ordered and delivered; recording-OFF default) |
| **The vendor seam — Twilio takes calls, or wait on Inkbox #100** | ⏳ **OPEN — awaits the founder's word.** MAIN's counsel on the record: Twilio for the phone line, Inkbox stays the staff desk. No ledger row yet by design — it lands in OWNER-DECISIONS.md as its own dated row the moment it is spoken. | `strategy/2026-08-19-twilio-inbound-switchboard.md` ("Decisions still the owner's", item 1); ledger row pending |

**No longer decisions — now dials (A29).** Who answers, which hours, one number vs per-state, and the budget ceiling left this table on 2026-08-19: the founder made them **adjustable controls**, not one-time sign-offs. They will live in the owner console once it ships; until then, changing one is the founder's word, landing as its own dated ledger line. Nothing about them blocks Phase 0 or 1.

BLOCK 2 — OWNERS' BRIEF ("The Next Step Plan"): replacement for the decisions list

## Where the decisions stand

- ✅ **Signed off — what happens to call recordings.** Shawn approved pull-and-delete: a recording is copied into our own Cloudflare storage right after the call and erased from Twilio. Our account is the only place call audio ever rests. *(Ledger A25, custody amendment signed off 2026-08-19.)*

- ⏳ **Ordered — the owners' control panel.** Shawn ordered that recording on/off, who answers and in which hours, one number vs per-state numbers, and the budget ceiling all become clickable settings for the owners — every change logged, defaults conservative, and the exact owner gate is its own governance line at build time. The spec is being drafted now; no portal code exists yet; the build follows. *(Ledger A29, ordered 2026-08-19; portal build pending.)*

- ⏳ **Open — the lawyer's word on the recording announcement.** A plain-language read of the consent-recording law is drafted (informational, not legal advice — counsel confirms, E7b). Until a lawyer approves the announcement wording, **recording stays OFF**. Booking that conversation is the open legal step for turning recording on. *(Ledger E7 — follow-up E7b open; recording-OFF default per A29. Separately, the A24 carrier-retention asks — Aetna, Corebridge, Occidental, Transamerica — remain outstanding.)*

- ⏳ **Open — Shawn's call on the phone vendor.** Twilio now (the working recommendation; Inkbox remains the staff messaging desk) or wait on Inkbox #100. Not yet decided; it gets its own dated ledger row when he says the word. *(Strategy record 2026-08-19; no ledger row yet — that absence is the status.)*

- 🎛️ **Not decisions anymore — dials.** Who answers, hours, number strategy, and budget used to sit on this list as sign-offs. As of 2026-08-19 they are **adjustable controls by design**: they will live in the owners' panel once it ships; until then, changing one is Shawn's word, landing as its own dated ledger line. Nothing waits on them to start. *(Ledger A29.)*

═══════════════════════════════════════════════════════════════════
[TODAY-RUNBOOK]
═══════════════════════════════════════════════════════════════════

GO-LIVE-TODAY — TWILIO TRIAL RUNBOOK (inbound dial-through, recording OFF)
Executor: founder, this afternoon. Informational, not legal advice — counsel confirms (E7b).

**1. SIGNUP — est. 15 min** (new-account fraud checks occasionally add a hold screen — budgeted. VERIFY-ON-SCREEN.)
1. (2m) Browser → twilio.com/try-twilio. Prefer **"Continue with Google"** on btcmao518@gmail.com — it skips the email-link step and saves ~3 min. Otherwise sign up by email and click the verification link Twilio sends. FACT: free trial, no card required.
2. (3m) Phone verification: enter +1 409 549 2092, enter the code. Twilio rejects VoIP/virtual numbers at signup — this must be a real mobile/carrier number (ASSUMPTION HIGH: it is his phone). If the SMS code stalls or loops after two sends, use the "call me instead" option rather than re-requesting. FACT: this makes it the account's first Verified Caller ID — the trial may Dial it.
3. (1m) Onboarding questions — pick Voice if asked; wording drifts. VERIFY-ON-SCREEN.
4. (2m) Dashboard shows Account SID and Auth Token. See STOP-LINES below for the Auth Token rule.

**2. NUMBER — est. 10 min**
5. (2m) Left nav → Phone Numbers → Manage → Buy a number (use console search if the nav has moved). VERIFY-ON-SCREEN.
6. (3m) Filters: Country US, Voice capability checked, type Local. PLAN: choose the area code deliberately (house rule after D4) — 941 to match the Sarasota agents, or 409 for the founder's region; founder decides, not the first suggestion. Note: trial accounts hold ONE number, so this choice is effectively final for the trial period without a release-and-rebuy.
7. (3m) Buy. The trial typically covers the first number — fee waived or drawn from the ~$15 credit; either way it is covered, but "$1.15 from credit" is not settled. VERIFY-ON-SCREEN. If the console asks for an address, regulatory bundle, or geographic permissions, that is normal — complete it.
8. (2m) Record the number in session notes (numbers are not secrets).

**3. VERIFIED CALLER IDS — OPTIONAL / DEFERRABLE (est. 10 min if run)**
FACT (HIGH; VERIFY-ON-DOCS, Twilio "How does the free trial work"): verified caller IDs gate only numbers Twilio dials OUT to (REST calls and `<Dial>` legs). INBOUND is open — any unverified caller reaches the trial number, hears the preamble, presses a key, and the Bin runs. The only number that must be verified today is +1 409 549 2092 — already verified at signup. **This section gates nothing in today's test matrix; do not let Ryan's or Andrew's availability block go-live.**
If run anyway (enables future dial-through to them): Phone Numbers → Manage → Verified Caller IDs → Add (VERIFY-ON-SCREEN) → enter Ryan's +1 941 210 1410. The console DISPLAYS a 6-digit validation code on the founder's screen; Twilio calls Ryan; the founder reads the code TO Ryan before/during the call, and RYAN keys it into his phone keypad. (Nobody relays a code back to the founder — run the other direction and the verification times out.) For mobile numbers the console may offer SMS verification instead — if shown, use it; it removes the live-answer choreography entirely. VERIFY-ON-SCREEN. Repeat for Andrew (+1 941 210 1411).

**4. TWIML BIN — est. 10 min**
9. (2m) Console search → TwiML Bins → Create (sometimes under Developer tools). VERIFY-ON-SCREEN.
10. (3m) Friendly name `thrive-inbound-trial`. Paste exactly (validated: XML declaration, `<Response>`/`<Say voice="Polly.Joanna">`/`<Dial>` all legal TwiML, E.164 target correct, no record attribute, no `<Record>`; keep it minimal — no answerOnBridge or timeout attributes on scaffolding):

```
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thank you for calling THRIVE. Please hold while we connect you to a licensed representative.</Say>
  <Dial>+14095492092</Dial>
</Response>
```

FACT: no recording language and no `record` attribute anywhere — recording is OFF until counsel approves announcement wording (A29/E7b).
11. (3m) Phone Numbers → Manage → Active numbers → the new number → Voice Configuration → "A call comes in" = TwiML Bin → `thrive-inbound-trial` → Save. VERIFY-ON-SCREEN.
12. (2m) Reload the number page; confirm the Bin shows attached.

**5. TEST MATRIX — est. 20 min**
FACT (HIGH): on a trial, every caller first hears Twilio's preamble ("You have a trial account… press any key to execute your code") and must press a key before the Bin runs.

13. T1 (5m) Founder calls the line — from a SECOND phone, never from +1 409 549 2092. Self-call quirk: dialing your own Dial target from the target phone finds it busy → straight to voicemail; proves nothing. SUCCESS: preamble → keypress → Joanna greeting → founder's phone rings → two-way audio. When the founder ANSWERS the Dial leg he may hear a brief trial notice before audio bridges — ASSUMPTION (LOW), VERIFY-ON-SCREEN; if heard, it is trial behavior, not a config error; do not "fix" it. Failures: silence after keypress = Bin not attached (redo step 11); greeting but no ring = Dial digits wrong (recheck step 10); "cannot be completed" = geographic permissions (revisit step 7).
14. T2 (5m) Ryan or Andrew (or anyone) calls — works with zero verification. SUCCESS and fixes identical to T1. Proves any caller gets through, not just the owner.
15. T3 (5m) No-answer — canonical form is IGNORE, not reject. Caller dials; founder IGNORES the ring. SUCCESS sound: ~20–30s of ringing, then the founder's carrier voicemail — note voicemail usually ANSWERS before the 30s Dial default timeout, so the timeout rarely fires; the caller landing in voicemail is a completed call and shows as such in logs. Do NOT test by rejecting: a rejected call hits voicemail in ~2–5s — near-instant, and easily misread as a failure when it is not. ASSUMPTION (MEDIUM): carrier voicemail is on; if instead dead air then hangup, it is off — acceptable for the trial. Phase 1's Worker route replaces this.
16. T4 (2m) Caller hangs up during the preamble. SUCCESS: nothing rings; Monitor → Logs → Calls shows one short inbound leg, no Dial leg. Confirms no ghost calls.
17. (3m) Review logs for all four; screenshot the call list (Auth Token nowhere in frame).

**6. STOP-LINES — absolute**
- The Auth Token never leaves the console's masked view — not chat, not files, not screenshots, not commits. (The Account SID is an identifier, fine to note.)
- No recording: no `record` attribute, no `<Record>`, no recording announcements (A29).
- No upgrade today unless the founder himself decides.
- No real consumer callers while the trial preamble exists — the line is unannounced and the preamble is unprofessional.
- Nothing outbound. Posture is receiving-first, inbound only.

**7. AFTERWARD — est. 10 min**
18. (5m) claude.ai → Settings → Connectors: VERIFY-ON-SCREEN whether a Twilio connector exists at all before promising it. If it does, create a standard API Key (SID + Secret) in the Twilio console for it — never paste the master Auth Token into a third-party credential store. Secret NAMES only in any report.
19. (3m) Report to the session: the purchased number plus screenshots (number config, call log), token masked.
20. (2m) Note for the record: the Bin is scaffolding; it retires when Phase 1's signature-verified Worker route ships — and that route needs a Cloudflare Access bypass policy (path-scoped; Service Auth is not viable for Twilio) before webhooks can reach it. Adjustable hours/roster dials do not exist on today's static Bin — adjustability arrives only with the Phase-1 Worker route.

**TOTAL: ~60 minutes solo.** Section 3 is optional — the former "longest pole" (Ryan and Andrew live on their phones) was a manufactured dependency; inbound needs no verified callers and today's only Dial target was verified at signup.

═══════════════════════════════════════════════════════════════════
[RESIDUAL-RISKS]
═══════════════════════════════════════════════════════════════════

Every surviving VERIFY-ON-DOCS / VERIFY-ON-SCREEN / low-confidence item. Law-adjacent entries: informational, not legal advice — counsel confirms (E7b).

LAW
1. VERIFY-ON-DOCS: the entire all-party list as of go-live (statutes get amended); exact Delaware citations (§ 2402(c)(4), § 1335(a)(4), Vespe).
2. Vermont — LOW: no recording statute; case law unsettled.
3. ASSUMPTION (MEDIUM-HIGH): announcement-based implied consent holds in every remaining all-party state (counsel Q1).
4. ASSUMPTION (HIGH): onboarding acknowledgment cures agent-side consent (counsel Q6).
5. ASSUMPTION (MEDIUM): plain transcription is not a BIPA voiceprint (counsel Q7).
6. ASSUMPTION (MEDIUM): objection case needs a scripted stop-recording path (counsel Q3).
7. LOW (optional): Puerto Rico privacy doctrine sometimes read as all-party — mooted by announcement-first design.

ANNOUNCEMENTS
8. VERIFY-ON-DOCS / counsel: "THRIVE" alone as entity identification; implied-consent sufficiency; "recorded or monitored"; "and may be transcribed"; whether opt-out requires discarding the already-captured partial in R2.
9. ASSUMPTION (MEDIUM): ~150 wpm timing estimates.

COMPLIANCE
10. VERIFY-ON-DOCS: current 16 CFR 310.5 (five-year TSR recordkeeping figure, knowledge-based); state mini-TCPAs (FL FTSA) for any future callback program.
11. ASSUMPTION (MEDIUM): per-state scope of permitted unlicensed clerical talk; business-entity licensing (VERIFY via NIPR).
12. FACT (MEDIUM) only: manual-callback defensibility window; record-keeping norms list.

MECHANICS
13. VERIFY-ON-DOCS: ~15s webhook callback timeout; DELETE Recordings → 204; whether new trials default "Enforce HTTP Auth on Media URLs" on; inbound keypress requirement on trial (HIGH from knowledge, help article unfetchable); trial inbound open to arbitrary callers (HIGH); number retention across upgrade.
14. MEDIUM: durable-write confirmation approach (buffer-and-measure or R2 checksum; Content-Length unreliable on chunked responses).

CONSOLE
15. ASSUMPTION (MEDIUM): America/Chicago default timezone (founder US-TX).
16. ASSUMPTION (LOW): $20 / 80% budget defaults — founder sets real values.
17. ASSUMPTION (MEDIUM): unmasked owner-supplied routing numbers in audit detail acceptable (owner may prefer masking; house precedent is caller_number_masked).
18. OPEN GOVERNANCE: owner gate choice (owners-plural switchboard.manage vs founder-gated recording toggle); roster phone storage ({email,number} JSON vs member phone column) — each needs its own ledger row.

COSTS
19. All Twilio rates ESTIMATE — VERIFY AT twilio.com/pricing; R2 figure ESTIMATE — VERIFY AT cloudflare.com/pricing (free tier ~10 GB-mo likely bills $0 — ESTIMATE, VERIFY-ON-DOCS); trial credit ~$15 ASSUMPTION (MEDIUM), VERIFY on account creation; two-simultaneous-legs cost model ASSUMPTION (MEDIUM).

UI
20. ASSUMPTION (MEDIUM): single DRAFT stamp binds all three candidates; append " · draft" per label if ever excerpted.
21. MEDIUM (host-dependent): banner stacking context — mitigated to z-index:10.

RUNBOOK (all VERIFY-ON-SCREEN unless noted)
22. Signup flow wording, fraud-check hold screens, "call me instead" fallback; console nav paths (buy number, Verified Caller IDs, TwiML Bins, voice configuration); number cost coverage on trial; address/regulatory bundle prompts; SMS option for caller-ID verification; trial notice on the answered Dial leg (ASSUMPTION LOW); claude.ai Twilio connector existence and auth flow.
23. ASSUMPTION (MEDIUM): founder's carrier voicemail is on. ASSUMPTION (HIGH): +1 409 549 2092 is a real mobile/carrier number.

═══════════════════════════════════════════════════════════════════
[GAPS]
═══════════════════════════════════════════════════════════════════

Completeness critic's findings, carried verbatim in substance (FACT HIGH unless noted; all from the fleet's own text). Status annotations in brackets are synthesis additions.

1. No assembled artifact. Order 1 was "make that into the artifact." The fleet holds specs and two HTML fragments but no integration step: ui-law's slots are all unfilled, and it hardcodes "Five questions for counsel" while law correction 9 raises the count to seven — the skeleton now contradicts its content lane. [Partially addressed in this bundle: the heading and slot count are reconciled to seven in [UI-LAW-FRAGMENT]; slot-filling and assembly remain MAIN's v0.3 work.]

2. ui-console contradicts the console spec, unreconciled: the preview defaults after-hours to "Voicemail → portal review queue" — the exact caller-audio capture the spec forbids pre-counsel (A29, "no voicemail"); single-select roster vs the spec's ordered multi-select; $50 ceiling default vs the spec's $20; no alternate-number mode or counsel-gate affordance. As-is it shows the founder a control the spec killed. [Still true of the fragment in this bundle; flagged inline above it. MAIN must reconcile before v0.3.]

3. Counsel packet unconsolidated (order 2): questions are scattered across law (7 after corrections), wording A3/A5/A8 ("monitored," "transcribed," opt-out partial deletion), and mechanics (record-start timing). One merged E7b list is the deliverable; nobody produced it. [Cross-referenced at the end of [LAW-DIRECTION] § 4; the merged list itself remains to be produced.]

4. Budget ceiling has no sensor. Storage, UI, validation, fail-safes are specced; how the Worker learns Twilio spend (Usage API poll vs usage-trigger webhook — the latter needing the Access bypass) appears nowhere. The dial is unenforceable as written. PLAN gap. [Flagged inline in [CONSOLE-SPEC] Control 5.]

5. Runbook omissions: no step enabling "Enforce HTTP Auth on Media URLs" (mechanics said day one); no Twilio balance-alert setup (costs recommends 70%); no plain statement that hours/roster dials cannot exist on today's static TwiML Bin — adjustability arrives only with the Phase-1 Worker route. [The third item is now stated in runbook step 20; the first two remain missing steps for MAIN to add.]

6. Homeless day-one items: internal DNC flag (wording B8), 'missed' status migration, and roster phone column are flagged but specced nowhere — each needs an owner-decision line or schema stub. [The 'missed' migration is now a named ship-first dependency in [CONSOLE-SPEC] Control 3; the DNC flag and roster phone column still need owner-decision lines or schema stubs.]

Orders 2–4 are otherwise answered; verifier kills left no other holes.