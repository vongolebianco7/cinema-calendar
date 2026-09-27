from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
DISCOVER = ROOT / "discover.html"
TEST = ROOT / "tests" / "test_discover_people_explorer.py"

TEST_CONTENT = r'''from pathlib import Path

html = Path("discover.html").read_text(encoding="utf-8")

checks = {
    "dedicated people entry": 'id="openPersonExplorer"',
    "people explorer intro": 'id="personExploreIntro"',
    "people result sort": 'id="personSort"',
    "person immediate search": 'function runPersonExplore',
    "director label": '監督から探す',
    "cast label": 'キャストから探す',
    "three column results": '#grid.grid{grid-template-columns:repeat(3,minmax(0,1fr))!important',
}

missing = [name for name, marker in checks.items() if marker not in html]
if missing:
    raise SystemExit("missing people explorer features: " + ", ".join(missing))

# The feature must reuse the existing free Cinemap backend and must not add a new paid/external API endpoint.
if 'people-explorer-api' in html or 'person-search-api' in html:
    raise SystemExit("unexpected new external API integration marker")

print("discover people explorer checks passed")
'''

CSS = r'''<style id="cinemap-person-explorer-v1">
.personExploreLink{appearance:none;font:inherit;cursor:pointer}
.personExploreIntro{margin:14px 0 12px;padding:15px;border:1px solid #343434;border-radius:13px;background:linear-gradient(180deg,#151515,#101010)}
.personExploreIntro h2{margin:0;font-size:18px}.personExploreIntro p{margin:6px 0 11px;color:#979797;font-size:11px;line-height:1.6}
.personExploreChoices{display:grid;grid-template-columns:1fr 1fr;gap:8px}.personExploreChoice{border:1px solid #3a3a3a;border-radius:10px;background:#181818;color:#eee;padding:11px 12px;text-align:left;font-weight:850;cursor:pointer}.personExploreChoice small{display:block;margin-top:4px;color:#858585;font-size:9px;font-weight:600;line-height:1.4}
.resultTools{display:flex;justify-content:flex-end;margin:-4px 0 10px}.resultTools label{display:flex;align-items:center;gap:7px;color:#888;font-size:10px}.resultTools select{width:auto;min-width:154px;margin:0;padding:8px 28px 8px 9px}
.personBox.personFocus{outline:1px solid #777;outline-offset:6px;border-radius:8px}
@media(max-width:650px){.personExploreIntro{padding:13px}.personExploreChoices{grid-template-columns:1fr 1fr}.personExploreChoice{padding:10px}.resultTools{justify-content:stretch}.resultTools label{width:100%;justify-content:space-between}.resultTools select{min-width:0;flex:1}}
</style>'''

INTRO = r'''<section class="personExploreIntro" id="personExploreIntro"><h2>監督・キャストから探す</h2><p>好きな作り手や俳優を起点に、その人が関わった作品をまとめて辿れます。</p><div class="personExploreChoices"><button class="personExploreChoice" type="button" data-person-focus="director">監督から探す<small>監督名を検索してフィルモグラフィーを見る</small></button><button class="personExploreChoice" type="button" data-person-focus="cast">キャストから探す<small>俳優名を検索して出演作品を見る</small></button></div></section>'''

SORT = r'''<div class="resultTools" id="personResultTools" hidden><label>並び替え<select id="personSort"><option value="popularity.desc">人気順</option><option value="vote_average.desc">評価が高い順</option><option value="primary_release_date.desc">制作年 新しい順</option><option value="primary_release_date.asc">制作年 古い順</option><option value="title.asc">タイトル順</option></select></label></div>'''


def prepare_tests():
    TEST.parent.mkdir(parents=True, exist_ok=True)
    TEST.write_text(TEST_CONTENT, encoding="utf-8")


def must_replace(text, old, new, name):
    if old not in text:
        raise SystemExit(f"patch anchor missing: {name}")
    return text.replace(old, new, 1)


