from pathlib import Path

p = Path('docs/AUTONOMOUS_EXECUTION.md')
assert p.exists(), 'autonomous execution contract is missing'
s = p.read_text(encoding='utf-8')

for state in ['BACKLOG', 'READY', 'IN_PROGRESS', 'VERIFY', 'APPLY', 'STATE_UPDATE']:
    assert state in s, f'missing state: {state}'

for stop in [
    'QUEUE_EMPTY',
    'USER_DECISION_REQUIRED',
    'AUTH_OR_PERMISSION_BLOCK',
    'SAFETY_OR_POLICY_BLOCK',
    'REPAIR_EXHAUSTED',
    'EXTERNAL_WAIT_NO_RESUME',
]:
    assert stop in s, f'missing STOP condition: {stop}'

for nonterminal in ['commit or PR', 'starting CI', 'CI success', 'asset inspection', 'posting progress']:
    assert nonterminal in s, f'missing nonterminal event: {nonterminal}'

assert 'maximum three repair attempts' in s
assert 'Never claim background execution' in s
print('autonomous execution contract: PASS')
