from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class BoxOfficeMeceRegionTests(unittest.TestCase):
    def test_boxoffice_uses_disjoint_domestic_foreign_groups(self):
        text = (ROOT / 'rankings.html').read_text(encoding='utf-8')
        self.assertIn('const regions=["すべて","国内","国外"]', text)
        self.assertIn('function productionBucket(movie,row)', text)
        self.assertIn('row.region==="邦画"', text)
        self.assertIn('row.region==="洋画"', text)
        self.assertIn('let list=boxRegion==="すべて"?raw:raw.filter(x=>bucket(x)===boxRegion)', text)
        self.assertNotIn('boxRegion==="海外"', text)

if __name__ == '__main__':
    unittest.main()
