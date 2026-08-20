import { describe, expect, it } from "vitest";
import { CORE_MEMORY_VERSION, coreMemoryFor } from "../../shared/core-memory";
import { PERSONAS, systemPromptFor } from "../../shared/personas";

describe("personality registry", () => {
  it("contains exactly ten unique Cloudflare and Inkbox identities", () => {
    expect(PERSONAS).toHaveLength(10);
    expect(new Set(PERSONAS.map((persona) => persona.id)).size).toBe(10);
    expect(new Set(PERSONAS.map((persona) => persona.name)).size).toBe(10);
    expect(new Set(PERSONAS.map((persona) => persona.inkboxHandle)).size).toBe(10);
    expect(new Set(PERSONAS.map((persona) => persona.inkboxEmail)).size).toBe(10);
  });

  it("puts the non-human and no-action boundaries in every system prompt", () => {
    for (const persona of PERSONAS) {
      const prompt = systemPromptFor(persona);
      expect(prompt).toContain("software, not a human");
      expect(prompt).toContain("You have no tools");
      expect(prompt).toContain("Produce decision support and drafts only");
      expect(prompt).toContain("CORE / J.A.R.V.I.S. institutional memory");
      expect(prompt).toContain(coreMemoryFor(persona.id));
    }
  });

  it("gives every agent the same versioned baseline and a distinct role memory", () => {
    expect(CORE_MEMORY_VERSION).toBe("core-2026-08-20.1");
    const memories = PERSONAS.map((persona) => coreMemoryFor(persona.id));
    expect(new Set(memories).size).toBe(10);
    for (const memory of memories) {
      expect(memory).toContain("Commission and agency economics");
      expect(memory).toContain("Fleet collaboration contract");
      expect(memory).toContain("Role-specific memory");
    }
  });
});
