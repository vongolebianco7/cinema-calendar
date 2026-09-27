from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]

class BoxOfficeMinimumDomesticForeignPerYearTests(unittest.TestCase):
    def test_every_year_has_at_least_ten_domestic_and_ten_foreign(self):
        data=json.loads((ROOT/'data/boxoffice.json').read_text(encoding='utf-8'))
        by_year=data.get('by_year',{})
        missing=[]
        for year in range(1980,2026):
            rows=by_year.get(str(year),[])
            domestic=sum(1 for r in rows if r.get('region')=='邦画')
            foreign=sum(1 for r in rows if r.get('region')=='洋画')
            if domestic<10 or foreign<10:
                missing.append((year,domestic,foreign))
        self.assertFalse(missing, f'Years below 10 per side: {missing}')

if __name__=='__main__':
    unittest.main()

# Coverage policy: every year keeps at least 10 邦画 and 10 洋画 entries.
