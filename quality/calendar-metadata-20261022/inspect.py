import concurrent.futures,json,os,pathlib,urllib.parse,urllib.request
key=os.environ['TMDB_API_KEY'];base='https://api.themoviedb.org/3'
queries=[('/movie/1061474',{}),('/movie/552524',{}),('/movie/1591961',{}),('/search/movie',{'query':'Stray Kids The dominATE Experience'}),('/search/movie',{'query':'Drive The Pretenders','year':'2026'}),('/search/movie',{'query':'Apocalypse Z','year':'2026'}),('/search/movie',{'query':'The Last Picture Show'})]
out={'metadata':[],'poster_health':[]}
for path,params in queries:
 try:
  url=base+path+'?'+urllib.parse.urlencode({**params,'api_key':key,'language':'ja-JP'})
  with urllib.request.urlopen(url,timeout=15) as r:d=json.load(r)
  rows=d.get('results',[d])
  out['metadata'].append({'request':path,'query':params,'results':[{k:m.get(k) for k in ['id','title','original_title','release_date','poster_path']} for m in rows[:8]]})
 except Exception as e:out['metadata'].append({'request':path,'query':params,'error':type(e).__name__})
urls=sorted({m['poster'] for m in json.load(open('data/streaming.json'))['movies'] if m.get('poster')})
def check(url):
 try:
  with urllib.request.urlopen(urllib.request.Request(url,method='HEAD'),timeout=8) as r:return {'url':url,'status':r.status}
 except Exception as e:return {'url':url,'status':getattr(e,'code',None),'error':type(e).__name__}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:out['poster_health']=list(ex.map(check,urls))
pathlib.Path('metadata-diagnostic.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print('Checked',len(queries),'TMDB requests and',len(urls),'existing poster URLs; no product writes')
