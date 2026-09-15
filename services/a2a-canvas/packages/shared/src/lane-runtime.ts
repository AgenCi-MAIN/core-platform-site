/**
 * The swarm lane runtime contract: lanes are runners with capacity, tasks are
 * queued onto lanes and can be dragged between them, and every state change
 * is a RuntimeEvent. The live canvas maps its execution UI onto these events.
 */
import type { CardId, LaneId, TaskId } from './ids.ts'
import type { TaskState } from './a2a.ts'

export const LANE_STATUSES = ['idle', 'busy', 'paused', 'errored'] as const
export type LaneStatus = (typeof LANE_STATUSES)[number]

export interface LaneRunner {
  id: LaneId
  name: string
  capacity: number
  model?: string
  status: LaneStatus
}

export const LANE_TASK_KINDS = ['build', 'verify', 'fix', 'commit', 'custom'] as const
export type LaneTaskKind = (typeof LANE_TASK_KINDS)[number]

export interface LaneTask {
  id: TaskId
  laneId: LaneId
  cardId?: CardId
  kind: LaneTaskKind
  payload: Record<string, unknown>
  state: TaskState
  attempts: number
  createdAt: string
  startedAt?: string
  finishedAt?: string
  result?: unknown
  error?: string
}

export const SCHEDULER_POLICIES = ['fifo', 'round-robin', 'least-loaded', 'priority'] as const
export type SchedulerPolicy = (typeof SCHEDULER_POLICIES)[number]

type Stamp = { at: string; seq: number }

export type RuntimeEvent =
  | ({ type: 'task.queued'; taskId: TaskId; laneId: LaneId } & Stamp)
  | ({ type: 'task.started'; taskId: TaskId; laneId: LaneId; attempt: number } & Stamp)
  | ({ type: 'task.finished'; taskId: TaskId; laneId: LaneId; result: unknown } & Stamp)
  | ({ type: 'task.failed'; taskId: TaskId; laneId: LaneId; error: string; willRetry: boolean } & Stamp)
  | ({ type: 'task.moved'; taskId: TaskId; fromLane: LaneId; toLane: LaneId } & Stamp)
  | ({ type: 'lane.paused'; laneId: LaneId } & Stamp)
  | ({ type: 'lane.resumed'; laneId: LaneId } & Stamp)
  | ({ type: 'runtime.tick'; queued: number; running: number } & Stamp)

export interface RuntimeSnapshot {
  lanes: LaneRunner[]
  tasks: LaneTask[]
  events: RuntimeEvent[]
  at: string
}
