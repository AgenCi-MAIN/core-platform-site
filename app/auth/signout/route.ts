import {
  clearedCookieHeader,
  safeRelativeReturnPath,
  SESSION_COOKIE,
} from "../../google-auth";
import { COMMAND_PASS_COOKIE } from "../../portal/command-pass";

export const dynamic = "force-dynamic";

/**
 * Clears the portal session. This signs the visitor out of the portal only —
 * their Google account is untouched, which the sign-in flow accounts for by
 * always showing Google's account chooser.
 */
export function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = safeRelativeReturnPath(url.searchParams.get("return_to") ?? "/");

  const secure = url.protocol === "https:";
  const responseHeaders = new Headers({ location: returnTo });
  responseHeaders.append("set-cookie", clearedCookieHeader(SESSION_COOKIE, secure));
  // Clear the Command Center pass too. Leaving it behind meant signing out and
  // back in returned someone to an unlocked Command Center without redeeming
  // anything — the pass outliving the session it was granted inside.
  responseHeaders.append("set-cookie", clearedCookieHeader(COMMAND_PASS_COOKIE, secure));
  return new Response(null, { status: 302, headers: responseHeaders });
}
