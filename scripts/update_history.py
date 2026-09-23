"""Preserve previously published, source-linked cinema calendar records.

History is an archive of *announced/scheduled* entries, not proof that a
screening or broadcast actually happened. No streaming-premiere dates are
inferred from current watch-provider availability.
"""
import datetime
import json
from pathlib import Path

DATA=Path("data")
NOW=datetime.datetime.now(datetime.timezone.utc).isoformat()
TODAY=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date().isoformat()
DEST=DATA/"release_history.json"

def load(path, default):
    try:
        with open(path,encoding="utf-8") as fp:
            return json.load(fp)
    except (FileNotFoundError,json.JSONDecodeError):
        return default

history=load(DEST,{"generated_at":None,"note":"出典付きの公開・配信開始・テレビ放映予定の掲載履歴。実際の上映・放映を保証する記録ではありません。","records":[]})
records=history.get("records",[])
seen={(r.get("kind"),r.get("date"),r.get("service"),str(r.get("id") or ""),r.get("title")) for r in records}

def ingest(rows, kind):
    for m in rows:
        day=m.get("date")
        if not day or day>TODAY or not m.get("title"):
            continue
        # TV must have a broadcaster's source; streaming must have a dated
        # official announcement. TMDB's Japanese theatrical release is a
        # planned release date, not a ticket/screening observation.
        if kind in ("tv","streaming") and not m.get("source_url"):
            continue
        r={
            "kind":kind,"title":m["title"],"id":m.get("id"),
            "original_title":m.get("original_title"),"date":day,
            "service":m.get("service"),"time":m.get("time"),
            "program":m.get("program"),"source":m.get("source") or ("TMDB JP release dates" if kind=="theatrical" else None),
            "source_url":m.get("source_url") or m.get("tmdb"),
            "record_type":"掲載した予定日（実施確認なし）",
        }
        key=(r["kind"],r["date"],r["service"],str(r["id"] or ""),r["title"])
        if key not in seen:
            seen.add(key)
            records.append(r)

theatrical=load(DATA/"theatrical.json",{}).get("movies",[])
tv=load(DATA/"tv.json",{}).get("movies",[])
streaming=load(DATA/"streaming.json",{}).get("movies",[])
ingest(theatrical,"theatrical")
ingest(tv,"tv")
ingest(streaming,"streaming")
# Auto-imported Netflix movies are only in movies.json.
all_movies=load(DATA/"movies.json",{}).get("movies",[])
ingest([m for m in all_movies if m.get("event")=="streaming"],"streaming")
records.sort(key=lambda m:(m.get("date") or "",m.get("kind") or "",m.get("title") or ""))
history["generated_at"]=NOW
history["records"]=records
with open(DEST,"w",encoding="utf-8") as fp:
    json.dump(history,fp,ensure_ascii=False,indent=2)
print("release history records:",len(records))
