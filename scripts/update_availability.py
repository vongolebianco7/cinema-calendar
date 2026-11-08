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
IMAGE_BASE="https://image.tmdb.org/t/p/w500"
MAX_DAILY_POSTER_LOOKUPS=80
POSTER_RECHECK_DAYS=30

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

def poster_url(path):
 if not isinstance(path,str) or not path.startswith("/") or path.startswith("//"):
  return None
 return IMAGE_BASE+path

def attach_catalog_posters(cache,movies):
 """Reuse only the same TMDB ID's canonical artwork; never title-match here."""
 updated=0
 for movie in movies:
  mid=movie.get("id")
  if not isinstance(mid,int) or mid<=0:
   continue
  item=cache.get(str(mid))
  if not isinstance(item,dict) or item.get("poster"):
   continue
  poster=movie.get("poster")
  if not isinstance(poster,str) or not poster.startswith("https://image.tmdb.org/t/p/"):
   poster=poster_url(movie.get("poster_path"))
  if poster:
   item["poster"]=poster
   item["poster_source"]="TMDB canonical movie catalog"
   cache[str(mid)]=item
   updated+=1
 return updated

def select_missing_poster_ids(cache,now,limit=MAX_DAILY_POSTER_LOOKUPS):
 """Pick oldest unchecked missing-poster IDs for a bounded daily TMDB lookup."""
 candidates=[]
 for raw_id,item in cache.items():
  if not isinstance(raw_id,str) or not raw_id.isdecimal() or raw_id.startswith("0") or not isinstance(item,dict) or item.get("poster"):
   continue
  checked=item.get("poster_checked_at")
  checked_dt=None
  if checked:
   try:
    checked_dt=datetime.datetime.fromisoformat(checked.replace("Z","+00:00"))
    if checked_dt.tzinfo is None:
     checked_dt=None
    else:
     checked_dt=checked_dt.astimezone(datetime.timezone.utc)
   except (TypeError,ValueError,AttributeError):
    checked_dt=None
  if checked_dt and datetime.timedelta(0)<=now-checked_dt<datetime.timedelta(days=POSTER_RECHECK_DAYS):
   continue
  candidates.append((checked_dt.timestamp() if checked_dt else float("-inf"),int(raw_id)))
 return [mid for _,mid in sorted(candidates)[:max(0,int(limit))]]

def enrich_missing_posters(cache,api_key,opener=urllib.request.urlopen,now=None,limit=MAX_DAILY_POSTER_LOOKUPS,delay=0.25,deadline=None):
 """Get official TMDB movie artwork for observed IDs, keeping existing values."""
 now=now or datetime.datetime.now(datetime.timezone.utc)
 checked_at=now.astimezone(datetime.timezone.utc).isoformat()
 updated=failed=attempted=0
 last_request=0.0
 for mid in select_missing_poster_ids(cache,now,limit):
  if deadline is not None and time.monotonic()>=deadline:
   break
  item=cache.get(str(mid))
  if not isinstance(item,dict) or item.get("poster"):
   continue
  wait=delay-(time.monotonic()-last_request)
  if wait>0:
   time.sleep(wait)
  url="https://api.themoviedb.org/3/movie/"+str(mid)+"?"+urllib.parse.urlencode({"api_key":api_key,"language":"ja-JP"})
  try:
   with opener(urllib.request.Request(url,headers={"Accept":"application/json"}),timeout=15) as response:
    result=json.load(response)
   attempted+=1
   last_request=time.monotonic()
   if result.get("id")!=mid:
    failed+=1
    continue
   poster=poster_url(result.get("poster_path"))
   item["poster_checked_at"]=checked_at
   if poster and not item.get("poster"):
    item["poster"]=poster
    item["poster_source"]="TMDB movie details"
    updated+=1
   cache[str(mid)]=item
  except Exception as exc:
   attempted+=1
   failed+=1
   last_request=time.monotonic()
   print("poster detail lookup skipped:",mid,type(exc).__name__)
 return updated,failed,attempted

def provider_groups(region):
 """Keep subscription, free/ad-supported, rental, and purchase observations distinct."""
 return {kind:provider_names(region.get(kind)) for kind in ("flatrate","free","ads","rent","buy")}

DISCOVERY_SERVICE_ORDER=("Netflix","Prime Video","U-NEXT","Disney+","ABEMA","WOWOWオンデマンド","Hulu","FOD","Apple TV+","Lemino","DMM TV","TELASA")
MAX_DAILY_DISCOVERY_PAGES=12
DISCOVERY_PAGE_SIZE=20

def discovery_service(name):
 name=ALIASES.get((name or "").strip(),(name or "").strip()).casefold()
 if name.startswith("netflix"):return "Netflix"
 if name in {"prime video","amazon prime video","amazon prime video with ads"}:return "Prime Video"
 if name in {"u-next","u-next japan"}:return "U-NEXT"
 if name in {"disney+","disney plus"}:return "Disney+"
 if name=="abema":return "ABEMA"
 if name in {"wowowオンデマンド","wowow on demand","wowow"}:return "WOWOWオンデマンド"
 if name=="hulu":return "Hulu"
 if name=="fod":return "FOD"
 if name in {"apple tv+","apple tv plus"}:return "Apple TV+"
 if name=="lemino":return "Lemino"
 if name=="dmm tv":return "DMM TV"
 if name=="telasa":return "TELASA"
 return None

