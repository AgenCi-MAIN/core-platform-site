# INKBOX A2A — the 24/7 centralized main command

Strategy, 2026-08-18. Written against what is actually built, not what is
planned. Every claim about the current state is cited to the record or the
code; where something is unbuilt it says so rather than describing it in the
present tense.

---

## 0. The thing to be honest about first

There is no such thing as an always-on agent on this stack, and pretending
otherwise is how a command centre becomes a story people tell each other.

A Claude session is not a daemon. It exists while a turn is running and it
stops. Nothing keeps thinking between messages. So "24/7 command" cannot mean
"an agent that is awake" — it has to mean **something that fires on a clock,
and something that holds state between firings.**

The proof this works already exists and is the most valuable operational fact
in the record. A14 (OWNER-DECISIONS.md:31): the founder texted at 05:13Z, an
hourly routine fired **with no session open**, and a reply landed at 07:34:58Z
— Inkbox message `c79cec0d`, delivered. That is the entire architecture,
demonstrated end to end, once, in production.

Everything below is the disciplined version of that loop.

---

## 1. What is actually live today

| Asset | State | Evidence |
| --- | --- | --- |
| Inkbox plan, $30/mo | ✅ purchased | D3, evidenced by a provisioned Active number |
| Staff number `+1 689 689 1349` | ✅ Active on identity `@out-reach`, display "Mr.T" | D4 |
| Desk address `out-reach@inkboxmail.com` | ✅ live | B19 |
| Hourly auto-reply routine | ✅ **verified firing with no session open** | A14, `trig_019FZZts1LhN9KayiwG9Q7rE` |
| Auto-reply allowlist | ✅ three numbers only — Shawn, Ryan, Andrew | A14 |
| HERALD | ✅ hourly outreach & info logger | WORKFORCE.md:58 |
| WARDEN | ✅ analyses inbound email, files a DRAFT, **never sends** | B19 |
| ELITE_8 + A9/A10 — ten A2A seats | ✅ standing, briefed | A17, A19 |
| ELITE_8 — **armed** | ❌ **none of them** | README: "Promotion does not mean armed" |
| Inkbox API key | ❌ **deliberately none** — all deleted, none minted | B19, record §10d |

### The two open wounds

**D4 is off-spec and unresolved.** The decision said `incoming_call_action:
auto_reject` until a voice agent is deliberately briefed. What shipped reads
**Inkbox Voice AI**, and the number is a 689 area code (Orlando overlay) rather
than the Utah local specified. The record does not know whether that was a
deliberate owner change or Inkbox's default reasserting on provisioning — it
was asked and is unanswered.

**This is the single most important thing to fix before scaling anything.** A
24/7 command centre whose front door is answered by an un-briefed third-party
voice AI is not a command centre; it is an unmonitored agent talking to
strangers on the agency's line, while consent is still at counsel (E7b). Every
other item in this strategy is safe to defer. This one is not.

**HQ cannot act as the desk.** The Inkbox connection is bound to the `core`
identity; it can forward *to* `out-reach@inkboxmail.com` but cannot read or
answer *as* it (B19). Any design that assumes an agent reads the desk inbox is
assuming a capability that does not exist today.

---

## 2. What "main command" has to mean here

Four jobs, and they are genuinely different. Conflating them is the usual
failure.

1. **INTAKE** — something arrives. A text, an email, a call, a CI failure, a
   PR comment, a carrier notice.
2. **TRIAGE** — is this urgent, routine, or noise? Who owns it?
3. **ACTION** — reply, escalate, file, or do nothing on purpose.
4. **RECORD** — what happened, and can we prove it afterwards.

The A2A bench already maps onto these, which is why the seats are worth using
rather than reinventing: **COURIER** owns the message contract (job 1),
**LATTICE** owns who may hand work to whom (job 2), **LEASH** owns what an
agent is allowed to do (job 3), **LEDGER** and **DEADMAN** own the record and
the silence (job 4).

The one that decides whether this is safe is **DEADMAN**: *did anything
actually happen?* A 24/7 system's characteristic failure is not doing the
wrong thing — it is doing nothing and looking identical to doing nothing on
purpose.

---

## 3. The architecture

### 3.1 One clock, not many

The temptation is a routine per job. Resist it. Each routine is a separate
thing that can silently stop, and nobody notices a stopped routine — they
notice a wrong reply.

