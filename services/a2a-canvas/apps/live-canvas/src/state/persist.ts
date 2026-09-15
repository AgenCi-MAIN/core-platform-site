/**
 * localStorage-backed Persistence, plus an in-memory implementation for
 * tests and as a fallback when localStorage is unavailable. Every storage
 * access is wrapped in try/catch: quota errors, private-mode throws, and a
 * missing `localStorage` global must all come back as `err`, never throw.
 */
import type { Persistence, CanvasDoc } from '../contracts.ts'
import { STORAGE_KEY } from '../contracts.ts'
import { ok, err } from '../../../../packages/shared/src/result.ts'

/** The minimal Storage surface persist.ts needs — lets tests pass a fake. */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function isValidDoc(value: unknown): value is CanvasDoc {
  if (typeof value !== 'object' || value === null) return false
  const d = value as Record<string, unknown>
  if (d.version !== 1) return false
  if (!Array.isArray(d.workflows)) return false
  for (const wf of d.workflows) {
    if (typeof wf !== 'object' || wf === null) return false
    const w = wf as Record<string, unknown>
    if (!Array.isArray(w.lanes) || !Array.isArray(w.cards) || !Array.isArray(w.edges)) return false
    if (typeof w.id !== 'string' || typeof w.name !== 'string') return false
  }
  if (typeof d.themeId !== 'string') return false
  if (typeof d.viewport !== 'object' || d.viewport === null) return false
  const vp = d.viewport as Record<string, unknown>
  if (typeof vp.x !== 'number' || typeof vp.y !== 'number' || typeof vp.zoom !== 'number') return false
  return true
}

function safeStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

export function createLocalStoragePersistence(storage?: StorageLike): Persistence {
  return {
    load() {
      const s = safeStorage(storage)
      if (!s) return err('localStorage is not available in this environment')

      let raw: string | null
      try {
        raw = s.getItem(STORAGE_KEY)
      } catch {
        return err('could not read from storage')
      }
      if (raw === null) return ok(null)

      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        return err('stored document is not valid JSON')
      }

      if (!isValidDoc(parsed)) return err('stored document has an unexpected shape')
      return ok(parsed)
    },
    save(doc: CanvasDoc) {
      const s = safeStorage(storage)
      if (!s) return err('localStorage is not available in this environment')

      let text: string
      try {
        text = JSON.stringify(doc)
      } catch {
        return err('document could not be serialized to JSON')
      }

      try {
        s.setItem(STORAGE_KEY, text)
      } catch {
        return err('could not write to storage (quota exceeded or unavailable)')
      }

      return ok({ savedAt: new Date().toISOString(), bytes: new TextEncoder().encode(text).length })
    },
    clear() {
      const s = safeStorage(storage)
      if (!s) return err('localStorage is not available in this environment')
      try {
        s.removeItem(STORAGE_KEY)
      } catch {
        return err('could not clear storage')
      }
      return ok(undefined)
    },
  }
}

/** In-memory Persistence: same contract, no globals — used by tests and as
 * a fallback the shell can swap in when localStorage throws on construction. */
export function createMemoryPersistence(): Persistence {
  const backing = new Map<string, string>()
  const storage: StorageLike = {
    getItem: (key) => (backing.has(key) ? (backing.get(key) as string) : null),
    setItem: (key, value) => {
      backing.set(key, value)
    },
    removeItem: (key) => {
      backing.delete(key)
    },
  }
  return createLocalStoragePersistence(storage)
}
