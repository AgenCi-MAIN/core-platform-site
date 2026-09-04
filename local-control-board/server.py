#!/usr/bin/env python3
"""Private, read-only personal control dashboard. Loopback only."""

from __future__ import annotations

import json
import socket
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
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


def status_payload() -> dict[str, object]:
    return {
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
