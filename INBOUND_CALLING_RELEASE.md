# CORE automatic inbound calling release

**Record date:** 2026-08-20

**Implementation branch:** `codex/inbound-calls-20260820`

**Implementation origin base:** `b1ae1ca2e852b8d2033240457eb28535d0611687`

**Current merge base:** `662612070cee1f7125c4b7cfd377cbe40cbb1daa`

**Current state:** implemented and locally verified; **not merged, deployed, migrated, provisioned, purchased, or routed live**

**Founder gate:** the exact one-use keyword `mi` authorizes one squash merge only; production mutations require separate explicit authorization

This runbook is the release contract for the browser inbound-calling work. It
contains identifiers and secret *names*, never secret values, subscriber
tokens, private-mobile numbers, unmasked customer numbers, or voicemail URLs.

## 1. Release boundary

The implementation provides:

- one `/portal/calls` workspace for Live, My History, Call Lab, and Voicemail;
- a J.A.R.V.I.S./Calls mode in the global floating eye;
- an always-visible Calls launcher and honest phone-state indicator directly
  beneath the expanded Account Balance control in the sticky portal top bar;
- explicit Available/Offline state, device and microphone checks, a 15-second
  heartbeat, and a 45-second fail-closed presence expiry;
- a single primary SignalWire browser registration per browser profile, with
  secondary tabs mirroring state through `BroadcastChannel`;
- keyboard `1` and an accessible Answer button for an active incoming offer;
- Mute, Keypad, Hold, Send to Team, and End Call controls;
- automatic personal-owner 8-second, available-team 8-second, private-mobile
  20-second, then announced-voicemail routing;
- atomic first-answer-wins handling and honest Answered elsewhere closure;
- a two-phase, idempotent Send to Team operation that excludes the sending
  employee from that attempt;
- final-voicemail-only recording, protected R2 playback, and exactly-once
  callback-task creation;
- self-only employee history and voicemail visibility, with founder-authorized
  aggregate and Call Lab views;
- an additive D1 migration at `db/sql/0011_inbound_browser_voice.sql`;
- exact-path, two-factor Basic plus HMAC authentication for SignalWire machine
  callbacks; and
- fail-closed token, presence, routing, authorization, and stale-session paths.

It deliberately does **not** add arbitrary employee outbound dialing, a warm
transfer label, live-call recording, transcription, AI participation, or a
claim that a closed/sleeping browser is Available. The founder-only Collab
Dialer is consolidated as the Outbound tab in `/portal/calls`; it remains
server-gated to the founder identity and is never offered to employees.

## 2. Provider and secret separation

The Worker needs these server-only bindings for inbound browser voice:

- `SIGNALWIRE_VOICE_SPACE_URL`
- `SIGNALWIRE_VOICE_PROJECT_ID`
- `SIGNALWIRE_VOICE_API_TOKEN`
- `SIGNALWIRE_PRIVATE_MOBILE_NUMBER`
- `SIGNALWIRE_TEAM_HUNT_ADDRESS`
- `SIGNALWIRE_MAIN_NUMBER`
- `SIGNALWIRE_CALLER_ENCRYPTION_KEY`
- `SIGNALWIRE_INGEST_SECRET`
- `SIGNALWIRE_INGEST_SECRET_PREVIOUS` only during credential rotation
- `SIGNALWIRE_SIGNING_KEY`
- `SIGNALWIRE_PUBLIC_ORIGIN`

The Voice token is dedicated to the production CORE Worker and carries only
the SignalWire permissions needed for voice routing and Subscriber token
issuance. Number search and purchase use a separate, operator-held
Numbers-scoped credential or the SignalWire dashboard. That purchasing
credential is never uploaded to the Worker.

Set or rotate each Worker secret interactively so its value is not placed in a
command line, file, log, or transcript:

```powershell
npx wrangler secret put SIGNALWIRE_VOICE_SPACE_URL -c dist/server/wrangler.json
npx wrangler secret put SIGNALWIRE_VOICE_PROJECT_ID -c dist/server/wrangler.json
npx wrangler secret put SIGNALWIRE_VOICE_API_TOKEN -c dist/server/wrangler.json
npx wrangler secret put SIGNALWIRE_PRIVATE_MOBILE_NUMBER -c dist/server/wrangler.json
npx wrangler secret put SIGNALWIRE_TEAM_HUNT_ADDRESS -c dist/server/wrangler.json
npx wrangler secret put SIGNALWIRE_MAIN_NUMBER -c dist/server/wrangler.json
npx wrangler secret put SIGNALWIRE_CALLER_ENCRYPTION_KEY -c dist/server/wrangler.json
npx wrangler secret put SIGNALWIRE_INGEST_SECRET -c dist/server/wrangler.json
npx wrangler secret put SIGNALWIRE_SIGNING_KEY -c dist/server/wrangler.json
npx wrangler secret put SIGNALWIRE_PUBLIC_ORIGIN -c dist/server/wrangler.json
```

