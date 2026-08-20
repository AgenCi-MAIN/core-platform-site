export type SignalwireWebhookSignatureScheme =
  | "swml-json-sha1-hex"
  | "compat-form-sha1-base64";

/**
 * Compute the signature value SignalWire places in its webhook header.
 *
 * SignalWire uses two encodings over the same HMAC-SHA1 primitive:
 * SWML/RELAY JSON uses lowercase hexadecimal, while Compatibility form
 * callbacks use base64. Keeping the distinction in the type prevents a valid
 * digest from being rendered in the wrong wire format again.
 */
export async function computeSignalwireWebhookSignature(
  signingKey: string,
  message: string,
  scheme: SignalwireWebhookSignatureScheme,
): Promise<string> {
  const encoder = new TextEncoder();
  const imported = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", imported, encoder.encode(message)));

  if (scheme === "swml-json-sha1-hex") {
    return [...mac].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  let binary = "";
  for (const byte of mac) binary += String.fromCharCode(byte);
  return btoa(binary);
}
