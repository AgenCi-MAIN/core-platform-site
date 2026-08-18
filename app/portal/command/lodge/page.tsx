import { redirect } from "next/navigation";
import {
  isCommandCenter,
  isCommandCenterUnlocked,
  requireCapability,
} from "../../access";
import { PortalPageIntro, PortalShell } from "../../components";

export const dynamic = "force-dynamic";

/**
 * The Command Center lock.
 *
 * Reached only by redirect from the Command Center guard, which means the
 * visitor already holds an active member row and a named place on the
 * Command Center list. The lock is the SECOND check, not the first: being on
 * the list makes you eligible to hold a pass, and nothing more.
 *
 * The founder never sees this page — his address opens the Command Center
 * permanently — so arriving here as the founder is a bug, and the page sends
 * him straight through rather than presenting a lock he has no code for.
 */
export default async function LodgePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; locked?: string; return_to?: string }>;
}) {
  const session = await requireCapability("dashboard.view.self", "/portal/command/lodge");
  const params = await searchParams;

  if (isCommandCenterUnlocked(session)) redirect("/portal/command");
  if (!isCommandCenter(session)) redirect("/portal/no-access");

  const failed = params.error === "1";
  const locked = params.locked === "1";

  return (
    <PortalShell session={session} current="/portal/command" section="Command Center">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Command Center"
          title={<>This one is <em>locked</em></>}
          subtitle="Your name is on the list, which is what makes you eligible for a code. The code itself comes from Shawn, it works once, and it expires fifteen minutes after he issues it."
          compact
        />

        <section className="portal-card lodge-card">
          <form className="lodge-form" method="post" action="/portal/command/lodge/redeem">
            <input
              type="hidden"
              name="return_to"
              value={params.return_to ?? "/portal/command"}
            />
            <label className="lodge-label" htmlFor="lodge-code">
              Six-digit lodge code
            </label>
            <input
              className="lodge-input"
              id="lodge-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              placeholder="000000"
              aria-describedby={failed ? "lodge-error" : "lodge-help"}
              required
            />
            <button className="lodge-submit" type="submit">
              Unlock for this session
            </button>

            {failed ? (
              <p className="lodge-error" id="lodge-error" role="alert">
                {locked
                  ? "That pass is locked. Five wrong attempts ends a code — ask Shawn for a new one."
                  : "That did not work. Ask Shawn for a fresh code."}
              </p>
            ) : (
              <p className="lodge-help" id="lodge-help">
                Redeeming burns the code. Closing your browser ends the session,
                and it lapses on its own after two hours either way.
              </p>
            )}
          </form>
        </section>

        <section className="portal-card">
          <p className="portal-lede">
            Ask Shawn directly — by phone or in person. A code is worth exactly
            one visit, so it does not need to be protected forever, but it
            should not sit in a message thread either.
          </p>
        </section>
      </main>
    </PortalShell>
  );
}
