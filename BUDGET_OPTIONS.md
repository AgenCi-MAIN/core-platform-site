# CORE / THRIVE — Budget Options

Standing record of costed options awaiting owner decision. Each entry is a
priced choice, not a commitment — nothing here is purchased until the owner
says the word.

---

## 1. Dedicated outbound text line (Inkbox)

Logged 2026-08-18. The current desk line (+1 689 689 1349) requires recipient
opt-in before the desk can send outbound texts. Two members (Ryan, Nate) have
never opted in and cannot receive texts today.

| Option | Cost | What it does | Opt-in required? |
|---|---|---|---|
| VoIP line | $10 | New dedicated number; standard SMS/MMS | Yes — recipients must still text START or send an inbound message first |
| iMessage dedicated line | $150 | New iMessage-capable number with 10 DLC campaign registration | **No** — can send to any iMessage-reachable number without prior opt-in |

**Context.**
- Shawn is reachable today via iMessage (conversation `3cb144a0-…`).
- Andrew is reachable today via SMS (he texted START on 2026-08-18).
- Ryan (+1 941 210 1410) — blocked on both channels, no opt-in of any kind.
- Nate — no phone number on file; email only.
- The $150 iMessage line would unblock outbound to Ryan immediately and to
  Nate once his number is confirmed, without requiring either to do anything
  on their end.
- The $10 VoIP line would add a second SMS number but would not remove the
  opt-in gate — same blocker, different number.

**Decision:** owner's call. Neither option is purchased.

---

## 2. Custom sending domain — `hq.thrive` (Inkbox)

Logged 2026-08-18. The owner has initiated domain verification for
**`hq.thrive`** in Inkbox. Once verified, outbound email (including morning
briefs) can be sent from a branded `@hq.thrive` address instead of
`out-reach@inkboxmail.com`.

**Status: AWAITING OWNERSHIP** — seven DNS records must be added at the
domain's DNS provider, then re-checked in Inkbox. Verification usually
completes within 5 minutes of propagation.

| Record | Type | Host | Value |
|---|---|---|---|
| Bounce handling (MAIL FROM) | MX | `mail.hq.thrive` | `10 feedback-smtp.us-east-1.amazonses.com` |
| Inbound mail | MX | `hq.thrive` | `10 inbound-smtp.us-east-1.amazonaws.com` |
| Domain ownership | TXT | `inkbox-ownership.hq.thrive` | `ibk-own-52588189aa03aeb3` |
| Domain verification | TXT | `_amazonses.hq.thrive` | `5UVkqXUTbY+bMWciPRfPs18Xw/p79J4RfWl0wl2wFXg=` |
| DKIM (Inkbox-signed) | TXT | `ibk1._domainkey.hq.thrive` | `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAA0…` (truncated) |
| Bounce handling (MAIL FROM) | TXT | `mail.hq.thrive` | `v=spf1 include:spf.inkboxmail.com ~all` |
| DMARC | TXT | `_dmarc.hq.thrive` | `v=DMARC1; p=none; rua=mailto:dmarc-reports@hq.…` (truncated) |

**Pending task for morning briefs:**
1. Add all seven DNS records at the `hq.thrive` DNS provider
2. Click Re-check in Inkbox to verify ownership
3. Once verified, update HERALD MORNING TEXT routine to send from `@hq.thrive`
   instead of `out-reach@inkboxmail.com`
4. Update A14 desk auto-reply identity if desired

**Blocks:** HERALD morning brief is currently not sending for a separate
reason (repo-source hypothesis, see CORE_PLATFORM_RECORD.md §19i). The
domain setup is infrastructure prep — it does not fix the send failure, but
once HERALD is fixed, the briefs will go out under the branded domain.

**Decision:** owner has initiated setup. DNS records pending.
