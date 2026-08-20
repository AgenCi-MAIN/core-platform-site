import { getAgentByName } from "agents";
import { CORE_MEMORY_VERSION } from "../../shared/core-memory";
import { PERSONAS, isPersonaId } from "../../shared/personas";
import { CoreAgent, type AgentStatus, type Env } from "./core-agent";
import { authorized, parseChatInput } from "./security";

export { CoreAgent };

function json(payload: unknown, status = 200): Response {
  return Response.json(payload, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
    },
  });
}

async function forEveryAgent(
  env: Env,
  action: "bootstrap" | "probe" | "status",
): Promise<AgentStatus[]> {
  return Promise.all(
    PERSONAS.map(async (persona) => {
      const agent = await getAgentByName<Env, CoreAgent>(env.CoreAgent, persona.id, {
        locationHint: "enam",
        routingRetry: { maxAttempts: 3 },
      });
      if (action === "bootstrap") return agent.bootstrap(persona.id);
      if (action === "probe") return agent.probe(persona.id);
      return agent.getStatus(persona.id);
    }),
  );
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (!authorized(request, env.FLEET_API_TOKEN)) return json({ error: "unauthorized" }, 401);

  if (url.pathname === "/v1/personas" && request.method === "GET") {
    return json({
      personas: PERSONAS.map(({ id, number, name, role, title, commandSeat, inkboxHandle, accent, monogram }) => ({
        id, number, name, role, title, commandSeat, inkboxHandle, accent, monogram,
      })),
    });
  }

  if (url.pathname === "/v1/fleet/bootstrap" && request.method === "POST") {
    const agents = await forEveryAgent(env, "bootstrap");
    console.log(JSON.stringify({ event: "fleet_bootstrapped", count: agents.length }));
    return json({ service: "core-agent-fleet", bootstrappedAt: new Date().toISOString(), agents });
  }

  if (url.pathname === "/v1/fleet/status" && request.method === "GET") {
    const agents = await forEveryAgent(env, "status");
    return json({ service: "core-agent-fleet", checkedAt: new Date().toISOString(), agents });
  }

  if (url.pathname === "/v1/fleet/probe" && request.method === "POST") {
    const agents = await forEveryAgent(env, "probe");
    console.log(JSON.stringify({ event: "fleet_probe_complete", count: agents.length }));
    return json({ service: "core-agent-fleet", checkedAt: new Date().toISOString(), agents });
  }

  const chatMatch = url.pathname.match(/^\/v1\/agents\/([^/]+)\/chat$/);
  if (chatMatch && request.method === "POST") {
    const personaId = decodeURIComponent(chatMatch[1]);
    if (!isPersonaId(personaId)) return json({ error: "unknown_agent" }, 404);
    try {
      const input = await parseChatInput(request);
      const agent = await getAgentByName<Env, CoreAgent>(env.CoreAgent, personaId, {
        locationHint: "enam",
        routingRetry: { maxAttempts: 3 },
      });
      return json(await agent.chat(personaId, input.message));
    } catch (error) {
      const reason = error instanceof Error ? error.message : "invalid_request";
      const clientError = reason === "request_too_large" || reason.includes("JSON") || reason.includes("Too big");
      return json({ error: clientError ? "invalid_request" : "agent_unavailable" }, clientError ? 400 : 503);
    }
  }

  return json({ error: "not_found" }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return json({
        service: "core-agent-fleet",
        status: "ok",
        agentCount: PERSONAS.length,
        version: env.FLEET_VERSION ?? "0.1.0",
        memoryVersion: CORE_MEMORY_VERSION,
        tools: 0,
      });
    }
    if (url.pathname.startsWith("/v1/")) return handleApi(request, env);
    return json({ error: "not_found" }, 404);
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      forEveryAgent(env, "probe")
        .then((agents) => console.log(JSON.stringify({ event: "scheduled_fleet_probe", count: agents.length })))
        .catch((error) => console.error(JSON.stringify({ event: "scheduled_fleet_probe_failed", reason: String(error) }))),
    );
  },
} satisfies ExportedHandler<Env>;
