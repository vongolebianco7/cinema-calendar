"""Cache Japanese watch-provider snapshots for recent/upcoming movies.

TMDB watch/providers data is powered by JustWatch and is a point-in-time
observation. It can tell us where a title is listed as flatrate, rental, or
purchase, but it does not expose prices and first observation is not a premiere
date.
"""
import datetime,json,os,time,urllib.parse,urllib.request
from pathlib import Path

ROOT=Path("data")
TODAY=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date()
NOW=datetime.datetime.now(datetime.timezone.utc).isoformat()
PATH=ROOT/"availability.json"

ALIASES={
 "Amazon Prime Video":"Prime Video",
 "Disney Plus":"Disney+",
 "Apple TV Plus":"Apple TV+",
 "Apple TV":"Apple TV+",
 "WOWOW":"WOWOWオンデマンド",
 "WOWOW On Demand":"WOWOWオンデマンド",
}

def load(p,default):
 try:
  with open(p,encoding="utf-8") as f:return json.load(f)
 except (FileNotFoundError,ValueError):return default

def provider_names(rows):
 names=set()
 for p in rows or []:
  name=(p.get("provider_name") or "").strip()
  if name:names.add(ALIASES.get(name,name))
 return sorted(names)

def finish_snapshot(old, cache, count, now):
 if not count:return old
 return {**old,"generated_at":now,"source":"TMDB watch/providers (JustWatch)","country":"JP","note":"日本向け配信先の観測。配信開始日ではありません。更新日は作品ごとのchecked_atを参照。","movies":cache}

DAILY_OBSERVATION_LIMIT=60

def select_due_observations(candidates, cache, now, limit=20):
 """Return oldest due observations with reserved capacity for both release types.

 Streaming premiere records receive up to two-thirds of the daily capacity,
 while theatrical candidates have a reserved one-third. If one category has
 fewer due titles, its unused slots flow to the other. This avoids indefinite
 starvation of theatrical records while continuing to prioritize streaming.
 """
 due={"streaming":[],"other":[]}
 for mid, (distance, movie) in candidates:
  checked=(cache.get(str(mid)) or {}).get("checked_at")
  checked_dt=None
  if checked:
   try:
    checked_dt=datetime.datetime.fromisoformat(checked.replace("Z","+00:00"))
    if checked_dt.tzinfo is None:
     checked_dt=None
    else:
     checked_dt=checked_dt.astimezone(datetime.timezone.utc)
   except (TypeError, ValueError, AttributeError):
    checked_dt=None
  if checked_dt is not None and datetime.timedelta(0) <= now-checked_dt < datetime.timedelta(days=7):
   continue
  bucket="streaming" if movie.get("event")=="streaming" else "other"
  sort_age=checked_dt.timestamp() if checked_dt else float("-inf")
  due[bucket].append(((sort_age,distance,mid),(mid,(distance,movie))))
 for rows in due.values():
  rows.sort(key=lambda pair:pair[0])
 limit=max(0,int(limit))
 streaming_quota=(limit*2+2)//3
 other_quota=limit-streaming_quota
 picked=due["streaming"][:streaming_quota]+due["other"][:other_quota]
 remaining=due["streaming"][streaming_quota:]+due["other"][other_quota:]
 # Fill unused reservations, preferring the least-recently-checked title.
 remaining.sort(key=lambda pair:pair[0])
 picked+=remaining[:max(0,limit-len(picked))]
 return [entry for _,entry in picked]




def main():
 KEY=os.environ["TMDB_API_KEY"]
 movies=load(ROOT/"movies.json",{}).get("movies",[])+load(ROOT/"awards.json",{}).get("catalog",[])
 old=load(PATH,{"generated_at":None,"source":"TMDB watch/providers (JustWatch)","country":"JP","movies":{}})
 cache=old.get("movies",{})
 by_id={}
 for m in movies:
  mid=m.get("id")
  if not isinstance(mid,int):continue
  try:date=datetime.date.fromisoformat(m.get("date") or str(TODAY))
  except (KeyError,ValueError):continue
  distance=abs((date-TODAY).days)
  if distance>365:continue
  if mid not in by_id or distance<by_id[mid][0]:by_id[mid]=(distance,m)

 # Prioritize streaming calendar entries, then nearby theatrical releases.
 # Coverage was previously capped at 100 titles, which made later-added
 # providers such as Apple TV+, ABEMA and Lemino appear under-populated.
 candidates=sorted(
  by_id.items(),
  key=lambda item:(0 if item[1][1].get("event")=="streaming" else 1, item[1][0])
 )
 selected=select_due_observations(candidates,cache,datetime.datetime.now(datetime.timezone.utc),limit=DAILY_OBSERVATION_LIMIT)
 count=0
 for mid,(_,m) in selected:
  url="https://api.themoviedb.org/3/movie/"+str(mid)+"/watch/providers?"+urllib.parse.urlencode({"api_key":KEY})
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"CINEMA-NOW/1.0"}),timeout=25) as r:
    jp=(json.load(r).get("results") or {}).get("JP") or {}
   flatrate=provider_names(jp.get("flatrate"))
   rent=provider_names(jp.get("rent"))
   buy=provider_names(jp.get("buy"))
   item=cache.get(str(mid),{"title":m.get("title"),"changes":[]})
   prev=(item.get("flatrate",item.get("services",[])),item.get("rent",[]),item.get("buy",[]))
   current=(flatrate,rent,buy)
   if prev!=current:
    item.setdefault("changes",[]).append({"observed_at":NOW,"flatrate":flatrate,"rent":rent,"buy":buy})
   item["services"]=flatrate
   item["flatrate"]=flatrate
   item["rent"]=rent
   item["buy"]=buy
   item["checked_at"]=NOW
   item["source_url"]=jp.get("link") or "https://www.themoviedb.org/movie/"+str(mid)+"/watch"
   item["title"]=m.get("title") or item.get("title")
   cache[str(mid)]=item
   count+=1
   time.sleep(1.5)
  except Exception as exc:
   print("provider check skipped:",mid,type(exc).__name__)

 print(f"Daily provider observation budget: {DAILY_OBSERVATION_LIMIT}; eligible titles: {len(candidates)}; scheduled checks: {len(selected)}")
 if count:
  result=finish_snapshot(old,cache,count,NOW)
  temporary=PATH.with_suffix('.tmp')
  temporary.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
  temporary.replace(PATH)
 else:
  print("No successful provider observations; preserving previous snapshot and update timestamp")
 print("Watch provider snapshots updated:",count)

if __name__=="__main__":main()