def apply():
    text = DISCOVER.read_text(encoding="utf-8")
    if 'id="openPersonExplorer"' in text:
        print("people explorer already applied")
        return

    text = must_replace(
        text,
        '</style>\n</head><body>',
        '</style>\n' + CSS + '\n</head><body>',
        "head style insertion",
    )

    old_links = '<div class="specialLinks"><a class="specialLink" href="rankings.html?axis=awards">受賞作から探す</a><a class="specialLink" href="rankings.html">ランキングから探す</a></div>'
    new_links = '<div class="specialLinks"><button class="specialLink personExploreLink" id="openPersonExplorer" type="button">監督・キャストから探す</button><a class="specialLink" href="rankings.html?axis=awards">受賞作から探す</a><a class="specialLink" href="rankings.html">ランキングから探す</a></div>'
    text = must_replace(text, old_links, new_links, "special links")

    text = must_replace(
        text,
        '<div class="exploreTabs">',
        INTRO + '<div class="exploreTabs">',
        "people intro",
    )

    text = must_replace(
        text,
        '<label class="personBox">監督<input class="personInput" id="director"',
        '<label class="personBox" id="directorPersonBox">監督から探す<input class="personInput" id="director"',
        "director label",
    )
    text = must_replace(
        text,
        '<label class="personBox">俳優<input class="personInput" id="cast"',
        '<label class="personBox" id="castPersonBox">キャストから探す<input class="personInput" id="cast"',
        "cast label",
    )

    text = must_replace(
        text,
        '<div class="grid" id="grid"></div>',
        SORT + '<div class="grid" id="grid"></div>',
        "sort controls",
    )

    old_build = 'function build(){let p=new URLSearchParams({page:String(page)}),era=$("#era").value,r=$("#rating").value,rt=$("#runtime").value,sort="popularity.desc";'
    new_build = 'function build(){let p=new URLSearchParams({page:String(page)}),era=$("#era").value,r=$("#rating").value,rt=$("#runtime").value,sort=$("#personSort")?.value||"popularity.desc";'
    text = must_replace(text, old_build, new_build, "build sort")

    old_people = 'async function people(inputId,boxId,kind){const el=$("#"+inputId),box=$("#"+boxId);let timer;'
    helper = '''function focusPersonField(kind){const id=kind==="director"?"director":"cast",box=$("#"+(kind==="director"?"directorPersonBox":"castPersonBox")),input=$("#"+id);document.querySelectorAll(".personBox.personFocus").forEach(x=>x.classList.remove("personFocus"));box?.classList.add("personFocus");input?.focus();input?.scrollIntoView({behavior:"smooth",block:"center"});setTimeout(()=>box?.classList.remove("personFocus"),1400)}\nfunction runPersonExplore(kind,id,name){if(kind==="director"){directorId=id;castId="";$("#cast").value=""}else{castId=id;directorId="";$("#director").value=""}$("#conditionResults").hidden=false;$("#personResultTools").hidden=false;$("#heading").textContent=name+(kind==="director"?"の監督作品":"の出演作品");load(true);$("#conditionResults").scrollIntoView({behavior:"smooth",block:"start"})}\nasync function people(inputId,boxId,kind){const el=$("#"+inputId),box=$("#"+boxId);let timer;'''
    text = must_replace(text, old_people, helper, "people helper")

    old_click = 'box.querySelectorAll("button").forEach(b=>b.onclick=()=>{el.value=b.dataset.name;if(kind==="director")directorId=b.dataset.id;else castId=b.dataset.id;box.hidden=true})'
    new_click = 'box.querySelectorAll("button").forEach(b=>b.onclick=()=>{el.value=b.dataset.name;box.hidden=true;runPersonExplore(kind,b.dataset.id,b.dataset.name)})'
    text = must_replace(text, old_click, new_click, "people suggestion click")

    old_apply = '$("#apply").onclick=()=>{$("#conditionResults").hidden=false;$("#heading").textContent="条件検索の結果";load(true)};'
    new_apply = '$("#apply").onclick=()=>{$("#conditionResults").hidden=false;$("#personResultTools").hidden=!(directorId||castId);$("#heading").textContent=directorId?($("#director").value+"の監督作品"):castId?($("#cast").value+"の出演作品"):"条件検索の結果";load(true)};'
    text = must_replace(text, old_apply, new_apply, "apply handler")

    hook = 'document.querySelectorAll("[data-explore-mode]").forEach(b=>b.onclick=()=>setExploreMode(b.dataset.exploreMode));'
    extra = hook + 'document.querySelectorAll("[data-person-focus]").forEach(b=>b.onclick=()=>{setExploreMode("filter");focusPersonField(b.dataset.personFocus)});const openPersonExplorer=$("#openPersonExplorer");if(openPersonExplorer)openPersonExplorer.onclick=()=>{setExploreMode("filter");$("#personExploreIntro")?.scrollIntoView({behavior:"smooth",block:"center"})};const personSort=$("#personSort");if(personSort)personSort.onchange=()=>{if(!$("#conditionResults").hidden&&items.length)load(true)};'
    text = must_replace(text, hook, extra, "people explorer bindings")

    # Deep links from movie detail already supply person/role/name. Make those results visible immediately.
    old_person_end = '$("#heading").textContent=(personName||"人物")+"の作品"}'
    new_person_end = '$("#heading").textContent=(personName||"人物")+"の作品";$("#conditionResults").hidden=false;$("#personResultTools").hidden=false;setTimeout(()=>load(true),0)}'
    text = must_replace(text, old_person_end, new_person_end, "person deep link")

    DISCOVER.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "apply"
    if cmd == "prepare-tests":
        prepare_tests()
    elif cmd == "apply":
        apply()
    else:
        raise SystemExit(f"unknown command: {cmd}")
