from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]

class BoxOfficeMinimumPerYearTests(unittest.TestCase):
    def test_every_year_from_1980_has_at_least_10_titles(self):
        data = json.loads((ROOT / "data/boxoffice.json").read_text(encoding="utf-8"))
        by_year = data.get("by_year", {})
        missing = []
        sparse = []
        for year in range(1980, 2026):
            rows = by_year.get(str(year))
            if rows is None:
                missing.append(year)
                continue
            if len(rows) < 10:
                sparse.append((year, len(rows)))
        self.assertEqual(missing, [], f"missing years: {missing}")
        self.assertEqual(sparse, [], f"years with fewer than 10 titles: {sparse}")

if __name__ == "__main__":
    unittest.main()
