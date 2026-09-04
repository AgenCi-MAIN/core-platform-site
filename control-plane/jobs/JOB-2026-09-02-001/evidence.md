# Evidence

## Baseline

- Repository: `AgenCi-MAIN/core-platform-site`.
- Branch: `vera-central-control-system`.
- Existing dirty state preserved: `.gitignore`, `CLAUDE.md`, and
  `CORE_PLATFORM_RECORD.md` modified; `a-to-a-agency-0.0.1/`,
  `automation_probe.js`, and `automation_probe.mjs` untracked.

## Delivery

- Read-only targeting Test A passed: the connected Google Chrome profile opened
  the `CORE portal repository audit` task, showed the Vera Portal Control
  environment and `vera-central-control-system` branch, exposed the visible
  status, and exposed its prompt composer without typing or sending.
- Read-only targeting Test B passed: the connected Edge profile opened the
  designated `Dispatch` task, exposed its latest visible response, and exposed
  its message composer without typing or sending.
### Test C update — 2026-09-02

- Dispatch finalized a connectivity-only order that prohibited file inspection,
  commands, edits, and repository-state changes.
- Computer Use delivered the order once to the designated Chrome Worker B task.
- Worker B returned the exact acknowledgment: `Worker B connection confirmed.`
- Computer Use returned that acknowledgment to Dispatch.
- Dispatch visibly confirmed the full Dispatch → Codex → Chrome Worker B →
  Dispatch path and reported that nothing was inspected, run, or changed.
- The connectivity round trip passed. The repository artifact review remains a
  separate pending review; this test does not approve those files.

### Dispatch revision cycle — 2026-09-02

- Dispatch returned `REVISE` on two evidence-honesty wording issues.
- Worker B retitled the proposed CLAUDE.md note to `Verified source state`.
- Worker B replaced the unsupported live `_cf_KV` assertion in both proposed
  files with a repository-verifiable migration statement.
- Worker B returned revised proposed hashes and confirmed every other proposed
  line was unchanged.
- Worker B reported that the repository remained clean; only scratchpad copies
  changed. Nothing was saved, committed, pushed, merged, deployed, or migrated,
  and Sky was not touched.
- The revised package is returned to Worker A / Dispatch for another review.

## Implementation evidence

- Created 16 files total: two control-plane root files, seven templates, and
  seven pilot-job files.
- JSON parse result: PASS for `job.schema.json`, the status template, and the
  pilot status record.
- Whitespace/error check: PASS from `git diff --check -- control-plane`.
- Scope check: Git reports `control-plane/` as the only new path attributable
  to this assignment. Pre-existing dirty paths remain untouched.

## Return evidence

- Result collected into the pilot job record at `2026-09-02T08:25:22Z`.
- Job moved to `RESULT_RETURNED` with Worker A / Dispatch as the review owner.
- `review.md` remains `PENDING`; no approval is fabricated or implied.
