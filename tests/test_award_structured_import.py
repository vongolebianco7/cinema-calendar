import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from import_award_winners import merge_winners
class StructuredWinnersTests(unittest.TestCase):
 def test_exact_award_year_fills_identity_and_appends_missing_winners(self):
  d={'awards':[{'organization':'アカデミー賞','category':'作品賞','year':1944,'title':'Casablanca'}]}
  rows=[{'organization':'アカデミー賞','category':'作品賞','year':1944,'title':'カサブランカ','tmdb_id':289,'source':'https://www.wikidata.org/wiki/Q132689'}, {'organization':'アカデミー賞','category':'作品賞','year':1930,'title':'Movie','tmdb_id':8,'source':'https://www.wikidata.org/wiki/Q8'}]
  out=merge_winners(d,rows);self.assertEqual(out['awards'][0]['tmdb_id'],289);self.assertEqual(len(out['awards']),2)
  self.assertEqual(len(merge_winners(out,rows)['awards']),2)
 def test_conflicting_verified_identity_or_tied_winners_is_not_overwritten(self):
  d={'awards':[{'organization':'賞','category':'作品賞','year':2020,'title':'Existing','tmdb_id':1}]}
  r={'organization':'賞','category':'作品賞','year':2020,'title':'Other','tmdb_id':2,'source':'https://www.wikidata.org/wiki/Q2'}
  out=merge_winners(d,[r]);self.assertEqual(out['awards'][0]['tmdb_id'],1);self.assertEqual(len(out['awards']),1)
  d={'awards':[{'organization':'賞','category':'作品賞','year':2020,'title':'Unknown'}]}
  out=merge_winners(d,[r,{**r,'title':'Third','tmdb_id':3}]);self.assertNotIn('tmdb_id',out['awards'][0])
