import type { Persona } from "../../shared/personas";

export function normalizeModelText(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
export function emptyModelFallback(persona: Persona): string {
  return `${persona.name} is active, but the model returned no final text after two bounded attempts. No external action was taken. Retry the request; if this repeats, treat the agent as degraded and review the fleet runtime.`;
}
