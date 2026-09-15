/**
 * Pure formatting/parsing helpers for the ui module. No `document` access
 * here on purpose — node:test imports this file directly.
 */
import type { Result, RunEvent } from '../contracts.ts'

/* ---- durations & run-event lines ------------------------------------------ */

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(s < 10 ? 2 : 1)}s`
  const totalSeconds = Math.round(s)
  const m = Math.floor(totalSeconds / 60)
  const rem = totalSeconds - m * 60
  return `${m}m${rem.toString().padStart(2, '0')}s`
}

/** Shortens a long id like "card_0001a3f9…" for compact display. */
export function shortId(id: string, keep = 4): string {
  if (id.length <= keep * 2 + 1) return id
  return `${id.slice(0, keep)}…${id.slice(-keep)}`
}

function eventCard(e: RunEvent): string {
  switch (e.type) {
    case 'node.started':
    case 'node.finished':
    case 'node.failed':
    case 'a2a.request':
    case 'a2a.response':
    case 'a2a.timeout':
      return e.cardId
    case 'run.failed':
      return e.cardId ?? '-'
    default:
      return '-'
  }
}

function eventDetail(e: RunEvent): string {
  switch (e.type) {
    case 'run.started':
      return `${e.nodeCount} node${e.nodeCount === 1 ? '' : 's'}`
    case 'node.started':
      return `attempt ${e.attempt}`
    case 'node.finished':
      return `output ${safeJson(e.output, 80)}`
    case 'node.failed':
      return `${e.error}${e.willRetry ? ' (retrying)' : ''}`
    case 'a2a.request':
      return `→ ${e.to} corr=${e.correlationId}`
    case 'a2a.response':
      return `← ${e.from} corr=${e.correlationId}`
    case 'a2a.timeout':
      return `→ ${e.to} timed out after ${formatDuration(e.timeoutMs)}`
    case 'run.finished':
      return `output ${safeJson(e.output, 80)}`
    case 'run.failed':
      return e.error
    case 'run.canceled':
      return 'canceled'
  }
}

function eventLatency(e: RunEvent): string | undefined {
  if (e.type === 'a2a.response') return formatDuration(e.latencyMs)
  if (e.type === 'run.finished') return formatDuration(e.durationMs)
  return undefined
}

/** One log line: "[seq] type · card · detail (latency)". */
export function formatRunEvent(e: RunEvent): string {
  const base = `[${e.seq}] ${e.type} · ${eventCard(e)} · ${eventDetail(e)}`
  const latency = eventLatency(e)
  return latency ? `${base} (${latency})` : base
}

/* ---- safe JSON pretty-printing --------------------------------------------- */

/** Pretty-prints a value, tolerating circular references, truncated at `max` chars. */
export function safeJson(value: unknown, max = 2000): string {
  let out: string
  try {
    const seen = new WeakSet<object>()
    const json = JSON.stringify(
      value,
      (_key, val: unknown) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) return '[Circular]'
          seen.add(val)
        }
        if (typeof val === 'bigint') return `${val.toString()}n`
        return val
      },
      2,
    )
    out = json === undefined ? String(value) : json
  } catch {
    try {
      out = String(value)
    } catch {
      out = '[unserializable]'
    }
  }
  if (out.length > max) {
    return `${out.slice(0, Math.max(0, max - 1))}…`
  }
  return out
}

/* ---- node config parsing ---------------------------------------------------- */

/** Parses node.config text; must decode to a plain JSON object (not array/primitive). */
export function parseConfig(text: string): Result<Record<string, unknown>, string> {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}` }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Config must be a JSON object' }
  }
  return { ok: true, value: parsed as Record<string, unknown> }
}

/* ---- keyboard shortcut parsing ---------------------------------------------- */

export interface ParsedShortcut {
  /** Lower-cased key, e.g. "s", "enter", "?". */
  key: string
  /** True when ctrl (Win/Linux) or meta/cmd (Mac) is required. */
  mod: boolean
  shift: boolean
}

/** Minimal shape of a KeyboardEvent this module needs — kept structural for tests. */
export interface KeyEventLike {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
}

/** Parses a shortcut spec like "mod+shift+z" (case-insensitive). */
export function parseShortcut(spec: string): ParsedShortcut {
  const tokens = spec
    .split('+')
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0)
  let mod = false
  let shift = false
  let key = ''
  for (const token of tokens) {
    if (token === 'mod' || token === 'ctrl' || token === 'control' || token === 'meta' || token === 'cmd' || token === 'command') {
      mod = true
    } else if (token === 'shift') {
      shift = true
    } else {
      key = token
    }
  }
  return { key, mod, shift }
}

/** Whether a key event matches a shortcut spec; "mod" matches ctrlKey or metaKey. */
export function matchesShortcut(event: KeyEventLike, spec: string): boolean {
  const parsed = parseShortcut(spec)
  if (event.key.toLowerCase() !== parsed.key) return false
  const hasMod = Boolean(event.ctrlKey) || Boolean(event.metaKey)
  if (hasMod !== parsed.mod) return false
  const hasShift = Boolean(event.shiftKey)
  if (hasShift !== parsed.shift) return false
  return true
}
