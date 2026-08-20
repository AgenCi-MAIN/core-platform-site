# Carrier logo assets

Drop approved carrier logo files here. `outreach/build.mjs` checks this
directory at build time: a carrier whose file is present renders with its
logo, and a carrier whose file is absent renders as a monogram tile instead.
Nothing breaks either way, and there is never a broken-image icon in a sent
email.

**Naming.** Lowercase, hyphenated, matching the `logo` field in
`outreach/carriers.json` — e.g. `mutual-of-omaha.png`.

**Before adding a file:** displaying an insurer's mark in agency marketing
normally requires that insurer's written authorization, which is the
co-marketing permission recorded in the owner's standing outreach
constraints. Put the file here once the approval exists, not before. The
monogram fallback is deliberately neutral — it is not an imitation of any
carrier's branding — so the template is safe to preview and safe to send
internally while approvals are outstanding.

The full asset manifest (formats, pixel dimensions, file-size ceilings) and
the request checklist for a carrier rep live alongside the template in
`outreach/`.
