# Fleet report 04 — TCPA / recording / licensing compliance architecture (066/067 lanes)

Delivered 2026-08-15. Analysis only — not legal advice; the counsel list at
the end is part of the deliverable. Multi-source confirmed except where
noted. This fills the blind spot present in all three advisory installments.

## Current state, August 2026 — the headlines

- **The FCC one-to-one consent rule is dead.** Vacated unanimously by the
  Eleventh Circuit (*Insurance Marketing Coalition v. FCC*, Jan 24, 2025 —
  one business day before effect); FCC formally deleted it from the CFR in
  Sept 2025. The pre-2023 status quo governs: prior express written consent
  (PEWC), multi-seller consent permissible. The *legal* floor dropped back;
  the *market* evidence standard (TrustedForm/Jornaya certificates on every
  lead) did not.
- **Revocation rules partially in force.** Since April 11, 2025: revocation
  in "any reasonable manner," honored within 10 business days, STOP-type
  keywords per-se. The **cross-channel "revoke-all" component is delayed to
  January 31, 2027** — build for it now anyway.
- **Litigation is at record volume**, concentrated in two serial-plaintiff
  theories: quiet-hours suits (called party's local time, ~8am–9pm; one FL
  firm filed ~456 of them) and DNC-registry suits. After *McLaughlin v.
  McKesson* (SCOTUS, June 2025), district courts aren't bound by FCC
  interpretations — build to the statute's strictest plausible reading.
- **Two of THRIVE's seven target states carry the sharpest state laws:**
  Florida's FTSA (private right of action, $500–$1,500/violation, 8am–8pm,
  3-call/24hr cap) and **Texas SB 140** (eff. Sept 1, 2025: texts covered,
  registration + $10K deposit unless exempt, private action via DTPA).

## The Tampa problem

Six target states are one-party recording consent; **Florida is all-party —
and a violation is a felony plus a civil cause of action.** A Tampa office
recording calls needs all-party consent on every call regardless of where
the consumer sits. With consumers in ~48 states, the only operable policy:
**automated recording disclosure on 100% of calls, every leg, everywhere**,
played before substantive content, captured in the recording itself,
re-run on transfers, with off-platform agent calls prohibited.

## Where inbound-first risk actually concentrates

1. **"Inbound" calls that aren't** — a lead vendor's transferred call is
   legally the *vendor's outbound dial*, and seller-liability doctrine
   reaches THRIVE. The largest hidden exposure in the model. Controls:
   consent proof per transfer, vendor contracts with warranties/indemnity,
   audit rights, no sub-affiliate opacity.
2. Callbacks to missed calls (EBR windows: 3-month inquiry / 18-month
   transaction; never call back a vendor transfer without independent PEWC).
3. Outbound re-dials on web leads — full outbound rules: 31-day DNC scrub,
   quiet hours by the lead's local time, FTSA call caps.
4. SMS follow-ups — PEWC per channel, near-real-time STOP handling, TX SB
   140 analysis before texting Texans.
5. Predictive dialing — recommendation: prohibit entirely; click-to-dial only.

## Licensing at 1,000 agents

Non-resident licensing via NIPR reciprocity: roughly **$2,500–$4,000 per
agent** for a 48-state footprint, with renewals arriving continuously on
birth-month cycles. Appointments: carrier-paid but recovered from agency
economics, $0–$60 per agent/carrier/state — argue **just-in-time
appointments**. The load-bearing rule: **only licensed (and appointed)
agents may solicit, negotiate, or quote on a transferred call, in the
consumer's state** — so the dialer must route by consumer state against a
live license/appointment table, making an unlicensed transfer *technically
impossible*, not just prohibited. Fronter scripts must stay on the
non-solicitation side of each state's line, QA-enforced. Platform
(AgentSync / Sircon / SureLC) plus 2–4 licensing-ops staff **before agent
#200**.

## What acquirers and carriers diligence (the data room, in advance)

Consent artifact retrievable for any phone number within hours (5-year
retention — FTC TSR floor); TCPA demand-letter log and dispositions;
approved-vendor list with signed consent warranties; NAIC complaint index
and DOI record (know your own before the buyer does); FE-specific quality
telemetry (persistency, chargebacks, replacements, free-look cancels — by
office and agent); 100% recording + QA program; zero unlicensed-solicitation
incidents with routing-control evidence.

## Leader-vetting screen (feeds the program's §9)

NIPR PDB history · state DOI enforcement databases per licensed state ·
FINRA BrokerCheck where applicable · **Vector One debit-balance check**
(unpaid advances live nowhere else and silently break carrier appointments)
· criminal background with **18 U.S.C. § 1033** screening (dishonesty
felonies federally bar insurance work absent a state waiver) · civil
litigation/judgment search · prior carrier termination-for-cause inquiries.
Annual re-screen for incumbents.

## The five compliance gates (now embedded in the Earn Your City draft, §9)

1. **Leader gate** — full screen cleared in writing before an offer.
2. **Licensing gate** — cohort licensed + appointed, routing table loaded
   and tested, before first live transfer.
3. **Telephony gate** — dialer audit signed: DNC current, quiet-hour blocks
   on, recording disclosure verified on all legs, no predictive modes,
   revocation keywords wired.
4. **Lead-source gate** — approved vendors only, payment-controlled; no
   local side buying.
5. **QA/complaint gate** — QA sampling live from day one; complaint intake
   wired to HQ; 60-day post-launch audit scheduled before ramp.

## Requires licensed counsel (verbatim from the analyst)

Consent language and lead-purchase agreements · TX SB 140
registration/exemption and FTSA flow analysis · TSR/McCarran-Ferguson and
state telemarketer-registration analysis for all seven states · multi-state
recording policy sign-off · fronter/agent script boundary per state
solicitation definitions · post-*McLaughlin* reliance posture and demand
responses · § 1033 waivers if ever needed.

Confidence notes: one-to-one deletion, revoke-all delay to Jan 31 2027, and
TX SB 140 are multi-source confirmed. Re-verify before final publication:
the Sept 2025 CFR-deletion date (single blog source) and exact per-state
appointment fees (use NIPR/state schedules when budgeting). Full source
list retained in the fleet transcript — keys: 11th Cir. *IMC v. FCC*;
FCC orders on revocation timing; Paul Hastings / Morgan Lewis on SB 140;
Bradley / McGuireWoods on FTSA; NIPR/state fee schedules; Vector One.
