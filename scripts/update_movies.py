import os,json,urllib.request,urllib.parse,datetime,re,html
KEY=os.environ["TMDB_API_KEY"]; BASE="https://api.themoviedb.org/3"
def get(path,params={}):
 p=dict(params);p["api_key"]=KEY;p.setdefault("language","ja-JP")
 with urllib.request.urlopen(BASE+path+"?"+urllib.parse.urlencode(p),timeout=30) as r:return json.load(r)
def details(mid):
 return get(f"/movie/{mid}",{"append_to_response":"release_dates,credits"})
today=datetime.date.today(); start=today-datetime.timedelta(days=45); end=today+datetime.timedelta(days=90)
items={}
# Japan theatrical releases only. Streaming premieres are stored separately in data/streaming.json
# and must come from dated official service announcements, never inferred from current availability.
for page in range(1,16):
 data=get("/discover/movie",{"region":"JP","release_date.gte":str(start),"release_date.lte":str(end),"with_release_type":"2|3","sort_by":"primary_release_date.asc","include_adult":"false","page":page})
 for m in data.get("results",[]):
  if not m.get("poster_path"): continue
  try:d=details(m["id"])
  except Exception:continue
  jp=d.get("release_dates",{}).get("results",[])
  jp=next((x for x in jp if x.get("iso_3166_1")=="JP"),None)
  dates=[]
  if jp:
   for x in jp.get("release_dates",[]):
    if x.get("type") in (2,3) and x.get("release_date"): dates.append(x["release_date"][:10])
  if not dates: continue
  valid=[x for x in dates if str(start) <= x <= str(end)]
  if not valid: continue
  date=min(valid)
  items[m["id"]]={"id":m["id"],"title":d.get("title") or m.get("title"),"original_title":d.get("original_title"),"date":date,"event":"theatrical","service":"劇場公開","poster":"https://image.tmdb.org/t/p/w500"+m["poster_path"],"score":d.get("vote_average",0),"votes":d.get("vote_count",0),"overview":d.get("overview",""),"tmdb":"https://www.themoviedb.org/movie/"+str(m["id"]),"director":next((x.get("name") for x in d.get("credits",{}).get("crew",[]) if x.get("job")=="Director"),None),"cast":[x.get("name") for x in d.get("credits",{}).get("cast",[])[:4] if x.get("name")],"countries":[x.get("name") for x in d.get("production_countries",[]) if x.get("name")]
theatrical=sorted(items.values(),key=lambda x:x["date"])
os.makedirs("data",exist_ok=True)
with open("data/theatrical.json","w",encoding="utf-8") as fh: json.dump({"generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"movies":theatrical},fh,ensure_ascii=False,indent=2)
# Auto-import dated Netflix titles from Netflix's official Japan "New to Watch" page.
# Only accept titles that TMDB resolves as a movie; series/TV results are excluded.
def fetch_text(url):
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
 with urllib.request.urlopen(req,timeout=30) as r:return r.read().decode("utf-8","ignore")
def netflix_official_movies():
 url="https://about.netflix.com/ja/new-to-watch"
 try: raw=fetch_text(url)
 except Exception:return []
 txt=html.unescape(re.sub(r"<[^>]+>","\n",raw))
 txt=re.sub(r"[ \t]+"," ",txt)
 found=[]
 # Netflix page exposes each title next to YYYY/MM/DD. Capture a short preceding text line.
 lines=[x.strip() for x in txt.splitlines() if x.strip()]
 for i,line in enumerate(lines):
  m=re.search(r"(202[0-9]/[01][0-9]/[0-3][0-9])",line)
  if not m: continue
  date=m.group(1).replace("/","-")
  prefix=line[:m.start()].strip()
  title=re.sub(r"Netflix.*$","",prefix).strip(" -–—→")
  if not title and i: title=lines[i-1].strip()
  if not title or len(title)>120: continue
  try:
   q=get("/search/movie",{"query":title,"region":"JP"}).get("results",[])
  except Exception: continue
  if not q: continue
  x=q[0]
  # Conservative title matching prevents a TV title from being mapped to an unrelated film.
  names={str(x.get("title","")).lower(),str(x.get("original_title","")).lower()}
  if title.lower() not in names and not any(title.lower() in n or n in title.lower() for n in names if len(n)>=4): continue
  found.append({"title":x.get("title") or title,"original_title":x.get("original_title"),"date":date,"event":"streaming","service":"Netflix","poster":("https://image.tmdb.org/t/p/w500"+x["poster_path"]) if x.get("poster_path") else None,"score":x.get("vote_average",0),"votes":x.get("vote_count",0),"overview":x.get("overview",""),"tmdb":"https://www.themoviedb.org/movie/"+str(x["id"]),"source":"Netflix公式 新作情報","source_url":url})
 return found
# Preserve curated streaming premieres; these are populated only from official dated announcements.
try:
 with open("data/streaming.json",encoding="utf-8") as fh: streaming=json.load(fh)
except FileNotFoundError:
 streaming={"generated_at":None,"movies":[]}
stream_movies=[m for m in streaming.get("movies",[]) if m.get("event")=="streaming" and m.get("date") and m.get("service")]
# Merge automatically discovered official Netflix movie premieres without overwriting curated entries.
seen={(m.get("service"),m.get("title"),m.get("date")) for m in stream_movies}
for m in netflix_official_movies():
 k=(m.get("service"),m.get("title"),m.get("date"))
 if k not in seen: stream_movies.append(m); seen.add(k)
# Enrich verified streaming premieres with TMDB metadata/posters by title.
# The premiere date and service always remain sourced from official announcements.
for m in stream_movies:
 try:
  q=get("/search/movie",{"query":m["title"],"region":"JP"}).get("results",[])
  if q:
   x=q[0]
   m["id"]=x.get("id")
   m["poster"]=("https://image.tmdb.org/t/p/w500"+x["poster_path"]) if x.get("poster_path") else m.get("poster")
   m["score"]=x.get("vote_average",m.get("score",0))
   m["votes"]=x.get("vote_count",m.get("votes",0))
   m["overview"]=x.get("overview",m.get("overview",""))
   m["tmdb"]="https://www.themoviedb.org/movie/"+str(x["id"])
   try:
    md=details(x["id"])
    m["director"]=next((z.get("name") for z in md.get("credits",{}).get("crew",[]) if z.get("job")=="Director"),None)
    m["cast"]=[z.get("name") for z in md.get("credits",{}).get("cast",[])[:4] if z.get("name")]
    m["countries"]=[z.get("name") for z in md.get("production_countries",[]) if z.get("name")]
   except Exception: pass
 except Exception:
  pass
events=theatrical+stream_movies
events.sort(key=lambda x:x.get("date",""))
with open("data/movies.json","w",encoding="utf-8") as fh: json.dump({"generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"note":"Calendar events only: verified Japan theatrical releases plus separately curated official streaming premiere dates. Current-availability snapshots are excluded.","movies":events},fh,ensure_ascii=False,indent=2)
