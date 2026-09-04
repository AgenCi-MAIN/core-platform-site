#!/usr/bin/env python3
"""Private, read-only personal control dashboard. Loopback only."""

from __future__ import annotations

import json
import math
import re
import socket
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
TELEMETRY = ROOT.parent / ".codex-runtime" / "telemetry.json"
HOST = "127.0.0.1"
PORT = 5001
RELAY_URL = "https://core-a2a-relay.thrive18.workers.dev/mcp"
WORKER_D_DASHBOARD = Path(
    r"C:\Users\k2547\OneDrive\Desktop\Main Office\Worker A ( M Office)\Worker D (Local)\dashboard"
)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def probe_relay() -> dict[str, object]:
    request = Request(RELAY_URL, method="GET", headers={"User-Agent": "CORE-local-health/1.0"})
    try:
        with urlopen(request, timeout=1.5) as response:
            status = response.status
    except HTTPError as error:
        status = error.code
    except (URLError, TimeoutError, socket.timeout) as error:
        return {"state": "unreachable", "detail": type(error).__name__}
    return {"state": "reachable", "detail": f"HTTP {status}; authentication not tested"}


def sanitize_telemetry(raw: object) -> dict[str, object]:
    """Project only typed measurements; never relay arbitrary file contents."""
    result = {}
    if not isinstance(raw, dict):
        return result

    def timestamp(record):
        try:
            value = record.get("observed_at")
            observed = datetime.fromisoformat(value)
            if observed.tzinfo is None or observed > datetime.now(timezone.utc):
                return None
            return observed.isoformat()
        except (ValueError, TypeError, AttributeError):
            return None

    def number(value, maximum):
        return type(value) in (int, float) and 0 <= value <= maximum and math.isfinite(value)

    codex = raw.get("codex")
    if isinstance(codex, dict) and timestamp(codex):
        used, window, reset = (codex.get(k) for k in ("used_percent", "window_minutes", "resets_at"))
        if number(used, 100) and number(window, 525600) and window > 0 and number(reset, 253402300799):
            result["codex"] = {"observed_at": timestamp(codex), "used_percent": used,
                               "remaining_percent": 100 - used, "window_minutes": window, "resets_at": reset}
    relay = raw.get("relay_client")
    details = {"authenticated": "Authenticated relay check succeeded; saved worker-reported result.",
               "authorization required": "Relay reauthorization required at last check.",
               "unavailable": "Relay health unavailable at last check."}
    if isinstance(relay, dict) and timestamp(relay) and isinstance(relay.get("state"), str) and relay["state"] in details:
        result["relay_client"] = {"observed_at": timestamp(relay), "state": relay["state"], "detail": details[relay["state"]]}
    inventory = raw.get("inventory")
    if isinstance(inventory, dict) and timestamp(inventory):
        keys = ("file_count", "total_bytes", "anomaly_count")
        digest = inventory.get("inventory_sha256")
        if all(type(inventory.get(k)) is int and 0 <= inventory[k] <= 2**53 - 1 for k in keys) and isinstance(digest, str) and re.fullmatch(r"[a-f0-9]{64}", digest):
            result["inventory"] = {k: inventory[k] for k in keys}
            result["inventory"].update(observed_at=timestamp(inventory), inventory_sha256=digest,
                                       source="worker_d_artifact_inventory via CORE relay",
                                       label="worker-reported; contents not reviewed")
    return result


def read_telemetry() -> dict[str, object]:
    try:
        if TELEMETRY.stat().st_size > 65536:
            return {}
        return sanitize_telemetry(json.loads(TELEMETRY.read_text(encoding="utf-8")))
    except (OSError, ValueError, TypeError):
        return {}


def status_payload() -> dict[str, object]:
    return {
        "telemetry": read_telemetry(),
        "scope": "private-local-read-only",
        "generated_at": utc_now(),
        "production": False,
        "writes_enabled": False,
        "runtime": {"state": "online", "bind": f"{HOST}:{PORT}", "detail": "This dashboard process"},
        "relay": probe_relay(),
        "worker_d_source": {
            "state": "present" if WORKER_D_DASHBOARD.is_dir() else "missing",
            "detail": "Source presence only; connector authentication is not tested",
        },
        "usage": {
            "state": "unavailable",
            "detail": "No trusted live usage adapter is connected; no estimates shown",
        },
        "evidence": {
            "branch": "codex/personal-control-dashboard",
            "source": str(ROOT),
            "contract": "Live facts, last-verified facts, and unavailable values stay separate",
        },
    }


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        __import__("sys").stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _json(self, code: int, payload: object) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/status":
            self._json(200, status_payload())
            return
        if path in {"/", "/access", "/access/"}:
            self.path = "/index.html"
        super().do_GET()

    def _deny_write(self) -> None:
        self._json(405, {"error": "read-only dashboard", "writes_enabled": False})

    do_POST = _deny_write
    do_PUT = _deny_write
    do_PATCH = _deny_write
    do_DELETE = _deny_write

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()


def main() -> None:
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Personal Control http://localhost:{PORT}/ (loopback only, read-only, not production)")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
