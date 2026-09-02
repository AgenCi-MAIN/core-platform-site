"use client";

import { useEffect } from "react";

/**
 * Small compatibility layer for the existing static portal navigation.
 *
 * The portal shell still owns its route authorization; this component only
 * upgrades the visible navigation vocabulary and exposes the wallet status
 * in the authenticated top bar. It is
 * deliberately idempotent because the shell can be replaced by client
 * navigation while this layout stays mounted.
 */
export function PortalNavigationUpgrade() {
  useEffect(() => {
    let phonePhase = document.documentElement.dataset.thrivePhonePhase ?? "loading";

    function setLabel(node: HTMLElement, label: string) {
      if (node.textContent !== label) node.textContent = label;
    }

    function phoneCopy(phase: string) {
      return ({
        loading: "Loading phone",
        setup_pending: "Setup needed",
        offline: "Offline · open phone",
        registering: "Connecting phone",
        secondary: "Mirroring primary tab",
        available: "Available · open phone",
        ringing: "Incoming · answer",
        connecting: "Connecting call",
        connected: "Call active",
        answered_elsewhere: "Answered elsewhere",
        error: "Phone unavailable",
      } as Record<string, string>)[phase] ?? "Open phone";
    }

    function renderPhonePhase() {
      document.documentElement.dataset.thrivePhonePhase = phonePhase;
      document.querySelectorAll<HTMLButtonElement>(".thrive-topbar-call-control").forEach((button) => {
        button.dataset.phonePhase = phonePhase;
        button.setAttribute("aria-label", `Open Calls in J.A.R.V.I.S. Phone status: ${phoneCopy(phonePhase)}.`);
        const status = button.querySelector<HTMLElement>(".thrive-topbar-call-status");
        if (status) setLabel(status, phoneCopy(phonePhase));
      });
    }

    function upgrade() {
      document.querySelectorAll<HTMLElement>(".portal-menu-item-surelc").forEach((node) => node.remove());

      document.querySelectorAll<HTMLElement>(".portal-topbar-end").forEach((topbar) => {
        if (topbar.querySelector(".thrive-account-call-stack")) return;
        const stack = document.createElement("div");
        stack.className = "thrive-account-call-stack";

        const balance = document.createElement("a");
        balance.href = "/portal/shop";
        balance.className = "thrive-balance-pill";
        balance.title = "Open IMO Marketplace";
        balance.innerHTML = "<span>Account balance</span><strong>— · ledger pending</strong>";

        const calls = document.createElement("button");
        calls.type = "button";
        calls.className = "thrive-topbar-call-control";
        calls.innerHTML = '<span><i aria-hidden="true"></i>Calls</span><strong class="thrive-topbar-call-status" aria-live="polite">Open phone</strong>';
        calls.addEventListener("click", () => {
          window.dispatchEvent(new CustomEvent("thrive:phone-panel", { detail: { open: true } }));
        });

        stack.appendChild(balance);
        stack.appendChild(calls);
        topbar.insertBefore(stack, topbar.firstChild);
      });

      renderPhonePhase();
    }

    upgrade();
    const observer = new MutationObserver(upgrade);
    observer.observe(document.body, { childList: true, subtree: true });
    const onPhoneState = (event: Event) => {
      const next = (event as CustomEvent<{ phase?: string }>).detail?.phase;
      if (!next) return;
      phonePhase = next;
      renderPhonePhase();
    };
    window.addEventListener("thrive:phone-state", onPhoneState);
    return () => {
      observer.disconnect();
      window.removeEventListener("thrive:phone-state", onPhoneState);
    };
  }, []);

  return (
    <style>{`
      .thrive-account-call-stack{display:grid;min-width:152px;border:1px solid color-mix(in srgb,var(--portal-accent) 32%,transparent);border-radius:11px;overflow:hidden;background:var(--portal-raised);box-shadow:0 8px 20px -18px rgba(0,0,0,.65)}
      .thrive-balance-pill{display:grid;gap:1px;min-width:0;padding:7px 11px 6px;text-decoration:none;background:transparent;transition:background .18s ease}
      .thrive-balance-pill:hover{background:color-mix(in srgb,var(--portal-accent) 12%,transparent)}
      .thrive-balance-pill span{color:var(--portal-muted);font-size:.58rem;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.thrive-balance-pill strong{color:var(--portal-text);font-size:.72rem;white-space:nowrap}
      .thrive-topbar-call-control{min-width:0;min-height:32px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 11px;border:0;border-top:1px solid color-mix(in srgb,var(--portal-accent) 22%,transparent);color:var(--portal-text);background:color-mix(in srgb,var(--portal-panel) 72%,transparent);font:inherit;text-align:left;cursor:pointer}
      .thrive-topbar-call-control:hover{background:var(--portal-accent-soft)}
      .thrive-topbar-call-control:focus-visible{position:relative;z-index:1;outline:2px solid var(--portal-accent);outline-offset:-2px}
      .thrive-topbar-call-control span{display:inline-flex;align-items:center;gap:6px;color:var(--portal-muted);font-size:.59rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
      .thrive-topbar-call-control i{width:7px;height:7px;border-radius:50%;background:var(--portal-muted);box-shadow:0 0 0 3px color-mix(in srgb,var(--portal-muted) 12%,transparent)}
      .thrive-topbar-call-control strong{overflow:hidden;color:var(--portal-text);font-size:.64rem;font-weight:800;text-overflow:ellipsis;white-space:nowrap}
      .thrive-topbar-call-control[data-phone-phase="available"] i{background:var(--portal-success);box-shadow:0 0 0 3px var(--portal-success-ring)}
      .thrive-topbar-call-control[data-phone-phase="ringing"] i,.thrive-topbar-call-control[data-phone-phase="connecting"] i,.thrive-topbar-call-control[data-phone-phase="connected"] i{background:var(--portal-accent);box-shadow:0 0 0 3px var(--portal-accent-soft)}
      .thrive-topbar-call-control[data-phone-phase="ringing"] strong,.thrive-topbar-call-control[data-phone-phase="connected"] strong{color:var(--portal-accent-strong)}
      @media(max-width:1020px){.thrive-account-call-stack{min-width:136px}.thrive-topbar-call-control strong{max-width:72px}}
      @media(max-width:860px){.thrive-balance-pill{display:none}.thrive-account-call-stack{min-width:112px;border-radius:9px}.thrive-topbar-call-control{min-height:44px;border-top:0;padding:7px 9px}.thrive-topbar-call-control strong{max-width:54px}}
      @media(max-width:620px){.thrive-account-call-stack{min-width:44px;width:44px}.thrive-topbar-call-control{width:44px;justify-content:center;padding:0}.thrive-topbar-call-control span{font-size:0;gap:0}.thrive-topbar-call-control i{width:9px;height:9px}.thrive-topbar-call-control strong{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}}
    `}</style>
  );
}
