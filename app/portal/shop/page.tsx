import Link from "next/link";
import { requireCapability } from "../access";
import { PortalPageIntro, PortalShell } from "../components";
import { MarketplaceAction } from "./marketplace-action";

export const dynamic = "force-dynamic";

const PRODUCTS = [
  {
    id: "transfer-calls" as const,
    eyebrow: "Inbound volume",
    name: "Live transfer calls",
    price: "$23",
    priceNote: "per call",
    description: "Buy additional live transfer inventory for agents who are ready to take inbound conversations.",
    bullets: ["$23 per delivered call", "Use with the Inbound Calls portal", "Quantity-based request"],
    quantityEnabled: true,
    unitPrice: 23,
    accent: "emerald",
  },
  {
    id: "recruiting-ads" as const,
    eyebrow: "Growth",
    name: "Recruiting ads",
    price: "Custom",
    priceNote: "campaign",
    description: "Request THRIVE recruiting campaign support for agent acquisition and local market expansion.",
    bullets: ["Creative + campaign request", "Market-specific setup", "Pricing approved before charge"],
    quantityEnabled: false,
    unitPrice: null,
    accent: "violet",
  },
  {
    id: "gohighlevel" as const,
    eyebrow: "Software",
    name: "GoHighLevel access",
    price: "Access",
    priceNote: "plan",
    description: "Request access to THRIVE's GoHighLevel software stack for CRM, automations, pipelines, and follow-up.",
    bullets: ["CRM workspace", "Automation tooling", "Account setup request"],
    quantityEnabled: false,
    unitPrice: null,
    accent: "blue",
  },
  {
    id: "ai-capacity" as const,
    eyebrow: "Automation",
    name: "AI capacity",
    price: "Custom",
    priceNote: "allocation",
    description: "Request additional THRIVE AI capacity for agent support, recruiting, or operating workflows.",
    bullets: ["Capacity request", "Use-case review", "Approved allocation only"],
    quantityEnabled: false,
    unitPrice: null,
    accent: "amber",
  },
] as const;

const STYLES = `
.marketplace-balance{display:grid;grid-template-columns:1fr auto;gap:22px;align-items:center;margin-bottom:18px;padding:22px 24px;border:1px solid color-mix(in srgb,var(--portal-accent) 28%,transparent);border-radius:20px;background:radial-gradient(circle at 92% 10%,color-mix(in srgb,var(--portal-accent) 18%,transparent),transparent 30%),var(--portal-panel);box-shadow:0 20px 50px rgba(2,6,23,.22)}.marketplace-balance-kicker{color:var(--portal-muted);font-size:.7rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}.marketplace-balance strong{display:block;margin-top:7px;color:var(--portal-text);font-size:clamp(1.8rem,3vw,2.7rem);letter-spacing:-.05em}.marketplace-balance p{margin:5px 0 0;color:var(--portal-muted);font-size:.82rem}.marketplace-balance-actions{display:flex;gap:10px;align-items:center}.marketplace-balance-actions a{border:1px solid color-mix(in srgb,var(--portal-accent) 28%,transparent);border-radius:10px;padding:10px 13px;color:var(--portal-accent-strong);background:color-mix(in srgb,var(--portal-accent) 12%,transparent);font-size:.76rem;font-weight:800;text-decoration:none}.marketplace-balance-state{border:1px solid color-mix(in srgb,var(--portal-warning) 26%,transparent);border-radius:999px;padding:7px 10px;color:var(--portal-warning);background:color-mix(in srgb,var(--portal-warning) 26%,transparent);font-size:.68rem;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.marketplace-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.marketplace-card{position:relative;overflow:hidden;min-height:390px;padding:24px!important;border-radius:20px!important}.marketplace-card:before{content:"";position:absolute;inset:0 0 auto;width:100%;height:2px;background:linear-gradient(90deg,transparent,var(--market-accent),transparent);opacity:.75}.marketplace-card:after{content:"";position:absolute;width:220px;height:220px;border-radius:50%;right:-95px;top:-100px;background:radial-gradient(circle,var(--market-glow),transparent 66%);pointer-events:none}.marketplace-card.emerald{--market-accent:var(--portal-accent-strong);--market-glow:color-mix(in srgb,var(--portal-accent) 16%,transparent)}.marketplace-card.violet{--market-accent:#a78bfa;--market-glow:color-mix(in srgb,var(--portal-accent) 16%,transparent)}.marketplace-card.blue{--market-accent:#60a5fa;--market-glow:color-mix(in srgb,var(--portal-accent) 16%,transparent)}.marketplace-card.amber{--market-accent:var(--portal-warning);--market-glow:rgba(251,191,36,.14)}.marketplace-card-head{position:relative;z-index:1;display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.marketplace-card-kicker{margin:0;color:var(--portal-muted);font-size:.69rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase}.marketplace-card h2{margin:8px 0 0;color:var(--portal-text);font-size:1.35rem;letter-spacing:-.025em}.marketplace-price{text-align:right}.marketplace-price strong{display:block;color:var(--portal-text);font-size:1.7rem;letter-spacing:-.04em}.marketplace-price small{color:var(--portal-muted);font-size:.72rem}.marketplace-description{position:relative;z-index:1;margin:18px 0 0;color:var(--portal-muted);line-height:1.58;font-size:.88rem;max-width:560px}.marketplace-bullets{position:relative;z-index:1;display:grid;gap:9px;margin:20px 0;padding:0;list-style:none}.marketplace-bullets li{display:flex;gap:9px;align-items:center;color:var(--portal-muted);font-size:.8rem}.marketplace-bullets li:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--market-accent);box-shadow:0 0 14px var(--market-accent)}.marketplace-action{position:relative;z-index:1;display:grid;grid-template-columns:auto 1fr;gap:9px;margin-top:auto;padding-top:18px;border-top:1px solid var(--portal-line-strong)}.marketplace-quantity{display:grid;gap:5px}.marketplace-quantity span{color:var(--portal-muted);font-size:.64rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.marketplace-quantity input{width:84px;border:1px solid var(--portal-line-strong);border-radius:10px;padding:10px 9px;background:var(--portal-raised);color:var(--portal-text);font:inherit}.marketplace-action button{align-self:end;border:1px solid color-mix(in srgb,var(--market-accent) 35%,transparent);border-radius:11px;padding:11px 14px;background:linear-gradient(135deg,color-mix(in srgb,var(--market-accent) 28%,var(--portal-raised)),var(--portal-raised));color:var(--portal-text);font:inherit;font-size:.8rem;font-weight:850;cursor:pointer}.marketplace-action button:disabled{opacity:.6;cursor:wait}.marketplace-estimate{grid-column:1/-1;color:var(--portal-muted);font-size:.71rem}.marketplace-message{grid-column:1/-1;margin:0;border-left:2px solid var(--market-accent);padding:8px 10px;color:var(--portal-muted);background:var(--portal-raised);font-size:.73rem;line-height:1.45}.marketplace-boundary{margin-top:18px;padding:18px 20px;border:1px solid var(--portal-line-strong);border-radius:16px;background:var(--portal-soft);color:var(--portal-muted);font-size:.78rem;line-height:1.55}.marketplace-boundary strong{color:var(--portal-text)}.marketplace-boundary code{color:var(--portal-accent-strong)}@media(max-width:900px){.marketplace-grid{grid-template-columns:1fr}}@media(max-width:680px){.marketplace-balance{grid-template-columns:1fr}.marketplace-balance-actions{justify-content:space-between}.marketplace-card-head{flex-direction:column}.marketplace-price{text-align:left}.marketplace-action{grid-template-columns:1fr}.marketplace-quantity input{width:100%}}
`;

