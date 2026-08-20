import { connection } from "next/server";
import { FleetConsole, type FleetPayload } from "@/components/fleet-console";
import { fleetRequest } from "@/lib/fleet-client";

export default async function Page() {
  await connection();
  let initialFleet: FleetPayload | null = null;
  let initialError: string | null = null;

  try {
    initialFleet = await fleetRequest<FleetPayload>("/v1/fleet/status");
  } catch {
    initialError = "The Cloudflare fleet is unavailable or not configured.";
  }

  return <FleetConsole initialFleet={initialFleet} initialError={initialError} />;
}
