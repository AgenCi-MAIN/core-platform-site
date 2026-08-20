import { redirect } from "next/navigation";
import { requireFounder } from "../access";

export const dynamic = "force-dynamic";

export default async function DialerPage() {
  await requireFounder("/portal/dialer", "calls.dial");
  redirect("/portal/calls?tab=outbound");
}
