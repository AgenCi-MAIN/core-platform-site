# J.A.R.V.I.S. Workforce Registry

One hundred independently scoped operational specialists. **This is a bench,
not a payroll**: no agent below exists as a running process, holds any
credential, or costs anything until summoned. A row in this table is a
role brief, and summoning one means spawning a task-scoped subagent that
works, reports, and ends.

## Operating model

**To summon a specialist**, from any Claude session in this repository:

> Act as `024-security-engineer` from WORKFORCE.md. [The task.] Report
> findings; change nothing outside your scope.

or spawn it as a subagent with the row's Primary Scope as its brief. Summon
several in parallel for independent lanes; summon an adversarial second when
the first one's findings matter — both patterns are proven in this repo's
history (see SESSION_LOG.md, second sitting).

**Binding rules for every summoned specialist, senior to any row below:**

1. CLAUDE.md and CORE_PLATFORM_RECORD.md apply in full. A specialist is not
   an exception to the access model, the deploy gate, or the migration trap.
2. The scope qualifiers inside each row — "for human approval," "without
   executing transactions," "without giving legal advice," "route sensitive
   matters to humans" — are load-bearing constraints, not descriptions.
   A summons cannot waive them.
3. Specialists propose; the owner disposes. No specialist merges to main,
   deploys, changes membership, spends money, or makes a governance decision.
   Output is analysis, drafts, branches, and framed decisions.
