import os,json,urllib.request,urllib.parse,datetime
KEY=os.environ["TMDB_API_KEY"]; BASE="https://api.themoviedb.org/3"
def get(path,params={}):
 p=dict(params);p["api_key"]=KEY;p.setdefault("language","ja-JP")
 with urllib.request.urlopen(BASE+path+"?"+urllib.parse.urlencode(p),timeout=30) as r:return json.load(r)

providers=get("/watch/providers/movie",{"watch_region":"JP"}).get("results",[])
wanted={"Netflix","Amazon Prime Video","Disney Plus","U-NEXT","Hulu"}
pmap={p["provider_id"]:p["provider_name"] for p in providers if p["provider_name"] in wanted}
provider_ids="|".join(map(str,pmap))
today=datetime.date.today()
items={}

# Broad catalog: popular films currently included in Japanese flat-rate services.
# Do not restrict to recent theatrical releases: that was producing a tiny/noisy catalog.
for page in range(1,21):
 data=get("/discover/movie",{
  "region":"JP","watch_region":"JP","with_watch_providers":provider_ids,
  "with_watch_monetization_types":"flatrate","sort_by":"popularity.desc",
  "include_adult":"false","include_video":"false","vote_count.gte":20,"page":page})
 for m in data.get("results",[]):
  if not m.get("poster_path") or not m.get("release_date"): continue
  # Remove very low-signal entries; keep new Japanese titles even before votes accumulate.
  votes=int(m.get("vote_count") or 0)
  if votes < 20: continue
  try: w=get(f"/movie/{m['id']}/watch/providers").get("results",{}).get("JP",{})
  except Exception: continue
  sv=sorted({pmap[x["provider_id"]] for x in w.get("flatrate",[]) if x.get("provider_id") in pmap})
  if not sv: continue
  title=(m.get("title") or "").strip()
  original=(m.get("original_title") or "").strip()
  # Prefer records that TMDB can present meaningfully to Japanese users.
  overview=(m.get("overview") or "").strip()
  japanese_friendly=bool(title and (title != original or overview or m.get("original_language")=="ja"))
  if not japanese_friendly: continue
  items[m["id"]]={
   "id":m["id"],"title":title,"original_title":original,"date":m.get("release_date"),
   "poster":"https://image.tmdb.org/t/p/w500"+m["poster_path"],
   "score":m.get("vote_average"),"votes":votes,"popularity":m.get("popularity",0),
   "overview":overview,"services":sv,
   "tmdb":"https://www.themoviedb.org/movie/"+str(m["id"])
  }

movies=sorted(items.values(),key=lambda x:(x["popularity"],x["votes"]),reverse=True)
out={"generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "note":"Popular, higher-signal movies currently available via selected flat-rate providers in Japan. Date is the movie release date, not the streaming-start date.",
 "movies":movies}
os.makedirs("data",exist_ok=True)
with open("data/movies.json","w",encoding="utf-8") as fh: json.dump(out,fh,ensure_ascii=False,indent=2)
