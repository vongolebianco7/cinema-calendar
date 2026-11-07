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


if __name__ == "__main__":
    unittest.main()