**One heartbeat routine, hourly**, which:

- reads the desk state,
- decides which of the standing jobs need running this hour,
- runs them,
- writes one line to a durable log whether or not anything happened.

That last clause is the whole discipline. **A heartbeat that only logs when
something happens cannot be distinguished from a heartbeat that has died.**
The log line for a quiet hour must exist and must say "quiet", which is
exactly the shape `ScheduleWakeup`'s `noop` flag exists for and exactly what
A14's routine already does implicitly.

### 3.2 The escalation ladder

Not everything deserves the same latency, and pretending it does is how you
get either a spammy assistant or a missed emergency.

| Tier | Example | Latency | Who acts |
| --- | --- | --- | --- |
| **0 — Auto-reply** | A verified number texts a question | ≤1 hour | The routine, within the A14 allowlist |
| **1 — Draft** | An unknown human emails the desk | ≤1 hour | WARDEN drafts, founder sends |
| **2 — Log only** | Marketing noise, newsletters, automated notices | next digest | HERALD logs, nobody acts |
| **3 — Wake the founder** | Carrier notice, a deploy that took the site down, a legal letter | immediate | Push, by name, with the reason |
| **4 — Stop everything** | Suspected breach, an unexplained privileged write | immediate | Halt routines, founder only |

Tier 3 needs a real channel. Today the only one that reaches the founder
without him looking is a text to a verified number — which the desk can
already send. **That is the pager, and it should be treated as one:**
deliberately rare, always actionable, never used for anything a digest could
carry. A pager that goes off for routine things is a pager that gets muted,
and a muted pager is worse than none because everyone believes it works.

Tier 4 exists because of A26. An unexplained privileged write happened once
and left no audit row. The ladder needs a rung that means *stop, do not
self-heal, get a human*.

### 3.3 What the command centre may do without asking

This is the leash, and it should be written down before anything is armed
rather than discovered afterwards.

**May, unattended:**
- Reply to the three A14-verified numbers, content only.
- Log anything, anywhere, always.
- Draft, and file the draft.
- Read the repo, the audit log, the deploy list, PR state.
- Fire a Tier-3 page to the founder.

**May not, ever, unattended:**
- Send to anyone off the allowlist.
- Change membership, roles, or capabilities.
- Deploy.
- Spend money.
- Touch client data.
- Answer a phone call as a person.
- Decide governance.

That second list is not a starting posture to be relaxed later. It is the
reason the first list is safe.

### 3.4 State between firings

A routine wakes with no memory. Whatever it needs must be somewhere durable.
Three candidates, and the choice matters:

- **The repo** — durable, versioned, reviewable, already the record of
  everything else. Slow to write, and every write is a commit. Right for
  decisions, logs, and anything a human will read later.
- **D1** — fast, queryable, already holds `audit_events` and now
  `member_requests`. Right for state with a lifecycle: what is pending, what
  was decided, what is still waiting.
- **The Inkbox thread itself** — the message history is state, and it is the
  one place a conversation's context genuinely lives. Right for "what did we
  already say to this person."

Use all three, deliberately, for what each is good at. The mistake to avoid is
putting lifecycle state in an append-only log — `member_requests` exists
precisely because `audit_events` can record that something was asked and can
never record what was decided.

---

## 4. Arming, in order

Ten seats are briefed and none is armed. Arming all ten at once is how you get
a system nobody can debug. The order below is chosen so each seat can be
verified before the next one depends on it.

**Phase 1 — see before you act.**
1. **A8 LEDGER.** Observability first. If you cannot prove what happened, you
   cannot safely arm anything that acts. Nothing else is armed until the log
   is trustworthy.
2. **A7 DEADMAN.** The silence detector. Armed second because from here on,
   every failure must be visible rather than quiet.

**Phase 2 — decide before you speak.**
3. **A4 COURIER.** The message contract: what a handoff looks like, how it is
   tracked, how it is finished.
4. **A5 LATTICE.** Who may hand work to whom. Constrains the graph before the
   graph has edges, which is far easier than pruning it later.

**Phase 3 — speak, carefully.**
5. **A3 LEASH.** Authority and attenuation — the enforcement of §3.3.
6. **A6 CAVEAT.** Confused deputy and injection. Armed *before* the system
   handles untrusted inbound, not after. Every inbound message is written by
   someone who is not us.

