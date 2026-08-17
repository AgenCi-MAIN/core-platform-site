# Cloudflare Access — replace One-Time PIN with Google identity

Owner decision A11, 2026-08-17: "Fix it and commit to google identity instead
of codes." Root cause and symptom are trap #9 in `CORE_PLATFORM_RECORD.md` §9 —
the emailed one-time code is spent by Gmail's link pre-fetch on iOS, so the
founder's phone reports "This One-Time Pin has already been used!" while his
desktop signs in normally.

**The Access configuration is not in this repository and cannot be changed from
it.** There is no Cloudflare credential in the agent session, and there should
not be one in a file. Every step below is dashboard or Google-console work done
by the founder. Nothing here requires a build, a deploy, or a code change — the
portal's own Google sign-in is untouched.

## What this does and does not buy

It removes the **email round-trip**, which is the broken part. It does **not**
reduce two sign-ins to one: Cloudflare Access and the portal are independent
OAuth flows and both remain. On a device already signed into Google, both become
silent redirects — a tap each, no code to copy, nothing for a mail scanner to
consume.

## Step 1 — a Google OAuth client for Cloudflare

In Google Cloud console under the founder identity (`btcmao518@gmail.com`):

- Create a **new** OAuth 2.0 Client ID, type **Web application**.
- Authorized redirect URI:
  `https://<team-name>.cloudflareaccess.com/cdn-cgi/access/callback`
- The team name is the host in the PIN page's own URL. The phone screenshot
  showed it ending `…ht-night-9c3a.cloudflareaccess.com`; read the exact string
  off **Zero Trust → Settings → Custom Pages** rather than reconstructing it
  from a truncated address bar.

Use a **separate** client from the portal's `GOOGLE_CLIENT_ID`. The portal's
client redirects to `/auth/callback` on the workers.dev host and belongs to a
different trust boundary; sharing one client means rotating either credential
breaks both walls at once. Two clients, two blast radii.

Secret **values** never enter this file, a commit, or chat — names only (§F5).

## Step 2 — add the login method

**Zero Trust → Settings → Authentication → Login methods → Add new → Google.**

Choose plain **Google**, never **Google Workspace**. Workspace authenticates a
managed domain; every member of this platform signs in with a personal
`@gmail.com` address, so the Workspace connector would refuse all of them. Paste
the client id and secret from step 1 and use the dashboard's **Test** button
before going near the application policy.

## Step 3 — point the application at it

**Access → Applications →** the application fronting
`site-creator-vinext-starter.bankerrunners.workers.dev` **→ Policies.**

- Add Google to the application's accepted login methods.
- **Leave One-Time PIN enabled for now.** It is the way back in if Google is
  misconfigured.
- Keep the existing include rule as the **explicit list of member emails**. Do
  not widen it to "any Google account" or "emails ending in `@gmail.com`" —
  that would let anyone with a Gmail address past the outer wall and leave the
  portal's membership check standing alone, which is the opposite of why Access
  was put in front of the domain on 2026-08-16.

## Step 4 — prove it, in this order

Lockout risk is real: this wall sits in front of everything, including the
portal that would otherwise let you fix it. Keep an authenticated desktop
session open in a second browser throughout.

1. Desktop, private window → the portal URL → "Sign in with Google" → portal
   loads.
2. Phone, Safari → same → no code requested at any point.
3. If the portal is installed to the home screen (§10c), launch **that icon**
   and confirm it authenticates in its own cookie container.

Only after all three pass: return to the application and remove **One-Time PIN**
as a login method. Verify once more from the private desktop window before
closing the session you kept open.

## Step 5 — after the cutover

- Every member re-authenticates once; the Access cookie's identity source
  changed. Expected, not a fault.
- **The Access include list is a second roster.** Granting someone from
  **Portal → Members** does not admit them past Access, and never did — with
  codes or with Google. Whoever is seated next (Oscar Valencia, A8) must be
  added in **both** places or they will hit the wall and report the portal as
  broken. Worth folding into the grant procedure in §5.
- A device whose Access cookie lapses cannot fetch `/sw.js` updates — the
  browser keeps the registered worker, since 403 is not an unregister code
  (preserved deploy-integrity analysis, `W-SUBS/07-frontend-pwa/BRIEF.md`).
  Navigations are never cached, so no stale shell is possible; lapsed devices
  hit the Access wall rather than old content. Re-verify on any Access change.
- Screenshot the finished application, every policy rule, and the login-method
  list into the backup set — the recovery docket already carries this as its
  §6, and it is now more load-bearing, since a Google client the founder can
  lose access to sits inside the auth path.

## Rollback

Re-enable One-Time PIN as a login method on the application. It is one toggle,
and it restores the previous behaviour immediately — including its iOS bug.
