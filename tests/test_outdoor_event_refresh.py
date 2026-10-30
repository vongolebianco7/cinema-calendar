import datetime as dt,importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('outdoor_refresh',Path(__file__).resolve().parents[1]/'scripts/update-outdoor-events.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class OutdoorRefresh(unittest.TestCase):
 def test_reviewed_update_preserves_omitted_existing_fields_for_same_identity(self):
  with tempfile.TemporaryDirectory() as tmp:
   feed=Path(tmp)/'events.json';sources=Path(tmp)/'sources.json'
   old={'id':'retained','name':'旧題','date':'2026-11-01','tmdbId':99,'movie':'作品','time':'18:00','custom_provenance':{'source':'retained'}}
   update={'id':'retained','name':'確認済みの題','date':'2026-11-01','checked_at':'2026-10-24','source_url':'https://example.org/event'}
   feed.write_text(json.dumps({'events':[old]}));sources.write_text(json.dumps({'curated_events':[update]}))
   with patch.object(m,'OUTPUT',feed),patch.object(m,'SOURCES',sources):m.main()
   result=json.loads(feed.read_text())['events'][0]
   for key in ['tmdbId','movie','time','custom_provenance']:self.assertEqual(result.get(key),old[key])
   self.assertEqual(result['name'],update['name'])
 def test_invalid_curated_identity_preserves_the_last_good_feed_bytes(self):
  with tempfile.TemporaryDirectory() as tmp:
   feed=Path(tmp)/'events.json';sources=Path(tmp)/'sources.json';before='{"updated_at":"2026-09-01","events":[]}\n'
   feed.write_text(before);sources.write_text(json.dumps({'curated_events':[{'id':'bad','name':'','date':'2026-11-01','checked_at':'2026-10-24','source_url':'https://example.org'}]}))
   with patch.object(m,'OUTPUT',feed),patch.object(m,'SOURCES',sources):
    with self.assertRaises(ValueError):m.main()
   self.assertEqual(feed.read_text(),before)
 def test_provenance_pages_and_news_discovery_never_trigger_network_collection(self):
  with tempfile.TemporaryDirectory() as tmp:
   feed=Path(tmp)/'events.json';sources=Path(tmp)/'sources.json'
   feed.write_text(json.dumps({'updated_at':'2026-09-01','events':[]}));sources.write_text(json.dumps({'official_pages':['https://example.org/festival']}))
   with patch.object(m,'OUTPUT',feed),patch.object(m,'SOURCES',sources),patch('urllib.request.urlopen',side_effect=OSError('HTML collection forbidden')) as network:
    m.main()
   network.assert_not_called()
 def test_reviewed_multiday_featured_film_facts_are_preserved_without_html(self):
  start=dt.date.today()+dt.timedelta(days=3);end=start+dt.timedelta(days=1)
  row={'id':'reviewed-test','name':'野外映画祭','date':start.isoformat(),'start_date':start.isoformat(),'end_date':end.isoformat(),'movie':'上映作品','time':'18:00','tmdbId':99,'source_url':'https://example.org/festival','checked_at':'2026-10-24'}
  with tempfile.TemporaryDirectory() as tmp:
   feed=Path(tmp)/'events.json';sources=Path(tmp)/'sources.json'
   feed.write_text(json.dumps({'events':[]}));sources.write_text(json.dumps({'curated_events':[row]}))
   with patch.object(m,'OUTPUT',feed),patch.object(m,'SOURCES',sources):m.main()
   self.assertEqual(json.loads(feed.read_text())['events'],[row])
 def test_no_discoveries_do_not_advance_freshness(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'events.json';p.write_text(json.dumps({'updated_at':'2026-09-01','events':[]}))
   with patch.object(m,'OUTPUT',p),patch.object(m,'SOURCES',Path(tmp)/'no-sources.json'):m.main()
   self.assertEqual(json.loads(p.read_text())['updated_at'],'2026-09-01')
 def test_curated_multiday_events_reappear_without_network_discovery(self):
  row={'id':'curated-screening','event_id':'curated-screening','name':'品川国際映画祭2026','date':'2026-11-09','start_date':'2026-11-09','end_date':'2026-11-14','movie':'','area':'東京','place':'品川インターシティ','source_url':'https://shinagawa-cinema.com/access.html','timezone':'Asia/Tokyo','checked_at':'2026-10-24'}
  with tempfile.TemporaryDirectory() as tmp:
   feed=Path(tmp)/'events.json';sources=Path(tmp)/'sources.json'
   feed.write_text(json.dumps({'updated_at':'2026-09-01','events':[]}));sources.write_text(json.dumps({'curated_events':[row]}))
   with patch.object(m,'OUTPUT',feed),patch.object(m,'SOURCES',sources,create=True):
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
