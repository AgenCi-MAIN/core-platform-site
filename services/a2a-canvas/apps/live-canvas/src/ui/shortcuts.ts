/**
 * Global keyboard shortcuts: mod+s save, mod+z undo, mod+shift+z / mod+y
 * redo, mod+enter run the active workflow, ? toggles a help toast.
 */
import type { UiDeps } from './types.ts'
import { matchesShortcut } from './format.ts'
import { performRedo, performSave, performUndo, runActiveWorkflow } from './actions.ts'

const HELP_TEXT = [
  'mod+s — Save',
  'mod+z — Undo',
  'mod+shift+z / mod+y — Redo',
  'mod+enter — Run active workflow',
  '? — Toggle this help',
].join('  ·  ')

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

/** Installs the shortcut handler on window; returns an uninstall function. */
export function installShortcuts(deps: UiDeps): () => void {
  function onKeydown(event: KeyboardEvent): void {
    if (isEditableTarget(event.target)) return

    if (matchesShortcut(event, 'mod+s')) {
      event.preventDefault()
      performSave(deps)
      return
    }
    if (matchesShortcut(event, 'mod+z')) {
      event.preventDefault()
      performUndo(deps)
      return
    }
    if (matchesShortcut(event, 'mod+shift+z') || matchesShortcut(event, 'mod+y')) {
      event.preventDefault()
      performRedo(deps)
      return
    }
    if (matchesShortcut(event, 'mod+enter')) {
      event.preventDefault()
      runActiveWorkflow(deps)
      return
    }
    if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault()
      deps.notify('info', HELP_TEXT)
    }
  }

  globalThis.addEventListener('keydown', onKeydown)
  return () => globalThis.removeEventListener('keydown', onKeydown)
}
