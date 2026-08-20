import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 4_000;
export const MAX_REQUEST_BYTES = 12_000;

const chatSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});

export type ChatInput = z.infer<typeof chatSchema>;

export function constantTimeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  const length = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;

  for (let index = 0; index < length; index += 1) {
    mismatch |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return mismatch === 0;
}
export function authorized(request: Request, expectedToken: string | undefined): boolean {
  if (!expectedToken) return false;
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  return constantTimeEqual(header.slice(7), expectedToken);
}

export async function parseChatInput(request: Request): Promise<ChatInput> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new Error("request_too_large");
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).length > MAX_REQUEST_BYTES) {
    throw new Error("request_too_large");
  }
  return chatSchema.parse(JSON.parse(body));
}

export function redactForStorage(value: string): string {
  return value
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[email redacted]")
    .replace(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[phone redacted]")
    .replace(/\b(?:sk|pk|api|token|key)[_-][A-Za-z0-9_-]{12,}\b/gi, "[credential redacted]")
    .replace(/\bBearer\s+[A-Za-z0-9._~-]{12,}\b/gi, "Bearer [redacted]");
}
