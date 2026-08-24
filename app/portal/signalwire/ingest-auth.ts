import { env } from "cloudflare:workers";
import { appendAuditRow } from "../../../db/audit";
import {
  computeSignalwireWebhookSignature,
  type SignalwireWebhookSignatureScheme,
} from "./webhook-signature";

/**
 * SERVER-ONLY authentication for the one route SignalWire calls with no human
 * present. Everything else in the portal is reached by a person who completed
 * Sign in with Google and holds an active `portal_members` row; a carrier
 * posting a call event has neither and never will.
 *
 * So this is a second, parallel authentication model, and it is built so it
 * cannot be mistaken for the first. It returns its own small result type. It
 * does not construct a `PortalSession`, it does not import `../access`, and
 * there is no value it can return that `can()` will accept. A caller
 * authenticated here has earned exactly one thing — the right to have its
 * payload considered by the ingest route — and no capability at all. The two
 * models stay structurally disjoint so a later edit cannot quietly promote a
 * machine into a member: there is no type here to promote.
 *
 * Two factors, both required:
 *
 *   1. A shared secret presented as HTTP Basic. SignalWire sends it because the
 *      webhook URL configured in its dashboard carries userinfo
 *      (`https://user:secret@host/path`), which its client turns into an
 *      `Authorization: Basic` header. The secret must NOT ride in a query
 *      string instead: query strings are recorded verbatim by essentially every
 *      observability layer in the path — Cloudflare's request logs, analytics,
 *      any proxy access log — so a secret placed there ends up living in
 *      systems with different retention and different readers than the secret
 *      store it came from. `Authorization` is redacted by convention almost
 *      everywhere a query string is not.
 *
 *   2. SignalWire's request signature, which proves the body was assembled by
 *      someone holding the project signing key. Factor 1 alone would be a
 *      bearer token: anyone who ever saw it — in a proxy log, a screenshot of
 *      the dashboard, a support ticket — could replay this endpoint at will.
 *
 * ---------------------------------------------------------------------------
 * WHAT SIGNALWIRE ACTUALLY SENDS
 * Verified against SignalWire's own documentation (2026-08), not assumed from
 * the Twilio integration next door.
 * ---------------------------------------------------------------------------
 *
 * SignalWire DOES sign webhooks, status callbacks included, and its docs call
 * verifying them "extremely important" for production. The header is
 * `x-signalwire-signature` — NOT `X-Twilio-Signature`. That is the single
 * detail most likely to be got wrong here, because the Compatibility API is
 * otherwise a drop-in for Twilio's and SignalWire's
 * `validateRequest(signingKey, signature, url, body)` is a fork of Twilio's
 * `RequestValidator`. Their own migration guidance is explicit that TwiML
 * handlers port unchanged but signature validation does not.
 *
 * The key is the per-project **signing key** from the dashboard's API
 * Credentials space — a different secret from the API token used for outbound
 * REST calls. `SIGNALWIRE_SIGNING_KEY` holds it.
 *
 * Signature input is the full public webhook URL followed by the body, and the
 * body is appended differently depending on how it was sent. SignalWire's
 * current server SDK defines two schemes. SWML/RELAY JSON appends the exact raw
 * UTF-8 body and renders HMAC-SHA1 as lowercase hexadecimal. Compatibility form
 * callbacks append each field name immediately followed by its value in sorted
 * field-name order and render HMAC-SHA1 as base64. Anything else is refused: a
 * body whose construction is undocumented cannot be verified, and
 * unverifiable is a denial, never a pass.
 */

/**
 * The path SignalWire is configured to POST to, and the path the signature is
 * verified against. It must stay identical to the route's own `PATH` — the
 * signature covers the URL, so a mismatch here rejects every legitimate call.
 */
export const INGEST_PATH = "/portal/calls/ingest";

/** SignalWire's signature header. Lowercase; `Headers.get` is case-insensitive. */
const SIGNATURE_HEADER = "x-signalwire-signature";

const AUDIT_ACTION = "signalwire.ingest.auth";

export type SignalwireMachineAuthOptions = {
  /** Literal path owned by the calling handler. Query strings are forbidden. */
  path?: string;
  /** Non-secret audit action for this one machine boundary. */
  auditAction?: string;
};

export type IngestDenial =
  /** A required secret is unset, or the configured origin is unusable. */
  | { kind: "not_configured"; status: 503 }
  /** No parseable HTTP Basic credential on the request. */
  | { kind: "no_credential"; status: 401 }
  /** A credential was presented and matched neither secret. */
  | { kind: "bad_credential"; status: 403 }
  /** The signature header is absent. */
  | { kind: "no_signature"; status: 403 }
  /** The body could not be read, or its content type has no documented construction. */
  | { kind: "unverifiable_body"; status: 403 }
  /** A signature was presented but did not match its documented body scheme. */
  | { kind: "bad_signature"; status: 403 }
  /** Both factors passed but the audit row did not land. */
  | { kind: "not_recorded"; status: 503 };

