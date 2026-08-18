import { NextResponse } from "next/server";
import { requireFounder } from "../../portal/access";

export async function GET() {
  await requireFounder("/go/desk", "go.desk");
  // authuser pins WHICH Google account Gmail opens the compose in. Without
  // it, Gmail picks the device's preferred account — which on the founder's
  // phone was the retired bankerrunners@gmail.com, a locked account that
  // dead-ends at a verification wall and is FROZEN for outreach by owner
  // decision A12. Pinning the migrated identity enforces A12 at the tool
  // level: this desk cannot open a compose as the dead account. A constant,
  // never caller input — the fixed-handoff test pins the exact param set.
  return NextResponse.redirect(
    new URL(
      "https://mail.google.com/mail/?view=cm&fs=1&to=out-reach%40inkboxmail.com&authuser=btcmao518%40gmail.com",
    ),
    307,
  );
}
