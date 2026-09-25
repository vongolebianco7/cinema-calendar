import json,datetime,urllib.parse,urllib.request
Q='[out:json][timeout:180];area["ISO3166-1"="JP"][admin_level=2]->.j;nwr["amenity"="cinema"](area.j);out center tags;'
def get():
 p=urllib.parse.urlencode({"data":Q}).encode()
 for u in ("https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"):
  try:
   r=urllib.request.Request(u,data=p,headers={"User-Agent":"CINEMAP cinema directory updater"})
   with urllib.request.urlopen(r,timeout=210) as x:return json.load(x)
  except Exception as e:last=e
 raise last
def v(t,*ks):
 for k in ks:
  if t.get(k):return str(t[k]).strip()
 return ""
rows=[];seen=set()
for e in get().get("elements",[]):
 t=e.get("tags",{});n=v(t,"name:ja","name");c=e.get("center",{});lat=e.get("lat",c.get("lat"));lon=e.get("lon",c.get("lon"))
 if not n:continue
 k=(n.replace(" ","").replace("　",""),round(float(lat),4) if lat else None,round(float(lon),4) if lon else None)
 if k in seen:continue
 seen.add(k);rows.append({"name":n,"prefecture":v(t,"addr:province","addr:state"),"municipality":v(t,"addr:city","addr:town","addr:village"),"address":v(t,"addr:full"),"lat":lat,"lon":lon,"website":v(t,"website","contact:website"),"operator":v(t,"operator"),"source":"OpenStreetMap","osm_type":e.get("type"),"osm_id":e.get("id")})
rows.sort(key=lambda x:(x["prefecture"],x["municipality"],x["name"]))
if len(rows)<300:raise RuntimeError("OSM cinema coverage unexpectedly low: "+str(len(rows)))
with open("data/theaters_osm.json","w",encoding="utf-8") as f:json.dump({"generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"source":"OpenStreetMap contributors","license":"ODbL 1.0","theaters":rows},f,ensure_ascii=False,indent=2)
print("OSM cinemas:",len(rows))\n# updater-version: 2
