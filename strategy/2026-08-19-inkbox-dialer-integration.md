# Integrating Inkbox as the dialer

Step-by-step plan. Nothing here is built yet.

---

## First: the browser is not where the call lands

This is the thing to get straight before any code, because getting it wrong is
a rebuild rather than a fix.

A web page cannot receive a phone call. When an agent "gets a call in the
portal", one of two entirely different things is happening:

**Model A — the call rings the agent's phone.** Inkbox holds the number,
answers, and transfers to that agent's real cell or softphone. The portal's job
is to say *who is available*, and afterwards to *hold the record* — the row,
the recording, the review. Audio never touches the browser.

**Model B — the call runs inside the browser (WebRTC).** The agent wears a
headset and talks through the page. This needs Inkbox to publish a browser SDK
or SIP-over-WebSocket, plus microphone permission, plus a device that stays
awake.

**Recommendation: Model A.** It is what a 25-seat telesales floor actually
runs, it works when someone's laptop sleeps, and it degrades to "the phone
rings" when anything else breaks. Model B is a second phase at best, and only
if Inkbox supports it — which is unverified.

So the live flow is:

```
  caller dials the Inkbox number
        |
        v
  Inkbox voice agent answers  ......... (the brief in voice/policyholder-services-fl.md)
        |  decides the department
        v
  Inkbox transfers to an agent's PHONE
        |
        +--> POSTs call events -----> portal webhook -> dialer_transfers row
        |                                              -> live status in /portal/calls
        |
        +--> recording available ---> portal pulls it into R2
                                      -> consent_status set at write time
```

The portal is the roster, the record, and the review surface. Inkbox is the
switchboard. Neither pretends to be the other.

### How Inkbox learns who to ring

This is the crux, and it has two possible shapes:

- **Push (portal → Inkbox).** When an agent toggles availability, the portal
  calls the Inkbox API to update a ring group. Portal is the source of truth;
  Inkbox holds a cached copy. Simple, and it fails safe — a stale group rings
  someone who is present but idle.
- **Pull (Inkbox → portal).** At call time Inkbox asks the portal "who takes
  claims right now?" Always fresh, but the portal is now on the critical path
  of every call, and if it is down, calls do not route.

**Push is the better default here**, because the portal going down should not
stop the phones. Whether Inkbox supports either is Phase 0.

---

## What already exists

More than you would expect. `dialer_transfers` is read by seven surfaces and
**written by none** — the table, the review UI, the consent gate, the R2 store,
and the capability model are all built. The schema even carries `source_system`
and `external_call_id`, so it was designed for a vendor to write into it.

| Piece | State |
|---|---|
| `dialer_transfers` table | exists, 16 columns, unique on `transfer_id` |
| `/portal/calls` list + `/portal/calls/review/[id]` | exist, read-only |
| `CALL_RECORDINGS` R2 bucket + `storage.ts` | exists |
| Recording playback, gated twice (capability + `consent_status`) | exists |
| `calls.review`, `calls.review.self`, `calls.recording.delete` | exist |
| `/portal/inbound/availability` POST | exists — writes a preference to audit |
| `dialpad.tsx` | exists, uses `tel:`; comments name the Call button as the seam |
| **an ingest route** | **does not exist — this is the work** |

`app/portal/inbound/availability/route.ts` says it out loud: the preference is
stored so that "the future routing bridge" has a durable source to consume.
This plan is that bridge.

---

## Phase 0 — Ask Inkbox five questions (blocking)

None of this can be designed around guesses, and their docs are not reachable
from the build environment.

1. **Webhooks.** Do they POST call events to a URL we own? What events
   (`ringing`, `answered`, `transferred`, `completed`, `recording.ready`), and
   what does the payload look like?
2. **Signing.** Is the webhook signed — HMAC header, shared secret, mTLS? *If
   the answer is "no, just keep the URL secret", that is not authentication and
   the route must compensate.*
3. **Routing control.** Can the API set a ring group / transfer destination per
   department (push), or call out to us at call time (pull)? Which?
4. **Recordings.** Where does the audio live, how long do they keep it, and is
   the fetch URL authenticated and time-limited?
5. **WebRTC.** Is there a browser SDK at all? Determines whether Model B ever
   becomes possible.

Also settle two of your own:

6. **An API key must be minted.** All Inkbox keys were deleted 2026-08-17 and
   none replaced, after one was burned by being pasted into chat. The new one
   goes in as a Worker secret — `wrangler secret put INKBOX_API_KEY` — and its
   **value never appears in a file, a commit, a comment, or a message.** Only
   the name.
7. **Recording + consent.** Does the line record? Florida is all-party consent
   (Fla. Stat. § 934.03), and callers dial from anywhere, so the consent line
   is read on every call.

---

## Phase 1 — Let Inkbox reach the portal at all

**Cloudflare Access will refuse the webhook.** It fronts the whole domain with
a Google-only, named-email policy. A vendor POST arrives anonymous and gets a
login redirect — the same failure that would break carrier logos in the email.

