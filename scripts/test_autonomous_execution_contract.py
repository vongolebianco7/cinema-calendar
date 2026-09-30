from pathlib import Path

p = Path('docs/AUTONOMOUS_EXECUTION.md')
assert p.exists(), 'autonomous execution contract is missing'
s = p.read_text(encoding='utf-8')

for state in ['BACKLOG', 'READY', 'RUNNING', 'WAITING', 'VERIFY', 'APPLY', 'DONE', 'BLOCKED']:
    assert state in s, f'missing state: {state}'

for stop in [
    'QUEUE_EMPTY', 'USER_DECISION_REQUIRED', 'AUTH_OR_PERMISSION_BLOCK',
    'SAFETY_OR_POLICY_BLOCK', 'REPAIR_EXHAUSTED', 'EXTERNAL_WAIT_NO_RESUME',
]:
    assert stop in s, f'missing STOP condition: {stop}'

for guard in ['REPAIRABLE', 'executable `NEXT_ACTION`', 'cancel finalization']:
    assert guard in s, f'missing final guard: {guard}'

for stage in ['`UNIT`', '`INTEGRATION`', '`SYSTEM`']:
    assert stage in s, f'missing quality stage: {stage}'

for requirement in [
    'visible progress event', 'progress event is not a final response',
    'restarts at UNIT', 'Merge is not DONE', 'MAIN_QUALITY',
    'Documentation alone never proves this acceptance test',
]:
    assert requirement in s, f'missing autonomy requirement: {requirement}'

print('autonomous execution contract unit test: PASS')
