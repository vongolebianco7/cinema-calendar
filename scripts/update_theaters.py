import json, datetime, re, urllib.request
from bs4 import BeautifulSoup

THEATERS = [
    {"name":"109シネマズ港北","code":"1137","area":"神奈川・港北"},
    {"name":"109シネマズ川崎","code":"1150","area":"神奈川・川崎"},
    {"name":"109シネマズ二子玉川","code":"T1","area":"東京・二子玉川"},
]

today=datetime.date.today()
days=[today+datetime.timedelta(days=i) for i in range(0,8)]
ua={"User-Agent":"Mozilla/5.0 (compatible; CINEMA-NOW/1.0)"}
rows=[]

def clean(s):
    return re.sub(r"\s+"," ",s or "").strip()

for th in THEATERS:
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
        current_theater=None
        current_times=[]
        seen=set()

        # Parse by heading sections. 109 pages expose movie names as h2 and screens as h3.
        for h in headings:
            txt=clean(h.get_text(" ",strip=True))
            if not txt:
                continue
            if h.name=="h2":
                # Ignore page headings and obvious all-uppercase duplicate/original-title headings.
                if txt in ("上映スケジュール",th["name"],th["name"].replace("109シネマズ","").upper()):
                    continue
                if re.fullmatch(r"[A-Z0-9][A-Z0-9 .:/&'!\-]+",txt):
                    continue
                current_title=txt
                current_theater=None
            elif h.name=="h3" and current_title and ("シアター" in txt or "THEATER" in txt.upper()):
                current_theater=txt
                # Search text until next heading for hh:mm～hh:mm pairs.
                bits=[]
                for sib in h.next_siblings:
                    if getattr(sib,"name",None) in ("h2","h3"):
                        break
                    t=clean(sib.get_text(" ",strip=True) if hasattr(sib,"get_text") else str(sib))
                    if t:
                        bits.append(t)
                blob=" ".join(bits)
                times=re.findall(r"([0-2]?\d:[0-5]\d)\s*[～〜~-]\s*([0-2]?\d:[0-5]\d)",blob)
                for start,end in times:
                    key=(current_title,current_theater,start,end)
                    if key in seen: continue
                    seen.add(key)
                    rows.append({
                        "title":current_title,
                        "date":ymd,
                        "theater":th["name"],
                        "area":th["area"],
                        "screen":current_theater,
                        "start":start,
                        "end":end,
                        "source_url":url
                    })

out={
    "generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "source":"109シネマズ公式上映スケジュール",
    "note":"作品詳細内の劇場別上映時刻表示用。現在は109シネマズ港北・川崎・二子玉川を公式スケジュールから取得。",
    "theaters":[{"name":x["name"],"area":x["area"],"code":x["code"]} for x in THEATERS],
    "schedules":rows
}
with open("data/theater_schedules.json","w",encoding="utf-8") as f:
    json.dump(out,f,ensure_ascii=False,indent=2)
print("theater schedule rows:",len(rows))
