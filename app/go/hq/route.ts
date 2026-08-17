import { redirect } from "next/navigation";
import { requireFounder } from "../../portal/access";
import { HQ_ENTRY_URL } from "../destinations";

export async function GET() {
  await requireFounder("/go/hq");
  redirect(HQ_ENTRY_URL);
}
