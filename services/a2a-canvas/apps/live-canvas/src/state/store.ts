/**
 * createStore: wires the pure reducer + pure history stack into the
 * imperative Store the app dispatches against. This is the one file in the
 * module allowed to hold mutable state (in its closure) — reducer/history
 * stay pure and get called as plain functions.
 */
import type { AppState, Action, CreateStore, Store, Listener } from '../contracts.ts'
import { EMPTY_SELECTION } from '../../../../packages/shared/src/workflow.ts'
import { systemClock } from '../../../../packages/shared/src/ids.ts'
import { reduce } from './reducer.ts'
import {
  createHistoryStack, recordSnapshot, shouldRecord, canUndo as stackCanUndo, canRedo as stackCanRedo,
  undo as stackUndo, redo as stackRedo,
  type HistoryStack,
} from './history.ts'

export const createStore: CreateStore = (initial, opts) => {
  const clock = opts?.clock ?? systemClock
  let history: HistoryStack = createHistoryStack(opts?.historyLimit)

  let state: AppState = {
    doc: initial,
    activeWorkflowId: initial.workflows[0]?.id ?? null,
    selection: EMPTY_SELECTION,
    drag: { kind: 'idle' },
    runs: {},
    saveStatus: { kind: 'idle' },
    canUndo: false,
    canRedo: false,
    previewThemeId: initial.themeId,
    previewOverrides: initial.themeOverrides,
  }

  const listeners = new Set<Listener>()

  function syncHistoryFlags(): void {
    state = { ...state, canUndo: stackCanUndo(history), canRedo: stackCanRedo(history) }
  }

  function notify(action: Action | null): void {
    for (const listener of listeners) listener(state, action)
  }

  const store: Store = {
    getState() {
      return state
    },
    dispatch(action: Action) {
      const prevDoc = state.doc
      const nextState = reduce(state, action, clock)
      if (shouldRecord(action) && nextState.doc !== prevDoc) {
        history = recordSnapshot(history, prevDoc)
      }
      state = nextState
      syncHistoryFlags()
      notify(action)
    },
    subscribe(listener: Listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    undo() {
      const step = stackUndo(history, state.doc)
      if (!step) return
      history = step.stack
      state = { ...state, doc: step.doc, saveStatus: { kind: 'dirty' } }
      syncHistoryFlags()
      notify(null)
    },
    redo() {
      const step = stackRedo(history, state.doc)
      if (!step) return
      history = step.stack
      state = { ...state, doc: step.doc, saveStatus: { kind: 'dirty' } }
      syncHistoryFlags()
      notify(null)
    },
  }

  return store
}
