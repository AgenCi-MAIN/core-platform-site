/**
 * Canvas module entry point: wires layout + render + interact into the
 * MountCanvas contract the shell (main.ts) calls.
 */
import type { CanvasCallbacks, CanvasController, MountCanvas, CardId } from '../contracts.ts'
import { computeLayout, screenToCanvas, type CanvasLayout } from './layout.ts'
import { render as renderCanvas } from './render.ts'
import { bindInteractions } from './interact.ts'

export const mountCanvas: MountCanvas = (svg, callbacks: CanvasCallbacks): CanvasController => {
  let layout: CanvasLayout = { workflows: [], lanes: [], nodes: [] }
  let viewport = { x: 0, y: 0, zoom: 1 }
  const interact = bindInteractions(svg, callbacks)

  const controller: CanvasController = {
    render(state) {
      layout = computeLayout(state.doc, state.doc.viewport)
      viewport = state.doc.viewport
      renderCanvas(svg, state, layout)
      interact.update(state, layout)
    },
    focusNode(cardId: CardId) {
      const target = svg.querySelector(`[data-card-id="${cardId}"]`)
      if (target instanceof SVGElement && typeof target.focus === 'function') target.focus()
    },
    toCanvasPoint(clientX: number, clientY: number) {
      const rect = svg.getBoundingClientRect()
      return screenToCanvas(clientX - rect.left, clientY - rect.top, viewport)
    },
    destroy() {
      interact.destroy()
    },
  }
  return controller
}
