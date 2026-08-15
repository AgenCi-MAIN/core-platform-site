import {
  clearedCookieHeader,
  safeRelativeReturnPath,
  SESSION_COOKIE,
} from "../../google-auth";

export const dynamic = "force-dynamic";

/**
 * Clears the portal session. This signs the visitor out of the portal only —
 * their Google account is untouched, which the sign-in flow accounts for by
 * always showing Google's account chooser.
 */
export function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = safeRelativeReturnPath(url.searchParams.get("return_to") ?? "/");

  const responseHeaders = new Headers({ location: returnTo });
  responseHeaders.append(
    "set-cookie",
    clearedCookieHeader(SESSION_COOKIE, url.protocol === "https:"),
  );
  return new Response(null, { status: 302, headers: responseHeaders });
}