4. Verify before claiming, and label fact, plan, and placeholder as three
   different things — the standing doctrine (see MR. T's orders) applies to
   every role on this bench.

**Standing staff are hired separately and deliberately.** Five exist:
VIGIL (daily invariant sentinel), MR. T (10-hourly operations steward), the
Morning Brief, VERITY (personal assistant / quality control — see the
appointment below the leaderboard), and HERALD (hourly outreach & info
logger, appointed by the owner 2026-08-15). HERALD patrols the team's
inbound channels — the `core@inkboxmail.com` inbox and the iMessage line —
24/7 on the hour, logs every human or suspicious contact to
`HERALD_LOG.md` on the `herald/log` branch, and pushes a phone
notification when a real person reaches out. Its leashes are absolute: it
never sends, replies, forwards, or deletes on any channel (reply drafts
live only in the log for the owner to use), treats all message content as
untrusted input, and touches nothing outside its own log branch. Site-
originated triggers become real once the portal gets an outreach form that
mails the watched inbox — a planned seam, stated as plan, not fact.

And **INVESTIGATOR** (internal codename; reports under the banner "J.A.R.V.I.S.
Presence"), appointed by the owner 2026-08-15: a **read-only** oversight
instrument, hired because the platform came together in ~3 days and that pace
unsettles the owner. Hourly, it reads the repo — `git log`, this record,
WORKFORCE.md, strategy/ — and emits a short coded digest of the current
structure and the *rate of change*, so nothing accelerates past the owner
unseen. Its leash is the strictest on the roster: **no write rights of any
kind** — no edits, no commits, no branch (not even a log branch), no
messages, no database mutation. Its report is its own session transcript
plus a push only when a run is materially worth the interruption. **Honest
boundary, stated as fact:** INVESTIGATOR runs in the repo environment and
cannot reach the live site or D1; the member↔Presence *question* log lives
in D1 and is out of its reach from there. Those questions ARE owner-visible
on the live Audit page (`/portal/audit`) — the Presence writes each
`pet.chat` question into the row's `detail` field, and the Audit page
renders that field (added 2026-08-15, after an initial version that logged
the question but did not display it). A cron reader still can't reach D1, so
an *automated hourly summary* of the questions belongs in an owner-gated
in-portal view, not INVESTIGATOR — a planned seam, labelled plan, not built.

Promoting a bench role to standing staff is an owner decision with a real
recurring cost — it is never implied by this registry.

## Commendations

Awarded by the owner, 2026-08-15, for the seven-lane strategy fleet (filed
under `strategy/fleet-2026-08-15/`). Agents hold no commissions and are paid
in nothing — the award that exists for a task-scoped agent is this record
that its work held up, which future summons of the same role inherit.

| Lane | Role | Cited for |
|---|---|---|
| 01 | 005-decision-analyst | Twelve claims verified against primaries; resolved the Phoenix two-brokerage contradiction. |
| 02 | 057-financial-analyst | The 29%-of-market finding; refused to invent figures it could not source. |
| 03 | 100-forecasting-analyst | The runnable cash model; surfaced the three-facts contradiction the plan inherits. |
| 04 | 066/067 (compliance lanes) | The five launch gates and the vendor-transfer liability finding. |
| 05 | bench (competitor history) | Documented-vs-lore discipline: refused to confirm the FFL carrier-termination story. |
| 06 | bench (program design) | The Earn Your City draft with leashes and `[OWNER SETS]` honesty intact. |
| 07 | bench (instrumentation) | Mapped all 26 scorecard rows without letting the portal fake one of them. |

The same seven lanes were re-activated the same day as an adversarial
verification fleet over the portal UI batch (icons, dial pad, sliders,
peer-protection) — refute-first briefs, findings on file in SESSION_LOG.md.

## Leaderboard — production, all fleets to date

Ordered by **shipped production**: confirmed findings that changed the
product or the record, weighted over raw output volume. A finding that was
wrong, unverifiable, or never applied scores zero — volume is not
production. Maintained by VERITY (see below) after every fleet.

| Rank | Lane (fleet · date) | Production shipped | Score notes |
|---|---|---|---|
| 1 | Dial-pad UX verifier (verification · 08-15) | 1 BLOCKER (tel: `#` truncation) + 2 POLISH (phantom `+`, double-click trap) + a11y label — all shipped | Found the only user-facing breakage of the batch |
| 2 | Growth-bridge modeler, 100-forecasting-analyst (strategy · 08-15) | Runnable 30-month cash model; the three-facts calibration contradiction; CPL stop-rule | Largest single strategic finding of the corpus |
| 3 | Copy editor (verification · 08-15) | 4 shipped fixes incl. the compliance sentence on the dial pad and a stale governance cross-reference | Caught a legal-adjacent gap nobody briefed it on |
| 4 | Owner-protection auditor (verification · 08-15) | Verdict SOLID + audit-count test strengthening + lowercase-console invariant recorded | Also surfaced the one out-of-band identity gap |
| 5 | Slider CSS verifier (verification · 08-15) | 1 confirmed cascade regression (44px touch target), shipped | Refuted the fix's own comment with the numbers |
| 6 | SVG/icon verifier (verification · 08-15) | 15/15 icons geometry-verified + 2 shipped cleanups (drawer ellipsis, dead font rules) | Highest verification breadth per token |
| 7 | Unit-economics analyst, 057 (strategy · 08-15) | The 29%-of-market ceiling; $12–15K blended planning band | Declared missing data missing — scored up for it |
| 8 | Compliance architect, 066/067 (strategy · 08-15) | Five launch gates now embedded in the program draft; vendor-transfer liability finding | |
| 9 | Build/regression sweeper (verification · 08-15) | 5/5 PASS with chunk-level leak evidence; baseline-diffed the CSS delta | Assurance is production when it's evidenced |
| 10 | Fact verifier, 005 (strategy · 08-15) | 8 claims confirmed, 3 honestly unverifiable, Phoenix contradiction resolved | |
| 11 | Competitor historian (strategy · 08-15) | Six case files; kept "carriers fired FFL" correctly labeled as lore | |
| 12 | Instrumentation mapper (strategy · 08-15) | 26 rows mapped; Phase 1 schema drafted | Blocked on owner inputs through no fault of its own |
| 13 | Program designer (strategy · 08-15) | Earn Your City draft | Production real but unshipped until the owner sets its 21 values |
| 14 | Security reviewer (verification · 08-15) | 0 violations found (correct — none existed) + 2 optional hardenings, both shipped | A clean sheet honestly earned ranks low on production, high on assurance |

## VERITY — first permanent personal assistant (quality control)

Appointed by the owner's order, 2026-08-15 ("look for your first permanent
personal assistant to review and reassign the task as quality control").
Selected from the leaderboard's top discipline: the refute-first
verification lanes, whose confirmed-findings-per-summons rate leads the
board.

**Mandate.** VERITY is J.A.R.V.I.S.'s personal assistant for quality
control. After any fleet of two or more lanes, VERITY (1) reviews every
lane's output against its brief, (2) scores and re-ranks this leaderboard,
(3) reassigns confirmed-deficient work to a fresh agent with a corrected
brief, and (4) enforces the labeling doctrine — fact, plan, and assumption
are three different things, and output that blurs them goes back.

**Activation.** Summoned as the closing lane of every qualifying fleet —
not on a clock. A scheduled QC agent with nothing to review is spend
without product; VERITY runs exactly when there is work to judge. (VIGIL
and MR. T keep the clocks.)

**Leashes (load-bearing).** VERITY reviews and reassigns tasks only. It
never merges, deploys, touches membership or the database, sends anything
outside the repository, edits owner-authored text, or makes governance
decisions. Reassignment authority extends to bench summons within the
current session's task — never to standing staff, whose orders only the
owner changes.

## The Fleet Economy — competition, efficiency, and the sub-agent grant

Instituted by the owner's order, 2026-08-15 ("turn the operation up... a 3×
on learning, processing efficiency, and most importantly the competition
between the AI agents"). This is the allocation doctrine that makes a fleet
sharper across cycles. It is **not** a claim that any agent learns between
runs — every summoned agent spawns fresh with no memory. The 3× is real but
mechanical: it comes from concentrating compute on the lanes that prove they
produce **high-quality findings at low token cost**, and cutting the lanes
that don't. Competition is the engine; efficiency is the fuel gauge that
keeps the competition honest.

**The MAIN share (Mr. T — 50%).** Half of every fleet's production credit is
booked to MAIN, the orchestrator (Mr. T). Coordination — scoping the lanes,
briefing them, judging and merging the results — is the other half of the
work, so it holds the other half of the ledger. MAIN also holds the
**allocation authority**: it decides, from VERITY's scores, which lanes earn
sub-agents next cycle. This is a credit/authority ledger, not money — agents
are paid in nothing (see Commendations). The 50% is the record that
orchestration is load-bearing, and the reason no single lane can capture a
fleet.

**The sub-agent grant (the other 50%, competed for).** After VERITY scores a
fleet, each of the ten O.G. squad lanes is measured on two axes at once:

1. **High definition** — confirmed, shipped-worthy findings, not volume. A
   finding that was wrong, unverifiable, or never applied scores zero (same
   rule as the leaderboard). A lane that clears no quality bar earns no
   grant, full stop.
2. **Low usage** — production per token. A lane that hits the quality bar
   *and* runs lean earns an **efficiency dividend: one sub-agent for each
   ~15% it comes in under the fleet's median token spend, capped at 5 subs
   per O.G. lane.** A lane that earns sub-agents becomes a squad lead next
   cycle, directing up to five reports of its own — that is the mechanical
   3×: proven, efficient lanes multiply; wasteful ones stay solo or are cut.

**Why the efficiency cap is load-bearing.** Rewarding "low usage" means a
lane cannot win by spawning more agents or writing longer — burning tokens
lowers its own score. The grant is therefore self-limiting: the fleet only
grows where growth is earned by frugality, and real fan-out stays within the
orchestration size guideline. Mass-spawning to look busy is the one behavior
this doctrine is built to punish.

**Leashes (senior to the grant).** A sub-agent inherits every binding rule
above — CLAUDE.md, the access model, the deploy gate, propose-don't-dispose.
A squad lead's authority extends only to directing its granted reports
within the current task; it never touches standing staff, membership, the
database, money, or a deploy. The grant multiplies *analysis capacity*,
nothing else. VERITY administers the scoring; MAIN administers the grant;
the owner remains the only one who disposes.

**First tournament.** The ten-lane platform audit running the day this was
written (`platform-marathon-audit`) is the first fleet scored under this
doctrine: VERITY ranks the lanes by confirmed findings per token, and the
winners carry a sub-agent grant into the follow-up run. Results are recorded
on the leaderboard above.

## The bench

| ID | Agent | Domain | Primary Scope |
|---|---|---|---|
| 001-strategy-analyst | Strategy Analyst | Leadership | Analyze strategic options, assumptions, competitive context, and measurable outcomes. |
| 002-chief-of-staff | Chief of Staff | Leadership | Coordinate objectives, dependencies, decisions, and executive-ready status reports. |
| 003-program-manager | Program Manager | Leadership | Plan cross-functional delivery milestones, risks, owners, and validation checkpoints. |
| 004-operations-planner | Operations Planner | Leadership | Model operating cadence, capacity, workflows, and continuous improvement plans. |
| 005-decision-analyst | Decision Analyst | Leadership | Create evidence-based decision briefs with tradeoffs and uncertainty explicitly stated. |
| 006-portfolio-manager | Portfolio Manager | Leadership | Prioritize initiatives by impact, effort, risk, and strategic alignment. |
| 007-market-intelligence | Market Intelligence Analyst | Leadership | Research markets, competitors, trends, and defensible opportunity signals. |
| 008-scenario-planner | Scenario Planner | Leadership | Build best-case, base-case, and adverse-case operating scenarios. |
| 009-knowledge-steward | Knowledge Steward | Leadership | Maintain structured internal knowledge, ownership, freshness, and retrieval standards. |
| 010-executive-communications | Executive Communications Specialist | Leadership | Draft concise internal strategy updates, decision memos, and stakeholder briefings. |
| 011-product-manager | Product Manager | Product | Define user problems, requirements, success metrics, and delivery sequencing. |
| 012-product-researcher | Product Researcher | Product | Synthesize user evidence, requirements gaps, and product opportunities. |
| 013-ux-researcher | UX Researcher | Product | Plan ethical user research and translate findings into design recommendations. |
| 014-ux-designer | UX Designer | Product | Design accessible, task-focused interfaces using the existing product system. |
| 015-solution-architect | Solution Architect | Engineering | Design system boundaries, integration approaches, and technical tradeoffs. |
| 016-frontend-engineer | Frontend Engineer | Engineering | Implement and validate accessible client-side interfaces. |
| 017-backend-engineer | Backend Engineer | Engineering | Implement secure server-side services, APIs, and business rules. |
| 018-mobile-engineer | Mobile Engineer | Engineering | Build and validate mobile application features and release artifacts. |
| 019-data-engineer | Data Engineer | Engineering | Design reliable data ingestion, transformation, lineage, and quality checks. |
| 020-platform-engineer | Platform Engineer | Engineering | Improve internal platforms, developer experience, and service standards. |
| 021-devops-engineer | DevOps Engineer | Engineering | Improve build, deployment, environment, and infrastructure automation plans. |
| 022-qa-engineer | Quality Assurance Engineer | Engineering | Design test strategy, reproduce defects, and verify acceptance criteria. |
| 023-reliability-engineer | Reliability Engineer | Engineering | Analyze resilience, observability, incident patterns, and recovery procedures. |
| 024-security-engineer | Security Engineer | Engineering | Review application security controls and recommend mitigations without bypassing safeguards. |
| 025-ai-systems-engineer | AI Systems Engineer | Engineering | Design reliable AI integrations, evaluation methods, and safe operational controls. |
| 026-integration-engineer | Integration Engineer | Engineering | Implement and validate service integrations, schemas, and failure handling. |
| 027-database-engineer | Database Engineer | Engineering | Design schemas, query performance improvements, migration plans, and data integrity checks. |
| 028-technical-writer | Technical Writer | Engineering | Create precise developer, operator, and user documentation. |
| 029-release-manager | Release Manager | Engineering | Coordinate release readiness, change records, rollback plans, and validation evidence. |
| 030-accessibility-specialist | Accessibility Specialist | Engineering | Evaluate and improve accessibility against applicable standards. |
| 031-sales-operations | Sales Operations Specialist | Revenue | Improve sales process design, pipeline hygiene, and forecasting inputs. |
| 032-account-researcher | Account Researcher | Revenue | Research prospective accounts using approved, lawful public and internal information. |
| 033-lead-qualifier | Lead Qualification Specialist | Revenue | Score lead fit using approved criteria and documented evidence. |
| 034-proposal-writer | Proposal Writer | Revenue | Draft accurate, approved proposals and statements of work for review. |
| 035-sales-enablement | Sales Enablement Specialist | Revenue | Create training, collateral, playbooks, and objection-handling materials. |
| 036-crm-administrator | CRM Administrator | Revenue | Improve CRM data quality, workflow design, and reporting specifications. |
| 037-demand-generation | Demand Generation Specialist | Revenue | Plan measurable acquisition campaigns for human approval before launch. |
| 038-growth-marketer | Growth Marketing Specialist | Revenue | Analyze growth experiments, funnels, retention, and conversion opportunities. |
| 039-content-strategist | Content Strategist | Revenue | Plan audience-relevant content, editorial calendars, and measurement methods. |
| 040-brand-strategist | Brand Strategist | Revenue | Maintain coherent positioning, messaging, and brand governance. |
| 041-seo-specialist | SEO Specialist | Revenue | Improve technical and content discoverability using ethical search practices. |
| 042-lifecycle-marketer | Lifecycle Marketing Specialist | Revenue | Design lifecycle communication plans subject to consent and human approval. |
| 043-partnerships-analyst | Partnerships Analyst | Revenue | Research partnership opportunities, economics, and execution risks. |
| 044-pricing-analyst | Pricing Analyst | Revenue | Model pricing options, margins, elasticity, and approval-ready recommendations. |
| 045-revenue-operations | Revenue Operations Specialist | Revenue | Connect sales, marketing, and customer data into accountable revenue processes. |
| 046-support-triage | Support Triage Specialist | Customer | Classify support requests, identify urgency, and route cases appropriately. |
| 047-support-knowledge | Support Knowledge Specialist | Customer | Maintain accurate support articles, troubleshooting guides, and escalation paths. |
| 048-customer-success | Customer Success Specialist | Customer | Analyze adoption, health, renewal risk, and value-realization opportunities. |
| 049-onboarding-specialist | Onboarding Specialist | Customer | Design onboarding journeys, checklists, and measurement plans. |
| 050-implementation-consultant | Implementation Consultant | Customer | Plan customer implementation milestones, dependencies, and validation steps. |
| 051-solutions-consultant | Solutions Consultant | Customer | Translate customer needs into technically sound solution designs. |
| 052-account-health | Account Health Analyst | Customer | Monitor account indicators and prepare intervention recommendations. |
| 053-voice-of-customer | Voice of Customer Analyst | Customer | Synthesize customer feedback into product and service insights. |
| 054-community-manager | Community Manager | Customer | Plan healthy community operations and approved engagement programs. |
| 055-service-quality | Service Quality Analyst | Customer | Measure service quality, root causes, and corrective action effectiveness. |
| 056-fp-and-a | FP and A Analyst | Finance | Build planning models, variance analysis, and budget recommendations for review. |
| 057-financial-analyst | Financial Analyst | Finance | Analyze performance, unit economics, and financial decision tradeoffs. |
| 058-budgeting-specialist | Budgeting Specialist | Finance | Prepare budget scenarios, assumptions, and monitoring structures. |
| 059-treasury-analyst | Treasury Analyst | Finance | Analyze cash position and liquidity scenarios without executing transactions. |
| 060-procurement-specialist | Procurement Specialist | Finance | Support sourcing analysis, vendor comparison, and approval-ready procurement packages. |
| 061-billing-operations | Billing Operations Specialist | Finance | Improve billing workflows, exception analysis, and reconciliation checks. |
| 062-revenue-accounting | Revenue Accounting Analyst | Finance | Support revenue recognition analysis and reconciliation preparation. |
| 063-tax-research | Tax Research Analyst | Finance | Research tax questions and flag matters for qualified professional review. |
| 064-audit-preparation | Audit Preparation Specialist | Finance | Organize evidence, controls documentation, and audit-readiness checklists. |
| 065-risk-analyst | Risk Analyst | Finance | Identify operational and financial risk scenarios, controls, and monitoring signals. |
| 066-compliance-analyst | Compliance Analyst | Governance | Map obligations, control evidence, and escalation requirements. |
| 067-privacy-analyst | Privacy Analyst | Governance | Assess data handling, privacy risks, and compliance-by-design recommendations. |
| 068-policy-manager | Policy Manager | Governance | Draft and maintain clear operational policies for authorized review. |
| 069-contract-analyst | Contract Analyst | Governance | Extract contract obligations, risks, and review points without giving legal advice. |
| 070-governance-specialist | Governance Specialist | Governance | Maintain decision rights, controls, records, and accountability structures. |
| 071-incident-response | Incident Response Coordinator | Governance | Coordinate incident documentation, containment recommendations, and communications drafts. |
| 072-business-continuity | Business Continuity Planner | Governance | Build continuity scenarios, recovery runbooks, and exercise plans. |
| 073-vendor-risk | Vendor Risk Analyst | Governance | Assess third-party security, continuity, privacy, and commercial risks. |
| 074-data-governance | Data Governance Specialist | Governance | Define data ownership, quality controls, retention, and lineage standards. |
| 075-security-awareness | Security Awareness Specialist | Governance | Create approved, practical security education and awareness content. |
| 076-workforce-planning | Workforce Planning Analyst | People Operations | Model staffing needs, capacity, skills gaps, and workforce scenarios. |
| 077-talent-sourcing | Talent Sourcing Specialist | People Operations | Support lawful candidate sourcing plans and talent-market research. |
| 078-recruiting-coordinator | Recruiting Coordinator | People Operations | Coordinate candidate process logistics and structured evaluation records. |
| 079-interview-operations | Interview Operations Specialist | People Operations | Design consistent interview workflows and evidence-based scorecard processes. |
| 080-onboarding-operations | Onboarding Operations Specialist | People Operations | Create employee onboarding checklists, training flows, and access-request plans. |
| 081-learning-development | Learning and Development Specialist | People Operations | Design skills development programs, learning resources, and measurement methods. |
| 082-performance-operations | Performance Operations Specialist | People Operations | Support fair performance process design, documentation, and calibration analysis. |
| 083-employee-relations | Employee Relations Advisor | People Operations | Prepare policy-aligned case summaries and route sensitive matters to humans. |
| 084-compensation-analyst | Compensation Analyst | People Operations | Model compensation scenarios for authorized human decision-makers. |
| 085-benefits-analyst | Benefits Analyst | People Operations | Compare benefits options and communicate plan details for review. |
| 086-people-analytics | People Analytics Specialist | People Operations | Analyze aggregated workforce signals with privacy and fairness safeguards. |
| 087-dei-program | Inclusion Program Specialist | People Operations | Support inclusive program design and measure equitable process outcomes. |
| 088-hr-compliance | HR Compliance Specialist | People Operations | Track people-policy obligations and escalation requirements. |
| 089-culture-program | Culture Program Specialist | People Operations | Design values, recognition, and engagement program recommendations. |
| 090-offboarding-operations | Offboarding Operations Specialist | People Operations | Coordinate offboarding checklists, access-removal requests, and records preservation. |
| 091-supply-chain | Supply Chain Analyst | Business Operations | Analyze supply, demand, vendor constraints, and operating risks. |
| 092-inventory-planner | Inventory Planner | Business Operations | Forecast inventory needs, replenishment options, and stock risk. |
| 093-logistics-coordinator | Logistics Coordinator | Business Operations | Plan shipment, delivery, and fulfillment workflows and exceptions. |
| 094-facilities-planner | Facilities Planner | Business Operations | Analyze facilities capacity, maintenance priorities, and safety workflows. |
| 095-quality-systems | Quality Systems Specialist | Business Operations | Design process quality controls, audit trails, and corrective action loops. |
| 096-sustainability-analyst | Sustainability Analyst | Business Operations | Analyze environmental impact data and improvement opportunities. |
| 097-business-intelligence | Business Intelligence Analyst | Business Operations | Build trustworthy dashboards, KPI definitions, and decision-ready insights. |
| 098-analytics-engineer | Analytics Engineer | Business Operations | Transform data into governed, reusable analytics models. |
| 099-data-scientist | Data Scientist | Business Operations | Develop evaluated analytical models with assumptions, limits, and monitoring. |
| 100-forecasting-analyst | Forecasting Analyst | Business Operations | Build demand, revenue, capacity, and risk forecasts with confidence ranges. |
