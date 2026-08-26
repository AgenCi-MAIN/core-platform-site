import Link from "next/link";
import { can, isCommandCenter, requireCapability } from "../access";
import { PortalPageIntro, PortalShell } from "../components";
import { MusicManager } from "./uploader";

export const dynamic = "force-dynamic";

/**
 * Portal Radio — the music library.
 *
 * Listening is open to every role (`dashboard.view.self`). Uploading and
 * removing require `members.manage`, because the files play for everyone.
 */
export default async function MusicPage() {
  const session = await requireCapability("dashboard.view.self", "/portal/music");
  const canUpload = can(session, "members.manage");

  return (
    <PortalShell session={session} current="/portal/music" section="Radio">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Portal Radio"
          title="Radio"
          subtitle="Music for the floor. Plays from the deck at the bottom of every portal page."
          compact
        />

        <p className="script-governance" role="note">
          <span className="script-governance-tag">Rights</span>
          <span>
            Upload only audio IMO holds the right to use — owned, licensed,
            royalty-free, or commissioned. Files from a personal streaming
            subscription are not licensed for this, and a DRM-protected cache
            cannot be used at all.{" "}
            <strong>Each upload is recorded against the person who made it.</strong>
          </span>
        </p>

        <MusicManager canUpload={canUpload} />

        {/* The Command Center's front door (founder's order 2026-08-18:
            "Move Command center in RADIO. Hidden in plain sight"). Rendered
            only for people already on COMMAND_CENTER_EMAILS, so it is not a
            hint to anyone else — and hiding it from them was never what
            stopped them: /portal/command refuses on the server whether or not
            this link exists. Anyone but the founder still needs a live lodge
            code after clicking it. */}
        {isCommandCenter(session) ? (
          <p className="radio-frequency">
            <Link href="/portal/command">
              <span className="radio-frequency-dial" aria-hidden="true">◉</span>
              <span>
                <strong>Frequency 00.1</strong>
                <small>Command Center</small>
              </span>
            </Link>
          </p>
        ) : null}
      </main>
    </PortalShell>
  );
}
