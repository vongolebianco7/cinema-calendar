"""Reject ambiguous prior snapshots without losing the last-known-good bytes."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "refresh_streaming_official.py"
spec = importlib.util.spec_from_file_location("refresh_streaming_official_duplicate_prior", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DuplicatePriorSnapshotTest(unittest.TestCase):
    def test_duplicate_prior_key_preserves_existing_snapshot(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "official.json"
            output = root / "published.json"
            entry = {
                "title": "Verified film", "service": "Netflix",
                "date": "2026-11-05", "event": "streaming",
                "source_url": "https://example.org/official",
                "tmdb_id": 1234,
            }
            source.write_text(json.dumps({"period": "2026-11", "movies": [entry]}), encoding="utf-8")
            previous = {"movies": [
                {**entry, "poster_path": "/correct.jpg"},
                {**entry, "poster_path": "/wrong.jpg"},
            ]}
            before = (json.dumps(previous) + "\n").encode("utf-8")
            output.write_bytes(before)
            with self.assertRaisesRegex(ValueError, "Duplicate prior release key"):
                module.refresh([source], output)
            self.assertEqual(output.read_bytes(), before)

    def test_unique_prior_key_retains_matching_poster(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "official.json"
            output = root / "published.json"
            entry = {
                "title": "Verified film", "service": "Netflix",
                "date": "2026-11-05", "event": "streaming",
                "source_url": "https://example.org/official",
                "tmdb_id": 1234,
            }
            source.write_text(json.dumps({"period": "2026-11", "movies": [entry]}), encoding="utf-8")
            output.write_text(json.dumps({"movies": [{**entry, "poster_path": "/correct.jpg"}]}), encoding="utf-8")
            self.assertTrue(module.refresh([source], output))
            self.assertEqual(json.loads(output.read_text())["movies"][0]["poster_path"], "/correct.jpg")


if __name__ == "__main__":
    unittest.main()
