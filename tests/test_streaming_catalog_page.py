import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class CurrentStreamingCatalogContractTests(unittest.TestCase):
    def test_page_uses_observed_availability_separately_from_premiere_dates(self):
        page = (ROOT / "streaming.html").read_text(encoding="utf-8")
        self.assertIn('fetch("data/availability.json"', page)
        self.assertIn("entry.checked_at", page)
        self.assertIn("配信開始日を保証するものではありません", page)
        self.assertIn("TMDB watch providers（JustWatch）", page)
        self.assertIn("7*86400000", page)

    def test_page_exposes_services_and_distinct_access_types(self):
        page = (ROOT / "streaming.html").read_text(encoding="utf-8")
        for service in ("Netflix", "Prime Video", "U-NEXT", "Disney+", "ABEMA", "WOWOW", "Hulu", "FOD", "Apple TV+", "Lemino", "DMM TV", "TELASA"):
            self.assertIn('"' + service + '"', page)
        for kind in ("flatrate", "rent", "buy"):
            self.assertIn('data-kind="' + kind + '"', page)
        self.assertIn("ポスター未確認", page)
        self.assertIn("CinelvaMovieIdentity", page)

    def test_homepage_links_to_catalog(self):
        home = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('href="streaming.html"', home)
        self.assertIn("配信中の映画", home)

    def test_current_snapshot_has_substantial_japan_availability_observations(self):
        data = json.loads((ROOT / "data/availability.json").read_text(encoding="utf-8"))
        self.assertEqual(data["country"], "JP")
        self.assertIn("配信開始日ではありません", data["note"])
        self.assertGreaterEqual(len(data["movies"]), 1500)


if __name__ == "__main__":
    unittest.main()
