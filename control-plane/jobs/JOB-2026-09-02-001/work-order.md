# Work order

**JOB TITLE:** Bootstrap the Vera control-plane job ledger

**PROJECT:** IMO Operating Portal

**TARGET WORKER:** Codex implementation worker

**APPLICATION:** Local repository tools; no production UI

**ACCOUNT / PROFILE:** Current authorized Codex task

**CONVERSATION:** Vera

**REPOSITORY:** AgenCi-MAIN/core-platform-site

**BRANCH:** vera-central-control-system

## Objective

Add a repository-backed job schema, operating rules, reusable templates, and
one pilot job record for the Computer Use courier workflow.

## Allowed scope

- `control-plane/**` only.
- Read-only inspection of repository status and governing documents.
- Validation of the new JSON files and changed-file scope.

## Prohibited actions

- Do not alter pre-existing modified or untracked files outside
  `control-plane/**`.
- No commit, push, merge, deploy, migration, secret, permission, membership,
  payment, production-data, regulated, destructive, or Sky action.
- Do not install the third-party community plugin shown in the supplied
  screenshot.

## Required evidence

- Starting branch and dirty state.
- Created-file list.
- JSON parse and schema-structure checks.
- Final `git diff --check` and scope report.

## Definition of done

The new control-plane artifacts exist only under `control-plane/**`, the pilot
record accurately states its stage, validation passes, and the result is ready
for Worker A / Dispatch review.

## Return result to

Worker A / Dispatch through this job directory.
