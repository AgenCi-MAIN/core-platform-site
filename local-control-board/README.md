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
