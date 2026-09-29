#!/usr/bin/env python3
"""Fast, zero-LLM quality gate for Cinemap."""
from pathlib import Path
import re, subprocess, sys, tempfile
ROOT=Path(__file__).resolve().parents[1];failures=[]
def run(cmd):
 print('+',' '.join(cmd));r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
 if r.stdout: print(r.stdout,end='')
 if r.returncode:
  if r.stderr: print(r.stderr,end='',file=sys.stderr)
  failures.append(' '.join(cmd))
for html in sorted(ROOT.glob('*.html')):
 text=html.read_text(encoding='utf-8')
 for i,script in enumerate(re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',text,flags=re.S|re.I)):
  if not script.strip(): continue
  with tempfile.NamedTemporaryFile('w',suffix='.js',encoding='utf-8',delete=False) as f:f.write(script);tmp=f.name
  r=subprocess.run(['node','--check',tmp],text=True,capture_output=True);Path(tmp).unlink(missing_ok=True)
  if r.returncode: print(f'{html.name} inline script #{i}:\n{r.stderr}',file=sys.stderr);failures.append(f'{html.name} inline script #{i}')
commands=[['python','tests/test_my_cinemap_three_column_export.py'],['python','-m','unittest','discover','-s','tests','-p','test_brand_identity.py','-v'],['python','scripts/check_sources.py'],['python','scripts/check_discovery_ui.py'],['python','scripts/check_core_journey.py'],['python','scripts/check_critic_map.py'],['node','scripts/check_critic_evidence.js'],['node','--test','tests/ocean-ecosystem.test.cjs'],['node','--test','tests/ocean-renderer-contract.test.cjs'],['node','--test','tests/ocean-renderer-compliance.test.cjs'],['node','--test','tests/ocean-renderer-quality.test.cjs'],['node','--test','tests/ocean-schooling.test.cjs'],['node','--test','tests/ocean-creature-diversity.test.cjs'],['node','--test','tests/ocean-growth-moment.test.cjs'],['node','--test','tests/ocean-poc-selection.test.cjs'],['node','--test','tests/ocean-real-fish-binary.test.cjs'],['node','--test','tests/ocean-real-fish-motion.test.cjs'],['node','--test','tests/ocean-photo-mount-order.test.cjs'],['node','--test','tests/ocean-photo-integration.test.cjs'],['node','--test','tests/ocean-photo-ecosystem.test.cjs'],['node','--test','tests/ocean-rating-ecology.test.cjs'],['node','--test','tests/ocean-photo-natural-motion.test.cjs'],['node','--test','tests/ocean-history-ecology.test.cjs'],['node','--test','tests/ocean-photo-fallback.test.cjs'],['node','--test','tests/ocean-creature-unlocks.test.cjs'],['node','--test','tests/ocean-distinct-photo-assets.test.cjs'],['node','--test','tests/ocean-biodiversity-assets.test.cjs'],['python','tests/test_ocean_living_renderer.py']]
for cmd in commands:
 if (ROOT/cmd[1]).exists() if len(cmd)>1 and ('/' in cmd[1] or cmd[1].endswith('.js') or cmd[1].endswith('.cjs')) else True: run(cmd)
if failures:
 print('\nQUALITY GATE FAILED:',file=sys.stderr)
 for f in failures: print(' -',f,file=sys.stderr)
 sys.exit(1)
print('\nQUALITY GATE PASSED')