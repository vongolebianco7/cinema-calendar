"""Regression checks for a confirmed Netflix premiere missing from CINELVA (#244).

This test validates the checked-in catalog, not live Netflix availability.
It does not infer premiere dates from TMDB watch/providers.
"""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "streaming.json"


class NetflixPremiereRegressionTest(unittest.TestCase):
    def test_sirat_2026_11_05_has_canonical_identity_and_poster(self):
        data = json.loads(CATALOG.read_text(encoding="utf-8"))
        matches = [
            row for row in data["movies"]
            if row.get("service") == "Netflix"
            and row.get("date") == "2026-11-05"
            and row.get("tmdb_id") == 1151272
        ]
        self.assertEqual(len(matches), 1, "Sirât premiere must appear exactly once")
        row = matches[0]
        self.assertEqual(row.get("event"), "streaming")
        self.assertEqual(row.get("tmdb"), "https://www.themoviedb.org/movie/1151272")
        self.assertEqual(row.get("id"), 1151272)
        self.assertTrue(row.get("poster", "").startswith("https://image.tmdb.org/t/p/"))
        self.assertEqual(row.get("source_url"), "https://www.netflix.com/jp/title/82169786")
        self.assertTrue(row.get("source_published_at"))
        self.assertTrue(row.get("verified_at"))


if __name__ == "__main__":
    unittest.main()
