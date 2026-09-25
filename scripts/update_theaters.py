import json, datetime, re, urllib.request
from bs4 import BeautifulSoup

# 109シネマズ公式サイトで現在案内されている全20劇場。
# code は公式チケットサイト cinema.109cinemas.net の tsc 値。
THEATERS = [
    {"name":"109シネマズ富谷","code":"44","area":"宮城・富谷"},
    {"name":"109シネマズプレミアム新宿","code":"X1","area":"東京・新宿"},
    {"name":"109シネマズ佐野","code":"C1","area":"栃木・佐野"},
    {"name":"109シネマズ菖蒲","code":"M1","area":"埼玉・久喜"},
    {"name":"109シネマズ木場","code":"20","area":"東京・木場"},
    {"name":"109シネマズ二子玉川","code":"T1","area":"東京・二子玉川"},
    {"name":"109シネマズグランベリーパーク","code":"G1","area":"東京・南町田"},
    {"name":"109シネマズ港北","code":"13","area":"神奈川・港北"},
    {"name":"109シネマズ川崎","code":"I1","area":"神奈川・川崎"},
    {"name":"109シネマズ湘南","code":"R1","area":"神奈川・湘南"},
    {"name":"ムービル","code":"72","area":"神奈川・横浜"},
    {"name":"109シネマズゆめが丘","code":"Z1","area":"神奈川・ゆめが丘"},
    {"name":"109シネマズ名古屋","code":"A1","area":"愛知・名古屋"},
    {"name":"109シネマズ四日市","code":"63","area":"三重・四日市"},
    {"name":"109シネマズ明和","code":"36","area":"三重・明和"},
    {"name":"109シネマズ大阪エキスポシティ","code":"V1","area":"大阪・吹田"},
    {"name":"109シネマズ箕面","code":"54","area":"大阪・箕面"},
    {"name":"109シネマズHAT神戸","code":"E1","area":"兵庫・神戸"},
    {"name":"109シネマズ広島","code":"P1","area":"広島・広島"},
    {"name":"109シネマズ佐賀","code":"K1","area":"佐賀・佐賀"},
]

today=datetime.date.today()
days=[today+datetime.timedelta(days=i) for i in range(0,8)]
ua={"User-Agent":"Mozilla/5.0 (compatible; CINEMAP/1.0)"}
rows=[]
successful_theaters=set()

def clean(s):
    return re.sub(r"\s+"," ",s or "").strip()

for th in THEATERS:
    theater_row_count=0
    for day in days:
        ymd=day.strftime("%Y-%m-%d")
        url=f"https://cinema.109cinemas.net/cgi-bin/pc/site/det.cgi?tsc={th['code']}&ymd={ymd}"
        try:
            req=urllib.request.Request(url,headers=ua)
            with urllib.request.urlopen(req,timeout=30) as r:
                raw=r.read()
            soup=BeautifulSoup(raw,"html.parser")
        except Exception as e:
            print("skip",th["name"],ymd,e)
            continue

        headings=soup.find_all(["h2","h3"])
        current_title=None
        seen=set()
        for h in headings:
            txt=clean(h.get_text(" ",strip=True))
            if not txt:
                continue
            if h.name=="h2":
                if txt in ("上映スケジュール",th["name"],th["name"].replace("109シネマズ","").upper()):
                    continue
                if re.fullmatch(r"[A-Z0-9][A-Z0-9 .:/&'!\\-]+",txt):
                    continue
                if txt.startswith(("SUB]","DUB]","IMAX","4DX","SCREENX","Atmos]")):
                    continue
                current_title=txt
            elif h.name=="h3" and current_title and ("シアター" in txt or "THEATER" in txt.upper()):
                bits=[]
                for node in h.next_elements:
                    if node is h:
                        continue
                    if getattr(node,"name",None) in ("h2","h3"):
                        break
                    if getattr(node,"name",None) is not None:
                        continue
                    t=clean(str(node))
                    if t:
                        bits.append(t)
                blob=" ".join(bits)
                times=re.findall(r"([0-2]?\d:[0-5]\d)\s*[～〜~-]\s*([0-2]?\d:[0-5]\d)",blob)
                for start_time,end_time in times:
                    key=(current_title,txt,start_time,end_time)
                    if key in seen:
                        continue
                    seen.add(key)
                    rows.append({
                        "title":current_title,
                        "date":ymd,
                        "theater":th["name"],
                        "area":th["area"],
                        "screen":txt,
                        "start":start_time,
                        "end":end_time,
                        "source_url":url
                    })
                    theater_row_count+=1
    if theater_row_count:
        successful_theaters.add(th["name"])
    else:
        print("warning: no parsed showtimes for",th["name"])

out={
    "generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "source":"109シネマズ公式上映スケジュール",
    "note":"作品詳細内の劇場別上映時刻表示用。109シネマズ公式サイトで案内されている全20劇場を対象に取得。",
    "coverage":{
        "requested_theaters":len(THEATERS),
        "parsed_theaters":len(successful_theaters),
        "days":len(days)
    },
    "theaters":[{"name":x["name"],"area":x["area"],"code":x["code"]} for x in THEATERS],
    "schedules":rows
}
if not rows:
    raise RuntimeError("Theater parsing returned 0 showtimes; retaining previously verified schedule")
with open("data/theater_schedules.json","w",encoding="utf-8") as f:
    json.dump(out,f,ensure_ascii=False,indent=2)
print("theater schedule rows:",len(rows),"theaters:",len(successful_theaters),"/",len(THEATERS))
