import { describe, expect, it } from "vitest";
import { PERSONA_BY_ID } from "../../shared/personas";
import { emptyModelFallback, normalizeModelText } from "../src/model-output";

describe("model output handling", () => {
  it("accepts useful final text and rejects whitespace-only output", () => {
    expect(normalizeModelText("  useful answer  ")).toBe("useful answer");
    expect(normalizeModelText(" \n\t ")).toBeNull();
  });

  it("returns a truthful degraded response after bounded empty attempts", () => {
    const fallback = emptyModelFallback(PERSONA_BY_ID.lumen);
    expect(fallback).toContain("Lumen is active");
    expect(fallback).toContain("two bounded attempts");
    expect(fallback).toContain("No external action was taken");
    expect(fallback).toContain("degraded");
  });
});
