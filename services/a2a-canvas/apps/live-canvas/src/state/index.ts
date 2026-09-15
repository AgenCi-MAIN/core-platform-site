/**
 * Public surface of the state module — everything the integrator (main.ts)
 * and sibling modules should import from `src/state/index.ts`.
 */
export { reduce } from './reducer.ts'
export { createStore } from './store.ts'
export { createLocalStoragePersistence, createMemoryPersistence, type StorageLike } from './persist.ts'
export { createSeedFactory } from './seeds.ts'
export {
  createHistoryStack, recordSnapshot, shouldRecord, canUndo, canRedo, undo, redo,
  DEFAULT_HISTORY_LIMIT, type HistoryStack, type HistoryStep,
} from './history.ts'
