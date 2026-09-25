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
 "critic semantic theme lens":(critic,["themeKey:","lensValue(","findLensTopic(","同じテーマで比べる"]),
 "critic grouped map":(critic,["この作品から生まれる論点","映画の作りから見る論点"]),
 "critic creator cycle":(critic,["同じ監督を辿る","discover.html?person="]),
 "critic comparison cycle":(critic,["data-related-id","fromId","同じ視点："]),
 "search standalone critic entry":(search,["Critic Mapで深掘る","critic.html?id="]),
 "calendar deep dive":(index,["Critic Mapを開く","作品詳細・Movie DNAへ"]),
 "ranking internal detail":(rankings,["Cinemapで深掘る","search.html?id="]),
 "my cinemap deep dive":(my,["critic.html?id=","search.html?id="]),
 "creator origin cycle":(discover,["元の作品のCritic Mapへ戻る","MOVIE DNA · CREATOR PATH"]),
}
for name,(body,needles) in checks.items():
    for needle in needles:
        if needle not in body:
            errors.append(f"{name} missing: {needle}")

# Keep the full Critic Map in one place only.
if "criticMap" in search and "criticPreview" not in search:
    errors.append("Search movie detail still owns the full Critic Map instead of previewing standalone Critic Map")

if errors:
    print("Cinemap core journey gate failed:")
    for e in errors: print("-",e)
    sys.exit(1)
print("Cinemap core journey gate passed.")
