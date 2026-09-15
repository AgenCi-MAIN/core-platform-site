/**
 * Branded identifiers, a deterministic id factory, and an injectable clock.
 *
 * Why: twelve lanes build against the same entities; branded ids stop a
 * CardId from being passed where a LaneId is expected, and the seeded factory
 * lets tests and fixtures produce stable ids without touching Math.random.
 */
export type Brand<T, B extends string> = T & { readonly __brand: B }

export type ThemeId = Brand<string, 'ThemeId'>
export type AgentId = Brand<string, 'AgentId'>
export type TaskId = Brand<string, 'TaskId'>
export type MessageId = Brand<string, 'MessageId'>
export type LaneId = Brand<string, 'LaneId'>
export type CardId = Brand<string, 'CardId'>
export type EdgeId = Brand<string, 'EdgeId'>
export type WorkflowId = Brand<string, 'WorkflowId'>
export type RunId = Brand<string, 'RunId'>

/** Injectable time source so core logic never reads Date.now() directly. */
export interface Clock {
  now(): number
}
export const systemClock: Clock = { now: () => Date.now() }
export function fixedClock(at: number): Clock {
  return { now: () => at }
}
/** A clock that advances by `stepMs` on every read; handy for ordered fixtures. */
export function steppingClock(start: number, stepMs = 1): Clock {
  let t = start - stepMs
  return { now: () => (t += stepMs) }
}
export function isoAt(clock: Clock): string {
  return new Date(clock.now()).toISOString()
}

export interface IdFactory {
  next(prefix?: string): string
  theme(): ThemeId
  agent(): AgentId
  task(): TaskId
  message(): MessageId
  lane(): LaneId
  card(): CardId
  edge(): EdgeId
  workflow(): WorkflowId
  run(): RunId
}

/** xorshift32 — small, fast, deterministic; only used when a seed is given. */
function xorshift32(seed: number): () => number {
  let s = seed >>> 0 || 0x9e3779b9
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 0x100000000
  }
}

/**
 * Creates an id factory. With a seed, ids are reproducible ("card_0001a3f9");
 * without one, ids come from crypto.randomUUID.
 */
export function createIdFactory(seed?: number): IdFactory {
  const rnd = seed === undefined ? null : xorshift32(seed)
  let counter = 0
  const next = (prefix = 'id'): string => {
    counter += 1
    if (rnd) {
      const r = Math.floor(rnd() * 0xffffff).toString(16).padStart(6, '0')
      return `${prefix}_${counter.toString(36).padStart(4, '0')}${r}`
    }
    return `${prefix}_${globalThis.crypto.randomUUID()}`
  }
  return {
    next,
    theme: () => next('theme') as ThemeId,
    agent: () => next('agent') as AgentId,
    task: () => next('task') as TaskId,
    message: () => next('msg') as MessageId,
    lane: () => next('lane') as LaneId,
    card: () => next('card') as CardId,
    edge: () => next('edge') as EdgeId,
    workflow: () => next('wf') as WorkflowId,
    run: () => next('run') as RunId,
  }
}

/** Casts a known-good string to a branded id (for fixtures and parsers). */
export function asId<B extends string>(value: string): Brand<string, B> {
  return value as Brand<string, B>
}