`SIGNALWIRE_CALLER_ENCRYPTION_KEY` must decode to exactly 32 bytes. The app uses
AES-GCM and stores a masked caller value for ordinary display. The private
mobile is used only inside server-generated provider instructions.

SignalWire Subscriber access tokens remain a documented residual risk because
an inbound-capable full token may also originate a call. The release mitigates
that limitation with a 15-minute token lifetime, DPoP/device fingerprint,
active-account and active-assignment checks, no outbound employee interface,
immediate refresh shutdown on Offline/logout/revocation/expiry, provider usage
monitoring, and a spend alert. Tokens and refresh tokens are never stored in
D1, logs, HTML, analytics, or the client bundle.

## 3. D1 migration gate

The migration is additive and forward-only. It creates:

- `voice_number_assignments`
- `voice_presence`
- `inbound_voice_calls`
- `voice_call_offers`
- `voice_callback_tasks`

After the verified branch is merged to `main`, and only with separate explicit
production authorization, apply the exact file to the named database before
any number routes are enabled:

```powershell
npm run build
npx wrangler d1 execute site-creator-d1 --remote --file=db/sql/0011_inbound_browser_voice.sql -c dist/server/wrangler.json
```

The Cloudflare dashboard D1 Console is the approved fallback if the account's
previous Wrangler remote-authentication failure recurs. Use one method only.
Confirm all five tables and their unique indexes before deployment or resource
provisioning. Do not run a destructive downgrade during rollback; leave this
additive schema dormant.

