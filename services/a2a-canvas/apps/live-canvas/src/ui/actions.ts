/**
 * Cross-cutting document/run actions shared by rail buttons and keyboard
 * shortcuts, so both paths do exactly the same thing. No `document` access.
 */
import type { UiDeps } from './types.ts'

export function performSave(deps: UiDeps): void {
  const state = deps.store.getState()
  deps.store.dispatch({ type: 'save.status', status: { kind: 'saving' } })
  const result = deps.persistence.save(state.doc)
  if (result.ok) {
    deps.store.dispatch({ type: 'save.status', status: { kind: 'saved', at: result.value.savedAt } })
    deps.notify('ok', 'Saved')
  } else {
    deps.store.dispatch({ type: 'save.status', status: { kind: 'error', message: result.error } })
    deps.notify('error', `Save failed: ${result.error}`)
  }
}

export function performUndo(deps: UiDeps): void {
  deps.store.undo()
}

export function performRedo(deps: UiDeps): void {
  deps.store.redo()
}

/** Runs the currently active workflow, unless it already has a run in flight. */
export function runActiveWorkflow(deps: UiDeps): void {
  const state = deps.store.getState()
  if (!state.activeWorkflowId) return
  const workflow = state.doc.workflows.find(w => w.id === state.activeWorkflowId)
  if (!workflow) return
  const alreadyRunning = Object.values(state.runs).some(r => r.workflowId === workflow.id && r.state === 'running')
  if (alreadyRunning) return
  deps.runtime.run(workflow, { themeApi: deps.theme, timeoutMs: 2000 })
}
