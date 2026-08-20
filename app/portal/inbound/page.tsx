import { redirect } from "next/navigation";
import { requireCapability } from "../access";

export const dynamic = "force-dynamic";

export default async function InboundCompatibilityPage() {
  await requireCapability("calls.answer", "/portal/inbound");
  redirect("/portal/calls?tab=live");
}
