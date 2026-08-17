import { redirect } from "next/navigation";
import { requireFounder } from "../../portal/access";
import { MR_T_DESK_URL } from "../destinations";

export async function GET() {
  await requireFounder("/go/desk");
  redirect(MR_T_DESK_URL);
}
