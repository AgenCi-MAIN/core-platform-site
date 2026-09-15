/**
 * The run log: a run selector (newest first) + Clear filter, and a capped,
 * auto-scrolling list of formatted run events.
 */
import type { AppState, RunEvent, RunRecord } from '../contracts.ts'
import type { UiDeps, UiPanel } from './types.ts'
import { formatRunEvent } from './format.ts'
import { clear, h } from './dom.ts'

const MAX_LINES = 500
let styleInstalled = false

function ensureStyle(): void {
  if (styleInstalled) return
  styleInstalled = true
  const style = document.createElement('style')
  style.textContent = '.runlog .danger{color:var(--c-danger)} .runlog .ok{color:var(--c-success)}'
  document.head.appendChild(style)
}

function sortedRuns(state: AppState): RunRecord[] {
  return Object.values(state.runs).sort((a, b) => (a.startedAt < b.startedAt ? 1 : a.startedAt > b.startedAt ? -1 : 0))
}

function lineClass(type: RunEvent['type']): string | undefined {
  if (type === 'node.failed' || type === 'a2a.timeout' || type === 'run.failed') return 'danger'
  if (type === 'run.finished' || type === 'node.finished' || type === 'a2a.response') return 'ok'
  return undefined
}

export function mountRunLog(root: HTMLElement, deps: UiDeps): UiPanel {
  ensureStyle()
  clear(root)
  root.classList.add('runlog')
  root.style.display = 'flex'
  root.style.flexDirection = 'column'
  root.style.gap = 'var(--sp-1)'

  let filterRunId = ''
  let pinned = true

  const select = h('select', {})
  const clearBtn = h('button', { class: 'btn', type: 'button' }, ['Clear filter'])
  const header = h('div', { class: 'row' }, [select, clearBtn])
  const body = h('div', { class: 'mono', style: 'overflow:auto;flex:1 1 auto' })

  function renderSelectOptions(state: AppState): void {
    const runs = sortedRuns(state)
    clear(select)
    select.append(h('option', { value: '' }, ['All runs']))
    for (const run of runs) {
      select.append(h('option', { value: run.runId }, [`${run.runId} · ${run.state}`]))
    }
    const stillExists = filterRunId === '' || runs.some(r => r.runId === filterRunId)
    if (!stillExists) filterRunId = ''
    select.value = filterRunId
  }

  function render(state: AppState): void {
    renderSelectOptions(state)

    let events: RunEvent[]
    if (filterRunId) {
      const run = state.runs[filterRunId]
      events = run ? run.events : []
    } else {
      events = sortedRuns(state)
        .flatMap(r => r.events)
        .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.seq - b.seq))
    }
    if (events.length > MAX_LINES) events = events.slice(events.length - MAX_LINES)

    clear(body)
    for (const event of events) {
      const cls = lineClass(event.type)
      body.append(h('div', cls ? { class: cls } : {}, [formatRunEvent(event)]))
    }
    if (pinned) body.scrollTop = body.scrollHeight
  }

  select.addEventListener('change', () => {
    filterRunId = select.value
    pinned = true
    render(deps.store.getState())
  })
  clearBtn.addEventListener('click', () => {
    filterRunId = ''
    pinned = true
    render(deps.store.getState())
  })
  body.addEventListener('scroll', () => {
    const atBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 8
    pinned = atBottom
  })

  root.append(header, body)

  function update(state: AppState): void {
    render(state)
  }

  function destroy(): void {
    clear(root)
  }

  return { update, destroy }
}
