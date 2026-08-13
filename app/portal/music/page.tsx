import { can, requireCapability } from "../access";
import { PortalPageIntro, PortalShell } from "../components";
import { MusicManager } from "./uploader";

export const dynamic = "force-dynamic";

/**
 * THRIVE Radio — the music library.
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
          eyebrow="THRIVE Radio"
          title="Radio"
          subtitle="Music for the floor. Plays from the deck at the bottom of every portal page."
          compact
        />

        <p className="script-governance" role="note">
          <span className="script-governance-tag">Rights</span>
          <span>
            Upload only audio THRIVE holds the right to use — owned, licensed,
            royalty-free, or commissioned. Files from a personal streaming
            subscription are not licensed for this, and a DRM-protected cache
            cannot be used at all.{" "}
            <strong>Each upload is recorded against the person who made it.</strong>
          </span>
        </p>

        <MusicManager canUpload={canUpload} />
      </main>
    </PortalShell>
  );
}
