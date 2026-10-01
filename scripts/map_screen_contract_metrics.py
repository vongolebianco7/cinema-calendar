#!/usr/bin/env python3
"""Map existing deterministic screen contracts into completeness metrics."""
from __future__ import annotations
import argparse,json
from pathlib import Path

MAPPINGS={
  'CAL-04':('discovery_ui',1.0,'calendar month/week structure'),
  'CAL-07':('discovery_ui',1.0,'theatrical category filter contract'),
}

def map_screen_contract_metrics(statuses:dict[str,bool])->list[dict]:
  rows=[]
  for metric_id,(key,points,description) in MAPPINGS.items():
    if key not in statuses:continue
    ok=bool(statuses[key])
    rows.append({'id':metric_id,'status':'pass' if ok else 'fail','earned':points if ok else 0,'details':description,'source_test':['scripts/check_discovery_ui.py']})
  return rows

def main()->int:
  p=argparse.ArgumentParser();p.add_argument('status_json');p.add_argument('--output',default='artifacts/completeness/metrics/screen-contracts.json');a=p.parse_args()
  statuses=json.loads(Path(a.status_json).read_text(encoding='utf-8'));out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps({'metrics':map_screen_contract_metrics(statuses)},ensure_ascii=False,indent=2)+'\n',encoding='utf-8');return 0
if __name__=='__main__':raise SystemExit(main())
