import os,json,urllib.request,urllib.parse,datetime
KEY=os.environ["TMDB_API_KEY"]; BASE="https://api.themoviedb.org/3"
def get(path,params={}):
 p=dict(params);p["api_key"]=KEY;p.setdefault("language","ja-JP")
 with urllib.request.urlopen(BASE+path+"?"+urllib.parse.urlencode(p),timeout=30) as r:return json.load(r)
providers=get("/watch/providers/movie",{"watch_region":"JP"}).get("results",[])
wanted={"Netflix","Amazon Prime Video","Disney Plus","U-NEXT","Hulu"}
pmap={p["provider_id"]:p["provider_name"] for p in providers if p["provider_name"] in wanted}
today=datetime.date.today(); start=today-datetime.timedelta(days=14); end=today+datetime.timedelta(days=45)
items={}
for page in range(1,6):
 data=get("/discover/movie",{"region":"JP","watch_region":"JP","with_watch_monetization_types":"flatrate","primary_release_date.gte":str(start),"primary_release_date.lte":str(end),"sort_by":"popularity.desc","page":page})
 for m in data.get("results",[]):
  try:w=get(f"/movie/{m['id']}/watch/providers").get("results",{}).get("JP",{})
  except:continue
  sv=[]
  for x in w.get("flatrate",[]): 
   if x.get("provider_id") in pmap: sv.append(pmap[x["provider_id"]])
  if not sv:continue
  items[m["id"]]={"id":m["id"],"title":m.get("title"),"original_title":m.get("original_title"),"date":m.get("release_date"),"poster":("https://image.tmdb.org/t/p/w500"+m["poster_path"]) if m.get("poster_path") else None,"score":m.get("vote_average"),"votes":m.get("vote_count"),"overview":m.get("overview"),"services":sorted(set(sv)),"tmdb":"https://www.themoviedb.org/movie/"+str(m["id"])}
out={"generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"note":"TMDB/JustWatch provider availability snapshot for Japan. Release date is used as calendar date; it is not guaranteed to be the streaming-start date.","movies":list(items.values())}
os.makedirs("data",exist_ok=True)
json.dump(out,open("data/movies.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
