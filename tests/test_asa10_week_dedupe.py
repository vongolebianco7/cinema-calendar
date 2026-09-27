from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class MorningTenDedupeTests(unittest.TestCase):
    def test_theatrical_week_dedupes_morning_ten_titles(self):
        text = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("function dedupeMorningTenWeek", text)
        self.assertIn('m.special_screening!=="asa10"', text)
        self.assertIn("morningTenQuery(m.title)", text)
        self.assertIn("weekMovies=dedupeMorningTenWeek(weekMovies)", text)

if __name__ == "__main__":
    unittest.main()
