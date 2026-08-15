import {
  clearedCookieHeader,
  decodeJwtPayload,
  getGoogleOAuthConfig,
  mintToken,
  nowSeconds,
  readCookie,
  safeRelativeReturnPath,
  sessionCookieHeader,
  SESSION_TTL_SECONDS,
  TXN_COOKIE,
  verifyToken,
} from "../../google-auth";

export const dynamic = "force-dynamic";

/**
 * Completion of the Sign in with Google flow. Verifies the transaction cookie
 * minted by /auth/signin, exchanges the authorization code server-side, and
 * turns Google's ID token into the portal's session cookie.
 *
 * Every rejection lands on /access — the public sign-in page — rather than an
 * error page. The reason is logged server-side but never shown: a failed
 * sign-in must not disclose anything about accounts or configuration.
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
  const secure = url.protocol === "https:";

  const reject = (reason: string): Response => {
    console.warn(`[auth] sign-in rejected: ${reason}`);
    const responseHeaders = new Headers({ location: "/access" });
    responseHeaders.append(
      "set-cookie",
      clearedCookieHeader(TXN_COOKIE, secure),
    );
    return new Response(null, { status: 302, headers: responseHeaders });
  };

  const providerError = url.searchParams.get("error");
  if (providerError) return reject(`provider_${providerError}`);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return reject("missing_code_or_state");

  const txnToken = readCookie(request.headers.get("cookie"), TXN_COOKIE);
  if (!txnToken) return reject("missing_transaction_cookie");

  const txn = await verifyToken(txnToken, config.sessionSecret);
  if (!txn) return reject("invalid_transaction_cookie");

  const { state: expectedState, verifier, returnTo, exp } = txn as Partial<{
    state: string;
    verifier: string;
    returnTo: string;
    exp: number;
  }>;
  if (typeof exp !== "number" || exp * 1000 <= Date.now()) {
    return reject("transaction_expired");
  }
  if (typeof expectedState !== "string" || expectedState !== state) {
    return reject("state_mismatch");
  }
  if (typeof verifier !== "string" || verifier.length === 0) {
    return reject("missing_verifier");
  }

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: `${url.origin}/auth/callback`,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
    });
  } catch {
    return reject("token_endpoint_unreachable");
  }
  if (!tokenResponse.ok) return reject(`token_exchange_http_${tokenResponse.status}`);

  const tokenBody = (await tokenResponse.json().catch(() => null)) as {
    id_token?: string;
  } | null;
  if (!tokenBody?.id_token) return reject("missing_id_token");

  // The ID token came straight from Google's token endpoint over TLS in the
  // exchange we initiated, so the transport authenticates it; the claims are
  // still validated individually below.
  const claims = decodeJwtPayload(tokenBody.id_token);
  if (!claims) return reject("unreadable_id_token");

  if (
    claims.iss !== "https://accounts.google.com" &&
    claims.iss !== "accounts.google.com"
  ) {
    return reject("wrong_issuer");
  }
  if (claims.aud !== config.clientId) return reject("wrong_audience");
  if (typeof claims.exp !== "number" || claims.exp * 1000 <= Date.now()) {
    return reject("expired_id_token");
  }
  if (typeof claims.sub !== "string" || claims.sub.length === 0) {
    return reject("missing_subject");
  }
  if (typeof claims.email !== "string" || claims.email.length === 0) {
    return reject("missing_email");
  }
  // An unverified address can be claimed by anyone at the provider. Since the
  // membership allowlist is keyed by email, admitting one would let a stranger
  // register a member's address and inherit their access.
  if (claims.email_verified !== true) return reject("email_not_verified");

  const now = nowSeconds();
  const session = await mintToken(
    {
      // Prefixed so a subject can never collide with one issued by a different
      // provider if the identity source ever changes again.
      sub: `google:${claims.sub}`,
      email: claims.email,
      name:
        typeof claims.name === "string" && claims.name.length > 0
          ? claims.name
          : null,
      iat: now,
      exp: now + SESSION_TTL_SECONDS,
    },
    config.sessionSecret,
  );

  const responseHeaders = new Headers({
    location:
      typeof returnTo === "string" ? safeRelativeReturnPath(returnTo) : "/portal",
  });
  responseHeaders.append("set-cookie", sessionCookieHeader(session, secure));
  responseHeaders.append("set-cookie", clearedCookieHeader(TXN_COOKIE, secure));
  return new Response(null, { status: 302, headers: responseHeaders });
}
