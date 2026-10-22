import datetime as dt,importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('outdoor_refresh',Path(__file__).resolve().parents[1]/'scripts/update-outdoor-events.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class OutdoorRefresh(unittest.TestCase):
 def test_preserves_structured_event_end_date_and_featured_film(self):
  start=dt.date.today()+dt.timedelta(days=3);end=start+dt.timedelta(days=1)
  event={'@type':'ScreeningEvent','name':'野外映画祭','startDate':start.isoformat()+'T18:00:00+09:00','endDate':end.isoformat()+'T06:00:00+09:00','location':{'name':'公園','address':{'addressRegion':'東京都'}},'workFeatured':{'@type':'Movie','name':'上映作品','sameAs':'https://www.themoviedb.org/movie/99'}}
  with patch.object(m,'fetch',return_value='<script type="application/ld+json">'+json.dumps(event)+'</script>'):rows=m.extract('https://example.org/festival')
  self.assertEqual(rows[0].get('end_date'),end.isoformat());self.assertEqual(rows[0].get('movie'),'上映作品');self.assertEqual(rows[0].get('time'),'18:00');self.assertEqual(rows[0].get('tmdbId'),99)
 def test_no_discoveries_do_not_advance_freshness(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'events.json';p.write_text(json.dumps({'updated_at':'2026-09-01','events':[]}))
   with patch.object(m,'OUTPUT',p),patch.object(m,'discover',return_value=[]):m.main()
   self.assertEqual(json.loads(p.read_text())['updated_at'],'2026-09-01')
if __name__=='__main__':unittest.main()
