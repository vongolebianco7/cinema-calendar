"""Cache Japanese movie watch-provider snapshots, distinct from premiere dates.

TMDB/JustWatch availability is a point-in-time observation. First observed
does NOT mean actual streaming premiere. Persist changes only; never infer
official start/end dates from provider presence.
"""
import datetime,json,os,time,urllib.parse,urllib.request
from pathlib import Path

KEY=os.environ["TMDB_API_KEY"]
ROOT=Path("data")
TODAY=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date()
NOW=datetime.datetime.now(datetime.timezone.utc).isoformat()
PATH=ROOT/"availability.json"
SERVICES={8:"Netflix",9:"Prime Video",337:"Disney+",84:"U-NEXT",15:"Hulu"}

def load(p,default):
 try:
  with open(p,encoding="utf-8") as f:return json.load(f)
 except (FileNotFoundError,ValueError):return default

movies=load(ROOT/"movies.json",{}).get("movies",[])
old=load(PATH,{"generated_at":None,"source":"TMDB watch/providers (JustWatch)","country":"JP","movies":{}})
cache=old.get("movies",{})
by_id={}
for m in movies:
 mid=m.get("id")
 if not isinstance(mid,int):continue
 try:date=datetime.date.fromisoformat(m["date"])
 except (KeyError,ValueError):continue
 distance=abs((date-TODAY).days)
 # Match recent / upcoming theatrical and official premieres first.
 if distance>110:continue
 if mid not in by_id or distance<by_id[mid][0]:by_id[mid]=(distance,m)
selected=sorted(by_id.items(),key=lambda item:item[1][0])[:100]
count=0
for mid,(_,m) in selected:
 url="https://api.themoviedb.org/3/movie/"+str(mid)+"/watch/providers?"+urllib.parse.urlencode({"api_key":KEY})
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"CINEMA-NOW/1.0"}),timeout=25) as r:
   jp=(json.load(r).get("results") or {}).get("JP") or {}
  services=sorted({SERVICES[p["provider_id"]] for p in jp.get("flatrate",[]) if p.get("provider_id") in SERVICES})
  item=cache.get(str(mid),{"title":m.get("title"),"changes":[]})
  prev=item.get("services")
  if prev is None or prev!=services:
   item.setdefault("changes",[]).append({"observed_at":NOW,"services":services})
  item["services"]=services
  item["checked_at"]=NOW
  item["source_url"]=jp.get("link") or "https://www.themoviedb.org/movie/"+str(mid)+"/watch"
  item["title"]=m.get("title") or item.get("title")
  cache[str(mid)]=item
  count+=1
  time.sleep(0.12)
 except Exception as exc:print("provider check skipped:",mid,str(exc))
old.update({"generated_at":NOW,"source":"TMDB watch/providers (JustWatch)","country":"JP",
"note":"見放題配信の定点観測。初観測日＝配信開始日ではなく、サービスを利用できる保証もありません。","movies":cache})
with open(PATH,"w",encoding="utf-8") as f:json.dump(old,f,ensure_ascii=False,indent=2)
print("Watch provider snapshots updated:",count)
