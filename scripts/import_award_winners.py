"""Manual CC0 structured winner import. Only explicit award dates, never film dates.
Input: reviewed normalized Wikidata P166 winners with explicit P585/edition dates.
Existing verified conflicts and ambiguous ties remain unchanged for manual review.
"""
from collections import defaultdict
from copy import deepcopy

def merge_winners(data, winners):
    result=deepcopy(data)
    groups=defaultdict(list)
    for row in winners:
        if not row.get('title') or not isinstance(row.get('year'),int) or not 1895<=row['year']<=2026:continue
        if not str(row.get('tmdb_id','')).isdigit() or int(row['tmdb_id'])<=0:continue
        if not str(row.get('source','')).startswith('https://www.wikidata.org/wiki/Q'):continue
        groups[(row['organization'],row['category'],row['year'])].append(row)
    for key, rows in groups.items():
        existing=[r for r in result['awards'] if (r['organization'],r['category'],r['year'])==key]
        if not existing:
            seen=set()
            for row in rows:
                if row['tmdb_id'] in seen:continue
                result['awards'].append({**row,'film_title':row['title'],'match_status':'resolved','match_method':'wikidata_explicit_award_date_tmdb_id'})
                seen.add(row['tmdb_id'])
        elif len(existing)==1 and len({r['tmdb_id'] for r in rows})==1:
            old=existing[0];row=rows[0]
            if old.get('tmdb_id') and int(old['tmdb_id'])!=int(row['tmdb_id']):continue
            old.update(tmdb_id=row['tmdb_id'],display_title=row['title'],match_status='resolved',match_method='wikidata_explicit_award_date_tmdb_id',identity_source=row['source'])
    return result
