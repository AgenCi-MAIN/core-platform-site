# CORE / THRIVE — four-month execution plan

**Plan window:** August 17–December 16, 2026

**North star:** prove that CORE can turn one verified signal into one governed,
measurable loop: **Signal → Call → Carrier → Policy → Retention → Better
signal**.

This is an execution plan, not a promise of production, income, carrier
approval, or policy placement. The rank thresholds, signal economics, and
conversion assumptions remain proposed until owners approve them against live
contracts and observed data.

## The four-month outcome

By December 16, CORE should have one narrow operating lane running end to end:

1. an opportunity has permission, provenance, qualification context, and an
   accountable disposition;
2. one canonical deal record feeds the book, scoreboard, retention workflow,
   and approved announcements without re-entry;
3. Call Lab turns reviewed calls into evidence-backed coaching and scripts;
4. CarrierOS supports licensed-agent decisions without claiming guaranteed
   underwriting outcomes; and
5. leadership can see funnel health, quality, persistence risk, and data gaps
   from a single weekly scorecard.

The goal is not to launch every prototype at once. It is to make one loop
trustworthy, then expand it.

## Non-negotiable operating rules

- **One source of truth:** choose the canonical deal-entry owner in Month 1.
  Until that decision is made, integrations remain adapters rather than a
  second competing ledger.
- **Enter once, fan out:** humans must not be the integration layer between
  LeadTech, CORE, RetentionOS, and Discord.
- **No insured PII in Discord:** announcements contain only approved agent,
  production, and policy-count fields.
- **Permission before volume:** a signal is not releasable until source,
  contact permission, geography, qualification, and routing fit are recorded.
- **Human authority remains:** licensed agents and current carrier materials
  control product and underwriting decisions.
- **Deny by default:** every new portal read or write is protected by the
  appropriate server-side capability and audited.
- **No vanity automation:** a workflow is automated only after its owner,
  failure state, reconciliation rule, and rollback path are named.

## Month 1 — Decide, baseline, and instrument

**Dates:** August 17–September 16

**Theme:** establish one version of reality before adding automation.

### Deliverables

1. **Owner decision memo.** Owners select and record one operating model:
   CORE as canonical entry, RetentionOS as canonical ledger with CORE as the
   orchestration layer, or a formally approved consolidation path.
2. **Canonical data contract.** Define identifiers and required fields for
   signal, contact permission, call, agent, sub-agency, carrier/product,
   application, policy, disposition, placement, chargeback, and persistence.
3. **Baseline scorecard.** Measure the current four-week baseline for signal
   validity, contact, appointment, application, placement, early lapse,
   chargeback, duplicate entry, and time-to-disposition. Mark unavailable data
   as unknown rather than zero.
4. **Pilot charter.** Select one licensed geography, one accountable manager,
   3–5 agents, a limited carrier set, a weekly signal cap, and explicit stop
   conditions.
5. **Governance approvals.** Owners approve or revise signal funding terms,
   the illustrative quality reserve, rank gates, announcement fields, call
   recording/analysis consent, and retention review rules.
6. **Event instrumentation.** Create an event map and acceptance tests for the
   closed loop; every stage has an owner, timestamp, source, status, and reason
   code.

### Exit gate

Month 1 is complete only when the canonical system decision is signed, the
pilot cohort and geography are named, required-field completeness is at least
95% on test records, and leadership accepts the baseline scorecard. Do not
release paid volume while any of those are missing.

## Month 2 — Run one controlled signal-to-disposition pilot

**Dates:** September 17–October 16

**Theme:** prove operational control at low volume.

### Deliverables

1. **Verified Signal intake.** Validate provenance, permission, geography,
   need, qualification context, routing reason, duplicate status, and capacity
   before release.
2. **Capacity and routing controls.** Enforce agent licensing, declared
   availability, per-agent caps, acceptance timeout, rerouting, and a pause
   switch. No uncontrolled overflow queue.
3. **Accountable dispositions.** Use a small reason-code taxonomy for every
   outcome, including invalid, duplicate, out of scope, no contact, follow-up,
   application, and do-not-contact.
4. **Quality review.** Sample invalid and disputed signals weekly. Track the
   illustrative 15% reserve separately; do not represent it as an approved
   commercial term until owners execute one.
5. **Call Lab review cadence.** Review at least five calls per pilot agent per
   week across won, lost, and service outcomes. Produce one behavior-level
   coaching action per agent rather than generic scores.
6. **Weekly operating review.** Manager reviews funnel conversion, speed,
   quality exceptions, compliance exceptions, agent capacity, and unresolved
   records; the owner decides continue, adjust, or pause.

### Exit gate

Advance only after two consecutive weekly cohorts meet all agreed thresholds,
at least 95% of released signals receive a disposition within the agreed SLA,
100% of pilot records have permission and provenance, and all critical
compliance exceptions are resolved. Conversion informs learning but never
overrides the compliance gate.

## Month 3 — Connect the systems and close the learning loop

**Dates:** October 17–November 16

**Theme:** eliminate duplicate work and turn outcomes into better decisions.

### Deliverables

1. **Single deal entry.** Implement one validated, idempotent deal record with
   a stable external key. Repeated submissions update or reconcile; they never
   create duplicate production or announcements.
