import os,json,urllib.request,urllib.parse,datetime,re,html,difflib
KEY=os.environ["TMDB_API_KEY"]; BASE="https://api.themoviedb.org/3"
def get(path,params={}):
 p=dict(params);p["api_key"]=KEY;p.setdefault("language","ja-JP")
 with urllib.request.urlopen(BASE+path+"?"+urllib.parse.urlencode(p),timeout=30) as r:return json.load(r)
def details(mid):
 return get(f"/movie/{mid}",{"append_to_response":"release_dates,credits"})
today=datetime.date.today(); start=today-datetime.timedelta(days=365); end=today+datetime.timedelta(days=365)
os.makedirs("data",exist_ok=True)

# Low-impact differential refresh:
# - Keep the existing +/-1 year cache.
# - Check the near-term window every day.
# - Check one rotating 60-day background slice per day.
# - Resolve at most 40 movie-detail records per run.
try:
 with open("data/theatrical.json",encoding="utf-8") as fh:
  old_theatrical=json.load(fh)
except (FileNotFoundError,json.JSONDecodeError):
 old_theatrical={"movies":[]}

items={}
for row in old_theatrical.get("movies",[]):
 mid=row.get("id")
 date=row.get("date")
 if isinstance(mid,int) and date and str(start)<=date<=str(end):
  items[mid]=row

span_days=(end-start).days+1
slice_days=60
slice_count=(span_days+slice_days-1)//slice_days
slice_index=today.toordinal()%slice_count
bg_start=start+datetime.timedelta(days=slice_index*slice_days)
bg_end=min(end,bg_start+datetime.timedelta(days=slice_days-1))

ranges=[
 (max(start,today-datetime.timedelta(days=30)),min(end,today+datetime.timedelta(days=120))),
 (bg_start,bg_end),
]

discovered={}
for range_start,range_end in ranges:
 params={"region":"JP","release_date.gte":str(range_start),"release_date.lte":str(range_end),"with_release_type":"2|3","sort_by":"primary_release_date.asc","include_adult":"false"}
 first=get("/discover/movie",{**params,"page":1})
 pages=min(int(first.get("total_pages") or 1),20)
 for m in first.get("results",[]):
  if m.get("id"):discovered[m["id"]]=m
 for page in range(2,pages+1):
  data=get("/discover/movie",{**params,"page":page})
  for m in data.get("results",[]):
   if m.get("id"):discovered[m["id"]]=m

MAX_DETAIL_REQUESTS=40
detail_requests=0
now_iso=datetime.datetime.now(datetime.timezone.utc).isoformat()

def needs_refresh(row):
 if not row:return True
 date=row.get("date") or ""
 if not (str(today-datetime.timedelta(days=30))<=date<=str(today+datetime.timedelta(days=60))):
  return False
 checked=row.get("checked_at")
 if not checked:return True
 try:
  checked_dt=datetime.datetime.fromisoformat(str(checked).replace("Z","+00:00"))
  return (datetime.datetime.now(datetime.timezone.utc)-checked_dt).days>=7
 except Exception:
  return True

