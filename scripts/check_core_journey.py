import pathlib, sys

ROOT=pathlib.Path(__file__).resolve().parents[1]
errors=[]

def read(p): return (ROOT/p).read_text(encoding="utf-8")

critic=read("critic.html")
search=read("search.html")
index=read("index.html")
rankings=read("rankings.html")
my=read("my-cinemap.html")
discover=read("discover.html")

checks={
 "critic evidence view":(critic,["js/critic-evidence.js","批評の傾向","出典を見る","sessionStorage"]),
 "critic movie detail link":(critic,["作品情報・映画DNAへ戻る","search.html?id="]),
 "search standalone critic entry":(search,["批評の傾向と出典を見る","critic.html?id="]),
 "search inline evidence":(search,["js/critic-evidence.js","data/critic_evidence.json","function renderInlineCriticism(","批評情報がまだ十分に集まっていません"]),
 "calendar deep dive":(index,["批評の傾向を見る","作品詳細・Movie DNAへ"]),
 "ranking internal detail":(rankings,["Cinemapで深掘る","search.html?id="]),
 "my cinemap deep dive":(my,["critic.html?id=","search.html?id="]),
 "creator origin cycle":(discover,["元の作品の批評へ戻る","MOVIE DNA · CREATOR PATH"]),
}
for name,(body,needles) in checks.items():
    for needle in needles:
        if needle not in body:
            errors.append(f"{name} missing: {needle}")

# The work page must not infer actual critical opinions from metadata.
if "criticTopics(" in critic or "criticTopics(" in search:
    errors.append("Criticism must not be inferred from synopsis or movie metadata")

if errors:
    print("Cinemap core journey gate failed:")
    for e in errors: print("-",e)
    sys.exit(1)
print("Cinemap core journey gate passed.")
