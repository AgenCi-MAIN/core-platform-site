import type { NextConfig } from "next";

/**
 * `bodySizeLimit` is named for Server Actions, but it gates more than that.
 *
 * vinext classifies **any** POST carrying `multipart/form-data` without an
 * action id as a progressive Server Action, and enforces this limit before the
 * request ever reaches a route handler. That sweeps up ordinary multipart
 * uploads — `/portal/music/upload` and `/portal/calls` recordings among them.
 *
 * At the 1 MB default, a track over roughly a minute was rejected with a
 * plain-text `413 Payload Too Large` produced by the framework. Because that
 * body is text and the client expects JSON, the browser surfaced it as
 * `Unexpected token 'P', "Payload Too Large" is not valid JSON` — which reads
 * like a parsing bug and hides the actual cause.
 *
 * Set to 40 MB to match `MAX_UPLOAD_BYTES` in app/portal/music/storage.ts, so
 * the application's own limit is the one that decides. That check returns
 * proper JSON and names the ceiling, which is what the interface can show.
 *
 * Keep the two in step. If `MAX_UPLOAD_BYTES` rises above this value, uploads
 * fail again with the same misleading error.
 */
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: 40 * 1024 * 1024,
    },
  },
};

export default nextConfig;
