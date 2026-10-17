from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class BoxOfficeOverseasFallbackTests(unittest.TestCase):
    def test_official_foreign_rows_remain_accessible_in_foreign_bucket(self):
        text = (ROOT / 'rankings.html').read_text(encoding='utf-8')
        self.assertIn('if(row.region==="洋画")return "国外"', text)
        self.assertIn('const regions=["すべて","国内","国外"]', text)
        self.assertIn('raw.filter(x=>bucket(x)===boxRegion)', text)
        self.assertIn('boxoffice.all_time||[]', text)
        self.assertIn('boxoffice.by_year||{}', text)

if __name__ == '__main__':
    unittest.main()
