# Personal Control local dashboard

One private, read-only loopback app consolidating the two earlier five-lane
dashboard concepts into a single truthful AI operations view.

Canonical URL:

```text
http://127.0.0.1:5001/access
```

Start it from this directory:

```powershell
python server.py
```

Boundaries:

- Binds only to `127.0.0.1`; it is not a network or production service.
- Supports status reads only. `POST`, `PUT`, `PATCH`, and `DELETE` return `405`.
- Displays no credentials, customer data, production membership, or business
  sales/commission material.
- Labels live probes, last-verified evidence, and unavailable data separately.
- Does not invent token usage, cost, uptime, request rates, or infrastructure
  health when no trusted adapter is connected.
- Worker B Heavy is the separate Claude account. It is not CORE Agent B, the
  bounded autonomous builder shown in the CORE Agents list.

This is not the IMO website and does not use the production portal sign-in.

## Saved telemetry

The status endpoint reads optional observations from
`../.codex-runtime/telemetry.json`, outside the public directory and ignored by
Git. Codex usage, relay authentication, and inventory each carry their own
`observed_at` timestamp. The UI marks readings stale after five minutes;
reloading the page does not refresh the underlying observations. Missing
timestamps are shown as unavailable. This is not an automatic MCP collector.
Store only sanitized status data here, never credentials or raw account output.

The server exposes only validated numeric measurements, timestamps, known relay
states, and inventory hashes. Free-form input fields are replaced with fixed
descriptions. Invalid or oversized snapshots are unavailable. Refresh requests
time out after five seconds and clear old readings on failure.

Run dashboard regression checks with:

```text
python -m unittest discover -s local-control-board -p "test_*.py"
node --test local-control-board/tests/*.test.mjs
```

These commands run from the repository root and are included in the portal CI
workflow for pull requests targeting main or vera-central-control-system.
CI coverage does not itself enable branch protection or require reviews.
