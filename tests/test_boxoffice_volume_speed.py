from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]

class BoxOfficeVolumeSpeedTests(unittest.TestCase):
    def test_all_time_has_full_official_ranking(self):
        data = json.loads((ROOT / "data/boxoffice.json").read_text(encoding="utf-8"))
        self.assertGreaterEqual(len(data.get("all_time", [])), 95)
        self.assertGreaterEqual(sum(1 for x in data.get("all_time", []) if x.get("region") == "邦画"), 30)
        self.assertGreaterEqual(sum(1 for x in data.get("all_time", []) if x.get("region") == "洋画"), 40)

    def test_boxoffice_renders_before_movie_metadata_hydration(self):
        text = (ROOT / "rankings.html").read_text(encoding="utf-8")
        start = text.index("async function renderBox()")
        end = text.index("function awardFilmName", start)
        block = text[start:end]
        self.assertNotIn("await Promise.all(raw.map", block)
        self.assertIn('const bucket=m=>productionBucket(null,m)', block)
        self.assertIn('data-box-film=', block)
        self.assertIn('hydrateBoxCardsLazy()', block)
        self.assertIn('IntersectionObserver', text)

if __name__ == "__main__":
    unittest.main()