Cloudflare recommends identifying a D1 database by its stable database name
rather than a binding name when applying migrations, because a binding can
change. See the [Cloudflare D1 migration reference](https://developers.cloudflare.com/d1/reference/migrations/).

## 4. Subscriber provisioning

Provision Subscribers only after the merged-main code, schema, and Worker
secrets pass their gates and the production provisioning action is explicitly
authorized.

For each live active member, in ascending `portal_members.id` order:

1. Confirm the member is active, has `calls.answer`, and is one of the five
   approved accounts. The revoked `bankerrunners@gmail.com` record must not be
   selected.
2. Use the stable non-email reference `core-member-<member-id>`.
3. Create or retrieve the Subscriber through SignalWire's Subscriber-token
   endpoint. Discard the returned access and refresh tokens immediately; this
   provisioning step must not print or persist either value.
4. Capture the returned `subscriber_id`.
5. Call SignalWire's Subscriber-addresses endpoint and select the exact
   `channels.audio` address. Never construct or guess `/private/...`; the
   provider can vary the address prefix.
6. Store the member ID, provider Subscriber ID, stable reference, exact audio
   address, and active status in `voice_number_assignments`.
7. Read the row back without exposing a token or private mobile number.

The Worker token broker independently verifies that SignalWire's token
response carries the same `subscriber_id` stored on the active assignment. A
mismatch fails closed. See SignalWire's [Subscriber-token API](https://signalwire.com/docs/apis/rest/subscribers/tokens/create-subscriber-token)
and [Subscriber-address API](https://signalwire.com/docs/apis/rest/subscribers/list-subscriber-addresses).

## 5. Number purchasing gate

Number purchasing is a separate, explicit production action; the merge keyword
does not authorize spending.

1. Search voice-capable local numbers in area code 205.
2. If fewer than five are available, search other Alabama local area codes.
3. Select five numbers and sort their E.164 values numerically.
4. Re-read the **displayed recurring checkout total immediately before
   purchase**. The public pricing page or an older estimate is not the gate.
5. Stop without purchasing if the five numbers plus five Subscribers exceed
   **$20.00/month fixed recurring cost**, excluding usage and tax.
6. Purchase only after recording the fresh total and timestamp in the
   operator-only release evidence.
7. Assign the sorted numbers to the ascending approved active member IDs,
   expected to resolve in this order:
   Ryan Davidson, Nate Nguyen, Andrew Davidson, Yuxiang Mao/Shawn, Ken.
8. If the live member-ID order or names do not match that expected list, stop
   for renewed founder approval rather than improvising an identity mapping.
9. Store provider number IDs and number assignments in D1. Add only safe
   business-number mappings to the operational record; never add private
   fallback or customer numbers.

The current [SignalWire voice pricing page](https://signalwire.com/pricing)
is reference material only. It does not replace the fresh checkout-total gate.

## 6. Cloudflare Access boundary

Create Access bypass coverage only for these exact machine callback paths:

- `/portal/calls/ingest`
- `/portal/calls/route`
- `/portal/calls/voicemail`

Do not bypass `/portal`, `/portal/calls`, a wildcard, or any prefix. In
particular, `/portal/calls/session`, `/portal/calls/presence`,
`/portal/calls/bootstrap`, `/portal/calls/offer-event`,
`/portal/calls/team-transfer`, `/portal/calls/callback-tasks/*`, and
`/portal/calls/voicemail/audio` remain user-authenticated and protected.

An Access bypass is not application authentication. Each machine route still
requires the configured Basic credential and an HMAC over the configured HTTPS
origin, exact path, and raw body. Every authentication failure returns the
same empty 401 response. Review Cloudflare's [Access policy behavior and
precedence](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/)
before changing the edge policy.

After any deploy or Access change, probe all three machine paths anonymously
for the same empty 401, probe GET for 405, and confirm `/portal/calls` still
redirects to Cloudflare Access. Do not enable a number until these probes pass.

## 7. Routing and smoke-test order

Configure and verify the five personal numbers first. Do not alter the public
main line during that phase.

Run with controlled authorized test phones and no customer data:

1. Personal DID: owner presses `1`; verify stable two-way headset audio.
2. Personal DID: owner misses; another available employee presses `1`.
3. Personal DID: both browser stages miss; private mobile receives the call
   and real telephone DTMF `1` accepts it.
4. Personal DID: all human stages miss; final voicemail produces exactly one
   playable task assigned to the DID owner.
5. Send to Team: the sending employee is excluded; another employee receives
   a fresh 8-second offer.
6. Race: two employees answer together; exactly one call bridges and every
   losing offer says Answered elsewhere.
7. Two portal tabs: only one SignalWire client registers.
8. Primary tab closes: presence expires and later calls do not offer there.
9. Revoked/unassigned test member: subscriber-token request is denied.
10. Employee history is self-only; founder view is company-wide.

Only after all personal tests pass, point `+12053515118` to the authenticated
shared route and run:

1. main line to browser answer;
2. main line browser miss to private-mobile DTMF `1`;
3. all stages missed to one unclaimed shared voicemail callback task; and
4. a final client-bundle, Worker-log, and R2/D1 inspection for credential,
   token, unmasked-number, private-mobile, encryption-key, and voicemail-URL
   leakage.

The release is accepted only after the correct eligible browsers ring, one
answer wins, two-way audio is stable, every timeout advances once, voicemail
creates one auditable task, and the prior private-mobile route remains ready
for configuration rollback.

## 8. Deployment command and monitoring

Deploy only the tested merged `main` revision, after separate explicit
deployment authorization, and only through the repository gate:

```powershell
npm run deploy
```

Capture the merged Git SHA, Worker version ID, D1 migration result, safe
provider resource IDs, cost-gate evidence, route configuration, and smoke-test
result. Never record credentials, tokens, caller numbers, the private fallback,
or voicemail access URLs.

During the initial production window, monitor provider failures, token issuance
denials, acceptance latency, stale presence, duplicate callback attempts,
voicemail ingestion failures, concurrent legs, and usage/spend. Keep live-call
recording, transcription, and AI participation disabled.

## 9. Configuration-first rollback

Rollback does not delete data or release numbers:

1. Restore `+12053515118` and all five personal DIDs to the verified existing
   private-mobile route.
2. Disable Subscriber-token issuance by removing or rotating the dedicated
   Voice token binding, and force every `voice_presence` row Offline.
3. Revoke active Subscriber sessions/tokens at SignalWire.
4. Confirm no browser remains eligible and the fallback route rings.
5. Leave migration `0011` in place but dormant.
6. Retain the purchased DIDs unless the founder separately authorizes their
   release.
7. Redeploy the last verified `main` revision only if configuration rollback
   does not restore service.

Record the rollback timestamp, operator, affected lines using safe business
identifiers, verification calls, and final status. Do not claim recovery until
the fallback route has been proven by an actual authorized call.

## 10. Local verification evidence

Before this runbook was written, the isolated implementation produced:

- production `vinext build`: pass;
- full repository suite: **122/122 pass**;
- dedicated inbound route/schema suite: **3/3 pass**;
- task-owned ESLint: pass;
- task-owned TypeScript diagnostics: none;
- build freshness/config preflight: pass; and
- built-client secret-name, private-host, dummy-token, and private-mobile leak
  scan: zero matches.

These results establish a verified implementation artifact. They do not prove
provider checkout price, live Subscriber resources, live browser audio,
Cloudflare Access policy state, a D1 production migration, or a deployment.
Those remain post-`mi` release gates.
