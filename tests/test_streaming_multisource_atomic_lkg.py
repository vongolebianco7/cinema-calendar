"""Atomic last-known-good regression across multiple curated monthly feeds (#244)."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "refresh_streaming_official.py"
spec = importlib.util.spec_from_file_location("refresh_streaming_official_atomic", SCRIPT)
refresh_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh_module)


class MultiSourceAtomicRefreshTest(unittest.TestCase):
    def test_later_invalid_month_never_publishes_earlier_valid_month(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            november = root / "november.json"
            december = root / "december.json"
            output = root / "published.json"
            prior = {"movies": [{"title": "Last known good", "service": "Netflix"}]}
            prior_bytes = (json.dumps(prior, ensure_ascii=False) + "\n").encode("utf-8")
            output.write_bytes(prior_bytes)

            first = {
                "period": "2026-11",
                "movies": [{
                    "title": "November movie", "date": "2026-11-10",
                    "event": "streaming", "service": "Netflix",
                    "source_url": "https://example.org/official/november",
                }],
            }
            second = {
                "period": "2026-12",
                "movies": [{
                    "title": "December movie", "date": "2026-12-10",
                    "event": "streaming", "service": "Netflix",
                    "source_url": "https://example.org/official/december",
                }],
            }
            november.write_text(json.dumps(first), encoding="utf-8")
            december.write_text(json.dumps({**second, "movies": [
                {**second["movies"][0], "source_url": "http://example.org/insecure"}
            ]}), encoding="utf-8")

            with self.assertRaises(ValueError):
                refresh_module.refresh([november, december], output)
            self.assertEqual(output.read_bytes(), prior_bytes,
                             "A later invalid feed must not partially replace the snapshot")

            december.write_text(json.dumps(second), encoding="utf-8")
            self.assertTrue(refresh_module.refresh([november, december], output))
            published = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(published["count"], 2)
            self.assertEqual(published["periods"], ["2026-11", "2026-12"])
            self.assertEqual({movie["title"] for movie in published["movies"]},
                             {"November movie", "December movie"})


if __name__ == "__main__":
    unittest.main()
