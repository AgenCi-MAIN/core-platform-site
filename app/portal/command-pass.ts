/**
 * Command Center lodge passes.
 *
 * SERVER ONLY. Never import this from a `"use client"` file — it reads the
 * session secret and the pass table, and both belong on the server alone.
 *
 * THE MODEL, decided by the founder 2026-08-18:
 *
 *   The founder (btcmao518@gmail.com) holds Command Center permanently and
 *   never touches a pass. EVERYONE else — including owners — reaches it only
 *   by redeeming a code the founder issued for their own address, and that
 *   code dies on first use.
 *
 * Four properties make a six-digit code defensible, and it needs all four:
 *
 *   1. BOUND. A pass is issued for one email. Redeeming it requires already
 *      being signed in as that person, so a leaked code is useless to anyone
 *      else and the audit row names a human rather than "whoever had it".
 *   2. SHORT. Fifteen minutes. Long enough to read down a phone line, short
 *      enough that a forgotten code is harmless within the hour.
 *   3. SINGLE USE. Redemption is recorded on the row; a redeemed pass can
 *      never be redeemed again, by anyone, including the same person.
 *   4. ATTEMPT-BOUNDED. One million codes is not many. A pass locks itself
 *      after five wrong guesses, so guessing is bounded by five attempts
 *      rather than by however much traffic fits in fifteen minutes.
 *
 * The code is never stored. Only its SHA-256 hash reaches the database, so
 * reading the table — including from the D1 console — cannot recover a live
 * code. The plaintext exists exactly once, on the screen that issued it.
 */

import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../../db";
import { commandPasses } from "../../db/schema";
import { env } from "cloudflare:workers";
import { mintToken, nowSeconds, verifyToken } from "../google-auth";

/** How long a freshly issued code stays redeemable. */
export const PASS_TTL_SECONDS = 15 * 60;

/** Wrong guesses before the pass locks itself. */
export const PASS_ATTEMPT_LIMIT = 5;

/**
 * How long a redeemed pass keeps the Command Center open. The cookie is also
 * a session cookie, so closing the browser ends it sooner — whichever comes
 * first. "One session, then gone" was the founder's choice; this is the hard
 * ceiling behind it, so a browser left open overnight does not hold the door.
 */
export const PASS_SESSION_SECONDS = 2 * 60 * 60;

export const COMMAND_PASS_COOKIE = "core_command_pass";

/** SHA-256, hex. The only form of a code that is ever persisted. */
export async function hashCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(code.trim()),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Compare two hex digests without leaking, through timing, how much of the
 * value matched. The digests are not themselves secret, but the habit is
 * cheap and the alternative teaches the wrong pattern to whoever copies this.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** A six-digit code from the platform's CSPRNG. Never Math.random. */
function generateCode(): string {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return String(buffer[0] % 1_000_000).padStart(6, "0");
}

export type IssuedPass = { code: string; expiresAt: string; id: number };

/**
 * Issue a pass for one address. Returns the plaintext code ONCE — the caller
 * must show it and then forget it. It is not recoverable afterwards from
 * anywhere, by anyone, which is the point.
 */
export async function issuePass(
  forEmail: string,
  issuedBy: string,
  note: string | null,
): Promise<IssuedPass> {
  const code = generateCode();
  const expiresAt = new Date((nowSeconds() + PASS_TTL_SECONDS) * 1000).toISOString();

  const [row] = await getDb()
    .insert(commandPasses)
    .values({
      email: forEmail.trim().toLowerCase(),
      codeHash: await hashCode(code),
      issuedBy,
      expiresAt,
      note,
    })
    .returning({ id: commandPasses.id });

  return { code, expiresAt, id: row.id };
}

export type RedeemOutcome =
  | { ok: true; token: string; passId: number }
  | { ok: false; reason: "no_pass" | "expired" | "locked" | "wrong_code" };

/**
 * Redeem a code for the signed-in person. Every failure path returns a reason
 * for the audit row and NONE of them tells the caller which part was wrong —
 * "no pass exists for you" and "your code is wrong" are the same message on
 * screen, because distinguishing them tells an attacker whether an address has
 * a live pass.
 */
export async function redeemPass(
  email: string,
  subjectId: string,
  code: string,
): Promise<RedeemOutcome> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const candidates = await db
    .select()
    .from(commandPasses)
    .where(
      and(
        eq(commandPasses.email, normalized),
        isNull(commandPasses.redeemedAt),
        isNull(commandPasses.revokedAt),
      ),
    );

  if (candidates.length === 0) return { ok: false, reason: "no_pass" };

  const now = Date.now();
  const live = candidates.filter((pass) => Date.parse(pass.expiresAt) > now);
  if (live.length === 0) return { ok: false, reason: "expired" };

  const usable = live.filter((pass) => pass.failedAttempts < PASS_ATTEMPT_LIMIT);
  if (usable.length === 0) return { ok: false, reason: "locked" };

  const offered = await hashCode(code);
  const match = usable.find((pass) => constantTimeEqual(pass.codeHash, offered));

  if (!match) {
    // Charge the attempt against every live pass this person holds, so five
    // guesses is five guesses whether they hold one pass or several.
    for (const pass of usable) {
      await db
        .update(commandPasses)
        .set({ failedAttempts: pass.failedAttempts + 1 })
        .where(eq(commandPasses.id, pass.id));
    }
    return { ok: false, reason: "wrong_code" };
  }

  await db
    .update(commandPasses)
    .set({
      redeemedAt: new Date().toISOString(),
      redeemedSubjectId: subjectId,
    })
    .where(eq(commandPasses.id, match.id));

  const secret = env.SESSION_SECRET;
  if (!secret) return { ok: false, reason: "no_pass" };

  const token = await mintToken(
    {
      sub: subjectId,
      pass: match.id,
      exp: nowSeconds() + PASS_SESSION_SECONDS,
    },
    secret,
  );

  return { ok: true, token, passId: match.id };
}

/**
 * Does this request carry a live redeemed pass for THIS person?
 *
 * The cookie is bound to the subject id, not the email, for the same reason
 * the session is: an email can change at the provider, a subject cannot. A
 * cookie minted for one person is inert in anyone else's browser.
 */
export async function hasLivePass(
  cookieValue: string | null,
  subjectId: string,
): Promise<boolean> {
  if (!cookieValue) return false;

  const secret = env.SESSION_SECRET;
  if (!secret) return false;

  const claims = await verifyToken(cookieValue, secret);
  if (!claims) return false;

  const expires = typeof claims.exp === "number" ? claims.exp : 0;
  if (expires <= nowSeconds()) return false;

  return claims.sub === subjectId;
}

/** Session cookie: no Max-Age, so closing the browser ends the pass. */
export function passCookieHeader(token: string, secure: boolean): string {
  return [
    `${COMMAND_PASS_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}
