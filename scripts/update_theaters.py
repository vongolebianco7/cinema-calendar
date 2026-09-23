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
            if h.name=="h2":
                if not txt or txt in ("上映スケジュール",th["name"]):
                    continue
                # English/original title headings repeat the Japanese name.
                if txt.isascii() and txt.upper()==txt:
                    continue
                if txt.startswith(("上映スケジュール", "作品詳細")):
                    continue
                current_title=txt
                continue
            if h.name!="h3" or not current_title:
                continue
            if "シアター" not in txt and "THEATER" not in txt.upper():
                continue
            # The Japanese and English headings can occur consecutively.
            screen=re.search(r"(?:シアター|THEATER)\\s*([0-9]+)",txt,re.I)
            screen_name="シアター"+screen.group(1) if screen else txt
            bits=[]
            for node in h.next_elements:
                if isinstance(node,Tag) and node.name in ("h2","h3"):
                    break
                if isinstance(node,NavigableString):
                    val=clean(str(node))
                    if val: bits.append(val)
            blob=" ".join(bits)
            times=re.findall(r"([0-2]?\\d:[0-5]\\d)\\s*[～〜~\\-]\\s*([0-2]?\\d:[0-5]\\d)",blob)
            for start,end in times:
                key=(current_title,screen_name,start,end)
                if key in seen: continue
                seen.add(key)
                rows.append({
                    "title":current_title,
                    "date":ymd,
                    "theater":th["name"],
                    "area":th["area"],
                    "screen":screen_name,
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
