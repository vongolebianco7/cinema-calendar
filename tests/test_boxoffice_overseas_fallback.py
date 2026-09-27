from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class BoxOfficeOverseasFallbackTests(unittest.TestCase):
    def test_official_foreign_rows_never_disappear(self):
        text = (ROOT / "rankings.html").read_text(encoding="utf-8")
        self.assertIn('const regions=["すべて","日本","海外","アメリカ","アジア","ヨーロッパ","その他"]', text)
        self.assertIn('row.region==="洋画"?"海外"', text)
        self.assertIn('boxRegion==="海外"?enriched.filter(x=>x.region==="洋画")', text)
        self.assertIn('海外=公式資料の洋画区分', text)

if __name__ == "__main__":
    unittest.main()
