import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from resolve_awards_tmdb import primary_candidates,choose
class PrimaryIdentityTests(unittest.TestCase):
 def test_regional_release_after_award_uses_verified_primary_date(self):
  row={'year':1944,'title':'Casablanca'}
  movies=[{'id':289,'title':'カサブランカ','original_title':'Casablanca','year':'1946'}]
  calls=[]
  def details(mid):
   calls.append(mid);return {'id':289,'title':'カサブランカ','original_title':'Casablanca','year':'1942','release_date_source':'tmdb_primary','poster':'/verified.jpg'}
  candidates=primary_candidates('Casablanca',movies,details)
  self.assertEqual(choose(row,candidates)['id'],289);self.assertEqual(calls,[289])
 def test_no_title_guess_or_unverified_regional_year_promotion(self):
  calls=[]
  rows=[{'id':1,'title':'Different','year':'1942'},{'id':2,'title':'Casablanca','year':'1946'}]
  def details(mid):calls.append(mid);return {'id':mid,'title':'Casablanca','year':'1942','release_date_source':'tmdb_region_with_primary_fallback'}
  result=primary_candidates('Casablanca',rows,details)
  self.assertEqual(calls,[2]);self.assertIsNone(choose({'title':'Casablanca','year':1944},result))
 def test_two_primary_same_title_films_remain_ambiguous(self):
  rows=[{'id':1,'title':'Same'},{'id':2,'title':'Same'}]
  result=primary_candidates('Same',rows,lambda mid:{'id':mid,'title':'Same','year':2024,'release_date_source':'tmdb_primary'})
  self.assertIsNone(choose({'title':'Same','year':2025},result))
