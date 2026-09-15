import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TRANSCRIPTS, twoAgentHandoffSuccess, dialRequestTimeoutThenRetry, themeProposalDeclinedVote } from '../src/a2a-transcripts.ts'
import { isTerminal } from '../../shared/src/a2a.ts'

test('there are exactly three transcripts, matching the named exports', () => {
  assert.equal(TRANSCRIPTS.length, 3)
  assert.equal(TRANSCRIPTS[0], twoAgentHandoffSuccess)
  assert.equal(TRANSCRIPTS[1], dialRequestTimeoutThenRetry)
  assert.equal(TRANSCRIPTS[2], themeProposalDeclinedVote)
})

test('every transcript has a unique id, a title, a description and at least one message', () => {
  const ids = new Set<string>()
  for (const t of TRANSCRIPTS) {
    assert.ok(t.id.length > 0)
    assert.ok(t.title.length > 0)
    assert.ok(t.description.length > 0)
    assert.ok(t.messages.length > 0, `${t.id}: expected at least one message`)
    assert.ok(t.taskSnapshots.length > 0, `${t.id}: expected at least one task snapshot`)
    assert.ok(!ids.has(t.id), `duplicate transcript id ${t.id}`)
    ids.add(t.id)
  }
})

test('every message and every task snapshot in a transcript shares that transcript’s correlationId', () => {
  for (const t of TRANSCRIPTS) {
    for (const m of t.messages) {
      assert.equal(m.correlationId, t.correlationId, `${t.id}: message ${m.id} has the wrong correlationId`)
    }
    for (const snap of t.taskSnapshots) {
      for (const m of snap.task.history) {
        assert.equal(m.correlationId, t.correlationId, `${t.id}: snapshot history message ${m.id} has the wrong correlationId`)
      }
    }
  }
})

test('every task snapshot belongs to the same taskId within its transcript', () => {
  for (const t of TRANSCRIPTS) {
    const firstTaskId = t.taskSnapshots[0]?.task.id
    assert.ok(firstTaskId)
    for (const snap of t.taskSnapshots) {
      assert.equal(snap.task.id, firstTaskId, `${t.id}: snapshot task id drifted`)
    }
  }
})

test('the successful handoff transcript: request then reply, ends completed', () => {
  const t = twoAgentHandoffSuccess
  assert.equal(t.messages.length, 2)
  const last = t.taskSnapshots.at(-1)
  assert.ok(last)
  assert.equal(last.task.state, 'completed')
  assert.ok(isTerminal(last.task.state))
  assert.equal(last.task.history.length, 2)
  assert.equal(last.task.artifacts.length, 1)
})

test('the timeout-then-retry transcript: two requests share one correlationId, and an input-required snapshot sits between them', () => {
  const t = dialRequestTimeoutThenRetry
  const requests = t.messages.filter((m) => m.from === t.messages[0]?.from)
  assert.equal(requests.length, 2, 'expected two outbound requests (attempt 1 and attempt 2)')
  const states = t.taskSnapshots.map((s) => s.task.state)
  assert.ok(states.includes('input-required'), 'expected a timeout snapshot before the retry')
  const timeoutIndex = states.indexOf('input-required')
  const completedIndex = states.indexOf('completed')
  assert.ok(timeoutIndex >= 0 && completedIndex > timeoutIndex, 'timeout must precede completion')
  const last = t.taskSnapshots.at(-1)
  assert.ok(last)
  assert.equal(last.task.state, 'completed')
})

test('the declined-vote transcript: the tally rejects, but the task still completes', () => {
  const t = themeProposalDeclinedVote
  const last = t.taskSnapshots.at(-1)
  assert.ok(last)
  assert.equal(last.task.state, 'completed')
  const decisionMessage = t.messages.at(-1)
  assert.ok(decisionMessage)
  const decisionPart = decisionMessage.parts.find((p) => p.kind === 'data')
  assert.ok(decisionPart && decisionPart.kind === 'data')
  const payload = decisionPart.data['payload'] as { accepted: boolean; tally: { approve: number; reject: number } }
  assert.equal(payload.accepted, false)
  assert.ok(payload.tally.reject > payload.tally.approve)
})

test('ids come from the seeded factory (fixed-width base36+hex), never crypto.randomUUID', () => {
  // createIdFactory's seeded branch always emits "<prefix>_" + exactly 10 base36-safe
  // characters (4-char counter + 6 hex); crypto.randomUUID ids would contain dashes
  // and be far longer, so this also doubles as a "no Date.now()/Math.random() leaked
  // through" check.
  const seededIdPattern = /^[a-z]+_[0-9a-z]{10}$/
  for (const t of TRANSCRIPTS) {
    for (const m of t.messages) {
      assert.match(m.id, seededIdPattern, `${t.id}: message id "${m.id}" is not seeded-deterministic`)
    }
    for (const snap of t.taskSnapshots) {
      assert.match(snap.task.id, seededIdPattern, `${t.id}: task id "${snap.task.id}" is not seeded-deterministic`)
    }
  }
})