**Phase 4 — identity and trust.**
7. **A2 SEAL.** Why should I believe you are who you say.
8. **A1 CARDWRIGHT.** What can this agent do and what will it refuse.

**Phase 5 — quality gates, continuous.**
9. **A9 SPECTRUM** and 10. **A10 PLAINSPEAK.** Can it be seen; is it true.
These two are not part of the command loop — they audit what it produces, and
they earned their seats by finding defects a green test suite shipped past.

**One seat armed per week, minimum.** The constraint is not effort, it is
observation: a seat armed on Monday should be watched for a week before
another one changes the system underneath it.

---

## 5. The first ninety days

**Days 1–7 — close the wounds.**
- Settle D4. Either brief the voice agent deliberately and record that, or set
  `auto_reject` as the decision specified. Do not leave it ambiguous.
- Answer whether the 689 number stays. An Orlando area code on a Utah-local
  decision is either a change of mind or an accident, and the record should
  say which.
- Arm A8 LEDGER. Get one hour of heartbeat log with a quiet line in it.

**Days 8–30 — one loop, proven.**
- Arm A7 DEADMAN. Deliberately kill the routine and confirm the silence is
  detected. **A failure detector that has never detected a failure is a
  decoration.**
- Extend the A14 loop from "reply to three numbers" to "triage everything into
  the five tiers, act only on tier 0 and 1."
- Run the Tier-3 pager once, on purpose, at a time the founder expects it, to
  prove the channel works before it is needed.

**Days 31–60 — widen the intake.**
- Arm COURIER and LATTICE. Bring PR events, CI failures and deploy state into
  the same triage rather than a second parallel one.
- Add the daily digest: one message, once, containing everything that did not
  warrant waking anyone.

**Days 61–90 — trust, then delegate.**
- Arm LEASH and CAVEAT.
- Only now consider widening the auto-reply allowlist beyond three numbers,
  and only by named addition, never by rule.

---

## 6. How this fails, and the countermeasure for each

**It goes quiet and nobody notices.** The most likely failure by a wide
margin. Countermeasure: the heartbeat logs every hour including quiet ones,
and DEADMAN pages if a heartbeat is missed twice. Test it by killing the
routine on purpose.

**It becomes noise and gets muted.** Second most likely. Countermeasure: the
five-tier ladder, and a hard rule that Tier 3 is rare. If the founder mutes
the pager, the system has failed regardless of how correct it was.

**It replies to the wrong person.** Countermeasure: the A14 allowlist is three
numbers and widening it is a recorded decision, not a config change. Everything
else drafts.

**Someone talks it into something.** Every inbound message is untrusted input
written by a stranger. Countermeasure: CAVEAT armed before the intake widens,
and the §3.3 "may not, ever" list enforced in the prompt *and* by the fact that
the routine holds no credential that could do those things. The strongest leash
is not being able to.

**It does something and cannot prove it.** Countermeasure: LEDGER first, and
the same discipline the portal already follows — every allow and every deny
written down. Note the known hole: a D1 console statement writes no audit row
(A26). The command centre must never use that path.

**The founder becomes the bottleneck again.** The honest risk of a
draft-everything posture. Countermeasure: measure it. If WARDEN files thirty
drafts a week and twenty-eight are sent unchanged, that is evidence for
widening tier 0 — with a recorded decision, on that evidence.

---

## 7. What this is not

It is not a replacement for the founder's judgement, and the design should stop
pretending otherwise the moment it starts to. Every governance decision, every
membership change, every dollar, every deploy, and every word to a client stays
human. What the command centre buys is that **nothing arrives unseen and
nothing waits unattended** — the difference between a business that runs at
night and one that merely has a phone number at night.

The measure of success is not how much it does. It is how little the founder
has to check.

---

## 8. Open questions for the founder

1. **D4** — deliberate change or Inkbox default? And does the 689 number stay?
2. **What is a Tier 3?** Name three things that should wake you at 3am, and
   three that should absolutely not. The ladder is only as good as that list.
3. **Does the desk get its own session identity**, so an agent can read and
   answer as `@out-reach` rather than only forward to it? Today it cannot
   (B19), and that ceiling shapes everything above tier 1.
4. **Who is the second pair of eyes** when the founder is unavailable for a
   day? A 24/7 system with a single human escalation target has a single point
   of failure wearing a person's name.
