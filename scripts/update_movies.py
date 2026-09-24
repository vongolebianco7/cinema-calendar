import os,json,urllib.request,urllib.parse,datetime,re,html,difflib
KEY=os.environ["TMDB_API_KEY"]; BASE="https://api.themoviedb.org/3"
def get(path,params={}):
 p=dict(params);p["api_key"]=KEY;p.setdefault("language","ja-JP")
 with urllib.request.urlopen(BASE+path+"?"+urllib.parse.urlencode(p),timeout=30) as r:return json.load(r)
def details(mid):
 return get(f"/movie/{mid}",{"append_to_response":"release_dates,credits"})
today=datetime.date.today(); start=today-datetime.timedelta(days=365); end=today+datetime.timedelta(days=365)
items={}
# Japan theatrical releases only. Streaming premieres are stored separately in data/streaming.json
# and must come from dated official service announcements, never inferred from current availability.
for page in range(1,31):
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
  items[m["id"]]={"id":m["id"],"title":d.get("title") or m.get("title"),"original_title":d.get("original_title"),"date":date,"event":"theatrical","service":"劇場公開","poster":"https://image.tmdb.org/t/p/w500"+m["poster_path"],"score":d.get("vote_average",0),"votes":d.get("vote_count",0),"overview":d.get("overview",""),"tmdb":"https://www.themoviedb.org/movie/"+str(m["id"]),"director":next((x.get("name") for x in d.get("credits",{}).get("crew",[]) if x.get("job")=="Director"),None),"director_id":next((x.get("id") for x in d.get("credits",{}).get("crew",[]) if x.get("job")=="Director"),None),"cast":[x.get("name") for x in d.get("credits",{}).get("cast",[])[:4] if x.get("name")],"countries":[x.get("name") for x in d.get("production_countries",[]) if x.get("name")],"runtime":d.get("runtime"),"genres":[x.get("name") for x in d.get("genres",[]) if x.get("name")]}
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
tv_data=sync_ntv_kinro(tv_data)
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

