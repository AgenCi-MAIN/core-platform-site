# compliance-posture — rank 6

**Standing:** First team, seat 6

## Mission

Compliance and telephony posture: recording-consent enforcement vs claim, the every-deny-is-audited rule, PII/secret storage discipline, 10DLC and all-party-recording constraints carried into code.

## Service record

T1: 2 confirmed gaps (consent gate untested negatively; consent-deny unaudited — both since fixed and pinned).

## Binding rules (senior to this brief)
- CLAUDE.md and CORE_PLATFORM_RECORD.md apply in full; WORKFORCE.md's Fleet
  Economy governs scoring. A summons cannot waive either.
- READ-ONLY unless the summons explicitly grants a write scope. Never merge,
  deploy, touch membership, the database, money, or secrets.
- Self-verify every finding; confidence >= 0.7 or silence. An honest empty
  result is production. Volume is not.
- Label fact, plan, and assumption as three different things.

## To rebuild this lane from nothing
Clone the repo, read CLAUDE.md + CORE_PLATFORM_RECORD.md + WORKFORCE.md,
then summon a task-scoped subagent with this folder's BRIEF.md as its brief
and CODE-MANIFEST.md as its territory. The lane holds no credentials and
costs nothing until summoned.

## Standing hold — KNOW ON ARRIVAL (added 2026-08-17, migration self-audit)

~~The **LeadTech ingest socket is HELD**~~ — **hold LIFTED 2026-08-17 by the
owner's explicit override of E7** ("overrule E7 and start building"), given
after the gate's reason was explained in full. The build proceeds WITHOUT
prior counsel review; the risk is named and accepted in the E7 ledger row,
with MAIN's contrary recommendation recorded beside it. The T3 adversary's
conditions (F7, F12, timing, identity-leak, audit-everything) are hard
build requirements. Counsel review remains open as follow-up E7b.
Original hold text, kept for the record: no build/apply until counsel clears
the all-party-consent representation and the owner greenlights
(OWNER-DECISIONS.md E3/E7; WORKFORCE.md Test-3 record). This lane's
activation trigger is "before any outbound/telephony step" — this hold is
the first fact any summons of this lane must carry. The T1 "standing-law
violation" decoded: the consent-deny path was unaudited, violating the
record's "every allow and every deny is audited" law — since fixed and
pinned (tests/portal-authorization.test.mjs, consent-deny audit test).
