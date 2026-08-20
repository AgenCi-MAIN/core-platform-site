export type ProbeState = {
  status: "ready" | "working" | "degraded";
  lastProbeAt: string | null;
  lastError: string | null;
};

/**
 * A successful probe proves the Durable Object is reachable and its memory is
 * synchronized. Clear a previous transient model failure instead of leaving
 * the agent permanently degraded after recovery.
 */
export function recoverAfterSuccessfulProbe<T extends ProbeState>(
  state: T,
  probedAt: string,
): T {
  return {
    ...state,
    status: "ready",
    lastProbeAt: probedAt,
    lastError: null,
  };
}
