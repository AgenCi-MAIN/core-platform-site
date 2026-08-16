# Partner state — Ryan & Andrew (recorded from the owner, 2026-08-15)

Owner-supplied context, verbatim in substance, labeled as his account (not
yet diligenced):

- **Ryan Davidson & Andrew Davidson** (brothers; Andrew identified by the owner 2026-08-15, andrew.davidson.zenith@gmail.com, owner seat approved) have built, over
  years: **LeadTech** — a lead company doing inbound calls — and **Thrive
  Companies** — a brokerage.
- Current pace: within the next 90 days, **$1M–$1.5M in production volume
  at 20% margins.**
- **Ryan**: deep insurance-space knowledge — strategy and sales leadership.
- **Andrew**: deep operations + marketing knowledge; generates high-quality
  inbound calls at low cost; manages operational processes.

## What this reframes

1. The equity conversation is NOT a founder granting slices of his company
   to helpers. Ryan & Andrew bring an operating production engine with
   revenue; Shawn brings CORE (the platform + AI institution), capital
   (extent TBD), and his own leadership. This is a **combination of
   contributions**, priced both ways.
2. The strategy corpus's "three economics facts" (comp share / who pays
   leads / 13% margin) now likely live inside LeadTech ↔ Thrive Companies
   economics — the answers are partly Ryan & Andrew's to give, and they are
   now **diligence items**, not just owner homework.
3. "Thrive" naming: the owner's venture and Ryan/Andrew's brokerage share
   the name — the legal relationship between "THRIVE" as used in this repo
   and "Thrive Companies" the entity must be established before any paper.

## Open before any equity is priced (diligence list)

- Carrier statements / production reports for Thrive Companies (actuals,
  not pace). LeadTech CPL and call-volume data. Entity documents for both
  companies. (Andrew's identity resolved: Andrew Davidson, Ryan's brother.)
- What Shawn contributes and wants: capital amount, role, control vs speed
  vs upside priorities.
- Whether the 20%-margin claim is net of advances/chargebacks (the corpus's
  advance-treadmill finding applies to any FE book).

Nothing here is verified beyond the owner's statement; labeled accordingly.

## Integration targets (owner-supplied, 2026-08-16)

External partner systems to plug INTO CORE, all following ONE reusable
ingest-socket pattern (authenticated by a secret NAME set via wrangler and
exchanged out-of-band; deny-by-default; audited; idempotent; fail-closed):

1. **LeadTech CRM** — call transfers → `dialer_transfers`. Socket being
   built by the Test-3 fleet (`leadtech-plug-fleet`). Andrew is owner and
   gave permission. The Leadership page's "Call operations" source row.
2. **Retention AI** (`retention-os.ai`, Thrive Companies agent portal) —
   persistency / lapse / chargeback data. SECOND source; reuses the
   LeadTech socket pattern with its own table (not `dialer_transfers` —
   different shape). Andrew's system; permission given 2026-08-16. The
   Leadership page's "Retention / persistency" source row (already present,
   marked Not connected).

Credential rule for every socket: value never in chat/files; a burned
credential (one pasted into a transcript) is rotated before use. No CORE
process logs into a partner system with a pasted password — CORE receives
authenticated POSTs, it does not scrape.