# Rankings: DB-less static shards for GitHub Pages.
# We precompute up to 200 titles per region x genre x era filter and commit them as JSON.
# This gives the UI enough depth for 50+ visible titles without exposing the TMDB API key client-side.
rankings={"邦画":{},"洋画":{}}
genre_groups={
 "アクション":[28],"アドベンチャー":[12],"アニメ":[16],"コメディ":[35],"クライム":[80],
 "ドキュメンタリー":[99],"ドラマ":[18],"ファミリー":[10751],"ファンタジー":[14],"歴史":[36],
 "ホラー":[27],"音楽":[10402],"ミステリー":[9648],"ロマンス":[10749],"SF":[878],
 "スリラー":[53],"戦争":[10752],"西部劇":[37]
}
eras={
 "〜1979":(None,"1979-12-31"),"1980年代":("1980-01-01","1989-12-31"),
 "1990年代":("1990-01-01","1999-12-31"),"2000年代":("2000-01-01","2009-12-31"),
 "2010年代":("2010-01-01","2019-12-31"),"2020年代":("2020-01-01",str(today))
}
os.makedirs("data/rankings",exist_ok=True)
manifest={"generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"filters":{}}
for region_name in ["邦画","洋画"]:
 manifest["filters"][region_name]={}
 for genre_name,genre_ids in genre_groups.items():
  manifest["filters"][region_name][genre_name]={}
  for era_name,(gte,lte) in eras.items():
   vote_min=20 if region_name=="邦画" else 100
   collected=[]
   for page in range(1,11):
    params={"with_genres":"|".join(str(x) for x in genre_ids),"sort_by":"vote_average.desc","vote_count.gte":vote_min,"include_adult":"false","page":page}
    if genre_name!="アニメ": params["without_genres"]="16"
    if gte: params["primary_release_date.gte"]=gte
    if lte: params["primary_release_date.lte"]=lte
    if region_name=="邦画": params["with_origin_country"]="JP"
    try:
     rs=get("/discover/movie",params).get("results",[])
    except Exception:
     rs=[]
    if not rs: break
    for x in rs:
     countries=x.get("origin_country") or []
     if region_name=="洋画" and "JP" in countries: continue
     collected.append(x)
   seen_ids=set(); unique=[]
   for x in collected:
    if not x.get("id") or x["id"] in seen_ids: continue
    seen_ids.add(x["id"]); unique.append(x)
   unique.sort(key=lambda x:(x.get("vote_average",0),x.get("vote_count",0)),reverse=True)
   rows=[{"id":x.get("id"),"title":x.get("title") or x.get("original_title"),
          "year":(x.get("release_date") or "")[:4],
          "poster":("https://image.tmdb.org/t/p/w342"+x["poster_path"]) if x.get("poster_path") else None,
          "score":x.get("vote_average",0),"votes":x.get("vote_count",0),
          "tmdb":"https://www.themoviedb.org/movie/"+str(x.get("id"))} for x in unique[:200]]
   safe_region="jp" if region_name=="邦画" else "foreign"
   safe_genre=str(genre_ids[0])
   safe_era=re.sub(r"[^0-9A-Za-z]+","-",era_name).strip("-") or "all"
   fname=f"{safe_region}-{safe_genre}-{safe_era}.json"
   with open("data/rankings/"+fname,"w",encoding="utf-8") as fh:
    json.dump({"region":region_name,"genre":genre_name,"era":era_name,"items":rows},fh,ensure_ascii=False,indent=2)
   manifest["filters"][region_name][genre_name][era_name]={"file":"data/rankings/"+fname,"count":len(rows)}
   rankings[region_name].setdefault(genre_name,{})[era_name]=rows[:50]
with open("data/rankings_manifest.json","w",encoding="utf-8") as fh:
 json.dump(manifest,fh,ensure_ascii=False,indent=2)
with open("data/rankings.json","w",encoding="utf-8") as fh:
 json.dump({"generated_at":manifest["generated_at"],"method":"TMDB vote_average descending; static shards, up to 200 titles per filter","rankings":rankings},fh,ensure_ascii=False,indent=2)

# Dedicated current-year ranking so "今年" is not just a subset of the 2020s top list.
current_year=str(today.year)
year_rankings={"邦画":{},"洋画":{}}
for region_name in ["邦画","洋画"]:
 for genre_name,genre_ids in genre_groups.items():
  vote_min=5 if region_name=="邦画" else 20
  collected=[]
  for page in range(1,11):
   params={
    "with_genres":"|".join(str(x) for x in genre_ids),
    "sort_by":"vote_average.desc",
    "vote_count.gte":vote_min,
    "include_adult":"false",
    "primary_release_date.gte":current_year+"-01-01",
    "primary_release_date.lte":str(today),
    "page":page
   }
   if genre_name!="アニメ": params["without_genres"]="16"
   if region_name=="邦画": params["with_origin_country"]="JP"
   try:
    rs=get("/discover/movie",params).get("results",[])
   except Exception:
    rs=[]
   if not rs: break
   for x in rs:
    countries=x.get("origin_country") or []
    if region_name=="洋画" and "JP" in countries: continue
    collected.append(x)
  seen_ids=set(); unique=[]
  for x in collected:
   if not x.get("id") or x["id"] in seen_ids: continue
   seen_ids.add(x["id"]); unique.append(x)
  unique.sort(key=lambda x:(x.get("vote_average",0),x.get("vote_count",0)),reverse=True)
  year_rankings[region_name][genre_name]=[
   {"id":x.get("id"),"title":x.get("title") or x.get("original_title"),
    "date":(x.get("release_date") or "")[:10],"year":(x.get("release_date") or "")[:4],
    "poster":("https://image.tmdb.org/t/p/w342"+x["poster_path"]) if x.get("poster_path") else None,
    "score":x.get("vote_average",0),"votes":x.get("vote_count",0),
    "tmdb":"https://www.themoviedb.org/movie/"+str(x.get("id"))}
   for x in unique[:200]
  ]
with open("data/rankings_year.json","w",encoding="utf-8") as fh:
 json.dump({"generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"year":today.year,
            "method":"TMDB current-year releases, vote_average descending","rankings":year_rankings},
           fh,ensure_ascii=False,indent=2)

# Refresh Japan all-time box office top 100 from Kogyo Tsushinsha (official source).
try:
 req=urllib.request.Request("https://kogyotsushin.com/archives/alltime/",headers={"User-Agent":"Mozilla/5.0"})
 raw=urllib.request.urlopen(req,timeout=30).read().decode("utf-8","ignore")
 rows=re.findall(r"<tr[^>]*>(.*?)</tr>",raw,re.I|re.S)
 box_items=[]
 def clean_cell(v):
  v=re.sub(r"<br\s*/?>"," ",v,flags=re.I)
  v=re.sub(r"<[^>]+>","",v)
  return html.unescape(v).replace("\u3000"," ").strip()
 for row in rows:
  cells=[clean_cell(x) for x in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>",row,re.I|re.S)]
  if len(cells)<5: continue
  rank_txt=cells[0].strip()
  if not re.fullmatch(r"\d+",rank_txt): continue
  gross_txt=cells[3].replace(",","").strip()
  m_gross=re.search(r"\d+(?:\.\d+)?",gross_txt)
  if not m_gross: continue
  release=cells[4].strip()
  domestic=False
  if len(cells)>=6:
   domestic=("*" in cells[5]) or ("＊" in cells[5])
  box_items.append({
   "rank":int(rank_txt),
   "title":cells[1].strip(),
   "distributor":cells[2].strip(),
   "gross_billion_yen":float(m_gross.group()),
   "release_date":release,
   "region":"邦画" if domestic else "洋画"
  })
 if box_items:
  try:
   with open("data/rankings_extra.json",encoding="utf-8") as fh:
    extra_seed=json.load(fh)
  except (FileNotFoundError,json.JSONDecodeError):
   extra_seed={}
  extra_seed.pop("filmarks_current",None)
  extra_seed["boxoffice_alltime"]={
   "title":"歴代興行収入ランキング",
   "as_of":str(today),
   "source":"興行通信社 CINEMAランキング通信",
   "source_url":"https://kogyotsushin.com/archives/alltime/",
   "scope":"興行通信社が公開する歴代興収ベスト100",
   "items":box_items[:100]
  }
  with open("data/rankings_extra.json","w",encoding="utf-8") as fh:
   json.dump(extra_seed,fh,ensure_ascii=False,indent=2)
except Exception as e:
 print("Box office refresh skipped:",e)

# Enrich every non-TMDB ranking item with TMDB metadata so all ranking axes show a common TMDB score/poster.
try:
 with open("data/rankings_extra.json",encoding="utf-8") as fh:
  extra_rankings=json.load(fh)
except (FileNotFoundError,json.JSONDecodeError):
 extra_rankings={}
for section_name in ["boxoffice_alltime"]:
 section=extra_rankings.get(section_name) or {}
 for item in section.get("items",[]):
  try:
   q=item.get("title")
   if not q: continue
   sr=get("/search/movie",{"query":q,"include_adult":"false","language":"ja-JP","page":1}).get("results",[])
   if not sr: continue
   # Prefer a release-year match when the source ranking provides one.
   source_year=""
   rd=item.get("release_date") or ""
   if len(rd)>=4: source_year=rd[:4]
   match=next((x for x in sr if source_year and (x.get("release_date") or "")[:4]==source_year),sr[0])
   item["tmdb_id"]=match.get("id")
   item["tmdb_score"]=match.get("vote_average",0)
   item["tmdb_votes"]=match.get("vote_count",0)
   item["poster"]=("https://image.tmdb.org/t/p/w342"+match["poster_path"]) if match.get("poster_path") else None
   item["tmdb"]="https://www.themoviedb.org/movie/"+str(match.get("id"))
   item["genres"]=match.get("genre_ids") or []
   item["origin_country"]=match.get("origin_country") or []
   if not item.get("region"): item["region"]="邦画" if "JP" in item["origin_country"] else "洋画"
   try:
    md=get("/movie/"+str(match.get("id")),{"append_to_response":"watch/providers"})
    item["genres_named"]=[g.get("name") for g in md.get("genres",[]) if g.get("name")]
    item["origin_country"]=md.get("origin_country") or item["origin_country"]
    item["runtime"]=md.get("runtime")
    jp=((md.get("watch/providers") or {}).get("results") or {}).get("JP") or {}
    pmap={8:"Netflix",9:"Prime Video",337:"Disney+",84:"U-NEXT",15:"Hulu"}
    item["subscriptions"]=[]
    for p in (jp.get("flatrate") or []):
     name=pmap.get(p.get("provider_id"))
     if name and name not in item["subscriptions"]: item["subscriptions"].append(name)
   except Exception:
    item["genres_named"]=[]
  except Exception:
   pass
if extra_rankings:
 extra_rankings["generated_at"]=datetime.datetime.now(datetime.timezone.utc).isoformat()
 with open("data/rankings_extra.json","w",encoding="utf-8") as fh:
  json.dump(extra_rankings,fh,ensure_ascii=False,indent=2)

with open("data/movies.json","w",encoding="utf-8") as fh: json.dump({"generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"note":"Calendar events only: verified Japan theatrical releases plus separately curated official streaming premiere dates. Current-availability snapshots are excluded.","movies":events},fh,ensure_ascii=False,indent=2)
