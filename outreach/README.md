# Outreach email

A built email, not a hand-edited one. `build.mjs` renders `template.html` and
`template.txt` from `carriers.json` and `copy.json` into `dist/`.

```bash
node outreach/build.mjs
```

Building is not sending. The script opens no socket. **Nothing in this
directory sends anything**, and that is deliberate: the last step is a person.

## Why a build step

The carrier list appears in the HTML rows, the plain-text alternative, and the
asset manifest. Maintained by hand in three places it drifts, and the failure
is quiet — a carrier present in the HTML and missing from the text part is
invisible until someone reads the message in a client that prefers text. A
plain-text part that does not correspond to its HTML is also the classic
cloaking signature, and filters score it as one. So the list lives in
`carriers.json` and all three renderings come from it.

## The carriers are the four we are appointed with

Taken from `app/portal/tools/page.tsx`, under "Where appointed agents service
each carrier's business directly" — Aetna (Senior Products), Corebridge
Connext, Occidental Life, Transamerica. That is evidence of appointment rather
than a carrier named in passing in a call script, which is the distinction that
matters when the email implies a relationship.

## Logos

`public/carriers/` is empty on purpose. A carrier's logo is that carrier's
trademark, and displaying it in agency marketing is what a co-marketing or
referral authorization governs — the same written authorization named in the
owner's standing outreach constraints.

`build.mjs` checks whether each logo file actually exists. Present, it renders
the image; absent, a neutral monogram tile that imitates no carrier's branding.
The email is therefore complete, on-brand and safe to send with no approvals in
hand, and a licensed asset drops in as a file copy with no template edit. The
build prints which carriers are still on placeholders.

## Rendering with images off is a supported state, not a degraded one

Outlook desktop still blocks external images by default, and that is
disproportionately where agency mail lands. Every carrier NAME is live text in
a table cell — never inside an image — so a reader with images blocked still
learns who we represent. Each `<img>` carries `width`/`height` attributes and
inline type styling so the cell holds its shape and the alt text reads as an
intentional initials tile rather than a broken-image icon.

The same rule governs the CTA: it is a table cell with a background colour and
live text, plus a VML `roundrect` for Outlook, never an image of a button. A
call to action that disappears with images off is a dead campaign.

## Before this is sent to anyone who is not staff

`COMPLIANCE.md` in this directory holds the gating checklist in full. The short
version, none of which is optional:

- **Consent is per recipient, not per list** — traceable to an opt-in event
  with source, timestamp and the exact language shown at the time.
- **Suppression scrubbed within the send window**, across every sending
  identity. Suppression is per-sender, not per-list.
- **Carrier authorization on file** if any carrier mark, logo, rate or plan
  detail appears. Without it, marks come out.
- **Medicare is a different regime.** Aetna (Senior Products) is on the bench,
  and anything touching Medicare Advantage or Part D pulls in CMS
  third-party-marketing-organization rules, which are materially stricter than
  CAN-SPAM and carry their own required language and submission process.
- **State insurance advertising rules** govern the agency's legal name and
  licence disclosure, and vary by state.
- The footer must not claim TCPA compliance. TCPA governs calls, texts and
  faxes — not email. Saying otherwise is a false statement about the law in a
  document whose whole purpose is to be accurate about it.

This is drafting assistance and not legal advice. Counsel or the carrier's
compliance desk clears it before a first send.

## Sending identity

The desk is `out-reach@inkboxmail.com`. Two consequences worth knowing before
anyone plans a campaign around it:

1. **The reputation is not ours.** Sending as a provider domain pools domain
   and IP reputation with every other tenant, gives no Postmaster Tools
   visibility, makes BIMI impossible, and cannot be migrated later. A
   THRIVE-owned subdomain with aligned DKIM and a custom Return-Path is where
   reputation should accrue. Treat the provider-domain send as a pilot.
2. **A THRIVE address in `From:` while relaying through the provider is the
   classic breakage** — DKIM signs as the provider, the envelope sender is a
   provider bounce domain, so DMARC alignment fails even though SPF "passes".
   Alignment is the requirement, not passage. Adding an SPF `include:` does not
   fix it.

`Reply-To:` is unauthenticated and safe to point at a monitored THRIVE mailbox.
Replies are among the strongest positive engagement signals there are.

## First send

Fifty to two hundred of the warmest contacts, not the book of business, and
never a purchased list. A large first blast from a cold identity fires four
things at once — volume anomaly, bounce spike, spam traps, and complaints from
people with no relationship — and reputation degrades inside a single send
while taking weeks of clean sending to rebuild, if it recovers.
