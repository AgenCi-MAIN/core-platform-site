"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const VOLUME_KEY = "thrive-portal-volume";
const MUTED_KEY = "thrive-portal-muted";

type Track = { key: string; title: string; artist: string };

/**
 * Portal Radio deck — the player docked at the bottom of every portal page.
 *
 * Tracks come from `/portal/music/list`, which reads the uploads made on the
 * Radio page. Nothing is bundled with the application, so the deck plays only
 * what IMO has deliberately put there.
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

/**
 * Inline icons, filled with currentColor.
 *
 * These were emoji (\u23ee \u25b6 \u23ed \ud83d\udd0a). Emoji ignore CSS colour
 * entirely — iOS painted them in its own glossy blue whatever the theme, which
 * is how the deck ended up with out-of-place glyphs on a dark page. An inline
 * SVG inherits the button's colour like any other text, in both themes.
 */
function DeckIcon({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      {children}
    </svg>
  );
}

const IconPrev = () => (
  <DeckIcon>
    <path d="M6 5h2.4v14H6zM20 5.5v13a.5.5 0 0 1-.78.42L9.6 12.9a1 1 0 0 1 0-1.8l9.62-6.02A.5.5 0 0 1 20 5.5z" />
  </DeckIcon>
);
const IconNext = () => (
  <DeckIcon>
    <path d="M15.6 5H18v14h-2.4zM4 5.5v13a.5.5 0 0 0 .78.42l9.62-6.02a1 1 0 0 0 0-1.8L4.78 5.08A.5.5 0 0 0 4 5.5z" />
  </DeckIcon>
);
const IconPlay = () => (
  <DeckIcon size={18}>
    <path d="M8 5.4v13.2a.6.6 0 0 0 .92.5l10.2-6.6a.6.6 0 0 0 0-1L8.92 4.9a.6.6 0 0 0-.92.5z" />
  </DeckIcon>
);
const IconPause = () => (
  <DeckIcon size={18}>
    <path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z" />
  </DeckIcon>
);
const IconSound = () => (
  <DeckIcon>
    <path d="M4 9.5v5a1 1 0 0 0 1 1h2.6l4.6 3.7a.6.6 0 0 0 .98-.47V5.27a.6.6 0 0 0-.98-.47L7.6 8.5H5a1 1 0 0 0-1 1z" />
    <path
      d="M16 8.6a5.2 5.2 0 0 1 0 6.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M18.6 6.4a8.4 8.4 0 0 1 0 11.2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity=".55"
    />
  </DeckIcon>
);
const IconMuted = () => (
  <DeckIcon>
    <path d="M4 9.5v5a1 1 0 0 0 1 1h2.6l4.6 3.7a.6.6 0 0 0 .98-.47V5.27a.6.6 0 0 0-.98-.47L7.6 8.5H5a1 1 0 0 0-1 1z" />
    <path
      d="M16.2 9.6l4.8 4.8M21 9.6l-4.8 4.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </DeckIcon>
);

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

  // Ringing or connected browser calls always win the headset. The radio is
  // paused immediately and deliberately stays paused after the call; resuming
  // requires a fresh member click so audio never surprises the employee.
  useEffect(() => {
    const pauseForCall = (event: Event) => {
      const active = (event as CustomEvent<{ active?: boolean }>).detail?.active;
      if (!active) return;
      audioRef.current?.pause();
      setPlaying(false);
    };
    window.addEventListener("thrive:call-activity", pauseForCall);
    return () => window.removeEventListener("thrive:call-activity", pauseForCall);
  }, []);

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
      <aside className="audio-deck audio-deck-empty" aria-label="Portal Radio">
        <span className="audio-deck-badge" aria-hidden="true">♪</span>
        <div className="audio-deck-copy">
          <strong>Portal Radio</strong>
          <small>No tracks yet — add them on the Radio page.</small>
        </div>
        <a className="audio-deck-button" href="/portal/music" title="Open Radio">
          <span aria-hidden="true">→</span>
        </a>
      </aside>
    );
  }

  return (
    <aside className="audio-deck" aria-label="Portal Radio player">
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
        <small>{track!.artist || "Portal Radio"}</small>
      </div>

      <div className="audio-deck-transport">
        <button className="audio-deck-button" type="button" onClick={previous} aria-label="Previous track">
          <IconPrev />
        </button>
        <button
          className="audio-deck-button audio-deck-button-primary"
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <IconPause /> : <IconPlay />}
        </button>
        <button className="audio-deck-button" type="button" onClick={next} aria-label="Next track">
          <IconNext />
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
          {muted || volume === 0 ? <IconMuted /> : <IconSound />}
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
