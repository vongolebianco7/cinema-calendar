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
 def test_resolved_award_ids_reuse_local_artwork_without_title_guessing(self):
  rows=[dict(year=2025,organization='賞',category='作品賞',title='Translated',tmdb_id=7),dict(year=2025,organization='賞',category='作品賞',title='Same')]
  result=enrich({'awards':rows,'catalog':[]},[{'id':7,'title':'原題','year':2024,'poster':'/verified.jpg'},{'id':8,'title':'Same','year':2024,'poster':'/a.jpg'},{'id':9,'title':'Same','year':2024,'poster':'/b.jpg'}])
  self.assertEqual(result['awards'][0]['poster'],'https://image.tmdb.org/t/p/w342/verified.jpg')
  self.assertEqual(result['catalog'][0]['id'],7)
  self.assertNotIn('tmdb_id',result['awards'][1])
 def test_box_artwork_keeps_financial_rows_and_rejects_remakes(self):
  from enrich_award_catalog import enrich_boxoffice
  data={'all_time':[{'title':'Translation','tmdbId':7,'gross':99,'year':2024},{'title':'Same','gross':12,'year':2024}], 'by_year':{}}
  before=[r['gross']for r in data['all_time']]
  enrich_boxoffice(data,[{'id':7,'title':'Original','poster':'/seven.jpg','year':2023},{'id':8,'title':'Same','poster':'/old.jpg','year':2023},{'id':9,'title':'Same','year':2024}])
  self.assertEqual(data['all_time'][0]['poster'],'https://image.tmdb.org/t/p/w342/seven.jpg')
  self.assertNotIn('tmdbId',data['all_time'][1]);self.assertEqual([r['gross']for r in data['all_time']],before)

 def test_box_old_same_title_id_is_corrected_only_with_exact_year_evidence(self):
  from enrich_award_catalog import enrich_boxoffice
  data={'all_time':[], 'by_year':{'2025':[{'title':'Superman','tmdbId':1924,'gross':10.3}]}}
  enrich_boxoffice(data,[{'id':1924,'title':'Superman','year':1978,'poster':'/old.jpg'},{'id':1061474,'title':'Superman','year':2025,'poster':'/new.jpg'}])
  self.assertEqual(data['by_year']['2025'][0]['tmdbId'],1061474)
  self.assertEqual(data['by_year']['2025'][0]['gross'],10.3)
 def test_proxy_resolution_uses_film_name_before_explicit_recipient_separator(self):
  row={'year':2026,'title':'Film — Director','film_title':'Film — Director'}
  self.assertEqual(choose(row,[{'id':7,'title':'Film','year':2025,'poster':'/seven.jpg'}])['id'],7)
  self.assertIsNone(choose(row,[{'id':7,'title':'Film','year':2025},{'id':8,'title':'Film','year':2024}]))
