"""Deterministic schema and provenance checks for release insights and on-demand data."""
import datetime
import json
from pathlib import Path
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[1]
def check():
    awards=json.loads((ROOT/'data/awards.json').read_text())
    for row in awards['awards']:
        assert isinstance(row['year'],int) and 1895<=row['year']<=datetime.date.today().year+1
        assert all(isinstance(row[k],str) and row[k] for k in ['organization','category','title','source','work_id'])
        assert urlparse(row['source']).scheme=='https'
        if row.get('tmdb_id'):assert isinstance(row['tmdb_id'],int) and row['tmdb_id']>0
    offers=json.loads((ROOT/'data/official_on_demand.json').read_text())
    known={s['name'] for s in json.loads((ROOT/'data/streaming_sources.json').read_text())['services']}
    seen=set()
    for row in offers['offers']:
        assert row['service'] in known and isinstance(row['id'],int) and row['id']>0
        assert row['source_type']=='official_on_demand_listing' and row['certainty']=='listing'
        assert 'date' not in row and row.get('starts_at') is None, 'Never invent a premiere date from a listing'
        assert urlparse(row['source_url']).hostname=='wod.wowow.co.jp'
        datetime.datetime.fromisoformat(row['checked_at'].replace('Z','+00:00'))
        datetime.datetime.fromisoformat(row['ends_at'])
        key=(row['service'],row['id']);assert key not in seen;seen.add(key)
    print(f"Release schemas passed: {len(awards['awards'])} award records, {len(seen)} official on-demand listings")
if __name__=='__main__':check()
