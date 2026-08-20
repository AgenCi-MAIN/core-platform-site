import { connection } from "next/server";
import { isPersonaId } from "@/shared/personas";
import { fleetRequest } from "@/lib/fleet-client";

const MAX_MESSAGE_LENGTH = 4_000;

export const maxDuration = 90;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await connection();
  const { id } = await context.params;
  if (!isPersonaId(id)) {
    return Response.json({ error: "Unknown agent." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { message?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: `Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 },
    );
  }

  try {
    const payload = await fleetRequest(`/v1/agents/${id}/chat`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    return Response.json(payload, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json(
      { error: "The agent could not answer. No external action was taken." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