def discover_provider_candidates(cache,state,api_key,opener=urllib.request.urlopen,now=None,max_pages=MAX_DAILY_DISCOVERY_PAGES,delay=0.25,deadline=None):
 """Discover exact TMDB movie IDs by Japan provider, then verify each via watch/providers."""
 now=now or datetime.datetime.now(datetime.timezone.utc)
 checked_at=now.astimezone(datetime.timezone.utc).isoformat()
 def get_json(url):
  timeout=6
  if deadline is not None:
   remaining=deadline-time.monotonic()
   if remaining<1:return None
   timeout=min(timeout,remaining)
  with opener(urllib.request.Request(url,headers={"Accept":"application/json","User-Agent":"CINELVA/1.0"}),timeout=timeout) as response:
   return json.load(response)
 provider_url="https://api.themoviedb.org/3/watch/providers/movie?"+urllib.parse.urlencode({"api_key":api_key,"watch_region":"JP","language":"ja-JP"})
 try:
  payload=get_json(provider_url)
  if not isinstance(payload,dict) or not isinstance(payload.get("results"),list):
   raise ValueError("invalid provider list response")
 except Exception as exc:
  print("availability provider discovery skipped:",type(exc).__name__)
  return 0,0,[],False
 provider_ids={}
 for provider in payload["results"]:
  if not isinstance(provider,dict):continue
  provider_id=provider.get("provider_id")
  if not isinstance(provider_id,int) or provider_id<=0:continue
  target=discovery_service(provider.get("provider_name"))
  if target:provider_ids.setdefault(target,[]).append(provider_id)
 services=sorted(provider_ids,key=lambda name:(DISCOVERY_SERVICE_ORDER.index(name),name))
 missing=[name for name in DISCOVERY_SERVICE_ORDER if name not in provider_ids]
 state=state if isinstance(state,dict) else {}
 state["provider_list_checked_at"]=checked_at
 state["missing_services"]=missing
 pages_state=state.setdefault("service_pages",{})
 if not isinstance(pages_state,dict):
  pages_state={};state["service_pages"]=pages_state
 if not services:
  state["next_service_index"]=0
  return 0,0,missing,True
 start=int(state.get("next_service_index",0) or 0)%len(services)
 ordered=services[start:]+services[:start]
 successes=added=attempted=0
 for service in ordered[:max(0,min(MAX_DAILY_DISCOVERY_PAGES,int(max_pages)))]:
  if deadline is not None and time.monotonic()>=deadline:break
  ids=sorted(provider_ids[service])
  provider_key="|".join(str(value) for value in ids)
  progress=pages_state.get(service,{})
  if not isinstance(progress,dict) or progress.get("provider_ids")!=provider_key:
   page=1
  else:
   try:page=max(1,int(progress.get("next_page",1)))
   except (TypeError,ValueError):page=1
  params={"api_key":api_key,"language":"ja-JP","watch_region":"JP","with_watch_providers":provider_key,
          "with_watch_monetization_types":"flatrate|free|ads|rent|buy","sort_by":"popularity.desc","include_adult":"false","page":str(page)}
  url="https://api.themoviedb.org/3/discover/movie?"+urllib.parse.urlencode(params)
  attempted+=1
  try:
   result=get_json(url)
   if not isinstance(result,dict) or not isinstance(result.get("results"),list) or int(result.get("page") or 0)!=page:
    raise ValueError("invalid discovery page response")
   total_pages=max(1,int(result.get("total_pages") or 1))
   for movie in result["results"]:
    if not isinstance(movie,dict):continue
    mid=movie.get("id");title=movie.get("title") or movie.get("original_title")
    if not isinstance(mid,int) or mid<=0 or not isinstance(title,str) or not title.strip():continue
    key=str(mid);item=cache.get(key)
    if not isinstance(item,dict):
     item={"title":title.strip(),"flatrate":[],"free":[],"ads":[],"rent":[],"buy":[],"services":[]}
     cache[key]=item;added+=1
    elif not item.get("title"):
     item["title"]=title.strip()
    if not item.get("poster"):
     poster=poster_url(movie.get("poster_path"))
     if poster:
      item["poster"]=poster
      item["poster_source"]="TMDB Japan provider discovery"
    cache[key]=item
   next_page=1 if page>=total_pages else page+1
   pages_state[service]={"provider_ids":provider_key,"next_page":next_page,"total_pages":total_pages,"last_page_at":checked_at}
   successes+=1
  except Exception as exc:
   print("availability provider page skipped:",service,type(exc).__name__)
   break
  if delay>0 and service!=ordered[-1]:
   time.sleep(min(delay,max(0,(deadline-time.monotonic()) if deadline is not None else delay)))
 state["next_service_index"]=(start+successes)%len(services)
 state["services_seen"]=services
 return successes,added,missing,True

