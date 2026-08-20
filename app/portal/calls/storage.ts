import { env } from "cloudflare:workers";

export type RecordingObject = {
  body: ReadableStream;
  etag: string;
  size: number;
  httpMetadata?: { contentType?: string };
};

type RecordingBucket = {
  get(key: string): Promise<RecordingObject | null>;
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView,
    options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> },
  ): Promise<unknown>;
};

export function getCallRecordingsBucket(): RecordingBucket | null {
  const runtime = env as unknown as { CALL_RECORDINGS?: RecordingBucket };
  return runtime.CALL_RECORDINGS ?? null;
}

export function isCallRecordingStorageReady(): boolean {
  return getCallRecordingsBucket() !== null;
}