export default async function MarketplacePage() {
  const session = await requireCapability("dashboard.view.self", "/portal/shop");

  return (
    <PortalShell session={session} current="/portal/shop" section="Marketplace">
      <style>{STYLES}</style>
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="THRIVE Marketplace"
          title={<>Buy the tools that <em>move production</em>.</>}
          subtitle="Calls, recruiting, software, and AI capacity live in one storefront. The portal records order intent now; the wallet and payment rail remain visibly disconnected until a real ledger is wired in."
          compact
        />

        <section className="marketplace-balance" aria-label="Portal account balance">
          <div>
            <span className="marketplace-balance-kicker">Account balance</span>
            <strong>—</strong>
            <p>Wallet ledger not connected yet. No request below can silently charge an agent.</p>
          </div>
          <div className="marketplace-balance-actions">
            <span className="marketplace-balance-state">Ledger pending</span>
            <Link href="/portal/inbound">Open inbound portal</Link>
          </div>
        </section>

        <div className="marketplace-grid">
          {PRODUCTS.map((product) => (
            <article className={`portal-card marketplace-card ${product.accent}`} key={product.id}>
              <div className="marketplace-card-head">
                <div>
                  <p className="marketplace-card-kicker">{product.eyebrow}</p>
                  <h2>{product.name}</h2>
                </div>
                <div className="marketplace-price">
                  <strong>{product.price}</strong>
                  <small>{product.priceNote}</small>
                </div>
              </div>
              <p className="marketplace-description">{product.description}</p>
              <ul className="marketplace-bullets">
                {product.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
              <MarketplaceAction
                productId={product.id}
                unitPrice={product.unitPrice}
                quantityEnabled={product.quantityEnabled}
              />
            </article>
          ))}
        </div>

        <p className="marketplace-boundary" role="note">
          <strong>What the button does today:</strong> it writes a permissioned <code>marketplace.request</code> record to CORE's append-only audit stream so leadership has a real order request to act on. <strong>It does not charge a card, debit a balance, or change compensation.</strong> Checkout becomes transactional only after a wallet/payment system of record is connected.
        </p>
      </main>
    </PortalShell>
  );
}