def finish_snapshot(old, cache, count, now):
 if not count:return old
 return {**old,"generated_at":now,"source":"TMDB watch/providers (JustWatch)","country":"JP","note":"日本向け配信先の観測。配信開始日ではありません。更新日は作品ごとのchecked_atを参照。","movies":cache}

DAILY_OBSERVATION_LIMIT=60
MAX_DAILY_OBSERVATIONS=320
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
 batch_deadline=time.monotonic()+MAX_BATCH_SECONDS
 poster_reserve=min(60,max(1,MAX_BATCH_SECONDS*0.15))
 discovery_pages=discovery_added=0
 discovery_missing=[]
 discovery_list_checked=False
 if MAX_BATCH_SECONDS>60:
  discovery_state=old.get("provider_discovery",{})
  discovery_deadline=batch_deadline-poster_reserve-min(120,MAX_BATCH_SECONDS*0.33)
  discovery_pages,discovery_added,discovery_missing,discovery_list_checked=discover_provider_candidates(
   cache,discovery_state,KEY,opener=urllib.request.urlopen,deadline=discovery_deadline)
  if discovery_list_checked:old["provider_discovery"]=discovery_state
  print(f"Availability catalog discovery: pages={discovery_pages}; new TMDB IDs={discovery_added}; services without provider IDs={','.join(discovery_missing)}")
 candidates=build_candidates(movies,cache,TODAY)
 catalog_poster_updates=attach_catalog_posters(cache,movies)

 budget=observation_budget(len(candidates))
 selected=select_due_observations(candidates,cache,datetime.datetime.now(datetime.timezone.utc),limit=budget)
 count=0
 failed=0
 deadline=batch_deadline-poster_reserve
 for mid,(_,m) in selected:
  remaining=deadline-time.monotonic()
  if remaining<=0:
   print("::warning title=Provider refresh time budget::Stopping this batch and saving completed observations; unfinished titles remain due.")
   break
  url="https://api.themoviedb.org/3/movie/"+str(mid)+"/watch/providers?"+urllib.parse.urlencode({"api_key":KEY})
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"CINEMA-NOW/1.0"}),timeout=min(25,remaining)) as r:
    jp=(json.load(r).get("results") or {}).get("JP") or {}
   groups=provider_groups(jp)
   flatrate,free,ads,rent,buy=(groups[kind] for kind in ("flatrate","free","ads","rent","buy"))
   item=cache.get(str(mid),{"title":m.get("title"),"changes":[]})
   prev=(item.get("flatrate",item.get("services",[])),item.get("free",[]),item.get("ads",[]),item.get("rent",[]),item.get("buy",[]))
   current=(flatrate,free,ads,rent,buy)
   if prev!=current:
    item.setdefault("changes",[]).append({"observed_at":NOW,"flatrate":flatrate,"free":free,"ads":ads,"rent":rent,"buy":buy})
   item["services"]=flatrate
   item["flatrate"]=flatrate
   item["free"]=free
   item["ads"]=ads
   item["rent"]=rent
   item["buy"]=buy
   item["checked_at"]=NOW
   item["source_url"]=jp.get("link") or "https://www.themoviedb.org/movie/"+str(mid)+"/watch"
   item["title"]=m.get("title") or item.get("title")
   cache[str(mid)]=item
   count+=1
   time.sleep(min(0.25,max(0,deadline-time.monotonic())))
  except Exception as exc:
   failed+=1
   print("provider check skipped:",mid,type(exc).__name__)

 poster_updates,poster_failures,poster_attempted=enrich_missing_posters(cache,KEY,limit=MAX_DAILY_POSTER_LOOKUPS,deadline=batch_deadline)
 print(f"Availability poster catalog matches: {catalog_poster_updates}; TMDB detail lookups: {poster_attempted}; posters added: {poster_updates}; failures: {poster_failures}")
 print(f"Daily provider observation budget: {budget} (hard cap {MAX_DAILY_OBSERVATIONS}); eligible titles: {len(candidates)}; scheduled checks: {len(selected)}")
 if len(candidates)>budget*REFRESH_AFTER_DAYS:
  print("::warning title=Provider refresh capacity::Catalogue exceeds the bounded six-day refresh capacity; some observations may expire. UI must retain unknown/stale handling.")
 if count or catalog_poster_updates or poster_updates or poster_attempted or discovery_list_checked:
  result=finish_snapshot(old,cache,count,NOW) if count else {**old,"movies":cache}
  temporary=PATH.with_suffix('.tmp')
  temporary.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
  temporary.replace(PATH)
 else:
  print("No successful provider observations or poster updates; preserving previous snapshot and update timestamp")
 print(f"Watch provider snapshots updated: {count}; failed: {failed}; attempted: {count+failed}; deferred: {len(selected)-count-failed}")
 if selected and count==0:
  raise RuntimeError("All TMDB provider observations failed; previous snapshot preserved")

if __name__=="__main__":main()
