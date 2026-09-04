# Worker D connector repair review

This package captures the local connector repair for Worker B's `worker_d_allowed_app_status` 502. It is a connector review package, not a complete Cloudflare Worker or deployment configuration.

## Change

The gateway advertised six tools, but the connector permitted only five. Add `worker_d_allowed_app_status` to `TOOLS` in `connector/index.mjs`. The rest of the connector is included as its existing baseline for review; CORE previously tracked no relay source.

## Verification

Run `npm test` with Node supporting `--experimental-strip-types`. This regression check needs no installed dependencies. The original relay package passed seven tests and TypeScript checking before packaging. Worker B's live post-fix call returned `READY_OWNER_GATE` with app control disabled.

Response SHA-256: `f93ae75cf82b5391485a28c463cbe7ef81f032dbcb2dd90383cc094c76a401e7`.

## Runtime

The connector requires the existing protected launcher and its environment configuration. It reads its connector credential from the configured protected token file. No credentials or machine-specific launcher configuration are included. This package does not change OAuth, client permissions, or the deployed Worker. Review and merge do not deploy or restart anything.
