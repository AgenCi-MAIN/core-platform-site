import { NextResponse } from "next/server";
import { requireFounder } from "../../portal/access";

export async function GET() {
  await requireFounder("/go/desk");
  return NextResponse.redirect(
    new URL(
      "https://mail.google.com/mail/?view=cm&fs=1&to=out-reach%40inkboxmail.com",
    ),
    307,
  );
}
