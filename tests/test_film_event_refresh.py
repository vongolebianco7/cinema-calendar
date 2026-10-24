import datetime as dt
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('film_events',Path(__file__).resolve().parents[1]/'scripts/update-film-events.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class FilmEventRefresh(unittest.TestCase):
 def test_extracts_standard_official_json_ld(self):
  day=(dt.date.today()+dt.timedelta(days=10)).isoformat()
  event={'@type':'Event','name':'東京映画祭','startDate':day,'location':{'name':'映画館','address':{'addressLocality':'東京'}}}
  page='<script type="application/ld+json">'+json.dumps(event)+'</script>'
  with patch.object(module,'fetch',return_value=page):
   result=module.extract('https://example.org/festival','domestic')
  self.assertEqual(len(result),1)
  self.assertEqual(result[0]['date'],day)
 def test_failed_sources_do_not_advance_feed_freshness(self):
  with tempfile.TemporaryDirectory() as tmp:
   feed=Path(tmp)/'events.json';sources=Path(tmp)/'sources.json'
   feed.write_text(json.dumps({'generated_at':'2026-09-01','events':[]}));sources.write_text(json.dumps({'domestic_official_pages':['https://example.org']}))
   with patch.object(module,'FEED',feed),patch.object(module,'SOURCES',sources),patch.object(module,'extract',return_value=[]):module.main()
   self.assertEqual(json.loads(feed.read_text())['generated_at'],'2026-09-01')
 def test_curated_announcements_survive_failed_discovery_and_restore_missing_rows(self):
  row={'title':'第99回アカデミー賞','date':'2027-03-14','end_date':'2027-03-14','service':'映画賞','scope':'overseas','source_url':'https://www.oscars.org/99th-oscars-and-academy-key-dates','timezone':'America/Los_Angeles','checked_at':'2026-10-24'}
  with tempfile.TemporaryDirectory() as tmp:
   feed=Path(tmp)/'events.json';sources=Path(tmp)/'sources.json'
   feed.write_text(json.dumps({'generated_at':'2026-09-01','events':[]}));sources.write_text(json.dumps({'curated_events':[row]}))
   with patch.object(module,'FEED',feed),patch.object(module,'SOURCES',sources),patch.object(module,'extract',return_value=[]):
    module.main();module.main()
   result=json.loads(feed.read_text())
   self.assertEqual(result['events'],[row])
   self.assertEqual(result['generated_at'],'2026-10-24')
 def test_upcoming_awards_have_official_provenance_and_local_dates(self):
  data=json.loads((Path(__file__).resolve().parents[1]/'data/film-event-sources.json').read_text())
  rows={e['title']:e for e in data.get('curated_events',[])}
  for title,day in [('第99回アカデミー賞','2027-03-14'),('第84回ゴールデングローブ賞','2027-01-10')]:
   self.assertIn(title,rows)
   self.assertEqual(rows[title]['date'],day)
   self.assertEqual(rows[title]['timezone'],'America/Los_Angeles')
   self.assertEqual(rows[title]['collection_method'],'manual_official_announcement')
if __name__=='__main__':unittest.main()