for mid,m in sorted(discovered.items(),key=lambda kv:(0 if kv[0] not in items else 1,kv[1].get("release_date") or "")):
 existing=items.get(mid)
 if not needs_refresh(existing):
  continue
 if detail_requests>=MAX_DETAIL_REQUESTS:
  break
 if not m.get("poster_path") and not existing:
  continue
 try:
  d=details(mid)
 except Exception:
  continue
 detail_requests+=1
 jp=next((x for x in d.get("release_dates",{}).get("results",[]) if x.get("iso_3166_1")=="JP"),None)
 dates=[]
 if jp:
  for x in jp.get("release_dates",[]):
   if x.get("type") in (2,3) and x.get("release_date"):dates.append(x["release_date"][:10])
 valid=[x for x in dates if str(start)<=x<=str(end)]
 if not valid:
  continue
 date=min(valid)
 poster_path=d.get("poster_path") or m.get("poster_path")
 items[mid]={
  "id":mid,
  "title":d.get("title") or m.get("title"),
  "original_title":d.get("original_title"),
  "date":date,
  "event":"theatrical",
  "service":"劇場公開",
  "poster":("https://image.tmdb.org/t/p/w500"+poster_path) if poster_path else (existing or {}).get("poster"),
  "score":d.get("vote_average",0),
  "votes":d.get("vote_count",0),
  "overview":d.get("overview",""),
  "tmdb":"https://www.themoviedb.org/movie/"+str(mid),
  "director":next((x.get("name") for x in d.get("credits",{}).get("crew",[]) if x.get("job")=="Director"),None),
  "director_id":next((x.get("id") for x in d.get("credits",{}).get("crew",[]) if x.get("job")=="Director"),None),
  "cast":[x.get("name") for x in d.get("credits",{}).get("cast",[])[:4] if x.get("name")],
  "countries":[x.get("name") for x in d.get("production_countries",[]) if x.get("name")],
  "runtime":d.get("runtime"),
  "genres":[x.get("name") for x in d.get("genres",[]) if x.get("name")],
  "checked_at":now_iso,
 }

theatrical=sorted(items.values(),key=lambda x:x["date"])
with open("data/theatrical.json","w",encoding="utf-8") as fh:
 json.dump({
  "generated_at":now_iso,
  "refresh_policy":{
   "near_term":[str(ranges[0][0]),str(ranges[0][1])],
   "background_slice":[str(bg_start),str(bg_end)],
   "max_detail_requests":MAX_DETAIL_REQUESTS,
  },
  "movies":theatrical,
 },fh,ensure_ascii=False,indent=2)
print("Theatrical cache:",len(theatrical),"detail requests:",detail_requests,"background:",bg_start,bg_end)
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
for m in []:  # Disabled: no automated Netflix page collection without explicit permission
 k=(m.get("service"),m.get("title"),m.get("date"))
 if k not in seen: stream_movies.append(m); seen.add(k)
# Poster lookup never changes an officially verified release/broadcast date.
# Normalize edition labels and punctuation to improve searches, but do not attach
# a poster without a close title match (a different film is worse than no image).
def norm_movie_title(value):
 value=(value or "").lower()
 value=re.sub(r"[【［\[][^】］\]]*(?:4k|デジタル|ノーカット|字幕|吹替)[^】］\]]*[】］\]]","",value,flags=re.I)
 return re.sub(r"[\s　・･:：!！?？「」『』【】\[\]()（）/／\-―ー\.\u30fb\u00b7]+","",value)
TITLE_ALIASES={
 "デーヴァラ":"Devara: Part 1",
 "ハウス・オブ・ザ・デビル":"The House of the Devil",
 "Stray Kids : The dominATE Experience":"Stray Kids: The dominATE Experience",
 "1980 僕たちの光州事件":"1980",
 "ラブ・ハイポセシス":"The Love Hypothesis",
 "ウェズリー・スナイプス ザ・シューター":"The Contractor",
 "ウェズリー・スナイプス　ザ・シューター":"The Contractor",
}
def search_movie_match(title, original_title=None):
 variants=[title]
 if title in TITLE_ALIASES: variants.append(TITLE_ALIASES[title])
 simplified=re.sub(r"[【［\[][^】］\]]*[】］\]]","",title).strip()
 if simplified and simplified!=title: variants.append(simplified)
 if original_title: variants.append(original_title)
 seen_queries=set()
 fallback=[]
 for name in variants:
  if not name or name in seen_queries:continue
  seen_queries.add(name)
  try:
   results=get("/search/movie",{"query":name,"region":"JP","include_adult":"false"}).get("results",[])
  except Exception:continue
  needle=norm_movie_title(name)
  for rank,x in enumerate(results[:10]):
   candidate_names=[x.get("title"),x.get("original_title")]
   normalized=[norm_movie_title(z) for z in candidate_names if z]
   if needle and needle in normalized:
    return x
   # Allow close title matches so posters lost by punctuation/subtitle differences
   # can recover, while keeping a conservative threshold to avoid wrong artwork.
   for cand in normalized:
    if not needle or not cand:continue
    ratio=difflib.SequenceMatcher(None,needle,cand).ratio()
    contains=(min(len(needle),len(cand))>=4 and (needle in cand or cand in needle))
    if ratio>=0.78 or contains:
     fallback.append((ratio+(0.03 if rank==0 else 0),x))
 if fallback:
  fallback.sort(key=lambda z:z[0],reverse=True)
  return fallback[0][1]
 return None