1. Add an Access **bypass policy** scoped to exactly one path:
   `/portal/calls/ingest`. Not the whole `/portal` tree. Not a wildcard.
2. Prove it before writing code:
   ```
   curl -sSi -X POST https://<host>/portal/calls/ingest -d '{}'
   ```
   A `302` to `cloudflareaccess.com` means it is still gated. You need a
   `4xx` from your own route.
3. **The bypass removes the edge's protection from that path, so the route
   must authenticate the caller itself.** That is the whole of Phase 2.

---

## Phase 2 — The ingest route

New file: `app/portal/calls/ingest/route.ts`. Roughly 150 lines. Order matters
— every check happens before anything is written.

1. **Verify the signature first**, before parsing, before touching D1. Read the
   raw body, recompute the HMAC with `INKBOX_API_KEY`, compare in constant
   time. `command-pass.ts` already has `constantTimeEqual` to copy the shape
   from. No signature, no write — and no detail in the error about why.
2. **Reject stale timestamps** (say, older than five minutes) so a captured
   request cannot be replayed tomorrow.
3. **Validate the payload** against an explicit allowlist of fields. Anything
   unrecognised is dropped, not stored.
4. **Upsert on `transfer_id`**, which is already uniquely indexed. Vendors
   retry; the second delivery of the same event must update, never duplicate.
5. **Mask the caller number before storing it** — the column is
   `caller_number_masked` and the name is the instruction.
6. **Set `consent_status` truthfully at write time.** `verified` only when the
   caller actually consented on that call. Default `pending`. A recording
   stored as `pending` that nobody ever verifies is a recording you can never
   use — which is the correct failure, and better than a comfortable lie.
7. **Write an `audit_events` row for every ingest**, accepted or rejected.
8. **Return 200 fast.** Do the slow work (recording fetch) in
   `ctx.waitUntil()`, or a vendor timeout turns into duplicate deliveries.

**Never trust identity from the payload.** `agent_email` in the body names who
Inkbox *says* took the call; it must be matched against `portal_members`, and a
non-member is recorded as unassigned rather than created. This is the same rule
as the retired `oai-authenticated-user-*` headers.

---

## Phase 3 — Recordings into R2

1. On `recording.ready`, fetch the audio from Inkbox with the API key.
2. Store to `CALL_RECORDINGS` under a key that cannot be guessed —
   `calls/<transfer_id>/<random>.<ext>`, not a sequence.
3. Write `recording_object_key` and `recording_mime_type` back to the row.
4. Playback already gates twice on capability + `consent_status`. **Change
   nothing there.**
5. **Retention is a decision before it is a bill.** Two years is recorded as
   the founder's answer. Until a deletion job exists, storage only grows —
   `budget/plan.ts` says exactly this about R2, and it is why that line is
   unpriced.

---

## Phase 4 — Availability actually routes something

Today `/portal/inbound/availability` writes a preference nothing reads.

1. Add each agent's ring destination to their member record. **A phone number
   is personal data** — treat it like the roster, not like config.
2. On toggle, push the current available set to Inkbox's ring group for that
   department.
3. Fail closed: if the push fails, the agent is shown as **not** available.
   Silently believing you are on the queue is worse than knowing you are off it.
4. Only then rewire the `dialpad.tsx` Call button — the comment there already
   marks it as the single seam.

---

## Phase 5 — Live state in the portal

1. `/portal/calls` reads `dialer_transfers` where status is live.
2. Refresh by **polling every few seconds**, not by holding a socket open.
   Workers bill CPU per request; an idle open connection per agent is a cost
   with no matching benefit at 25 seats.
3. Rank visibility already applies — `canSeeInRoster` means an agent sees their
   own calls and their downline's, never their upline's. Reuse it; do not write
   a second visibility rule.

---

## Test before any of it is live

The suite runs real workerd and D1, so the ingest route is testable end to end.
Pin at minimum:

- an unsigned POST is refused, and writes nothing
- a POST with a wrong signature is refused
- a replayed old timestamp is refused
- the same `transfer_id` twice produces one row, not two
- `agent_email` naming a non-member does not create a member
- a recording with `consent_status: pending` will not play, for anyone
- the ingest path refuses anonymous **reads**, so the bypass did not open a hole

That last one matters most. The Access bypass is the only place in this system
where the edge stops protecting a path, and a test is the only thing that will
notice if it ever widens.

---

## Order, and what it costs to be wrong

```
0  Ask Inkbox the five questions       blocking, no code
1  Access bypass, proven with curl     30 min, blocks everything after
2  Ingest route + signature + tests    the real work
3  Recordings into R2                  needs a retention job or it grows forever
4  Availability -> ring groups         needs agent phone numbers, which is PII
5  Live status in the portal           cosmetic until 2-4 are solid
```

Phases 0 and 1 are cheap and unblock the rest. Phase 2 is where the care goes:
it is an authenticated write endpoint sitting behind a deliberate hole in the
edge, and it is the only one in the system.
