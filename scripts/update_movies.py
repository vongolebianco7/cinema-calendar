import os,json,urllib.request,urllib.parse,datetime
KEY=os.environ["TMDB_API_KEY"]; BASE="https://api.themoviedb.org/3"
def get(path,params={}):
 p=dict(params);p["api_key"]=KEY;p.setdefault("language","ja-JP")
 with urllib.request.urlopen(BASE+path+"?"+urllib.parse.urlencode(p),timeout=30) as r:return json.load(r)
def details(mid):
 return get(f"/movie/{mid}",{"append_to_response":"release_dates"})
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
  date=min(dates)
  items[m["id"]]={"id":m["id"],"title":d.get("title") or m.get("title"),"original_title":d.get("original_title"),"date":date,"event":"theatrical","service":"劇場公開","poster":"https://image.tmdb.org/t/p/w500"+m["poster_path"],"score":d.get("vote_average",0),"votes":d.get("vote_count",0),"overview":d.get("overview",""),"tmdb":"https://www.themoviedb.org/movie/"+str(m["id"])}
theatrical=sorted(items.values(),key=lambda x:x["date"])
os.makedirs("data",exist_ok=True)
with open("data/theatrical.json","w",encoding="utf-8") as fh: json.dump({"generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"movies":theatrical},fh,ensure_ascii=False,indent=2)
# Preserve curated streaming premieres; these are populated only from official dated announcements.
try:
 with open("data/streaming.json",encoding="utf-8") as fh: streaming=json.load(fh)
except FileNotFoundError:
 streaming={"generated_at":None,"movies":[]}
events=theatrical+streaming.get("movies",[])
events.sort(key=lambda x:x.get("date",""))
with open("data/movies.json","w",encoding="utf-8") as fh: json.dump({"generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"note":"Calendar events only: verified Japan theatrical releases plus separately curated official streaming premiere dates. Current-availability snapshots are excluded.","movies":events},fh,ensure_ascii=False,indent=2)
