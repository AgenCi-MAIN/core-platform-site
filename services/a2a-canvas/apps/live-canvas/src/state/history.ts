/**
 * Pure undo/redo stack over CanvasDoc snapshots. No mutation, no closures
 * holding state — store.ts owns the stateful glue and calls these as plain
 * data transforms, which is what keeps this file trivially testable.
 */
import type { Action, CanvasDoc } from '../contracts.ts'

export interface HistoryStack {
  readonly past: readonly CanvasDoc[]
  readonly future: readonly CanvasDoc[]
  readonly limit: number
}

export const DEFAULT_HISTORY_LIMIT = 100

export function createHistoryStack(limit: number = DEFAULT_HISTORY_LIMIT): HistoryStack {
  return { past: [], future: [], limit }
}

/** Which actions are doc-mutating enough to earn an undo step. Selection,
 * viewport, drag, theme.preview and run.event are deliberately excluded. */
export function shouldRecord(action: Action): boolean {
  switch (action.type) {
    case 'workflow.event':
    case 'node.config':
    case 'node.shape':
    case 'node.kind':
    case 'node.resize':
    case 'theme.apply':
      return true
    default:
      return false
  }
}

/** Pushes `doc` (the state *before* the action that is about to be applied)
 * onto the past stack, trims to `limit`, and clears the redo stack. */
export function recordSnapshot(stack: HistoryStack, doc: CanvasDoc): HistoryStack {
  const past = [...stack.past, doc]
  const trimmed = past.length > stack.limit ? past.slice(past.length - stack.limit) : past
  return { ...stack, past: trimmed, future: [] }
}

export interface HistoryStep {
  stack: HistoryStack
  doc: CanvasDoc
}

export function undo(stack: HistoryStack, current: CanvasDoc): HistoryStep | undefined {
  if (stack.past.length === 0) return undefined
  const doc = stack.past[stack.past.length - 1] as CanvasDoc
  const past = stack.past.slice(0, -1)
  const future = [current, ...stack.future]
  return { stack: { ...stack, past, future }, doc }
}

export function redo(stack: HistoryStack, current: CanvasDoc): HistoryStep | undefined {
  if (stack.future.length === 0) return undefined
  const doc = stack.future[0] as CanvasDoc
  const future = stack.future.slice(1)
  const past = [...stack.past, current]
  return { stack: { ...stack, past, future }, doc }
}

export function canUndo(stack: HistoryStack): boolean {
  return stack.past.length > 0
}

export function canRedo(stack: HistoryStack): boolean {
  return stack.future.length > 0
}