# Enrich verified streaming premieres with TMDB metadata/posters by title.
# The premiere date and service always remain sourced from official announcements.
for m in stream_movies:
 if m.get("id") and m.get("poster") and m.get("director_id"):
  continue
 try:
  x=search_movie_match(m["title"],m.get("original_title"))
  if x:
   m["id"]=x.get("id")
   m["poster"]=("https://image.tmdb.org/t/p/w500"+x["poster_path"]) if x.get("poster_path") else m.get("poster")
   m["score"]=x.get("vote_average",m.get("score",0))
   m["votes"]=x.get("vote_count",m.get("votes",0))
   m["overview"]=x.get("overview",m.get("overview",""))
   m["tmdb"]="https://www.themoviedb.org/movie/"+str(x["id"])
   try:
    md=details(x["id"])
    m["director"]=next((z.get("name") for z in md.get("credits",{}).get("crew",[]) if z.get("job")=="Director"),None)
    m["director_id"]=next((z.get("id") for z in md.get("credits",{}).get("crew",[]) if z.get("job")=="Director"),None)
    m["cast"]=[z.get("name") for z in md.get("credits",{}).get("cast",[])[:4] if z.get("name")]
    m["countries"]=[z.get("name") for z in md.get("production_countries",[]) if z.get("name")]
    m["runtime"]=md.get("runtime")
    m["genres"]=[z.get("name") for z in md.get("genres",[]) if z.get("name")]
   except Exception: pass
 except Exception:
  pass
# Merge verified Nippon TV Friday Roadshow movie broadcasts from official lineup pages.
def sync_ntv_kinro(tv_data):
 try:
  raw=fetch_text("https://kinro.ntv.co.jp/")
  paths=sorted(set(re.findall(r'href=["\\\'](/lineup/(202[0-9]{5,7}))["\\\']',raw)))
  existing={(m.get("service"),m.get("date"),m.get("title")) for m in tv_data.get("movies",[])}
  for path,_ in paths:
   url="https://kinro.ntv.co.jp"+path
   try: page=fetch_text(url)
   except Exception: continue
   date_m=re.search(r'(202[0-9])\\.(\\d{1,2})\\.(\\d{1,2})',html.unescape(re.sub(r"<[^>]+>"," ",page)))
   title_m=re.search(r'<h1[^>]*>(.*?)</h1>',page,re.I|re.S)
   if not date_m or not title_m: continue
   title=html.unescape(re.sub(r"<[^>]+>","",title_m.group(1))).strip()
   date=f"{date_m.group(1)}-{int(date_m.group(2)):02d}-{int(date_m.group(3)):02d}"
   # Only add actual movies that resolve in TMDB movie search; TV specials are skipped.
   match=search_movie_match(title)
   if not match: continue
   key=("日本テレビ",date,title)
   if key in existing: continue
   tv_data.setdefault("movies",[]).append({"title":title,"date":date,"time":"21:00","event":"tv","service":"日本テレビ","program":"金曜ロードショー","source":"日本テレビ 金曜ロードシネマクラブ","source_url":url,"terrestrial_first":None})
   existing.add(key)
 except Exception as e:
  print("NTV lineup refresh skipped:",e)
 return tv_data

