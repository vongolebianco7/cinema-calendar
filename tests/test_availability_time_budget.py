"""A slow provider must not consume the workflow or discard partial progress."""
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

class AvailabilityTimeBudgetTests(unittest.TestCase):
 def run_batch(self, success_first):
  spec=importlib.util.spec_from_file_location('availability_timed',Path('scripts/update_availability.py'))
  module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);target=root/'availability.json'
   old={'generated_at':'2026-10-01','movies':{}}
   original=json.dumps(old);target.write_text(original)
   (root/'movies.json').write_text(json.dumps({'movies':[{'id':i,'date':str(module.TODAY),'event':'streaming'} for i in range(1,101)]}))
   (root/'awards.json').write_text('{}')
   clock=[0.0];attempts=[]
   def request(url,timeout):
    attempts.append((clock[0],timeout))
    if success_first and len(attempts)==1:
     clock[0]+=12
     return io.BytesIO(b'{"results":{"JP":{}}}')
    clock[0]+=timeout
    raise TimeoutError('provider stalled')
   with patch.object(module,'ROOT',root),patch.object(module,'PATH',target),patch.object(module,'MAX_BATCH_SECONDS',50,create=True),patch.dict(module.os.environ,{'TMDB_API_KEY':'test-key'}),patch.object(module.time,'monotonic',side_effect=lambda:clock[0]),patch.object(module.time,'sleep',side_effect=lambda seconds:clock.__setitem__(0,clock[0]+seconds)),patch.object(module.urllib.request,'urlopen',side_effect=request),patch('builtins.print'):
    if success_first:module.main()
    else:
     with self.assertRaises(RuntimeError):module.main()
   return clock[0],attempts,json.loads(target.read_text()),target.read_text()==original

 def test_partial_success_is_saved_within_bounded_time_despite_slow_provider(self):
  elapsed,attempts,result,_=self.run_batch(True)
  self.assertLessEqual(elapsed,50)
  self.assertLessEqual(len(attempts),3)
  self.assertEqual(set(result['movies']),{'1'})
  self.assertNotEqual(result['generated_at'],'2026-10-01')
  for started,timeout in attempts:self.assertLessEqual(timeout,50-started)

 def test_all_failures_preserve_original_snapshot_even_at_time_deadline(self):
  elapsed,attempts,result,unchanged=self.run_batch(False)
  self.assertLessEqual(elapsed,50)
  self.assertTrue(unchanged)
  self.assertEqual(result['generated_at'],'2026-10-01')
  self.assertLessEqual(len(attempts),2)
