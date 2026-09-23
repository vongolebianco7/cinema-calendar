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

        # The official page nests the showtime table below the screen heading.
        # next_siblings of h3 is often empty, so walk text nodes until
        # the next movie/screen heading instead.
        from bs4 import Tag, NavigableString
        headings=soup.find_all(["h2","h3"])
        current_title=None
        seen=set()
        for h in headings:
            txt=clean(h.get_text(" ",strip=True))
            if not txt:continue
            if h.name=="h2":
                if txt in ("上映スケジュール",th["name"],th["name"].replace("109シネマズ","").upper()):continue
                if re.fullmatch(r"[A-Z0-9][A-Z0-9 .:/&'!\\-]+",txt):continue
                if txt.startswith(("SUB]","DUB]","IMAX","4DX","SCREENX")):continue
                current_title=txt
            elif h.name=="h3" and current_title and ("シアター" in txt or "THEATER" in txt.upper()):
                # The screening time may be nested in another div, not an h3 sibling.
                # Walk the document until the next heading, across container boundaries.
                bits=[]
                for node in h.next_elements:
                    if node is h:continue
                    if getattr(node,"name",None) in ("h2","h3"):break
                    if getattr(node,"name",None) is not None:continue
                    t=clean(str(node))
                    if t:bits.append(t)
                blob=" ".join(bits)
                times=re.findall(r"([0-2]?\d:[0-5]\d)\s*[～〜~-]\s*([0-2]?\d:[0-5]\d)",blob)
                for start_time,end_time in times:
                    key=(current_title,txt,start_time,end_time)
                    if key in seen:continue
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

out={
    "generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "source":"109シネマズ公式上映スケジュール",
    "note":"作品詳細内の劇場別上映時刻表示用。現在は109シネマズ港北・川崎・二子玉川を公式スケジュールから取得。",
    "theaters":[{"name":x["name"],"area":x["area"],"code":x["code"]} for x in THEATERS],
    "schedules":rows
}
if not rows:
    # Do not turn a temporary website-layout change into false "no showtimes" data.
    raise RuntimeError("Theater parsing returned 0 showtimes; retaining previously verified schedule")
with open("data/theater_schedules.json","w",encoding="utf-8") as f:
    json.dump(out,f,ensure_ascii=False,indent=2)
print("theater schedule rows:",len(rows))
