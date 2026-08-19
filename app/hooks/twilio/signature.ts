/**
 * Twilio webhook signature verification.
 *
 * Twilio signs each webhook with `X-Twilio-Signature` =
 *   Base64( HMAC-SHA1( key = Auth Token,
 *                      message = the exact public webhook URL
 *                                + every POST parameter, sorted by name,
 *                                appended as name+value with no delimiters ) )
 * (confirmed against twilio.com/docs/usage/security.)
 *
 * Two house rules are load-bearing here:
 *
 *  - **The URL is a configured constant, never rebuilt from request headers.**
 *    This repo never trusts identity or origin from a header, and the signed
 *    URL is exactly that class of value: a `Host`/`X-Forwarded-*` an attacker
 *    controls would let them recompute a matching signature. The caller passes
 *    the URL that Twilio was configured with, from a stored setting.
 *  - **The comparison is constant-time.** Never `===` on the two base64
 *    strings.
 *
 * A request that fails verification for any reason — no token configured, no
 * signature header, wrong signature — is treated as unauthenticated. The route
 * answers 403 and echoes nothing the caller sent.
 */

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * The base64 HMAC-SHA1 Twilio expects for these params at this URL. Exported
 * for tests; the route calls {@link verifyTwilioSignature}.
 */
export async function computeTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) data += key + params[key];

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64(new Uint8Array(mac));
}

/**
 * Constant-time string compare. The two inputs here are base64 of a
 * fixed-length (20-byte) SHA-1 digest, so a length mismatch only ever means
 * the presented signature is the wrong shape — it leaks nothing about the
 * token — but the per-character accumulate below never short-circuits on
 * content, which is the property that matters.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyTwilioSignature(args: {
  authToken: string | undefined | null;
  url: string | undefined | null;
  params: Record<string, string>;
  signature: string | undefined | null;
}): Promise<boolean> {
  const { authToken, url, params, signature } = args;
  if (!authToken || !url || !signature) return false;
  const expected = await computeTwilioSignature(authToken, url, params);
  return constantTimeEqual(expected, signature);
}
