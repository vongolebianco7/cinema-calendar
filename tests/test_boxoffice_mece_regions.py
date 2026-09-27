from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class BoxOfficeMeceRegionTests(unittest.TestCase):
    def test_boxoffice_regions_are_single_level(self):
        text = (ROOT / "rankings.html").read_text(encoding="utf-8")
        self.assertIn('const regions=["すべて","日本","アメリカ","アジア","ヨーロッパ","その他"]', text)
        self.assertNotIn('const regions=["すべて","日本","海外"', text)
        self.assertNotIn('boxRegion==="海外"', text)
        self.assertIn('return row.region==="邦画"?"日本":"その他"}', text)

if __name__ == "__main__":
    unittest.main()
