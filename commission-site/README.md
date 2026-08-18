# Thrive commission schedule — PUBLIC standalone site

This directory is a deliberately PUBLIC, standalone Cloudflare Pages site:
the interactive commission schedule (29 carriers, level picker 80–150,
per-product ladders, promotion rules) with **no sign-in, no membership check,
and no Cloudflare Access in front of it** — that is its purpose, per the
owner's order (2026-08-17: "a separate link to a public website with no
verification or sign up needed").

It is fully separate from the portal platform:

- Different deployment target: a Cloudflare **Pages** project
  (`thrive-commission`), not the portal Worker. The portal's Access gate does
  not and must not cover it.
- No code, data, or auth shared with the portal. `index.html` is one
  self-contained file (carrier logos inlined); the only external fetch is
  Google Fonts.
- Members ALSO get the same document inside the portal at
  `/portal/commission` (guarded, audited) — that copy lives at
  `public/commission-schedule.html`. When the schedule changes, update BOTH
  files (they are byte-identical siblings).

Deploy / update (owner, from the project directory, with Cloudflare auth):

```
npm run deploy:commission
```

First run creates the Pages project and prints the public URL
(https://thrive-commission.pages.dev). Subsequent runs update it in place.

Never add anything to this directory that is not meant to be world-readable:
no secrets, no member data, no portal code. It ships to the open internet.