2. **Audited fan-out.** Send the approved record to the canonical book,
   scoreboard, retention workflow, RetentionOS adapter, and central/sub-agency
   Discord destinations. Each delivery has pending, delivered, failed, and
   reconciled states.
3. **Safe announcements.** Discord payloads exclude customer name, contact
   details, health information, policy number, and free-text notes.
4. **CarrierOS pilot.** Publish versioned guidance for the limited pilot
   carrier set, with source date, state availability, escalation owner, and a
   visible reminder that carrier materials and underwriting control.
5. **Evidence-backed scripts.** Promote a script change only when linked to
   reviewed calls and an owner-approved hypothesis. Track version, use, and
   outcome; avoid declaring causation from small samples.
6. **Reconciliation dashboard.** Show missing identifiers, duplicate records,
   failed deliveries, stale dispositions, and mismatches between systems.

### Exit gate

Advance only when duplicate deal creation is zero in acceptance testing,
fan-out succeeds or visibly queues for reconciliation in at least 99% of pilot
transactions, no customer PII appears in test announcements, and every
CarrierOS entry has a current source and review owner.

## Month 4 — Validate retention, rank evidence, and scale readiness

**Dates:** November 17–December 16

**Theme:** decide what deserves expansion based on evidence, not excitement.

### Deliverables

1. **Cohort view.** Connect source, routing, call behaviors, application,
   placement, early retention signals, and chargebacks by weekly cohort. Longer
   persistence measures remain immature and must be labeled accordingly.
2. **Core Command queue.** Rank a limited set of explainable actions: pending
   requirements, stale follow-ups, licensing/routing conflicts, retention
   risks, coaching reviews, carrier escalations, and integration failures.
3. **Rank shadow report.** Calculate Ember–Zenith evidence without changing
   compensation. Show which proposed gates are measurable, which lack history,
   and how many agents would qualify under the draft rules.
4. **Goal Engine calibration.** Replace illustrative defaults with editable,
   owner-approved pilot assumptions and display observed sample sizes beside
   rates. Continue to label outputs as planning estimates, not income claims.
5. **Operating playbook.** Document daily triage, weekly reviews, exception
   ownership, quality disputes, carrier-content updates, incident response,
   and pilot pause/rollback procedures.
6. **Scale decision.** Produce a written recommendation to expand one variable
   at a time—geography, agents, carrier set, or volume—or to hold and repair.

### Exit gate

The four-month plan closes with an owner-signed go/hold/stop decision. A **go**
requires stable data completeness and SLA performance for four consecutive
weeks, no unresolved critical compliance issue, reconciled fan-out, named
operators for every recurring workflow, and unit economics that remain viable
under conservative assumptions.

## Weekly executive scorecard

Use cohort-based numerators and denominators; never show a percentage without
its sample size.

| Category | Weekly measures |
| --- | --- |
| Signal integrity | released, permission complete, provenance complete, duplicate, invalid, disputed, reserve used |
| Funnel | accepted, contacted, appointments, applications, placed, not-taken, time at each stage |
| Customer protection | do-not-contact compliance, recording consent, critical exceptions, unresolved complaints |
| Agent execution | speed to first action, disposition SLA, follow-up completion, reviewed calls, coaching action completion |
| Book quality | pending requirements, early lapse indicators, chargebacks, replacement activity, mature persistence when available |
| System health | required-field completeness, duplicate deals, failed fan-outs, reconciliation age, stale carrier guidance |
| Economics | funded capacity, verified/released amount, acquisition cost, handling cost, placement contribution, downside scenario |

Owners set numeric targets after Month 1 baselining. The universal control
targets are 100% permission/provenance on released signals, zero critical
compliance exceptions left unresolved, zero customer PII in announcements,
and zero silent integration failures.

## Operating cadence and accountability

| Cadence | Owner | Decision/output |
| --- | --- | --- |
| Daily, 15 minutes | Pilot manager | exceptions, stale work, capacity changes, pause/reroute decisions |
| Twice weekly | Call/quality reviewer | reviewed calls, one coached behavior per agent, script evidence candidates |
| Weekly, 45 minutes | Pilot manager + owners | cohort scorecard, economics, compliance, continue/adjust/pause decision |
| Biweekly | Product/engineering owner | reconciliation defects, instrumentation gaps, release scope |
| Month-end | Owners | exit-gate sign-off and next-month authorization |

Every action has one directly responsible owner. “Team” is not an owner.

## What is deliberately deferred

- broad multi-state or all-agent rollout;
- automatic underwriting or product recommendations without licensed review;
- compensation changes based on the draft rank model;
- model-driven writes or autonomous external actions;
- predictive lead scoring before outcome labels are reliable;
- polished dashboards that do not improve an operating decision; and
- claims about 13-month persistence before cohorts have actually matured.

## First seven days

1. Hold the 60-minute owner decision meeting on the canonical system and pilot
   lane.
2. Name the pilot manager, compliance reviewer, data owner, and integration
   owner.
3. Approve the canonical identifiers and minimum required fields.
4. Export the prior four weeks of available funnel and quality data for the
   baseline; create an explicit missing-data register.
5. Select the pilot agents, geography, carrier subset, volume ceiling, and stop
   conditions.
6. Schedule the daily pilot stand-up and weekly owner gate review for all four
   months.
7. Publish the Month 1 decision log so unresolved governance choices cannot be
   mistaken for product requirements.
