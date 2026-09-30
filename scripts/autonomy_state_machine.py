#!/usr/bin/env python3
from dataclasses import dataclass, field

ACTIVE={'READY','RUNNING','VERIFY','REPAIRABLE','APPLY'}
STOP={'QUEUE_EMPTY','USER_DECISION_REQUIRED','AUTH_OR_PERMISSION_BLOCK','SAFETY_OR_POLICY_BLOCK','REPAIR_EXHAUSTED','EXTERNAL_WAIT_NO_RESUME'}
STAGES=('UNIT','INTEGRATION','SYSTEM')

@dataclass
class Task:
    name:str
    state:str='READY'
    stage:int=0
    repairs:int=0
    history:list[str]=field(default_factory=list)

class Engine:
    def __init__(self,tasks): self.tasks=tasks
    def can_finalize(self):
        return not any(t.state in ACTIVE for t in self.tasks)
    def select(self):
        return next((t for t in self.tasks if t.state in ACTIVE),None)
    def step(self,t,fail_stage=None):
        if t.state=='READY': t.state='RUNNING'; t.history.append('PROGRESS:RUNNING'); return
        if t.state=='RUNNING': t.state='VERIFY'; t.stage=0; t.history.append('PROGRESS:UNIT'); return
        if t.state=='REPAIRABLE':
            t.repairs+=1; t.state='VERIFY'; t.stage=0; t.history.append('REPAIR->UNIT'); return
        if t.state=='VERIFY':
            stage=STAGES[t.stage]
            if fail_stage==stage and t.repairs==0:
                t.state='REPAIRABLE'; t.history.append(stage+':FAIL'); return
            t.history.append(stage+':PASS')
            t.stage+=1
            if t.stage==len(STAGES): t.state='APPLY'
            else: t.history.append('PROGRESS:'+STAGES[t.stage])
            return
        if t.state=='APPLY': t.state='DONE'; t.history.append('APPLY:DONE')

def run(tasks,fail_stage=None,max_steps=100):
    e=Engine(tasks); steps=0
    while not e.can_finalize():
        assert steps<max_steps,'self-loop failed to terminate'
        t=e.select(); assert t is not None,'active queue lost'
        e.step(t,fail_stage); steps+=1
    return e,steps
