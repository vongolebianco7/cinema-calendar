from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]

class BoxOffice1980BackfillTests(unittest.TestCase):
    def test_yearly_boxoffice_reaches_1980_and_preserves_metric(self):
        data = json.loads((ROOT / "data/boxoffice.json").read_text(encoding="utf-8"))
        years = data.get("by_year", {})
        self.assertIn("1980", years)
        self.assertIn("1999", years)
        self.assertIn("2000", years)
        self.assertIn("2019", years)
        self.assertGreaterEqual(len(years["1980"]), 10)
        self.assertGreaterEqual(len(years["2019"]), 10)
        self.assertTrue(all(x.get("region") in {"邦画", "洋画"} for x in years["1980"]))
        self.assertTrue(all(x.get("metric") == "配給収入" for x in years["1980"]))
        self.assertTrue(all(x.get("metric") == "興行収入" for x in years["2000"]))

    def test_ranking_ui_labels_pre_2000_measure_correctly(self):
        text = (ROOT / "rankings.html").read_text(encoding="utf-8")
        self.assertIn('m.metric||"興行収入"', text)
        self.assertIn('1999年以前は配給収入', text)
        self.assertIn('Number(boxEra)<2000', text)

if __name__ == "__main__":
    unittest.main()
