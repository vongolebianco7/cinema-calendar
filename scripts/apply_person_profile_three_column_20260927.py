from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
DISCOVER = ROOT / "discover.html"
TEST = ROOT / "tests" / "test_person_profile_three_column.py"

TEST_CONTENT = r'''from pathlib import Path
html = Path("discover.html").read_text(encoding="utf-8")
checks = {
  "person profile": 'id="personProfile"',
  "representative works": 'id="personRepresentativeGrid"',
  "top rated works": 'id="personTopRatedGrid"',
  "role switch": 'data-person-role="director"',
  "cast role switch": 'data-person-role="cast"',
  "decade filter": 'data-person-decade="2010"',
  "profile renderer": 'function renderPersonProfile',
  "three column hard lock": '/* discover-three-column-results-v2 */',
}
missing = [k for k,v in checks.items() if v not in html]
if missing:
  raise SystemExit("missing: " + ", ".join(missing))
if '/* mobile-movie-rails-v1 */' in html:
  raise SystemExit("legacy mobile one-row result rail still present")
if '#grid.grid{display:flex!important' in html:
  raise SystemExit("search result grid still forced to horizontal flex")
print("person profile + three-column search checks passed")
'''

CSS = r'''<style id="cinemap-person-profile-v2">
/* discover-three-column-results-v2 */
#grid.grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;width:100%!important;max-width:100%!important;overflow:visible!important;padding-bottom:25px!important}
#grid .card{width:auto!important;min-width:0!important;max-width:none!important;flex:none!important}
.personProfile{display:none;margin:18px 0 10px;padding:16px;border:1px solid #343434;border-radius:14px;background:#101010}.personProfile.show{display:block}.personProfileHead{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}.personProfileName{margin:0;font-size:25px;line-height:1.15}.personProfileRole{margin-top:5px;color:#8d929a;font-size:11px}.personRoleTabs,.personDecades{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none}.personRoleTabs{margin-top:13px}.personDecades{margin-top:9px}.personRoleTabs::-webkit-scrollbar,.personDecades::-webkit-scrollbar{display:none}.personRoleTab,.personDecade{white-space:nowrap;border:1px solid #343434;background:#171717;color:#ddd;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:800}.personRoleTab.active,.personDecade.active{background:#eee;color:#111;border-color:#eee}.personProfileSection{margin-top:18px}.personProfileSectionHead{display:flex;align-items:end;justify-content:space-between;gap:10px;margin-bottom:9px}.personProfileSectionHead h3{margin:0;font-size:16px}.personProfileSectionHead span{color:#777;font-size:9px}.personHighlightGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.personFeatureCard{display:block;border:1px solid #292929;border-radius:8px;background:#111;color:inherit;overflow:hidden;text-align:left;padding:0}.personFeatureCard .poster{aspect-ratio:2/3}.personFeatureCard .body{padding:6px}.personFeatureCard .title{font-size:10px}.personFeatureCard .meta{font-size:8px}.personProfileEmpty{color:#777;font-size:11px;padding:8px 0}
@media(max-width:650px){#grid.grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}.personProfile{padding:13px}.personProfileName{font-size:22px}.personHighlightGrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}}
</style>'''

PROFILE = r'''<section class="personProfile" id="personProfile"><div class="personProfileHead"><div><h2 class="personProfileName" id="personProfileName"></h2><div class="personProfileRole" id="personProfileRole"></div></div></div><div class="personRoleTabs" id="personRoleTabs"><button class="personRoleTab" type="button" data-person-role="director">監督作品</button><button class="personRoleTab" type="button" data-person-role="cast">出演作品</button></div><div class="personDecades" id="personDecades"><button class="personDecade active" type="button" data-person-decade="">すべて</button><button class="personDecade" type="button" data-person-decade="2020">2020年代</button><button class="personDecade" type="button" data-person-decade="2010">2010年代</button><button class="personDecade" type="button" data-person-decade="2000">2000年代</button><button class="personDecade" type="button" data-person-decade="older">1999年以前</button></div><section class="personProfileSection"><div class="personProfileSectionHead"><h3>代表作</h3><span>人気・評価をもとに表示</span></div><div class="personHighlightGrid" id="personRepresentativeGrid"></div></section><section class="personProfileSection"><div class="personProfileSectionHead"><h3>最高評価作</h3><span>評価順</span></div><div class="personHighlightGrid" id="personTopRatedGrid"></div></section></section>'''


