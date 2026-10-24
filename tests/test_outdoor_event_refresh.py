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
   with patch.object(m,'OUTPUT',p),patch.object(m,'SOURCES',Path(tmp)/'no-sources.json'),patch.object(m,'discover',return_value=[]):m.main()
   self.assertEqual(json.loads(p.read_text())['updated_at'],'2026-09-01')
 def test_curated_multiday_events_reappear_without_network_discovery(self):
  row={'id':'curated-screening','event_id':'curated-screening','name':'品川国際映画祭2026','date':'2026-11-09','start_date':'2026-11-09','end_date':'2026-11-14','movie':'','area':'東京','place':'品川インターシティ','timezone':'Asia/Tokyo','checked_at':'2026-10-24'}
  with tempfile.TemporaryDirectory() as tmp:
   feed=Path(tmp)/'events.json';sources=Path(tmp)/'sources.json'
   feed.write_text(json.dumps({'updated_at':'2026-09-01','events':[]}));sources.write_text(json.dumps({'curated_events':[row]}))
   with patch.object(m,'OUTPUT',feed),patch.object(m,'SOURCES',sources,create=True),patch.object(m,'discover',return_value=[]):
    m.main();m.main()
   result=json.loads(feed.read_text())
   self.assertEqual(result['events'],[row])
   self.assertEqual(result['updated_at'],'2026-10-24')
 def test_curated_event_level_schedules_do_not_invent_film_identity(self):
  config=json.loads((Path(__file__).resolve().parents[1]/'data/outdoor-event-sources.json').read_text())
  rows=config['curated_events']
  self.assertEqual({e['id'] for e in rows},{'tiff-outdoor-2026','shinagawa-cinema-2026'})
  for row in rows:
   self.assertEqual(row['movie'],'')
   self.assertNotIn('tmdbId',row)
   self.assertNotIn('poster_url',row)
   self.assertEqual(row['timezone'],'Asia/Tokyo')
   self.assertGreaterEqual(row['end_date'],row['start_date'])
   self.assertTrue(row['source_url'].startswith('https://'))
if __name__=='__main__':unittest.main()
