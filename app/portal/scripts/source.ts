/**
 * The canonical Script Vault source document — URL only.
 *
 * Kept in its own module, separate from library.ts, so a CLIENT component can
 * link to the document without importing the script bodies. library.ts is
 * server-only by rule (its bodies must never land in a public client bundle);
 * this file carries nothing but a public Google Docs address, so importing it
 * from "use client" code leaks nothing.
 *
 * The link is a temporary reference bridge (Dispatch work order 1B). Opening
 * it stores no Google credential, token, cookie, or document content in CORE —
 * the member signs in to Google on their own, in their own tab.
 */
export const SCRIPT_VAULT_SOURCE_URL =
  "https://docs.google.com/document/d/1vV2_B6xix29g-k-IVpXZR5AcTcyjhjlx4S-tJca97WE";
