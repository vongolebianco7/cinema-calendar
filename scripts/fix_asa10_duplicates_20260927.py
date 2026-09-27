from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "index.html"
text = path.read_text(encoding="utf-8")

anchor = '''function groupedMovieCards(weekMovies,modeName){\n'''
helper = '''function dedupeMorningTenWeek(rows){\n const seen=new Set();\n return rows.filter(m=>{\n  if(m.special_screening!=="asa10")return true;\n  const key=revivalNorm(morningTenQuery(m.title));\n  if(!key)return true;\n  if(seen.has(key))return false;\n  seen.add(key);\n  return true\n })\n}\n'''
if helper not in text:
    if anchor not in text:
        raise SystemExit("groupedMovieCards anchor not found")
    text = text.replace(anchor, helper + anchor, 1)

old = '''   let weekMovies=filtered().filter(m=>{\n    if(!m.date)return false;let d=new Date(m.date+"T00:00:00"),z=new Date((m.end_date||m.date)+"T00:00:00");return d<=we&&z>=ws\n   }).sort((a,b)=>a.date.localeCompare(b.date)||popularitySort(a,b));\n'''
new = '''   let weekMovies=filtered().filter(m=>{\n    if(!m.date)return false;let d=new Date(m.date+"T00:00:00"),z=new Date((m.end_date||m.date)+"T00:00:00");return d<=we&&z>=ws\n   });\n   weekMovies=dedupeMorningTenWeek(weekMovies).sort((a,b)=>a.date.localeCompare(b.date)||popularitySort(a,b));\n'''
if old not in text:
    if new not in text:
        raise SystemExit("theatrical weekMovies block not found")
else:
    text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")
print("Applied Morning Ten festival weekly title dedupe")
