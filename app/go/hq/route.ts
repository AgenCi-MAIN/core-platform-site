import { NextResponse } from "next/server";
import { requireFounder } from "../../portal/access";

export async function GET() {
  await requireFounder("/go/hq");
  return NextResponse.redirect(
    new URL("https://claude.ai/code/session_01W4UZQ4izQyBNT2HEd9D9PK"),
    307,
  );
}