def prepare_tests():
    TEST.parent.mkdir(parents=True, exist_ok=True)
    TEST.write_text(TEST_CONTENT, encoding="utf-8")


def must_replace(text, old, new, name):
    if old not in text:
        raise SystemExit(f"patch anchor missing: {name}")
    return text.replace(old, new, 1)


def apply():
    text = DISCOVER.read_text(encoding="utf-8")
    if 'id="personProfile"' in text and '/* discover-three-column-results-v2 */' in text:
        print("person profile already applied")
        return

    # Remove the old mobile rule that converts condition/search results into a one-row horizontal rail.
    start = text.find('<style>/* mobile-movie-rails-v1 */')
    if start != -1:
        end = text.find('</style>', start)
        if end == -1:
            raise SystemExit("mobile rail style end missing")
        text = text[:start] + text[end + len('</style>'):]

    text = must_replace(text, '<style id="cinemap-person-explorer-v1">', CSS + '\n<style id="cinemap-person-explorer-v1">', 'profile css')
    text = must_replace(text, '<section class="personMode" id="personMode">', PROFILE + '<section class="personMode" id="personMode">', 'profile markup')

    old_let = 'let genre="",preset="rated",page=1,totalPages=1,items=[],presetItems=[],theatricalPopular=[],streamingPopular=[],theatricalSource=[],streamingSource=[],directorId="",castId="";'
    new_let = 'let genre="",preset="rated",page=1,totalPages=1,items=[],presetItems=[],theatricalPopular=[],streamingPopular=[],theatricalSource=[],streamingSource=[],directorId="",castId="",currentPersonId="",currentPersonName="",currentPersonKind="",personDecade="";'
    text = must_replace(text, old_let, new_let, 'person state')

    old_build_tail = 'if(directorId)p.set("crew",directorId);if(castId)p.set("cast",castId);p.set("sort",sort);return p}'
    new_build_tail = 'if(directorId)p.set("crew",directorId);if(castId)p.set("cast",castId);if((directorId||castId)&&personDecade){if(personDecade==="older")p.set("to","1999");else{p.set("from",personDecade);p.set("to",String(+personDecade+9))}}p.set("sort",sort);return p}'
    text = must_replace(text, old_build_tail, new_build_tail, 'decade build')

    old_load = 'items=items.concat(d.movies||[]);render();$("#status").textContent=(d.total_results||items.length).toLocaleString()+"作品";'
    new_load = 'items=items.concat(d.movies||[]);render();renderPersonProfile();$("#status").textContent=(d.total_results||items.length).toLocaleString()+"作品";'
    text = must_replace(text, old_load, new_load, 'profile render after load')

    old_run = 'function runPersonExplore(kind,id,name){if(kind==="director"){directorId=id;castId="";$("#cast").value=""}else{castId=id;directorId="";$("#director").value=""}$("#conditionResults").hidden=false;$("#personResultTools").hidden=false;$("#heading").textContent=name+(kind==="director"?"の監督作品":"の出演作品");load(true);$("#conditionResults").scrollIntoView({behavior:"smooth",block:"start"})}'
    new_run = '''function personCardHtml(m){return '<button class="personFeatureCard" data-person-movie="'+E(m.tmdbId||m.id||"")+'"><div class="poster">'+(m.poster?'<img loading="lazy" src="'+E(m.poster)+'">':'')+'</div><div class="body"><div class="title">'+E(m.title||"")+'</div><div class="meta">'+E(m.year||"")+' · ★ '+Number(m.score||0).toFixed(1)+'</div></div></button>'}\nfunction renderPersonProfile(){const profile=$("#personProfile");if(!profile)return;const active=!!(currentPersonId&&(directorId||castId));profile.classList.toggle("show",active);if(!active)return;$("#personProfileName").textContent=currentPersonName||"人物";$("#personProfileRole").textContent=currentPersonKind==="director"?"監督作品を探索中":"出演作品を探索中";document.querySelectorAll("[data-person-role]").forEach(b=>b.classList.toggle("active",b.dataset.personRole===currentPersonKind));document.querySelectorAll("[data-person-decade]").forEach(b=>b.classList.toggle("active",b.dataset.personDecade===personDecade));const rep=[...items].sort((a,b)=>(Number(b.popularity||0)+Number(b.score||0)*10+Number(b.votes||0)/100)-(Number(a.popularity||0)+Number(a.score||0)*10+Number(a.votes||0)/100)).slice(0,5),rated=[...items].filter(x=>Number(x.score||0)>0).sort((a,b)=>Number(b.score||0)-Number(a.score||0)||Number(b.votes||0)-Number(a.votes||0)).slice(0,5);$("#personRepresentativeGrid").innerHTML=rep.map(personCardHtml).join("")||'<div class="personProfileEmpty">表示できる作品がありません。</div>';$("#personTopRatedGrid").innerHTML=rated.map(personCardHtml).join("")||'<div class="personProfileEmpty">評価データがありません。</div>';document.querySelectorAll("[data-person-movie]").forEach(b=>b.onclick=()=>{const m=items.find(x=>String(x.tmdbId||x.id)===b.dataset.personMovie);location.href="search.html?"+new URLSearchParams({id:b.dataset.personMovie,search:m?.title||""}).toString()})}\nfunction setPersonRole(kind){if(!currentPersonId)return;currentPersonKind=kind;if(kind==="director"){directorId=currentPersonId;castId=""}else{castId=currentPersonId;directorId=""}$("#heading").textContent=currentPersonName+(kind==="director"?"の監督作品":"の出演作品");load(true)}\nfunction runPersonExplore(kind,id,name){currentPersonId=id;currentPersonName=name;currentPersonKind=kind;personDecade="";if(kind==="director"){directorId=id;castId="";$("#cast").value=""}else{castId=id;directorId="";$("#director").value=""}$("#conditionResults").hidden=false;$("#personResultTools").hidden=false;$("#heading").textContent=name+(kind==="director"?"の監督作品":"の出演作品");renderPersonProfile();load(true);$("#conditionResults").scrollIntoView({behavior:"smooth",block:"start"})}'''
    text = must_replace(text, old_run, new_run, 'person profile functions')

    old_qp = 'const qp=new URLSearchParams(location.search),person=qp.get("person"),role=qp.get("role"),personName=qp.get("name"),fromId=qp.get("fromId"),fromTitle=qp.get("from");if(person){'
    new_qp = 'const qp=new URLSearchParams(location.search),person=qp.get("person"),role=qp.get("role"),personName=qp.get("name"),fromId=qp.get("fromId"),fromTitle=qp.get("from");if(person){currentPersonId=person;currentPersonName=personName||"人物";currentPersonKind=(role==="監督"||role==="脚本"||role==="撮影"||role==="音楽"||role==="編集")?"director":"cast";'
    text = must_replace(text, old_qp, new_qp, 'deep link person state')

    hook = 'const personSort=$("#personSort");if(personSort)personSort.onchange=()=>{if(!$("#conditionResults").hidden&&items.length)load(true)};'
    extra = hook + 'document.querySelectorAll("[data-person-role]").forEach(b=>b.onclick=()=>setPersonRole(b.dataset.personRole));document.querySelectorAll("[data-person-decade]").forEach(b=>b.onclick=()=>{if(!currentPersonId)return;personDecade=b.dataset.personDecade;load(true)});'
    text = must_replace(text, hook, extra, 'profile controls')

    DISCOVER.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "apply"
    if cmd == "prepare-tests": prepare_tests()
    elif cmd == "apply": apply()
    else: raise SystemExit(f"unknown command: {cmd}")
