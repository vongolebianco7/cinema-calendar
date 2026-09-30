import unittest
from scripts.autonomy_state_machine import Task,Engine,run

class AutonomyStress(unittest.TestCase):
 def test_final_guard_blocks_active_work(self):
  e=Engine([Task('x')]); self.assertFalse(e.can_finalize())
  e.step(e.tasks[0]); self.assertFalse(e.can_finalize())

 def test_fault_restarts_at_unit(self):
  t=Task('fault'); e,_=run([t],fail_stage='INTEGRATION')
  self.assertEqual(t.state,'DONE')
  self.assertIn('INTEGRATION:FAIL',t.history)
  i=t.history.index('REPAIR->UNIT')
  self.assertIn('UNIT:PASS',t.history[i+1:])
  self.assertIn('INTEGRATION:PASS',t.history[i+1:])
  self.assertIn('SYSTEM:PASS',t.history[i+1:])

 def test_long_queue_no_loss_or_duplicate_apply(self):
  tasks=[Task(f't{i}') for i in range(20)]; e,steps=run(tasks,max_steps=140)
  self.assertTrue(e.can_finalize())
  self.assertEqual(steps,120)  # READY,RUNNING + 3 verification stages + APPLY per task
  for t in tasks:
   self.assertEqual(t.state,'DONE'); self.assertEqual(t.history.count('APPLY:DONE'),1)

 def test_persisted_state_can_resume(self):
  tasks=[Task('a'),Task('b')]; e=Engine(tasks)
  for _ in range(4): e.step(e.select())
  snapshot=[Task(t.name,t.state,t.stage,t.repairs,list(t.history)) for t in tasks]
  resumed,_=run(snapshot)
  self.assertTrue(resumed.can_finalize())
  self.assertTrue(all(t.state=='DONE' for t in snapshot))

if __name__=='__main__': unittest.main()
