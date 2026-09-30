import unittest
from scripts.autonomy_state_machine import Task, Engine

class NoIntermediateReportPolicy(unittest.TestCase):
 def test_ci_wait_is_not_finalizable(self):
  t=Task('ci', state='WAITING')
  t.wait_reason='CI_PENDING'
  e=Engine([t])
  self.assertFalse(e.can_finalize())

 def test_pass_requires_merge_next_action(self):
  t=Task('pr', state='WAITING')
  t.wait_reason='CI_PASS'
  e=Engine([t])
  self.assertEqual(e.next_action(), 'MERGE')

 def test_merge_requires_main_verify(self):
  t=Task('merged', state='WAITING')
  t.wait_reason='MERGED'
  e=Engine([t])
  self.assertEqual(e.next_action(), 'MAIN_VERIFY')

 def test_only_whitelisted_stop_can_finalize(self):
  t=Task('blocked', state='BLOCKED')
  t.stop_reason='AUTH_OR_PERMISSION_BLOCK'
  self.assertTrue(Engine([t]).can_finalize())
  t.stop_reason='CI_PENDING'
  self.assertFalse(Engine([t]).can_finalize())

if __name__=='__main__': unittest.main()
