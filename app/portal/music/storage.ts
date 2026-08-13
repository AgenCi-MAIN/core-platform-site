import { env } from "cloudflare:workers";

/**
 * Storage for THRIVE Radio.
 *
 * Music lives in the existing R2 bucket under a `music/` prefix rather than in
 * a second bucket. That keeps the deployment contract unchanged — no new
 * binding to declare, provision, and verify — and the prefix keeps it entirely
 * separate from call recordings, which are governed differently and must never
 * be reachable through these routes.
 *
 * Every helper here refuses to operate outside the prefix.
 */

const PREFIX = "music/";

/** Extensions we accept, mapped to the content type we will serve back. */
export const AUDIO_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  wav: "audio/wav",
  flac: "audio/flac",
  webm: "audio/webm",
};

/** 40 MB. Large enough for a long track, small enough to stay sane. */
export const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

type StoredObject = {
  body: ReadableStream;
  etag: string;
  size: number;
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
};

type ListedObject = {
  key: string;
  size: number;
  uploaded: Date | string;
  customMetadata?: Record<string, string>;
  httpMetadata?: { contentType?: string };
};

type MusicBucket = {
  get(key: string): Promise<StoredObject | null>;
  put(
    key: string,
    value: ArrayBuffer | ReadableStream,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  list(options?: {
    prefix?: string;
    limit?: number;
    /**
     * R2 omits custom and HTTP metadata from list results unless they are
     * asked for. Without this the title and artist silently fall back to the
     * filename, which is exactly the kind of quiet wrong answer that survives
     * review.
     */
    include?: ("customMetadata" | "httpMetadata")[];
  }): Promise<{ objects: ListedObject[] }>;
  delete(key: string): Promise<void>;
};

export function getMusicBucket(): MusicBucket | null {
  const runtime = env as unknown as { CALL_RECORDINGS?: MusicBucket };
  return runtime.CALL_RECORDINGS ?? null;
}

export function isMusicStorageReady(): boolean {
  return getMusicBucket() !== null;
}

export type MusicTrack = {
  /** Full R2 key, including the prefix. */
  key: string;
  /** Display title. */
  title: string;
  /** Display artist, or an empty string. */
  artist: string;
  size: number;
  uploadedAt: string;
  contentType: string;
};

/**
 * Turn an arbitrary filename into a safe key segment: lowercase, ASCII, no
 * path separators, no traversal, bounded length, and a preserved extension.
 */
export function safeKeySegment(filename: string): string | null {
  const dot = filename.lastIndexOf(".");
  if (dot <= 0) return null;

  const ext = filename.slice(dot + 1).toLowerCase();
  if (!AUDIO_TYPES[ext]) return null;

  const stem = filename
    .slice(0, dot)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  if (!stem) return null;
  return `${stem}.${ext}`;
}

/** Reject anything that is not squarely inside the music prefix. */
export function isMusicKey(key: string): boolean {
  if (!key.startsWith(PREFIX)) return false;
  if (key.includes("..")) return false;
  const rest = key.slice(PREFIX.length);
  return /^[a-z0-9][a-z0-9.-]*$/.test(rest);
}

export function musicKey(segment: string): string {
  return `${PREFIX}${segment}`;
}

export async function listMusic(): Promise<MusicTrack[]> {
  const bucket = getMusicBucket();
  if (!bucket) return [];

  const listed = await bucket.list({
    prefix: PREFIX,
    limit: 200,
    include: ["customMetadata", "httpMetadata"],
  });

  return listed.objects
    .filter((object) => isMusicKey(object.key))
    .map((object) => {
      const meta = object.customMetadata ?? {};
      const fallback = object.key.slice(PREFIX.length).replace(/\.[a-z0-9]+$/, "");
      const uploaded =
        object.uploaded instanceof Date
          ? object.uploaded.toISOString()
          : String(object.uploaded ?? "");

      return {
        key: object.key,
        title: meta.title || fallback,
        artist: meta.artist || "",
        size: object.size,
        uploadedAt: uploaded,
        contentType: object.httpMetadata?.contentType || "audio/mpeg",
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}
