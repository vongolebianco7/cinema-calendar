from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class BoxOfficeCountryBucketTests(unittest.TestCase):
    def test_boxoffice_country_bucket_reads_all_country_shapes(self):
        text = (ROOT / "rankings.html").read_text(encoding="utf-8")
        self.assertIn("origin_country", text)
        self.assertIn("production_countries", text)
        self.assertIn("row.country", text)
        self.assertIn('return "アメリカ"', text)
        self.assertIn('return "アジア"', text)
        self.assertIn('return "ヨーロッパ"', text)
        self.assertIn('const regions=["すべて","日本","海外","アメリカ","アジア","ヨーロッパ","その他"]', text)
        self.assertIn('row.region==="洋画"?"海外"', text)

if __name__ == "__main__":
    unittest.main()
