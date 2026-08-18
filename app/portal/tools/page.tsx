import { requireCapability } from "../access";
import { PortalCardHeader, PortalPageIntro, PortalShell } from "../components";

export const dynamic = "force-dynamic";

const PATH = "/portal/tools";

/**
 * The external tool directory — every third-party tool the operation uses,
 * in one categorized, guarded place (owner tab-dump, 2026-08-18). Rules:
 *
 *   - LINKS ONLY. Nothing here authenticates through CORE, stores data in
 *     CORE, or renders third-party content inside CORE. Every entry opens in
 *     a new tab where the member signs in separately.
 *   - Stable URLs only. The owner's Aetna and Transamerica links arrived
 *     carrying one-time session tokens; those were stripped to the stable
 *     login pages, because an expired token link would 404 for every member.
 *   - Adding a tool = one entry in TOOL_CATEGORIES (and, if it earns a
 *     sidebar tab, a NAV item too). Category first, alphabetical-ish within.
 */
const TOOL_CATEGORIES: readonly {
  title: string;
  blurb: string;
  tools: readonly { label: string; href: string; note?: string }[];
}[] = [
  {
    title: "Carrier portals",
    blurb: "Where appointed agents service each carrier's business directly.",
    tools: [
      { label: "Aetna (Senior Products)", href: "https://www.aetna.com/aimmanageaccount/login" },
      {
        label: "Corebridge Connext",
        href: "https://www.connext.corebridgefinancial.com/life/connext-portal/public/login",
      },
      { label: "Occidental Life", href: "https://www.occidentallife.com/v4/agentLogin.php" },
      { label: "Transamerica", href: "https://secure.transamerica.com/login/sign-in/login.html" },
    ],
  },
  {
    title: "Contracting & licensing",
    blurb: "SureLC by SuranceBay — one entry per upline.",
    tools: [
      {
        label: "SureLC — Heartland",
        href: "https://accounts.surancebay.com/oauth/authorize?redirect_uri=https:%2F%2Fsurelc.surancebay.com%2Fproducer%2Foauth%3FreturnUrl%3D%252Fprofile%252Fcontact-info%253FgaId%253D505&gaId=505&client_id=surecrmweb&response_type=code",
        note: "gaId 505",
      },
      {
        label: "SureLC — Brenda Daly",
        href: "https://accounts.surancebay.com/oauth/authorize?redirect_uri=https:%2F%2Fsurelc.surancebay.com%2Fproducer%2Foauth%3FreturnUrl%3D%252Fprofile%252Fcontact-info%253FgaId%253D862%2526gaId%253D862%2526branch%253DBrenda%252520Daly%2526branchVisible%253Dtrue%2526branchEditable%253Dfalse%2526branchRequired%253Dtrue%2526autoAdd%253Dfalse%2526requestMethod%253DGET&gaId=862&client_id=surecrmweb&response_type=code",
        note: "gaId 862",
      },
      {
        label: "SureLC — Altura of America",
        href: "https://accounts.surancebay.com/oauth/authorize?redirect_uri=https:%2F%2Fsurelc.surancebay.com%2Fproducer%2Foauth%3FreturnUrl%3D%252Fprofile%252Fcontact-info%253FgaId%253D323%2526branch%253DAltura%252520of%252520America&gaId=323&client_id=surecrmweb&response_type=code",
        note: "gaId 323",
      },
    ],
  },
  {
    title: "Leads & CRM",
    blurb: "Lead sources and the systems that track them.",
    tools: [
      {
        label: "Reagan AI",
        href: "https://reagan.ai/Account/Login?ReturnUrl=%2FAgentPortal%2FManage%2FAccount",
      },
      { label: "InteleLead", href: "https://www.intelelead.com/portal/" },
      {
        label: "Salesforce",
        href: "https://energy-saas-6930.my.salesforce.com/",
        note: "org energy-saas-6930",
      },
    ],
  },
  {
    title: "Quoting & underwriting",
    blurb: "InsuranceToolkits — quoting plus the advisory-only underwriting helper.",
    tools: [
      { label: "FEX Quoter", href: "https://app.insurancetoolkits.com/fex/quoter" },
      {
        label: "AI Underwriter",
        href: "https://app.insurancetoolkits.com",
        note: "advisory only — never a quote or a decision",
      },
    ],
  },
  {
    title: "Team documents",
    blurb: "Shared working documents. Access is governed by their own Google permissions.",
    tools: [
      {
        label: "Operations sheet",
        href: "https://docs.google.com/spreadsheets/d/1WHqWIpv2irhJuM77KYy_Q5iV_VnRMU3LMGs0anVxceM/edit?gid=0#gid=0",
      },
      {
        label: "Operations doc",
        href: "https://docs.google.com/document/d/1MEUhgynxiLPS1kRefY9dSi6MGVac2mD6VubKiLsYRQw/edit",
      },
    ],
  },
  {
    title: "Utilities",
    blurb: "Supporting tools.",
    tools: [{ label: "AudioConvert", href: "https://audioconvert.ai/library" }],
  },
];

export default async function ToolsPage() {
  const session = await requireCapability("dashboard.view.self", "/portal/tools");

  return (
    <PortalShell session={session} current={PATH} section="Tools">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="External tools"
          title={<>Tool <em>directory</em></>}
          subtitle="Every third-party tool in one place, by category. Each opens in a new tab and has its own sign-in — nothing here runs inside CORE or shares its data."
          compact
        />

        {TOOL_CATEGORIES.map((category) => (
          <article className="portal-card" key={category.title}>
            <PortalCardHeader icon="T" title={category.title} description={category.blurb} />
            <div className="portal-table-scroll">
              <table className="portal-table">
                <tbody>
                  {category.tools.map((tool) => (
                    <tr key={tool.href}>
                      <td>
                        <a
                          href={tool.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="portal-tool-link"
                        >
                          <strong>{tool.label}</strong> ↗
                        </a>
                      </td>
                      <td>{tool.note ?? ""}</td>
                      <td>
                        <span className="portal-state portal-state-live">External</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </main>
    </PortalShell>
  );
}
