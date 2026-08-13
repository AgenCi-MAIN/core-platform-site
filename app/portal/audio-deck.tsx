"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const VOLUME_KEY = "thrive-portal-volume";
const MUTED_KEY = "thrive-portal-muted";

type Track = { key: string; title: string; artist: string };

/**
 * THRIVE Radio deck — the player docked at the bottom of every portal page.
 *
 * Tracks come from `/portal/music/list`, which reads the uploads made on the
 * Radio page. Nothing is bundled with the application, so the deck plays only
 * what THRIVE has deliberately put there.
 *
 * Deliberate behaviours:
 *  - Never autoplays. The member presses play.
 *  - Volume and mute persist across pages and reloads.
 *  - When there are no tracks it renders a quiet, labelled state rather than
 *    disappearing, so the control stays discoverable.
 */
function storedVolume(): number {
  if (typeof window === "undefined") return 0.5;
  try {
    const saved = window.localStorage.getItem(VOLUME_KEY);
    if (saved === null) return 0.5;
    const parsed = Number.parseFloat(saved);
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0.5;
  } catch {
    return 0.5;
  }
}

function storedMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTED_KEY) === "true";
  } catch {
    return false;
  }
}

export function PortalAudioDeck() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(storedVolume);
  const [muted, setMuted] = useState(storedMuted);

  // Load the library once. A failure here is non-fatal: the deck simply shows
  // its empty state rather than breaking the page it is docked to.
  useEffect(() => {
    let cancelled = false;
    fetch("/portal/music/list", { cache: "no-store" })
      .then((res): Promise<{ tracks?: Track[] }> =>
        res.ok ? (res.json() as Promise<{ tracks?: Track[] }>) : Promise.resolve({ tracks: [] }),
      )
      .then((data) => {
        if (!cancelled) setTracks(data.tracks ?? []);
      })
      .catch(() => {
        /* deck stays empty */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (el) {
      el.volume = volume;
      el.muted = muted;
    }
    try {
      window.localStorage.setItem(VOLUME_KEY, String(volume));
      window.localStorage.setItem(MUTED_KEY, String(muted));
    } catch {
      /* storage unavailable; the setting still applies to this page */
    }
  }, [volume, muted]);

  const hasTracks = tracks.length > 0;
  const track = hasTracks ? tracks[index % tracks.length] : null;

  const next = useCallback(() => {
    if (!hasTracks) return;
    setIndex((current) => (current + 1) % tracks.length);
  }, [hasTracks, tracks.length]);

  const previous = useCallback(() => {
    if (!hasTracks) return;
    setIndex((current) => (current - 1 + tracks.length) % tracks.length);
  }, [hasTracks, tracks.length]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !playing) return;
    void el.play().catch(() => setPlaying(false));
  }, [index, playing]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    void el
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, [playing]);

  if (!hasTracks) {
    return (
      <aside className="audio-deck audio-deck-empty" aria-label="THRIVE Radio">
        <span className="audio-deck-badge" aria-hidden="true">♪</span>
        <div className="audio-deck-copy">
          <strong>THRIVE Radio</strong>
          <small>No tracks yet — add them on the Radio page.</small>
        </div>
        <a className="audio-deck-button" href="/portal/music" title="Open Radio">
          <span aria-hidden="true">→</span>
        </a>
      </aside>
    );
  }

  return (
    <aside className="audio-deck" aria-label="THRIVE Radio player">
      <audio
        ref={audioRef}
        src={`/portal/music/track?key=${encodeURIComponent(track!.key)}`}
        onEnded={next}
        onPause={() => setPlaying(false)}
        preload="none"
      />

      <span className="audio-deck-badge" aria-hidden="true">♪</span>

      <div className="audio-deck-copy">
        <strong>{track!.title}</strong>
        <small>{track!.artist || "THRIVE Radio"}</small>
      </div>

      <div className="audio-deck-transport">
        <button className="audio-deck-button" type="button" onClick={previous} aria-label="Previous track">
          <span aria-hidden="true">⏮</span>
        </button>
        <button
          className="audio-deck-button audio-deck-button-primary"
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
        >
          <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
        </button>
        <button className="audio-deck-button" type="button" onClick={next} aria-label="Next track">
          <span aria-hidden="true">⏭</span>
        </button>
      </div>

      <div className="audio-deck-volume">
        <button
          className="audio-deck-button"
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={muted}
        >
          <span aria-hidden="true">{muted || volume === 0 ? "🔇" : "🔊"}</span>
        </button>
        <input
          className="audio-deck-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(event) => {
            const value = Number.parseFloat(event.target.value);
            setVolume(value);
            if (value > 0 && muted) setMuted(false);
          }}
          aria-label="Volume"
        />
        <span className="audio-deck-level" aria-hidden="true">
          {Math.round((muted ? 0 : volume) * 100)}
        </span>
      </div>

      <span className="audio-deck-count">
        {(index % tracks.length) + 1}/{tracks.length}
      </span>
    </aside>
  );
}
