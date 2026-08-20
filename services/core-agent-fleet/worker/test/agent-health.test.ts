import { describe, expect, it } from "vitest";
import { recoverAfterSuccessfulProbe } from "../src/agent-health";

describe("agent probe recovery", () => {
  it("clears a transient degraded state after a successful probe", () => {
    const recovered = recoverAfterSuccessfulProbe(
      {
        status: "degraded" as const,
        lastProbeAt: null,
        lastError: "model_timeout",
        messageCount: 7,
      },
      "2026-08-20T12:00:00.000Z",
    );

    expect(recovered).toEqual({
      status: "ready",
      lastProbeAt: "2026-08-20T12:00:00.000Z",
      lastError: null,
      messageCount: 7,
    });
  });
});
