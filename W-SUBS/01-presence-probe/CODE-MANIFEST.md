# presence-probe — code manifest (the lane's territory)

- `app/portal/presence/route.ts — the guarded model route; the isolation contract lives in its header`
- `app/portal/presence.tsx — client widget; text-node-only rendering`
- `app/portal/library/content.ts — the LIBRARY the model answers from`
- `app/portal/access.ts — assertCapability + recordAudit (the cap counts these rows)`
- `app/globals.css — .presence-* styles, blink keyframes, BOOST/reduced-motion strips`
- `worker-env.d.ts — ANTHROPIC_API_KEY / PRESENCE_MODEL typings`
- `tests/portal-authorization.test.mjs — presence guard, keyless 503, and cap boundary tests`