/** Which shared secret the caller presented. Watched during a rotation. */
export type SecretGeneration = "current" | "previous";

export type IngestAuth =
  | { ok: true; secret: SecretGeneration; signature: SignalwireWebhookSignatureScheme }
  | { ok: false; denial: IngestDenial };

/**
 * The whole of the request this guard is allowed to see: a path for the audit
 * row, the headers carrying both factors, and the body the signature covers.
 *
 * Stated structurally rather than as `Request` for two reasons. It is the
 * shorter one that matters day to day — `Request` is generic over its
 * Cloudflare properties, so a handler's request and the `.clone()` it hands
 * over here are different types and the plain annotation rejects the call. The
 * better one is that the narrow shape is a claim the file can keep: the guard
 * reads three things and cannot reach for a fourth.
 */
type SignedRequest = {
  readonly url: string;
  readonly headers: Headers;
  text(): Promise<string>;
};

/**
 * Decide whether this request may be ingested.
 *
 * The body is read here, so callers must hand over a clone and keep the
 * original for parsing — a body can only be consumed once. Nothing this
 * function reads is returned to the caller: it decides authenticity and
 * nothing else, and the route parses the payload itself.
 *
 * Never throws. Every outcome, allow and deny alike, is written to
 * `audit_events` before it is returned.
 */
export async function authenticateSignalwireRequest(
  request: SignedRequest,
  options: SignalwireMachineAuthOptions = {},
): Promise<IngestAuth> {
  const expectedPath = options.path ?? INGEST_PATH;
  const auditAction = options.auditAction ?? AUDIT_ACTION;
  // Recorded for forensics only. Unlike the signed URL below, this is read off
  // the request — which is safe precisely because nothing verifies against it.
  const requestPath = safePath(request);

  const current = env.SIGNALWIRE_INGEST_SECRET;
  const previous = env.SIGNALWIRE_INGEST_SECRET_PREVIOUS;
  const signingKey = env.SIGNALWIRE_SIGNING_KEY;
  const signedUrl = publicMachineUrl(expectedPath);

  if (!isLiteralMachinePath(expectedPath) || requestPath !== expectedPath) {
    return deny(
      { kind: "bad_signature", status: 403 },
      requestPath,
      null,
      auditAction,
    );
  }

  // Unconfigured means closed. This is the one route Cloudflare Access does not
  // stand in front of — it has to admit an anonymous carrier — so a
  // half-provisioned deployment here is an open door onto the transfer table,
  // not a degraded page. Refuse before reading anything off the request.
  if (!current || !signingKey || !signedUrl) {
    return deny({ kind: "not_configured", status: 503 }, requestPath, null, auditAction);
  }

  const presented = readBasicSecret(request.headers.get("authorization"));
  if (presented === null) {
    return deny({ kind: "no_credential", status: 401 }, requestPath, null, auditAction);
  }

  const generation = await matchSecret(presented, current, previous);
  if (generation === null) {
    return deny({ kind: "bad_credential", status: 403 }, requestPath, null, auditAction);
  }

  const presentedSignature = request.headers.get(SIGNATURE_HEADER);
  if (!presentedSignature) {
    return deny({ kind: "no_signature", status: 403 }, requestPath, generation, auditAction);
  }

  const body = await readSignatureBody(request);
  if (body === null) {
    return deny({ kind: "unverifiable_body", status: 403 }, requestPath, generation, auditAction);
  }

  // SignalWire signs the URL string it actually requested, and this Worker
  // hands out two forms of the same path. A URL configured in the provider
  // dashboard is bare; a callback URL embedded in an SWML document this Worker
  // generated carries HTTP user-info, because the provider has to authenticate
  // itself when it calls back. Both are legitimate for the same path, so both
  // are tried.
  //
  // The credentialed candidate is built only from the generation the caller has
  // already proved it holds. That keeps this a widening of which *string* may
  // have been signed, not of which secret is accepted: an unproven generation
  // never reaches the HMAC.
  const provenSecret = generation === "current" ? current : previous;
  const candidates = [
    signedUrl,
    provenSecret ? credentialedMachineUrl(expectedPath, provenSecret) : null,
  ];

  let signatureScheme: SignalwireWebhookSignatureScheme | null = null;
  for (const candidate of candidates) {
    if (candidate === null) continue;
    signatureScheme = await matchSignature(
      presentedSignature,
      signingKey,
      signatureMessage(body, candidate),
    );
    if (signatureScheme !== null) break;
  }
  if (signatureScheme === null) {
    return deny({ kind: "bad_signature", status: 403 }, requestPath, generation, auditAction);
  }

  // `appendAuditRow` reports rather than throws, and the report is load-bearing
  // here: an unattended caller has no operator watching a console, and the
  // audit trail is the whole basis on which this traffic is later trusted.
  // Accepting a transfer the portal cannot account for would put a row in
  // dialer_transfers with no record of what authorised it, so an unrecorded
  // allow becomes a denial and SignalWire retries.
  const recorded = await appendAuditRow({
    action: auditAction,
    decision: "allow",
    reason: "secret_and_signature_verified",
    requestPath,
    detail: `secret=${generation} signature=${signatureScheme}`,
  });
  if (!recorded) {
    return { ok: false, denial: { kind: "not_recorded", status: 503 } };
  }

  return { ok: true, secret: generation, signature: signatureScheme };
}

