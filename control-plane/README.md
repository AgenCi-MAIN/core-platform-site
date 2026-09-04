# Vera Central Control plane

This directory is the durable job ledger for the Vera -> Dispatch -> Computer
Use -> Worker B workflow. Chat messages and browser windows are transport. The
files under `jobs/` are the authoritative record of what was requested, what
was authorized, what was returned, and what was reviewed.

This layer does not grant access or authority. Repository, branch, production,
membership, secret, financial, regulated, destructive, and Sky boundaries in
`AGENTS.md`, `CLAUDE.md`, and `CORE_PLATFORM_RECORD.md` remain controlling.

## Permanent roles

| Role | Surface | Responsibility |
| --- | --- | --- |
| Shawn | Human owner | Final authority and consequential-action approval |
| Vera | Current Codex coordination task | Intake, normalization, routing, status, escalation |
| Worker A / Dispatch | Designated Dispatch session | Finalize orders and review returned evidence |
| Computer Use | Codex capability | Deliver exact orders and collect exact results |
| Worker B | Designated Chrome profile and task | Execute bounded work on the named branch |
| Edge | Read-only reference | Never receives Worker B orders |

Do not identify a target as only "the Claude window." Every work order names
the role, application, account/profile, conversation, repository, and branch.

## Directory contract

Each job has exactly one directory:

```text
control-plane/jobs/JOB-YYYY-MM-DD-NNN/
  request.md
  work-order.md
  status.json
  result.md
  evidence.md
  review.md
  approval.md
```

Copy the seven files in `templates/` to begin a job. Validate `status.json`
against `job.schema.json` before a delivery or state change.

## State machine

```text
INTAKE
  -> DISPATCH_REVIEW
  -> READY_FOR_WORKER
  -> DELIVERED
  -> WORKING
  -> RESULT_RETURNED
  -> FINAL_REVIEW
  -> APPROVED | REVISION_REQUIRED | OWNER_APPROVAL_REQUIRED
  -> VERIFIED
  -> COMPLETE
```

`BLOCKED` may be entered from any state. An attempted handoff is not
`DELIVERED`; Worker B must visibly acknowledge it. A claimed result is not
`COMPLETE`; Dispatch must review the returned artifacts and the result must be
verified in proportion to risk.

## Courier rules

Computer Use may:

1. Read a finalized `work-order.md` whose state is `READY_FOR_WORKER`.
2. Verify the designated application, profile, conversation, repository, and
   branch.
3. Deliver the order once without rewriting it.
4. Record visible acknowledgment and delivery evidence.
5. Collect the result, tests, blockers, and changed-file list for the same job.
6. Write the return into `result.md` and `evidence.md`, then set
   `RESULT_RETURNED`.
7. Notify Dispatch that review is ready.

Computer Use does not perform Worker B's coding work, approve a return, or
execute a consequential action.

## Always-owner-gated actions

The job must stop at `OWNER_APPROVAL_REQUIRED` before any:

- merge or protected-branch push;
- production deploy or rollback;
- database migration or production-data mutation;
- secret, credential, access, membership, or role change;
- payment, contract, equity, employment, or regulated-insurance action;
- destructive or difficult-to-recover action;
- Sky access or change; or
- material expansion beyond the finalized work order.

## Reliability rules

- One job ID follows the assignment from intake through completion.
- `status.json` is authoritative; chat text is not.
- Delivery and collection operations must be safe to retry and must not create
  duplicate work.
- Conflicting or stale revisions stop the write and require a re-read.
- Screenshots support evidence but do not replace file, command, test, or API
  evidence when those are available.
- No password, API key, session cookie, OAuth token, private key, policyholder
  data, or other secret belongs in this directory.

## Phase 1 acceptance test

The first pilot passes when Shawn gives one instruction, Worker B receives and
acknowledges exactly one finalized order, Worker B's full return lands in the
same job directory, Dispatch reviews the actual return without Shawn relaying
it, and Vera reports one verified outcome or approval request. No commit, push,
merge, deploy, migration, secret change, permission change, production action,
or Sky change is part of that pilot.
