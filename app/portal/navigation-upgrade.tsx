"use client";

import { useEffect } from "react";

const REAGAN_HREF = "https://reagan.ai/Account/Login?ReturnUrl=%2FAgentPortal%2FManage%2FAccount";

/**
 * Small compatibility layer for the existing static portal navigation.
 *
 * The portal shell still owns its route authorization; this component only
 * upgrades the visible navigation vocabulary and adds the universal inbound
 * route. It is deliberately idempotent because the shell can be replaced by
 * client navigation while this layout stays mounted.
 */
export function PortalNavigationUpgrade() {
  useEffect(() => {
    function upgrade() {
      document.querySelectorAll<HTMLElement>(".portal-nav-item-surelc").forEach((node) => node.remove());

      document.querySelectorAll<HTMLElement>(".portal-nav-exchange .portal-nav-label").forEach((node) => {
        node.textContent = "Marketplace";
      });
      document.querySelectorAll<HTMLElement>(".portal-nav-item-reagan .portal-nav-label").forEach((node) => {
        node.textContent = "Reagan AI — Heartland";
      });

      document.querySelectorAll<HTMLElement>(".portal-nav").forEach((nav) => {
        if (nav.querySelector(".thrive-inbound-nav")) return;
        const groups = [...nav.querySelectorAll<HTMLElement>(".portal-nav-group")];
        const calls = groups.find(
          (group) => group.querySelector<HTMLElement>(".portal-nav-group-label")?.textContent?.trim() === "Calls",
        );
        if (!calls) return;

        const link = document.createElement("a");
        link.href = "/portal/inbound";
        link.className = "portal-nav-item-retreaver thrive-inbound-nav";
        if (window.location.pathname === "/portal/inbound") link.setAttribute("aria-current", "page");
        link.title = "Inbound Calls";
        link.innerHTML = `
          <span class="portal-nav-icon" aria-hidden="true">
            <svg class="portal-nav-symbol portal-nav-symbol-retreaver" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">
              <circle cx="5" cy="12" r="2.6"></circle><circle cx="19" cy="5" r="2.6"></circle><circle cx="19" cy="19" r="2.6"></circle><path d="M7.3 10.9 16.7 6.1M7.3 13.1l9.4 4.8"></path>
            </svg>
          </span>
          <span class="portal-nav-label">Inbound Calls</span>
          <span class="thrive-inbound-live">LIVE</span>`;

        const training = calls.querySelector<HTMLElement>(".portal-nav-item-training");
        if (training?.nextSibling) calls.insertBefore(link, training.nextSibling);
        else calls.appendChild(link);
      });

      document.querySelectorAll<HTMLAnchorElement>('a[href="/portal/shop"] .portal-workspace-copy strong').forEach((node) => {
        node.textContent = "Marketplace";
      });
      document.querySelectorAll<HTMLAnchorElement>(`a[href="${REAGAN_HREF}"] .portal-workspace-copy strong`).forEach((node) => {
        node.textContent = "Reagan AI — Heartland";
      });
      document.querySelectorAll<HTMLAnchorElement>('a[href*="surancebay.com"] .portal-workspace-copy').forEach((node) => {
        node.closest("a")?.remove();
      });
    }

    upgrade();
    const observer = new MutationObserver(upgrade);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <style>{`
      .thrive-inbound-live{margin-left:auto;border:1px solid rgba(52,211,153,.26);border-radius:999px;padding:2px 5px;color:#6ee7b7;background:rgba(16,185,129,.08);font-size:.52rem;font-weight:900;letter-spacing:.08em}
      .thrive-balance-pill{display:grid;gap:1px;min-width:92px;border:1px solid rgba(45,212,191,.16);border-radius:10px;padding:6px 9px;text-decoration:none;background:rgba(15,23,42,.5)}
      .thrive-balance-pill span{color:#7f91aa;font-size:.58rem;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.thrive-balance-pill strong{color:#e6edf6;font-size:.76rem}
    `}</style>
  );
}
