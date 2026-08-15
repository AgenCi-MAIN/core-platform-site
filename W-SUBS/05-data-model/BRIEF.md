# data-model — rank 5

**Standing:** First team, seat 5

## Mission

Data model and migration integrity: schema.ts vs db/sql vs drizzle, the two-migration-path trap, email-case invariant, constraint gaps, query parameterization.

## Service record

T1: 2 confirmed integrity gaps (app-only email uniqueness; the unguarded second-table read — since fixed).

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
