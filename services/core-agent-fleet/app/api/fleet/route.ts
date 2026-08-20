import { connection } from "next/server";
import { fleetRequest } from "@/lib/fleet-client";

export async function GET() {
  await connection();
  try {
    const payload = await fleetRequest("/v1/fleet/status");
    return Response.json(payload, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json(
      { error: "The Cloudflare fleet is unavailable or not configured." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}

export async function POST() {
  await connection();
  try {
    const payload = await fleetRequest("/v1/fleet/bootstrap", {
      method: "POST",
      body: "{}",
    });
    return Response.json(payload, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json(
      { error: "The Cloudflare fleet memory update failed." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
