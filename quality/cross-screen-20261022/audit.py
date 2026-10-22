"""Read-only, reproducible source/data audit. Does not claim browser coverage."""
import collections, importlib.util, json, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
def load(n): return json.loads((ROOT/'data'/f'{n}.json').read_text())
def summary(rows):
 dates=[str(r.get('end_date') or r.get('date') or r.get('start_date') or '')[:10] for r in rows]
 dates=[d for d in dates if len(d)==10]
 missing=[r.get('title') or r.get('movie') or r.get('name') for r in rows if not any(r.get(k) for k in ('poster','poster_url','poster_path'))]
 keys=collections.Counter((r.get('event'),r.get('date'),r.get('service'),r.get('title') or r.get('movie') or r.get('name')) for r in rows)
 return dict(rows=len(rows),missing_poster_metadata=len(missing),missing_poster_examples=missing[:12],last_date=max(dates,default=None),months=dict(sorted(collections.Counter(d[:7] for d in dates).items())),duplicate_keys=[dict(key=k,count=v) for k,v in keys.items() if v>1])
report={'source_sha':'2d47c6f27dd2a406a156e945154aff116e7a5642','as_of':'2026-10-22','scope':'source/data only; no live deployment or browser verification','feeds':{}}
for n,k in [('movies','movies'),('streaming','movies'),('tv','movies'),('events','events'),('outdoor-events','events'),('revival_screenings','screenings'),('special_screenings','screenings'),('theater_schedules','schedules')]:
 d=load(n);report['feeds'][n]=summary(d[k]);report['feeds'][n]['stamped_at']=d.get('generated_at') or d.get('updated_at')
report['streaming_services']={}
rows=load('streaming')['movies']
for svc in sorted(set(r.get('service','') for r in rows)|{'ABEMA','Lemino','WOWOW'}):report['streaming_services'][svc]=summary([r for r in rows if r.get('service')==svc])
report['outdoor_movie_groups']=dict(collections.Counter(r.get('name') for r in load('outdoor-events')['events'] if r.get('movie')))
report['festival_only']=summary([r for r in load('events')['events'] if r.get('service')!='国内イベント'])
# Execute real extractors with a valid official structured-data fixture; no network or writes.
fixture={'@context':'https://schema.org','@type':'Event','name':'野外映画祭 Film Festival','description':'野外映画上映','startDate':'2026-10-25','endDate':'2026-10-26','location':{'name':'東京会場','address':{'addressRegion':'東京都','addressLocality':'千代田区'}},'url':'https://example.org/event'}
page='<script type="application/ld+json">'+json.dumps(fixture,ensure_ascii=False)+'</script>'
report['extractor_fixture']={}
for name,args in [('update-film-events',('https://example.org/event','domestic')),('update-outdoor-events',('https://example.org/event',))]:
 spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/f'{name}.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.fetch=lambda *a:page
 found=m.extract(*args);report['extractor_fixture'][name]={'valid_json_ld_input':True,'extracted_records':len(found),'result':found}
# All recursive movie-card collections: duplicates across separate ranking categories are not defects.
def collections_of_movies(value,loc='root'):
 if isinstance(value,list):
  if value and all(isinstance(x,dict) for x in value) and any('title' in x and ('poster' in x or 'id' in x or 'tmdbId' in x) for x in value):yield loc,value
  else:
   for i,x in enumerate(value):yield from collections_of_movies(x,f'{loc}/{i}')
 elif isinstance(value,dict):
  for k,v in value.items():yield from collections_of_movies(v,f'{loc}/{k}')
report['other_card_collections']={}
for n in ['rankings','rankings_extra','rankings_year','boxoffice','awards']:
 d=load(n);cs=list(collections_of_movies(d));bad=[];total=missing=0
 for loc,rs in cs:
  total+=len(rs);ms=[r.get('title') for r in rs if not any(r.get(k) for k in ('poster','poster_url','poster_path'))];missing+=len(ms)
  ids=collections.Counter(str(r.get('tmdbId') or r.get('id')) for r in rs if r.get('tmdbId') or r.get('id'))
  if ms or any(v>1 for v in ids.values()):bad.append({'collection':loc,'missing_count':len(ms),'missing_examples':ms[:3],'duplicate_ids':{k:v for k,v in ids.items() if v>1}})
 report['other_card_collections'][n]={'collections':len(cs),'row_occurrences':total,'missing_poster_metadata_occurrences':missing,'affected_collections':bad[:30]}
out=pathlib.Path(__file__).with_name('results.json');out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
