"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Track = {
  key: string;
  title: string;
  artist: string;
  size: number;
  uploadedAt: string;
  contentType: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "busy"; message: string }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MusicManager({ canUpload }: { canUpload: boolean }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/portal/music/list", { cache: "no-store" });
      if (!res.ok) throw new Error(`list failed (${res.status})`);
      const data = (await res.json()) as { tracks?: Track[]; storage?: string };
      setTracks(data.tracks ?? []);
      if (data.storage === "unavailable") {
        setStatus({
          kind: "error",
          message:
            "Object storage is not bound on this deployment, so nothing can be uploaded or played yet.",
        });
      }
    } catch (error) {
      setStatus({ kind: "error", message: `Could not load tracks: ${String(error)}` });
    } finally {
      setLoaded(true);
    }
  }, []);

  // Load the library once on mount. Every state update below happens in a
  // promise callback after the network settles, never synchronously during
  // the effect, so this does not cause a cascading render.
  useEffect(() => {
    let cancelled = false;

    fetch("/portal/music/list", { cache: "no-store" })
      .then((res): Promise<{ tracks?: Track[]; storage?: string }> => {
        if (!res.ok) throw new Error(`list failed (${res.status})`);
        return res.json() as Promise<{ tracks?: Track[]; storage?: string }>;
      })
      .then((data) => {
        if (cancelled) return;
        setTracks(data.tracks ?? []);
        if (data.storage === "unavailable") {
          setStatus({
            kind: "error",
            message:
              "Object storage is not bound on this deployment, so nothing can be uploaded or played yet.",
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setStatus({ kind: "error", message: `Could not load tracks: ${String(error)}` });
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setStatus({ kind: "error", message: "Choose an audio file first." });
      return;
    }

    setStatus({ kind: "busy", message: `Uploading ${file.name}…` });
    try {
      const res = await fetch("/portal/music/upload", { method: "POST", body: data });
      const body = (await res.json()) as { error?: string; title?: string };
      if (!res.ok) throw new Error(body.error ?? `upload failed (${res.status})`);

      setStatus({ kind: "ok", message: `Uploaded “${body.title}”.` });
      form.reset();
      if (fileRef.current) fileRef.current.value = "";
      await refresh();
    } catch (error) {
      setStatus({ kind: "error", message: String(error instanceof Error ? error.message : error) });
    }
  }

  async function remove(track: Track) {
    setStatus({ kind: "busy", message: `Removing ${track.title}…` });
    try {
      const res = await fetch(`/portal/music/upload?key=${encodeURIComponent(track.key)}`, {
        method: "DELETE",
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? `delete failed (${res.status})`);
      setStatus({ kind: "ok", message: `Removed “${track.title}”.` });
      await refresh();
    } catch (error) {
      setStatus({ kind: "error", message: String(error instanceof Error ? error.message : error) });
    }
  }

  return (
    <div className="music-manager">
      {canUpload ? (
        <form className="portal-card music-upload" onSubmit={upload}>
          <h2>Add a track</h2>
          <p className="portal-fine">
            Upload audio THRIVE has the right to use — music you own, licensed
            or royalty-free production audio, or something you commissioned.
            Every upload is recorded in the audit log against your name.
          </p>

          <div className="music-upload-grid">
            <label>
              <span>Audio file</span>
              <input
                ref={fileRef}
                className="access-input"
                type="file"
                name="file"
                accept="audio/*,.mp3,.m4a,.aac,.ogg,.opus,.wav,.flac,.webm"
                required
              />
            </label>
            <label>
              <span>Title (optional)</span>
              <input className="access-input" type="text" name="title" maxLength={120} placeholder="Crystalize" />
            </label>
            <label>
              <span>Artist (optional)</span>
              <input className="access-input" type="text" name="artist" maxLength={120} placeholder="Lexurus" />
            </label>
          </div>

          <button className="access-submit" type="submit" disabled={status.kind === "busy"}>
            {status.kind === "busy" ? "Working…" : "Upload"}
          </button>
        </form>
      ) : null}

      {status.kind !== "idle" ? (
        <p
          className={`music-status music-status-${status.kind}`}
          role={status.kind === "error" ? "alert" : "status"}
        >
          {status.message}
        </p>
      ) : null}

      <section className="portal-card">
        <h2>Library</h2>
        {!loaded ? (
          <p className="portal-fine">Loading…</p>
        ) : tracks.length === 0 ? (
          <div className="portal-empty">
            <span className="portal-empty-icon" aria-hidden="true">○</span>
            <div className="portal-empty-copy">
              <h3>No tracks yet</h3>
              <p>
                {canUpload
                  ? "Upload one above and it appears here and in the player at the bottom of every page."
                  : "An owner or administrator adds tracks. They will appear here."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="music-list">
            {tracks.map((track) => (
              <li key={track.key}>
                <span className="music-list-mark" aria-hidden="true">♪</span>
                <span className="music-list-copy">
                  <strong>{track.title}</strong>
                  <small>
                    {track.artist ? `${track.artist} · ` : ""}
                    {formatSize(track.size)}
                  </small>
                </span>
                <audio
                  className="music-list-audio"
                  controls
                  preload="none"
                  src={`/portal/music/track?key=${encodeURIComponent(track.key)}`}
                />
                {canUpload ? (
                  <button
                    className="audio-deck-button"
                    type="button"
                    onClick={() => void remove(track)}
                    aria-label={`Remove ${track.title}`}
                    title={`Remove ${track.title}`}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
