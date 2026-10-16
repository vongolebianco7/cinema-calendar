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
 "critic movie detail link":(critic,["作品情報へ戻る","search.html?id="]),
 "search standalone critic entry":(search,["批評の傾向と出典を見る","critic.html?id="]),
 "search inline evidence":(search,["js/critic-evidence.js","data/critic_evidence.json","function renderInlineCriticism(","批評情報がまだ十分に集まっていません"]),
 "calendar meaningful detail":(index,["公開・配信・放送の履歴と出典を確認する","監督・出演者","上映方式"]),
 "ranking internal detail":(rankings,["Cinelvaで深掘る","search.html?id="]),
 # My Cinelva keeps records local and routes to record-based image sharing.
 "my cinelva record sharing":(my,["href=\"my-cinelva/\"","鑑賞実績の共有画像","cinelva-share-image.js"]),
 "creator origin cycle":(discover,["元の作品の批評へ戻る","作り手の作品をたどる"]),
}
for name,(body,needles) in checks.items():
    for needle in needles:
        if needle not in body:
            errors.append(f"{name} missing: {needle}")

# The work page must not infer actual critical opinions from metadata.
if "criticTopics(" in critic or "criticTopics(" in search:
    errors.append("Criticism must not be inferred from synopsis or movie metadata")
if 'class="criticPreviewCta" href="critic.html?id=' not in search:
    errors.append("Movie detail criticism link must be a valid anchor")

if errors:
    print("Cinemap core journey gate failed:")
    for e in errors: print("-",e)
    sys.exit(1)
print("Cinemap core journey gate passed.")
