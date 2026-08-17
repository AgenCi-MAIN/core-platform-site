import { redirect } from "next/navigation";
import { requireFounder } from "../../portal/access";
import { ROUTINES_ENTRY_URL } from "../destinations";

export async function GET() {
  await requireFounder("/go/routines");
  redirect(ROUTINES_ENTRY_URL);
}
