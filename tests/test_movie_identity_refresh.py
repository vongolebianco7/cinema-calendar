"""Refresh must preserve canonical IDs and never infer a film from an event year."""
import ast,re,unittest
from pathlib import Path
source=ast.parse(Path('scripts/update_movies.py').read_text())
helpers=ast.Module(body=[n for n in source.body if isinstance(n,ast.FunctionDef) and n.name in ['search_movie_match','verified_movie_metadata']],type_ignores=[])
class RefreshIdentity(unittest.TestCase):
 def setUp(self):
  self.calls=[]
  self.rows=[]
  def get(path,args):self.calls.append((path,args));return {'results':self.rows}
  self.ns={'re':re,'TITLE_ALIASES':{},'norm_movie_title':lambda s:re.sub(r'\W','',str(s or '')).lower(),'get':get,'details':lambda mid:{'id':mid,'title':'Verified film'}}
  exec(compile(helpers,'helpers','exec'),self.ns)
 def test_event_date_and_local_id_do_not_trigger_title_search(self):
  self.assertIsNone(self.ns['verified_movie_metadata']({'id':550,'title':'Movie','date':'2026-10-20'}));self.assertEqual(self.calls,[])
 def test_explicit_id_wins_over_title(self):
  self.assertEqual(self.ns['verified_movie_metadata']({'tmdbId':587,'title':'Different alias'})['id'],587);self.assertEqual(self.calls,[])
 def test_verified_url_wins(self):
  self.assertEqual(self.ns['verified_movie_metadata']({'tmdb':'https://www.themoviedb.org/movie/587'})['id'],587)
 def test_remake_or_close_title_is_not_first_result_fallback(self):
  self.rows=[{'id':1,'title':'Movie','release_date':'1980-01-01'},{'id':2,'title':'Movie 2','release_date':'2020-01-01'}]
  self.assertIsNone(self.ns['search_movie_match']('Movie',release_year=2020))
 def test_exact_title_year_must_be_unique(self):
  self.rows=[{'id':1,'title':'Movie','release_date':'2020-01-01'}]
  self.assertEqual(self.ns['search_movie_match']('Movie',release_year=2020)['id'],1)
  self.rows.append({'id':2,'title':'Movie','release_date':'2020-02-01'})
  self.assertIsNone(self.ns['search_movie_match']('Movie',release_year=2020))
 def test_mismatched_detail_id_is_rejected(self):
  self.ns['details']=lambda mid:{'id':999}
  self.assertIsNone(self.ns['verified_movie_metadata']({'tmdbId':587}))
if __name__=='__main__':unittest.main()
