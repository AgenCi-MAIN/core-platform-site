import { env } from "cloudflare:workers";
import { headers } from "next/headers";

/**
 * Sign in with Google — identity for a self-hosted deployment.
 *
 * The previous identity source was the Sites hosting platform, which injected
 * `oai-authenticated-user-*` headers after authenticating the visitor. Those
 * headers were trustworthy only because that platform stripped them from
 * incoming requests. Self-hosted on a plain Cloudflare Worker there is no such
 * platform, so a header-based identity would be writable by anyone. Identity
 * therefore comes from a session cookie that only this application can mint:
 *
 *   1. `/auth/signin` starts an OAuth 2.0 authorization-code flow with PKCE
 *      against Google, carrying a signed, single-use transaction cookie.
 *   2. `/auth/callback` exchanges the code (server-side, with the client
 *      secret) and mints the session cookie from Google's ID token.
 *   3. Every request reads identity from that cookie via `getAuthUser`.
 *
 * The session token is `v1.<base64url payload>.<base64url hmac>`, authenticated
 * with HMAC-SHA256 under `SESSION_SECRET`. A token that fails verification for
 * ANY reason — bad format, bad signature, expired, malformed payload — is
 * treated as no identity at all. Authorization is unchanged: identity alone
 * still grants nothing; `portal_members` decides membership and role.
 *
 * Secrets (set with `wrangler secret put`, or `.dev.vars` locally):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET — the OAuth client.
 *   SESSION_SECRET — long random string; rotating it signs everyone out.
 */

export type AuthUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

export const SESSION_COOKIE = "core_session";
export const TXN_COOKIE = "core_oauth";

export const SIGN_IN_PATH = "/auth/signin";
export const SIGN_OUT_PATH = "/auth/signout";
export const CALLBACK_PATH = "/auth/callback";

/** Seven days. The payload `exp` and the cookie Max-Age carry the same value. */
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

/** Ten minutes to complete the round-trip to Google. */
export const TXN_TTL_SECONDS = 10 * 60;

const encoder = new TextEncoder();

type SessionClaims = {
  sub: string;
  email: string;
  name: string | null;
  iat: number;
  exp: number;
};

/** The signed-in visitor, or null. Never throws; every failure is anonymous. */
export async function getAuthUser(): Promise<AuthUser | null> {
  const sessionSecret = env.SESSION_SECRET;
  if (!sessionSecret) return null;

  const requestHeaders = await headers();
  const token = readCookie(requestHeaders.get("cookie"), SESSION_COOKIE);
  if (!token) return null;

  const claims = await verifyToken(token, sessionSecret);
  if (!claims) return null;

  const { sub, email, name, exp } = claims as Partial<SessionClaims>;
  if (typeof sub !== "string" || sub.length === 0) return null;
  if (typeof email !== "string" || email.length === 0) return null;
  if (typeof exp !== "number" || exp * 1000 <= Date.now()) return null;

  const fullName = typeof name === "string" && name.length > 0 ? name : null;
  return { userId: sub, displayName: fullName ?? email, email, fullName };
}

export function signInPath(returnTo: string): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function signOutPath(returnTo = "/"): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  sessionSecret: string;
};

/** All three secrets, or null — sign-in is either fully configured or off. */
export function getGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const sessionSecret = env.SESSION_SECRET;
  if (!clientId || !clientSecret || !sessionSecret) return null;
  return { clientId, clientSecret, sessionSecret };
}

/* ============================================================
   Signed tokens.
   ============================================================ */

export async function mintToken(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const body = `v1.${base64UrlEncode(encoder.encode(JSON.stringify(payload)))}`;
  const key = await hmacKey(secret, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return `${body}.${base64UrlEncode(new Uint8Array(mac))}`;
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;

  const payloadBytes = base64UrlDecode(parts[1]);
  const macBytes = base64UrlDecode(parts[2]);
  if (!payloadBytes || !macBytes) return null;

  // crypto.subtle.verify recomputes the MAC and compares in constant time.
  const key = await hmacKey(secret, ["verify"]);
  const authentic = await crypto.subtle.verify(
    "HMAC",
    key,
    macBytes,
    encoder.encode(`v1.${parts[1]}`),
  );
  if (!authentic) return null;

  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(payloadBytes));
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function hmacKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages,
  );
}

/**
 * Decode a JWT's claims WITHOUT verifying its signature. Only valid for a
 * token received directly from the issuer's token endpoint over TLS, where
 * the transport already authenticates the sender. Never use this on a token
 * that arrived from the client.
 */
export function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  const bytes = base64UrlDecode(parts[1]);
  if (!bytes) return null;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function base64UrlEncode(bytes: Uint8Array): string {
  let raw = "";
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecode(text: string): Uint8Array<ArrayBuffer> | null {
  const remainder = text.length % 4;
  if (remainder === 1) return null;
  const padded =
    text.replace(/-/g, "+").replace(/_/g, "/") +
    (remainder === 2 ? "==" : remainder === 3 ? "=" : "");
  try {
    const raw = atob(padded);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export function randomToken(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/* ============================================================
   Cookies.
   ============================================================ */

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const piece of header.split(";")) {
    const eq = piece.indexOf("=");
    if (eq === -1) continue;
    if (piece.slice(0, eq).trim() === name) return piece.slice(eq + 1).trim();
  }
  return null;
}

export function sessionCookieHeader(token: string, secure: boolean): string {
  return cookieHeader(SESSION_COOKIE, token, SESSION_TTL_SECONDS, secure);
}

export function txnCookieHeader(token: string, secure: boolean): string {
  return cookieHeader(TXN_COOKIE, token, TXN_TTL_SECONDS, secure);
}

export function clearedCookieHeader(name: string, secure: boolean): string {
  return cookieHeader(name, "", 0, secure);
}

function cookieHeader(
  name: string,
  value: string,
  maxAge: number,
  secure: boolean,
): string {
  // SameSite=Lax: sent on top-level navigations, so the redirect back from
  // Google carries the transaction cookie, while cross-site subresource
  // requests do not carry the session.
  return (
    `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}` +
    (secure ? "; Secure" : "")
  );
}

/* ============================================================
   Return-path hygiene.
   ============================================================ */

export function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  // A `..` segment can normalize a path down to one that BEGINS with `//`
  // even though the raw input did not: "/..//evil.com" survives the guard
  // above, and the URL parser resolves it to pathname "//evil.com" while the
  // origin still reads as ours. Returned verbatim into a Location header that
  // is a protocol-relative URL, and the browser resolves it to https://evil.com
  // — an open redirect on an unauthenticated surface, reachable through the
  // sign-out and sign-in return_to parameters. Re-check after normalization,
  // not just before it.
  if (url.pathname.startsWith("//")) return "/";
  if (isReservedAuthPath(url.pathname)) return "/";

  return `${url.pathname}${url.search}${url.hash}`;
}

function isReservedAuthPath(pathname: string): boolean {
  return (
    pathname === SIGN_IN_PATH ||
    pathname === SIGN_OUT_PATH ||
    pathname === CALLBACK_PATH
  );
}
