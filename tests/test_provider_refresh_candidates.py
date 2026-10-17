"""Regression tests for retained watch-provider snapshots older than calendar window."""
import datetime
import importlib.util
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location("update_availability", Path("scripts/update_availability.py"))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ProviderRefreshTests(unittest.TestCase):
 def test_old_cached_title_remains_eligible_but_unknown_old_title_does_not(self):
  today=datetime.date(2026,10,17)
  items=[
   {"id":101,"title":"Old cached","date":"2015-01-01","event":"streaming"},
   {"id":102,"title":"Old uncached","date":"2015-01-01","event":"streaming"},
   {"id":103,"title":"New title","date":"2026-10-18","event":"streaming"}
  ]
  cache={"101":{"checked_at":"2026-09-01T00:00:00+00:00"}}
  candidates=module.build_candidates(items,cache,today)
  self.assertEqual({mid for mid,_ in candidates},{101,103})
  due=module.select_due_observations(candidates,cache,datetime.datetime(2026,10,17,tzinfo=datetime.timezone.utc),limit=2)
  self.assertEqual({mid for mid,_ in due},{101,103})

 def test_cached_title_disappearing_from_calendar_still_refreshes(self):
  today=datetime.date(2026,10,17)
  cache={"765432":{"title":"Archived observed film","checked_at":"2026-08-01T00:00:00+00:00"},
         "0":{"checked_at":"2026-08-01T00:00:00+00:00"},
         "not-an-id":{"checked_at":"2026-08-01T00:00:00+00:00"}}
  candidates=module.build_candidates([],cache,today)
  self.assertEqual([mid for mid,_ in candidates],[765432])
  due=module.select_due_observations(candidates,cache,datetime.datetime(2026,10,17,tzinfo=datetime.timezone.utc),limit=60)
  self.assertEqual([mid for mid,_ in due],[765432])

 def test_recent_cached_title_is_not_refetched_before_seven_days(self):
  today=datetime.date(2026,10,17)
  items=[{"id":200,"date":"2010-01-01","event":"streaming"}]
  cache={"200":{"checked_at":"2026-10-16T00:00:00+00:00"}}
  candidates=module.build_candidates(items,cache,today)
  self.assertEqual(len(candidates),1)
  self.assertEqual(module.select_due_observations(candidates,cache,datetime.datetime(2026,10,17,tzinfo=datetime.timezone.utc),limit=60),[])

 def test_deduplicates_releases_and_rejects_invalid_ids(self):
  today=datetime.date(2026,10,17)
  rows=[{"id":300,"date":"2026-10-10","event":"other"},
        {"id":300,"date":"2026-10-16","event":"streaming"},
        {"id":"bad","date":"2026-10-17"},
        {"id":0,"date":"2026-10-17"}]
  result=module.build_candidates(rows,{},today)
  self.assertEqual(len(result),1)
  self.assertEqual(result[0][1][0],1)
  self.assertEqual(result[0][1][1]["event"],"streaming")

if __name__=="__main__":
 unittest.main()
