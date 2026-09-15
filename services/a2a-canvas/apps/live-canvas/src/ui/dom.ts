/**
 * A tiny DOM-building helper so rail/inspector/runlog/status/shortcuts don't
 * repeat createElement/append boilerplate. Touches `document` — never
 * imported by node:test files.
 */
export type Attrs = Record<string, unknown>

const BOOLEAN_PROPS = new Set(['disabled', 'hidden', 'checked', 'required'])

/** Creates an element, applying attrs (class, style, "on" handlers, booleans, plain attrs) and children. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue
    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener)
      continue
    }
    if (key === 'class') {
      node.className = String(value)
      continue
    }
    if (key === 'style') {
      node.setAttribute('style', String(value))
      continue
    }
    if (key === 'readonly' || key === 'readOnly') {
      ;(node as unknown as { readOnly: boolean }).readOnly = Boolean(value)
      continue
    }
    if (BOOLEAN_PROPS.has(key)) {
      ;(node as unknown as Record<string, boolean>)[key] = Boolean(value)
      continue
    }
    node.setAttribute(key, String(value))
  }
  for (const child of children) {
    node.append(typeof child === 'string' ? document.createTextNode(child) : child)
  }
  return node
}

/** Removes all children of an element. */
export function clear(node: Element): void {
  while (node.firstChild) node.removeChild(node.firstChild)
}
