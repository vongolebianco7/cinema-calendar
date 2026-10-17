import datetime
import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

spec=importlib.util.spec_from_file_location("update_availability",Path("scripts/update_availability.py"))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ProviderOutageTests(unittest.TestCase):
 def test_all_failed_observations_fail_job_without_writing_snapshot(self):
  today=module.TODAY
  old={"generated_at":"old","movies":{}}
  with patch.dict(module.os.environ,{"TMDB_API_KEY":"test"}),patch.object(module,"load",side_effect=[{"movies":[{"id":123,"date":str(today),"event":"streaming"}]},{"catalog":[]},old]),patch.object(module.urllib.request,"urlopen",side_effect=TimeoutError("network unavailable")),patch.object(module,"PATH") as path:
   with self.assertRaisesRegex(RuntimeError,"All TMDB provider observations failed"):
    module.main()
   path.with_suffix.assert_not_called()

if __name__=="__main__":unittest.main()
