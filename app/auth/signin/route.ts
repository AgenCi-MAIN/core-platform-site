import {
  base64UrlEncode,
  getGoogleOAuthConfig,
  mintToken,
  nowSeconds,
  randomToken,
  safeRelativeReturnPath,
  txnCookieHeader,
  TXN_TTL_SECONDS,
} from "../../google-auth";

export const dynamic = "force-dynamic";

/**
 * Start of the Sign in with Google flow. Issues a signed transaction cookie
 * holding the OAuth state, the PKCE verifier, and where to return afterwards,
 * then hands the browser to Google's consent screen.
 */
export async function GET(request: Request) {
  const config = getGoogleOAuthConfig();
  if (!config) {
    return new Response(
      "Sign-in is not configured on this deployment. An administrator must set " +
        "the GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and SESSION_SECRET secrets.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  const url = new URL(request.url);
  const returnTo = safeRelativeReturnPath(
    url.searchParams.get("return_to") ?? "/portal",
  );

  const state = randomToken();
  const verifier = randomToken();
  const challenge = base64UrlEncode(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
    ),
  );

  const txn = await mintToken(
    { state, verifier, returnTo, exp: nowSeconds() + TXN_TTL_SECONDS },
    config.sessionSecret,
  );

  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorize.searchParams.set("client_id", config.clientId);
  authorize.searchParams.set("redirect_uri", `${url.origin}/auth/callback`);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "openid email profile");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "S256");
  // Always offer the account chooser: members are told to sign in with their
  // onboarding address, and silently reusing whatever Google session happens
  // to be active is how the wrong account gets used.
  authorize.searchParams.set("prompt", "select_account");

  const responseHeaders = new Headers({ location: authorize.toString() });
  responseHeaders.append(
    "set-cookie",
    txnCookieHeader(txn, url.protocol === "https:"),
  );
  return new Response(null, { status: 302, headers: responseHeaders });
}
