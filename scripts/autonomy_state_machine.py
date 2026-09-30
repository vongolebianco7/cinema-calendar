#!/usr/bin/env python3
from dataclasses import dataclass, field

ACTIVE={'READY','RUNNING','VERIFY','REPAIRABLE','APPLY'}
STOP={'QUEUE_EMPTY','USER_DECISION_REQUIRED','AUTH_OR_PERMISSION_BLOCK','SAFETY_OR_POLICY_BLOCK','REPAIR_EXHAUSTED','EXTERNAL_WAIT_NO_RESUME'}
NON_TERMINAL_WAIT={'CI_PENDING','CI_PASS','MERGED','MAIN_VERIFY','DEPLOY_PENDING'}
STAGES=('UNIT','INTEGRATION','SYSTEM')

@dataclass
class Task:
    name:str
    state:str='READY'
    stage:int=0
    repairs:int=0
    history:list[str]=field(default_factory=list)
    wait_reason:str|None=None
    stop_reason:str|None=None

class Engine:
    def __init__(self,tasks): self.tasks=tasks
    def can_finalize(self):
        for t in self.tasks:
            if t.state in ACTIVE: return False
            if t.state=='WAITING' and t.wait_reason in NON_TERMINAL_WAIT: return False
            if t.state=='BLOCKED' and t.stop_reason not in STOP: return False
        return True
    def next_action(self):
        for t in self.tasks:
            if t.state in ACTIVE: return 'EXECUTE'
            if t.state=='WAITING':
                return {'CI_PENDING':'CHECK_CI_OR_OTHER_READY','CI_PASS':'MERGE','MERGED':'MAIN_VERIFY','MAIN_VERIFY':'CHECK_MAIN','DEPLOY_PENDING':'CHECK_DEPLOY'}.get(t.wait_reason,'RESOLVE_WAIT')
            if t.state=='BLOCKED' and t.stop_reason not in STOP: return 'REPAIR'
        return 'FINAL' if self.can_finalize() else 'SELECT'
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
            t.history.append(stage+':PASS'); t.stage+=1
            if t.stage==len(STAGES): t.state='APPLY'
            else: t.history.append('PROGRESS:'+STAGES[t.stage])
            return
        if t.state=='APPLY': t.state='DONE'; t.history.append('APPLY:DONE')

def run(tasks,fail_stage=None,max_steps=100):
    e=Engine(tasks); steps=0
    while any(t.state in ACTIVE for t in tasks):
        assert steps<max_steps,'self-loop failed to terminate'
        t=e.select(); assert t is not None,'active queue lost'
        e.step(t,fail_stage); steps+=1
    return e,steps
