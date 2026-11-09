"""Regression: a curated update cannot replace a verified movie identity (#244/#593)."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "refresh_streaming_official.py"
spec = importlib.util.spec_from_file_location("refresh_streaming_official_lkg_identity", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PriorIdentityConflictTest(unittest.TestCase):
    def test_conflicting_tmdb_id_keeps_prior_snapshot_byte_for_byte(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "2026-11.json"
            output = root / "published.json"
            old = {"movies": [{
                "title": "Example Movie", "service": "Netflix", "date": "2026-11-05",
                "tmdb_id": 123, "poster_path": "/verified.jpg"
            }]}
            original = (json.dumps(old) + "\n").encode()
            output.write_bytes(original)
            incoming = {"period": "2026-11", "movies": [{
                "title": "Example Movie", "service": "Netflix", "date": "2026-11-05",
                "event": "streaming", "source_url": "https://example.org/official",
                "tmdb_id": 456, "poster_path": "/wrong.jpg"
            }]}
            source.write_text(json.dumps(incoming), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Conflicting prior TMDB identity"):
                module.refresh([source], output)
            self.assertEqual(output.read_bytes(), original)

    def test_matching_tmdb_id_preserves_verified_artwork(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "2026-11.json"
            output = root / "published.json"
            output.write_text(json.dumps({"movies": [{
                "title": "Example Movie", "service": "Netflix", "date": "2026-11-05",
                "tmdb_id": 123, "poster_path": "/verified.jpg"
            }]}), encoding="utf-8")
            source.write_text(json.dumps({"period": "2026-11", "movies": [{
                "title": "Example Movie", "service": "Netflix", "date": "2026-11-05",
                "event": "streaming", "source_url": "https://example.org/official",
                "tmdb_id": 123
            }]}), encoding="utf-8")
            self.assertTrue(module.refresh([source], output))
            self.assertEqual(json.loads(output.read_text())["movies"][0]["poster_path"],
                             "/verified.jpg")


if __name__ == "__main__":
    unittest.main()
