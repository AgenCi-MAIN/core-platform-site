/**
 * Composes rail/inspector/runlog/status/shortcuts into the Shell the
 * integrator mounts from main.ts.
 */
import type { AppState, MountShell, Shell } from '../contracts.ts'
import type { NotifyKind, UiDeps } from './types.ts'
import { mountRail } from './rail.ts'
import { mountInspector } from './inspector.ts'
import { mountRunLog } from './runlog.ts'
import { mountStatus } from './status.ts'
import type { StatusApi } from './status.ts'
import { installShortcuts } from './shortcuts.ts'

export const mountShell: MountShell = (deps) => {
  let statusApi: StatusApi | null = null
  let rail: ReturnType<typeof mountRail> | null = null
  let inspector: ReturnType<typeof mountInspector> | null = null
  let runlog: ReturnType<typeof mountRunLog> | null = null
  let uninstallShortcuts: (() => void) | null = null
  let unsubscribeStore: (() => void) | null = null

  function notify(kind: NotifyKind, message: string): void {
    statusApi?.notify(kind, message)
  }

  function update(state: AppState): void {
    rail?.update(state)
    inspector?.update(state)
    runlog?.update(state)
    statusApi?.setSaveStatus(state.saveStatus)
  }

  function mount(): void {
    statusApi = mountStatus(deps.roots.status, deps.roots.toasts)

    const uiDeps: UiDeps = {
      store: deps.store,
      runtime: deps.runtime,
      theme: deps.theme,
      persistence: deps.persistence,
      canvas: deps.canvas,
      themePanel: deps.themePanel,
      notify,
    }

    rail = mountRail(deps.roots.rail, uiDeps)
    inspector = mountInspector(deps.roots.inspector, uiDeps)
    runlog = mountRunLog(deps.roots.runlog, uiDeps)
    uninstallShortcuts = installShortcuts(uiDeps)

    unsubscribeStore = deps.store.subscribe(state => update(state))
    update(deps.store.getState())
  }

  function destroy(): void {
    uninstallShortcuts?.()
    unsubscribeStore?.()
    rail?.destroy()
    inspector?.destroy()
    runlog?.destroy()
    statusApi?.destroy()
    rail = null
    inspector = null
    runlog = null
    statusApi = null
    uninstallShortcuts = null
    unsubscribeStore = null
  }

  const shell: Shell = { mount, update, notify, destroy }
  return shell
}
