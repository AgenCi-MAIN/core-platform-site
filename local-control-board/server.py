#!/usr/bin/env python3
"""Local Vera control board. Bind loopback only. No secrets. Not production."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
DATA = ROOT / "data"
ASSIGNMENTS = DATA / "assignments.json"
HOST = "127.0.0.1"
PORT = 5000

THIS_AGENT = {
    "id": "bc-ba101046-1271-4c57-93d4-ca62046a34f6",
    "name": "Core mcp relay status discovery",
    "url": "https://cursor.com/agents/bc-ba101046-1271-4c57-93d4-ca62046a34f6",
    "role": "This Cursor cloud agent",
}

CLAUDE_SESSION = {
    "id": "session_01MwGuvK4QLhgygwUe5MLs8P",
    "url": "https://claude.ai/code/session_01MwGuvK4QLhgygwUe5MLs8P",
    "note": "Linked by owner 2026-09-04. Transcript not readable from this cloud run (auth wall). Not treated as production authority.",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def load_assignments() -> list[dict]:
    if not ASSIGNMENTS.exists():
        return []
    raw = json.loads(ASSIGNMENTS.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        return []
    return raw


def save_assignments(items: list[dict]) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    ASSIGNMENTS.write_text(json.dumps(items, indent=2) + "\n", encoding="utf-8")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        sys_stderr = __import__("sys").stderr
        sys_stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _json(self, code: int, payload: object) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/status":
            self._json(
                200,
                {
                    "label": "LOCALLY_GENERATED_UNTRUSTED",
                    "production": False,
                    "this_agent": THIS_AGENT,
                    "claude_session": CLAUDE_SESSION,
                    "relay": {
                        "namespace": "core-a2a-relay",
                        "state": "ready",
                        "tool_count": 6,
                    },
                    "worker_d": {
                        "status": "READY_FOR_BOUNDED_TEST",
                        "transport": "stdio",
                        "app_control": False,
                    },
                    "observed_at": "2026-09-04T19:07:00Z",
                },
            )
            return
        if path == "/api/assignments":
            self._json(200, {"this_agent": THIS_AGENT, "items": load_assignments()})
            return
        if path == "/":
            self.path = "/index.html"
        super().do_GET()

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path != "/api/assignments":
            self._json(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length") or "0")
        if length > 20_000:
            self._json(413, {"error": "payload too large"})
            return
        try:
            data = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._json(400, {"error": "invalid json"})
            return
        title = str(data.get("title") or "").strip()
        detail = str(data.get("detail") or "").strip()
        if not title or len(title) > 200:
            self._json(400, {"error": "title required (max 200)"})
            return
        if len(detail) > 4000:
            self._json(400, {"error": "detail too long"})
            return
        item = {
            "id": str(uuid.uuid4()),
            "title": title,
            "detail": detail,
            "assignee_id": THIS_AGENT["id"],
            "assignee_name": THIS_AGENT["name"],
            "status": "assigned",
            "created_at": utc_now(),
        }
        items = load_assignments()
        items.insert(0, item)
        save_assignments(items)
        self._json(201, item)

    def do_PATCH(self) -> None:
        path = urlparse(self.path).path
        prefix = "/api/assignments/"
        if not path.startswith(prefix):
            self._json(404, {"error": "not found"})
            return
        item_id = path[len(prefix) :]
        length = int(self.headers.get("Content-Length") or "0")
        try:
            data = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._json(400, {"error": "invalid json"})
            return
        status = str(data.get("status") or "").strip()
        allowed = {"assigned", "working", "done", "held"}
        if status not in allowed:
            self._json(400, {"error": "invalid status"})
            return
        items = load_assignments()
        found = None
        for item in items:
            if item.get("id") == item_id:
                item["status"] = status
                item["updated_at"] = utc_now()
                found = item
                break
        if not found:
            self._json(404, {"error": "not found"})
            return
        save_assignments(items)
        self._json(200, found)


def main() -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    if not ASSIGNMENTS.exists():
        save_assignments([])
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Vera local board http://{HOST}:{PORT}/ (loopback only, not production)")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
