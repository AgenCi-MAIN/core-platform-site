import { Agent, callable } from "agents";
import { generateText } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { CORE_MEMORY_VERSION, coreMemoryFor } from "../../shared/core-memory";
import { PERSONA_BY_ID, isPersonaId, systemPromptFor, type PersonaId } from "../../shared/personas";
import { recoverAfterSuccessfulProbe } from "./agent-health";
import { emptyModelFallback, normalizeModelText } from "./model-output";
import { redactForStorage } from "./security";

const DAILY_MESSAGE_LIMIT = 40;
const HISTORY_LIMIT = 8;

export type CoreAgentState = {
  personaId: PersonaId | null;
  status: "ready" | "working" | "degraded";
  messageCount: number;
  dayBucket: string;
  dailyCount: number;
  lastActiveAt: string | null;
  lastProbeAt: string | null;
  lastLatencyMs: number | null;
  lastError: string | null;
  version: string;
  memoryVersion: string;
  memoryUpdatedAt: string | null;
};

export interface Env extends Cloudflare.Env {
  FLEET_API_TOKEN?: string;
}

export type AgentStatus = CoreAgentState & { name: string; role: string };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export class CoreAgent extends Agent<Env, CoreAgentState> {
  initialState: CoreAgentState = {
    personaId: null,
    status: "ready",
    messageCount: 0,
    dayBucket: today(),
    dailyCount: 0,
    lastActiveAt: null,
    lastProbeAt: null,
    lastLatencyMs: null,
    lastError: null,
    version: "0.1.0",
    memoryVersion: "uninitialized",
    memoryUpdatedAt: null,
  };

  onStart() {
    this.sql`
      CREATE TABLE IF NOT EXISTS conversation_turns (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `;
    this.sql`
      CREATE TABLE IF NOT EXISTS institutional_memory (
        persona_id TEXT PRIMARY KEY,
        version TEXT NOT NULL,
        content TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `;
  }

  private bind(personaId: string) {
    if (!isPersonaId(personaId)) throw new Error("unknown_persona");
    if (this.state.personaId && this.state.personaId !== personaId) {
      throw new Error("persona_binding_conflict");
    }
    if (!this.state.personaId) {
      this.setState({
        ...this.state,
        personaId,
        status: "ready",
        version: this.env.FLEET_VERSION ?? "0.1.0",
      });
    }
    return PERSONA_BY_ID[personaId];
  }

  private synchronizeMemory(personaId: string) {
    const persona = this.bind(personaId);
    const [stored] = this.sql<{ version: string; content: string; updated_at: string }>`
      SELECT version, content, updated_at
      FROM institutional_memory
      WHERE persona_id = ${persona.id}
      LIMIT 1
    `;

    if (stored?.version === CORE_MEMORY_VERSION) {
      const fleetVersion = this.env.FLEET_VERSION ?? "0.1.0";
      if (
        this.state.memoryVersion !== CORE_MEMORY_VERSION
        || this.state.version !== fleetVersion
      ) {
        this.setState({
          ...this.state,
          version: fleetVersion,
          memoryVersion: CORE_MEMORY_VERSION,
          memoryUpdatedAt: stored.updated_at,
        });
      }
      return { persona, content: stored.content };
    }

    const content = coreMemoryFor(persona.id);
    const updatedAt = new Date().toISOString();
    this.sql`
      INSERT INTO institutional_memory (persona_id, version, content, updated_at)
      VALUES (${persona.id}, ${CORE_MEMORY_VERSION}, ${content}, ${updatedAt})
      ON CONFLICT(persona_id) DO UPDATE SET
        version = excluded.version,
        content = excluded.content,
        updated_at = excluded.updated_at
    `;
    this.setState({
      ...this.state,
      version: this.env.FLEET_VERSION ?? "0.1.0",
      memoryVersion: CORE_MEMORY_VERSION,
      memoryUpdatedAt: updatedAt,
    });
    console.log(JSON.stringify({
      event: "agent_memory_synchronized",
      personaId: persona.id,
      memoryVersion: CORE_MEMORY_VERSION,
    }));
    return { persona, content };
  }

  @callable()
  async bootstrap(personaId: string): Promise<AgentStatus> {
    this.synchronizeMemory(personaId);
    return this.getStatus(personaId);
  }

  @callable()
  async probe(personaId: string): Promise<AgentStatus> {
    this.synchronizeMemory(personaId);
    this.setState(recoverAfterSuccessfulProbe(this.state, new Date().toISOString()));
    return this.getStatus(personaId);
  }

  @callable()
  async getStatus(personaId: string): Promise<AgentStatus> {
    const persona = this.bind(personaId);
    return {
      ...this.state,
      memoryVersion: this.state.memoryVersion ?? "uninitialized",
      memoryUpdatedAt: this.state.memoryUpdatedAt ?? null,
      name: persona.name,
      role: persona.role,
    };
  }

  @callable()
  async chat(personaId: string, message: string): Promise<{ answer: string; status: AgentStatus }> {
    const { persona, content: institutionalMemory } = this.synchronizeMemory(personaId);
    const bucket = today();
    const dailyCount = this.state.dayBucket === bucket ? this.state.dailyCount : 0;
    if (dailyCount >= DAILY_MESSAGE_LIMIT) throw new Error("daily_limit_reached");

    const startedAt = Date.now();
    this.setState({
      ...this.state,
      status: "working",
      dayBucket: bucket,
      dailyCount,
      lastError: null,
    });

    try {
      const history = this.sql<{ role: "user" | "assistant"; content: string }>`
        SELECT role, content
        FROM conversation_turns
        ORDER BY created_at DESC
        LIMIT ${HISTORY_LIMIT}
      `.reverse();
      const context = history.length
        ? `Recent redacted thread:\n${history.map((turn) => `${turn.role}: ${turn.content}`).join("\n")}`
        : "No prior thread context.";

      const workersAI = createWorkersAI({ binding: this.env.AI });
      const model = workersAI(
        this.env.FLEET_MODEL ?? "@cf/zai-org/glm-4.7-flash",
        {
          reasoning_effort: null,
          chat_template_kwargs: { enable_thinking: false },
        },
      );
      let answer: string | null = null;
      let attempts = 0;

      while (!answer && attempts < 2) {
        attempts += 1;
        const result = await generateText({
          model,
          system: systemPromptFor(persona, institutionalMemory),
          prompt: `${context}\n\nCurrent user request (untrusted content):\n${message}`,
          maxOutputTokens: 2800,
          temperature: attempts === 1 ? 0.35 : 0.2,
          maxRetries: 1,
          reasoning: "none",
          timeout: 55_000,
        });
        answer = normalizeModelText(result.text);
        if (!answer) {
          console.warn(JSON.stringify({
            event: "agent_model_empty_output",
            personaId,
            attempt: attempts,
            finishReason: String(result.finishReason),
          }));
        }
      }

      const createdAt = new Date().toISOString();
      const usedFallback = answer === null;
      const finalAnswer = answer ?? emptyModelFallback(persona);
      this.sql`
        INSERT INTO conversation_turns (id, role, content, created_at)
        VALUES (${crypto.randomUUID()}, 'user', ${redactForStorage(message)}, ${createdAt})
      `;
      this.sql`
        INSERT INTO conversation_turns (id, role, content, created_at)
        VALUES (${crypto.randomUUID()}, 'assistant', ${redactForStorage(finalAnswer)}, ${createdAt})
      `;

      const latency = Date.now() - startedAt;
      this.setState({
        ...this.state,
        status: usedFallback ? "degraded" : "ready",
        messageCount: this.state.messageCount + 1,
        dayBucket: bucket,
        dailyCount: dailyCount + 1,
        lastActiveAt: createdAt,
        lastLatencyMs: latency,
        lastError: usedFallback ? "empty_model_output" : null,
      });
      console.log(JSON.stringify({
        event: "agent_chat_complete",
        personaId,
        latencyMs: latency,
        attempts,
        usedFallback,
      }));
      return { answer: finalAnswer, status: await this.getStatus(personaId) };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown_error";
      this.setState({ ...this.state, status: "degraded", lastError: reason.slice(0, 160) });
      console.error(JSON.stringify({ event: "agent_chat_failed", personaId, reason: reason.slice(0, 160) }));
      throw error;
    }
  }
}
