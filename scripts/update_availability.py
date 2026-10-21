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
MAX_DAILY_OBSERVATIONS=200
# Leave the rest of the25-minute job for other importers, checks and commit.
MAX_BATCH_SECONDS=360
REFRESH_AFTER_DAYS=6

def observation_budget(candidate_count):
 """Bound requests while leaving one day of headroom before UI expiry."""
 return min(MAX_DAILY_OBSERVATIONS,max(DAILY_OBSERVATION_LIMIT,
            (max(0,int(candidate_count))+REFRESH_AFTER_DAYS-1)//REFRESH_AFTER_DAYS))

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
  if checked_dt is not None and datetime.timedelta(0) <= now-checked_dt < datetime.timedelta(days=REFRESH_AFTER_DAYS):
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



def build_candidates(movies, cache, today):
 """Keep a bounded refresh path for previously observed older titles.

 The release calendar is only a discovery window, not a guarantee that
 previously observed streaming titles cease to need freshness checks.
 Revisit old snapshots only when their IDs still exist in our approved
 local movie catalog. Do not discover new distant-history titles.
 """
 by_id={}
 for movie in movies:
  mid=movie.get("id")
  if not isinstance(mid,int) or mid<=0:
   continue
  try:
   released=datetime.date.fromisoformat(movie.get("date") or str(today))
  except (TypeError,ValueError):
   continue
  distance=abs((released-today).days)
  if distance>365 and str(mid) not in cache:
   continue
  # Prefer the closest calendar entry when a title occurs more than once.
  if mid not in by_id or distance<by_id[mid][0]:
   by_id[mid]=(distance,movie)
 # Existing approved TMDB observations must remain refreshable even when
 # their former calendar entries disappear from the rolling movie feeds.
 for raw_id, observed in cache.items():
  if not isinstance(raw_id,str) or not raw_id.isdecimal() or raw_id.startswith("0"):
   continue
  mid=int(raw_id)
  if mid<=0 or mid in by_id or not isinstance(observed,dict):
   continue
  by_id[mid]=(366,{"id":mid,"title":observed.get("title") or "",
                    "event":"streaming"})
 return sorted(by_id.items(),key=lambda item:(
  0 if item[1][1].get("event")=="streaming" else 1,item[1][0]
 ))




def main():
 KEY=os.environ["TMDB_API_KEY"]
 movies=load(ROOT/"movies.json",{}).get("movies",[])+load(ROOT/"awards.json",{}).get("catalog",[])
 old=load(PATH,{"generated_at":None,"source":"TMDB watch/providers (JustWatch)","country":"JP","movies":{}})
 cache=old.get("movies",{})
 candidates=build_candidates(movies,cache,TODAY)

 budget=observation_budget(len(candidates))
 selected=select_due_observations(candidates,cache,datetime.datetime.now(datetime.timezone.utc),limit=budget)
 count=0
 failed=0
 deadline=time.monotonic()+MAX_BATCH_SECONDS
 for mid,(_,m) in selected:
  remaining=deadline-time.monotonic()
  if remaining<=0:
   print("::warning title=Provider refresh time budget::Stopping this batch and saving completed observations; unfinished titles remain due.")
   break
  url="https://api.themoviedb.org/3/movie/"+str(mid)+"/watch/providers?"+urllib.parse.urlencode({"api_key":KEY})
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"CINEMA-NOW/1.0"}),timeout=min(25,remaining)) as r:
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
   time.sleep(min(1.5,max(0,deadline-time.monotonic())))
  except Exception as exc:
   failed+=1
   print("provider check skipped:",mid,type(exc).__name__)

 print(f"Daily provider observation budget: {budget} (hard cap {MAX_DAILY_OBSERVATIONS}); eligible titles: {len(candidates)}; scheduled checks: {len(selected)}")
 if len(candidates)>budget*REFRESH_AFTER_DAYS:
  print("::warning title=Provider refresh capacity::Catalogue exceeds the bounded six-day refresh capacity; some observations may expire. UI must retain unknown/stale handling.")
 if count:
  result=finish_snapshot(old,cache,count,NOW)
  temporary=PATH.with_suffix('.tmp')
  temporary.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
  temporary.replace(PATH)
 else:
  print("No successful provider observations; preserving previous snapshot and update timestamp")
 print(f"Watch provider snapshots updated: {count}; failed: {failed}; attempted: {count+failed}; deferred: {len(selected)-count-failed}")
 if selected and count==0:
  raise RuntimeError("All TMDB provider observations failed; previous snapshot preserved")

if __name__=="__main__":main()
