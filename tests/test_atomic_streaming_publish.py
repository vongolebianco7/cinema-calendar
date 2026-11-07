"""Issue #244: streaming importer must retain the last valid snapshot."""
import json
import os
import runpy
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from atomic_json import write_json_atomic

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/import_streaming_announcements.py"


class AtomicStreamingPublishTests(unittest.TestCase):
    def prepare(self, directory, valid):
        root = Path(directory) / "data"
        root.mkdir()
        records = {
            "streaming_sources.json": {"services": [{"name": "Netflix", "official_url": "https://example.org/official"}]},
            "streaming.json": {"generated_at": "original", "movies": []},
            "streaming_announcements.json": {"movies": [{
                "title": "Verified Example", "service": "Netflix",
                "date": "2026-11-15" if valid else "not-a-date",
                "source_url": "https://example.org/official", "verified": True,
                "content_type": "movie"
            }]}
        }
        for name, data in records.items():
            (root / name).write_text(json.dumps(data), encoding="utf-8")
        return root

    def test_invalid_import_preserves_previous_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            root = self.prepare(directory, False)
            original = (root / "streaming.json").read_bytes()
            result = subprocess.run([sys.executable, str(SCRIPT)],
                                    cwd=directory, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual((root / "streaming.json").read_bytes(), original)
            self.assertEqual(list(root.glob(".streaming-*.tmp")), [])

    def test_atomic_replace_failure_preserves_previous_snapshot_and_cleans_temp(self):
        with tempfile.TemporaryDirectory() as directory:
            root = self.prepare(directory, True)
            original = (root / "streaming.json").read_bytes()
            previous = Path.cwd()
            try:
                os.chdir(directory)
                with patch("os.replace", side_effect=OSError("simulated publish failure")):
                    with self.assertRaisesRegex(OSError, "simulated publish failure"):
                        runpy.run_path(str(SCRIPT), run_name="__main__")
            finally:
                os.chdir(previous)
            self.assertEqual((root / "streaming.json").read_bytes(), original)
            self.assertEqual(list(root.glob(".streaming-*.tmp")), [])

    def test_valid_import_atomically_replaces_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            root = self.prepare(directory, True)
            subprocess.run([sys.executable, str(SCRIPT)],
                           cwd=directory, capture_output=True, check=True)
            result = json.loads((root / "streaming.json").read_text(encoding="utf-8"))
            self.assertEqual(len(result["movies"]), 1)
            self.assertEqual(result["movies"][0]["title"], "Verified Example")
            self.assertEqual(list(root.glob(".streaming-*.tmp")), [])

    def test_calendar_snapshots_replace_atomically_and_preserve_streaming_events(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "movies.json"
            target.write_text('{"movies":[{"event":"streaming","title":"last good"}]}', encoding="utf-8")
            previous = target.read_bytes()
            snapshot = {
                "generated_at": "2026-11-08T00:00:00Z",
                "movies": [{"event": "streaming", "title": "Verified Example", "date": "2026-11-15"}],
            }
            with patch("os.replace", side_effect=OSError("simulated calendar publish failure")):
                with self.assertRaisesRegex(OSError, "simulated calendar publish failure"):
                    write_json_atomic(target, snapshot)
            self.assertEqual(target.read_bytes(), previous)
            self.assertEqual(list(Path(directory).glob(".movies.json-*.tmp")), [])

            write_json_atomic(target, snapshot)
            published = json.loads(target.read_text(encoding="utf-8"))
            self.assertEqual(published["movies"][0]["event"], "streaming")
            self.assertEqual(published["movies"][0]["title"], "Verified Example")
            self.assertEqual(list(Path(directory).glob(".movies.json-*.tmp")), [])

    def test_calendar_refresh_routes_both_streaming_and_display_snapshots_through_atomic_writer(self):
        source = (SCRIPT.parent / "update_movies.py").read_text(encoding="utf-8")
        self.assertIn('write_json_atomic("data/streaming.json"', source)
        self.assertIn('write_json_atomic("data/movies.json"', source)
        self.assertIn("events=theatrical+stream_movies", source)


if __name__ == "__main__":
    unittest.main()