# Enrich the curated official TV schedule with matching movie metadata and posters.
# Keep source broadcast dates, channels and premiere status untouched.
try:
 with open("data/tv.json",encoding="utf-8") as fh: tv_data=json.load(fh)
except (FileNotFoundError,json.JSONDecodeError):
 tv_data={"movies":[]}
# Disabled: no automated NTV page collection without explicit permission
# tv_data=sync_ntv_kinro(tv_data)
tv_updated=False
for m in tv_data.get("movies",[]):
 if m.get("poster") and m.get("id"):continue
 try:
  x=search_movie_match(m.get("title",""),m.get("original_title"))
  if not x:continue
  if x.get("poster_path"):
   m["poster"]="https://image.tmdb.org/t/p/w500"+x["poster_path"]
  m["id"]=x.get("id")
  m["original_title"]=x.get("original_title")
  m["score"]=x.get("vote_average",0)
  m["votes"]=x.get("vote_count",0)
  m["tmdb"]="https://www.themoviedb.org/movie/"+str(x["id"])
  m["overview"]=x.get("overview","")
  tv_updated=True
 except Exception as e:print("TV metadata skipped",m.get("title"),e)
if tv_updated:
 with open("data/tv.json","w",encoding="utf-8") as fh:
  json.dump(tv_data,fh,ensure_ascii=False,indent=2)

events=theatrical+stream_movies
events.sort(key=lambda x:x.get("date",""))

# Cache filmographies for directors appearing in the calendar.
try:
 with open("data/directors.json",encoding="utf-8") as fh: director_data=json.load(fh)
except (FileNotFoundError,json.JSONDecodeError):
 director_data={"directors":{}}
directors=director_data.get("directors",{})
for m in events:
 did=m.get("director_id")
 if not did: continue
 key=str(did)
 if key in directors: continue
 try:
  credits=get(f"/person/{did}/movie_credits")
 except Exception:
  continue
 seen_ids=set(); works=[]
 for w in credits.get("crew",[]):
  if w.get("job")!="Director" or not w.get("id") or w.get("id") in seen_ids: continue
  rd=w.get("release_date") or ""
  if not rd or rd[:10] >= str(today): continue
  seen_ids.add(w["id"])
  works.append({"id":w["id"],"title":w.get("title") or w.get("original_title"),"year":rd[:4],"date":rd[:10],"poster":("https://image.tmdb.org/t/p/w342"+w["poster_path"]) if w.get("poster_path") else None,"score":w.get("vote_average",0),"votes":w.get("vote_count",0),"tmdb":"https://www.themoviedb.org/movie/"+str(w["id"])})
 works.sort(key=lambda x:x.get("date",""),reverse=True)
 directors[key]={"id":did,"name":m.get("director"),"works":works[:30]}
with open("data/directors.json","w",encoding="utf-8") as fh:
 json.dump({"generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"directors":directors},fh,ensure_ascii=False,indent=2)

# Rankings are intentionally NOT regenerated during the daily movie refresh.
# Existing static ranking shards remain available to the UI.
# This keeps the daily external API footprint bounded; rankings can be refreshed separately at low frequency.

# Box-office scraping disabled.
# CINEMA DAYS does not automatically collect or republish Kogyo Tsushinsha ranking data.
try:
 with open("data/rankings_extra.json","w",encoding="utf-8") as fh:
  json.dump({"generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat()},fh,ensure_ascii=False,indent=2)
except Exception:
 pass

with open("data/movies.json","w",encoding="utf-8") as fh: json.dump({"generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"note":"Calendar events only: verified Japan theatrical releases plus separately curated official streaming premiere dates. Current-availability snapshots are excluded.","movies":events},fh,ensure_ascii=False,indent=2)
