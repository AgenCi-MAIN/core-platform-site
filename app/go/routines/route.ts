import { NextResponse, type NextRequest } from "next/server";
import { requireFounder } from "../../portal/access";

export async function GET(request: NextRequest) {
  await requireFounder("/go/routines", "go.routines");
  return NextResponse.redirect(
    new URL("/portal/command#handoff-routines", request.url),
    307,
  );
}