async function deny(
  denial: IngestDenial,
  requestPath: string,
  generation: SecretGeneration | null,
  auditAction: string,
): Promise<IngestAuth> {
  // Deliberately carries neither the presented credential nor the signature. A
  // denial row is read by more people than the secret store is, and a rejected
  // guess is still someone's live secret often enough to matter. The generation
  // is metadata, not material: it is what tells an operator a rotation has
  // finished and `SIGNALWIRE_INGEST_SECRET_PREVIOUS` can be deleted.
  await appendAuditRow({
    action: auditAction,
    decision: "deny",
    reason: denial.kind,
    requestPath,
    detail: generation ? `secret=${generation}` : null,
  });
  return { ok: false, denial };
}

/**
 * The URL the signature was computed over: a stated origin plus a literal path.
 *
 * Never `request.url`. Two reasons, and the second decides it.
 *
 * The practical one: by the time a request reaches the Worker its URL has been
 * through Cloudflare and whatever else fronts the origin. A re-cased host, a
 * scheme rewritten behind TLS termination, a trailing slash added by a proxy —
 * each produces a different base string and rejects every legitimate call, with
 * a symptom (all signatures suddenly invalid) that looks exactly like a leaked
 * key.
 *
 * The load-bearing one: that URL is built from request headers. Deriving the
 * signed string from it would let the caller choose part of the input to its
 * own signature check, which is the same mistake as trusting an identity
 * header — a thing this project forbids outright and pins shut with tests. The
 * origin is configuration, so moving it requires changing a secret.
 *
 * Returns null when the origin is unset or unparseable, which fails closed
 * rather than verifying against a malformed string.
 */
function publicMachineUrl(path: string): string | null {
  const configured = env.SIGNALWIRE_PUBLIC_ORIGIN?.trim();
  if (!configured) return null;

  try {
    const url = new URL(configured);
    if (url.protocol !== "https:") return null;
    // `url.origin` normalises away any path, query, or trailing slash that was
    // pasted in, so a stray character in the secret cannot silently break every
    // verification at once.
    return `${url.origin}${path}`;
  } catch {
    return null;
  }
}

/**
 * The same stated URL with the shared secret in HTTP user-info: what SignalWire
 * is handed for callbacks it must authenticate itself on.
 *
 * Exported so the document that gives the URL out and the guard that verifies
 * the resulting signature build one identical string. They were written
 * separately once and drifted — lifecycle callbacks were signed over the
 * credentialed URL and verified against the bare one, so every call-state event
 * was refused `bad_signature` while the calls themselves connected, and the
 * call history silently stopped recording (CORE_PLATFORM_RECORD.md §19z).
 */
export function credentialedMachineUrl(path: string, secret: string): string | null {
  const bare = publicMachineUrl(path);
  if (bare === null) return null;
  try {
    const url = new URL(bare);
    url.username = "signalwire";
    url.password = secret;
    return url.toString();
  } catch {
    return null;
  }
}

function isLiteralMachinePath(value: string): boolean {
  return value.startsWith("/portal/calls/") && !value.includes("?") && !value.includes("#");
}

/**
 * The exact string the signature should have been computed over, or null when
 * the body cannot be reconstructed the way the signer built it.
 *
 * The content type picks the construction rather than both being attempted,
 * so a single request has exactly one valid signature. Trying every shape until
 * one matched would widen what counts as authentic for no benefit.
 */
type SignatureInput = {
  message: string;
  scheme: SignalwireWebhookSignatureScheme;
};

type SignatureBody =
  | { kind: "json"; raw: string }
  | { kind: "form"; entries: Array<[string, string]> };

