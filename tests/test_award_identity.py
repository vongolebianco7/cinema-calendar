import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from resolve_awards_tmdb import choose
from enrich_award_catalog import enrich
class AwardIdentityTests(unittest.TestCase):
 def test_remakes_and_ambiguous_ids_are_not_guessed(self):
  award={'year':2025,'title':'Same'}
  old={'id':1,'title':'Same','year':1950};new={'id':2,'title':'Same','year':2024}
  self.assertEqual(choose(award,[old,new])['id'],2)
  self.assertIsNone(choose(award,[new,{**new,'id':3}]))
  self.assertIsNone(choose(award,[old]))
 def test_person_suffix_and_cross_category_work_identity(self):
  rows=[dict(year=2025,organization='賞',category='主演男優賞',title='Film — Actor',source='https://example.org'),dict(year=2025,organization='賞',category='作品賞',title='Film',source='https://example.org')]
  result=enrich({'awards':rows},[{'id':1,'title':'Film','year':2024}])['awards']
  self.assertEqual(result[0]['film_title'],'Film');self.assertEqual(result[0]['recipient'],'Actor')
  self.assertEqual(result[0]['work_id'],result[1]['work_id']);self.assertEqual(result[0]['tmdb_id'],1)
