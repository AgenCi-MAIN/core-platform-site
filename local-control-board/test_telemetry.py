import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import server


class TelemetryTests(unittest.TestCase):
    def test_only_measurements_leave_server(self):
        raw = {
            "token": "SENTINEL_SECRET",
            "codex": {"observed_at": "2026-01-01T00:00:00+00:00", "used_percent": 51,
                      "remaining_percent": 99, "window_minutes": 10080, "resets_at": 1788927296,
                      "secret": "SENTINEL_SECRET"},
            "relay_client": {"observed_at": "2026-01-01T00:00:00+00:00", "state": "authenticated",
                             "detail": "SENTINEL_SECRET"},
            "inventory": {"observed_at": "2026-01-01T00:00:00+00:00", "file_count": 4,
                          "total_bytes": 864, "anomaly_count": 0, "inventory_sha256": "a" * 64,
                          "source": "SENTINEL_SECRET", "label": "SENTINEL_SECRET"},
        }
        result = server.sanitize_telemetry(raw)
        self.assertNotIn("SENTINEL_SECRET", json.dumps(result))
        self.assertEqual(result["codex"]["remaining_percent"], 49)
        self.assertEqual(result["inventory"]["file_count"], 4)

    def test_malformed_or_future_readings_are_unavailable(self):
        for raw in (None, [], "bad", {"relay_client": {"state": []}},
                    {"codex": {"observed_at": "2999-01-01T00:00:00+00:00"}},
                    {"codex": {"observed_at": "2026-01-01T00:00:00"}}):
            with self.subTest(raw=raw):
                self.assertEqual(server.sanitize_telemetry(raw), {})

    def test_missing_invalid_and_oversized_files_fail_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "telemetry.json"
            with patch.object(server, "TELEMETRY", path):
                self.assertEqual(server.read_telemetry(), {})
                path.write_text("{broken", encoding="utf-8")
                self.assertEqual(server.read_telemetry(), {})
                path.write_text(" " * 65537, encoding="utf-8")
                self.assertEqual(server.read_telemetry(), {})


if __name__ == "__main__":
    unittest.main()
