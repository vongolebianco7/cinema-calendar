from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class BoxOfficeCountryBucketTests(unittest.TestCase):
    def test_production_bucket_reads_country_shapes_without_guessing_continents(self):
        text = (ROOT / 'rankings.html').read_text(encoding='utf-8')
        self.assertIn('function productionBucket(movie,row)', text)
        self.assertIn('origin_country', text)
        self.assertIn('production_countries', text)
        self.assertIn('row.country', text)
        self.assertIn('row.region==="邦画"', text)
        self.assertIn('row.region==="洋画"', text)
        self.assertIn('return isJapan?"国内":"国外"', text)
        self.assertIn('const regions=["すべて","国内","国外"]', text)
        self.assertIn('raw.filter(x=>bucket(x)===boxRegion)', text)

if __name__ == '__main__':
    unittest.main()