/**
 * Read the body once, in the form the signature is computed over.
 *
 * Separated from message construction because a body can only be consumed
 * once, and the same body must now be checked against more than one candidate
 * URL.
 */
async function readSignatureBody(request: SignedRequest): Promise<SignatureBody | null> {
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return null;
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    // The raw bytes as received. Re-serialising parsed JSON would change key
    // order and whitespace, and the signature covers the document that was
    // actually sent, not an equivalent one.
    return { kind: "json", raw };
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    // Field name immediately followed by its value, in sorted name order — the
    // construction SignalWire inherited from Twilio.
    const entries = [...new URLSearchParams(raw).entries()];
    entries.sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
    return { kind: "form", entries };
  }

  return null;
}

/** The exact string a signature is computed over, for one candidate URL. */
function signatureMessage(body: SignatureBody, signedUrl: string): SignatureInput {
  if (body.kind === "json") {
    return { message: `${signedUrl}${body.raw}`, scheme: "swml-json-sha1-hex" };
  }
  return {
    message: body.entries.reduce(
      (accumulated, [name, value]) => `${accumulated}${name}${value}`,
      signedUrl,
    ),
    scheme: "compat-form-sha1-base64",
  };
}

/** The password half of an HTTP Basic credential, or null if there isn't one. */
function readBasicSecret(header: string | null): string | null {
  if (!header) return null;

  const [scheme, encoded] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "basic" || !encoded) return null;

  let decoded: string;
  try {
    decoded = atob(encoded.trim());
  } catch {
    return null;
  }

  const separator = decoded.indexOf(":");
  if (separator === -1) return null;

  // Only the password half is checked. The username is not secret — it sits in
  // the webhook URL in the SignalWire dashboard, and the carrier drops userinfo
  // from the URL before signing it — so requiring a particular one adds no
  // entropy while adding a way to lock the carrier out.
  return decoded.slice(separator + 1);
}

/**
 * Which configured secret the presented value matches, if either.
 *
 * Both are always tested, even once the first has matched, so the work done is
 * the same whichever generation is in use. Two are accepted because rotation is
 * otherwise a hard cutover: the dashboard URL and the Worker secret cannot
 * change in the same instant, and every call landing in the gap is a dropped
 * lead. The outgoing value is deleted once the audit log stops reporting
 * `secret=previous`.
 */
async function matchSecret(
  presented: string,
  current: string,
  previous: string | undefined,
): Promise<SecretGeneration | null> {
  const [isCurrent, isPrevious] = await Promise.all([
    digestsMatch(presented, current),
    previous ? digestsMatch(presented, previous) : Promise.resolve(false),
  ]);

  if (isCurrent) return "current";
  if (isPrevious) return "previous";
  return null;
}

/** The documented scheme a valid signature verified under, or null if it did not. */
async function matchSignature(
  presented: string,
  signingKey: string,
  input: SignatureInput,
): Promise<SignalwireWebhookSignatureScheme | null> {
  const expected = await computeSignalwireWebhookSignature(
    signingKey,
    input.message,
    input.scheme,
  );
  return (await digestsMatch(presented, expected)) ? input.scheme : null;
}

/**
 * Equality for secret material, compared as digests rather than as the values
 * themselves.
 *
 * Comparing the raw strings — with `===`, or with any loop that stops at the
 * first difference — leaks through timing. The obvious leak is the early
 * return: it reveals how many leading characters were right, which turns
 * guessing a secret from an infeasible search into a character-at-a-time walk.
 * The subtler one is length, and it is why hashing is not optional here. A
 * comparison that rejects on differing length returns faster than one that has
 * to walk, so the length of the real secret falls out of the timing before a
 * single character has been confirmed.
 *
 * Hashing both sides first removes both leaks. SHA-256 output is 32 bytes
 * whatever went in, so the loop below always runs exactly 32 iterations, always
 * compares the same number of bytes, and never returns early — differences are
 * OR'd into an accumulator inspected once at the end. Timing then depends on
 * nothing the caller controls. Comparing digests is sound rather than circular
 * because only the digests are ever compared, never the preimages: equal
 * digests mean equal secrets, and a digest discloses neither the length nor the
 * content of what produced it.
 */
async function digestsMatch(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);

  const first = new Uint8Array(a);
  const second = new Uint8Array(b);

  let difference = 0;
  for (let index = 0; index < first.length; index += 1) {
    difference |= first[index] ^ second[index];
  }
  return difference === 0;
}

function safePath(request: SignedRequest): string {
  try {
    return new URL(request.url).pathname;
  } catch {
    return INGEST_PATH;
  }
}
