/**
 * Save status text (#status) and toast notifications (#toasts).
 */
import type { SaveStatus } from '../contracts.ts'
import type { Notify, NotifyKind } from './types.ts'
import { h } from './dom.ts'

function prefersReducedMotion(): boolean {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  } catch {
    return false
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString(undefined, { hour12: false })
}

export interface StatusApi {
  setSaveStatus(status: SaveStatus): void
  notify: Notify
  destroy(): void
}

export function mountStatus(statusRoot: HTMLElement, toastsRoot: HTMLElement): StatusApi {
  const timers = new Set<ReturnType<typeof setTimeout>>()

  function setSaveStatus(status: SaveStatus): void {
    switch (status.kind) {
      case 'idle':
        statusRoot.textContent = ''
        statusRoot.setAttribute('data-kind', '')
        break
      case 'dirty':
        statusRoot.textContent = 'Unsaved changes'
        statusRoot.setAttribute('data-kind', '')
        break
      case 'saving':
        statusRoot.textContent = 'Saving…'
        statusRoot.setAttribute('data-kind', '')
        break
      case 'saved':
        statusRoot.textContent = `Saved ${formatTime(status.at)}`
        statusRoot.setAttribute('data-kind', 'ok')
        break
      case 'error':
        statusRoot.textContent = `Save failed: ${status.message}`
        statusRoot.setAttribute('data-kind', 'error')
        break
    }
  }

  function notify(kind: NotifyKind, message: string): void {
    const toast = h('div', { class: 'toast', role: 'status' }, [message])
    if (kind === 'error') toast.style.color = 'var(--c-danger)'
    else if (kind === 'ok') toast.style.color = 'var(--c-success)'
    toastsRoot.append(toast)

    const reduced = prefersReducedMotion()
    if (!reduced) toast.style.transition = 'opacity var(--motion-base) var(--ease)'

    const timer = setTimeout(() => {
      timers.delete(timer)
      if (reduced) {
        toast.remove()
        return
      }
      toast.style.opacity = '0'
      const done = (): void => toast.remove()
      toast.addEventListener('transitionend', done, { once: true })
      setTimeout(done, 250)
    }, 4000)
    timers.add(timer)
  }

  function destroy(): void {
    for (const timer of timers) clearTimeout(timer)
    timers.clear()
    statusRoot.textContent = ''
    statusRoot.removeAttribute('data-kind')
    while (toastsRoot.firstChild) toastsRoot.removeChild(toastsRoot.firstChild)
  }

  return { setSaveStatus, notify, destroy }
}
