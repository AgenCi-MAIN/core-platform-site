/**
 * Internal types shared across src/ui/** — not part of the cross-module
 * contract (see ../contracts.ts). Only ui/* files import this.
 */
import type { CanvasController, MountThemePanel, Persistence, Runtime, Store, ThemeApi } from '../contracts.ts'
import type { AppState } from '../contracts.ts'

export type NotifyKind = 'ok' | 'error' | 'info'
export type Notify = (kind: NotifyKind, message: string) => void

/** Dependencies every ui/* mount function needs, beyond its own DOM root(s). */
export interface UiDeps {
  store: Store
  runtime: Runtime
  theme: ThemeApi
  persistence: Persistence
  canvas: CanvasController
  themePanel: MountThemePanel
  notify: Notify
}

/** The shape every ui/* mount function returns. */
export interface UiPanel {
  update(state: AppState): void
  destroy(): void
}
