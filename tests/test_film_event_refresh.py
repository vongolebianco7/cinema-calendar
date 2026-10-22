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
if __name__=='__main__':unittest.main()
