from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
DISCOVER = ROOT / "discover.html"
TEST = ROOT / "tests" / "test_person_profile_objective_only.py"

TEST_CONTENT = r'''from pathlib import Path
html = Path("discover.html").read_text(encoding="utf-8")
for marker in [
    '代表作',
    '最高評価作',
    'id="personRepresentativeGrid"',
    'id="personTopRatedGrid"',
    '人気・評価をもとに表示',
]:
    if marker in html:
        raise SystemExit(f"subjective person profile marker remains: {marker}")
for marker in [
    'id="personProfile"',
    'data-person-role="director"',
    'data-person-role="cast"',
    'data-person-decade="2010"',
    'id="personSort"',
    '/* discover-three-column-results-v2 */',
]:
    if marker not in html:
        raise SystemExit(f"objective person profile feature missing: {marker}")
print("objective-only person profile checks passed")
'''


def prepare_tests():
    TEST.parent.mkdir(parents=True, exist_ok=True)
    TEST.write_text(TEST_CONTENT, encoding="utf-8")


def apply():
    text = DISCOVER.read_text(encoding="utf-8")

    # Remove the two subjective highlight sections while retaining role/decade controls and the full filmography grid.
    start = text.find('<section class="personProfileSection"><div class="personProfileSectionHead"><h3>代表作</h3>')
    if start != -1:
        end_marker = '</section><section class="personProfileSection"><div class="personProfileSectionHead"><h3>最高評価作</h3><span>評価順</span></div><div class="personHighlightGrid" id="personTopRatedGrid"></div></section>'
        end = text.find(end_marker, start)
        if end == -1:
            raise SystemExit("subjective person sections end anchor missing")
        text = text[:start] + text[end + len(end_marker):]

    # Simplify renderer: profile header/tabs only; all works remain in the existing 3-column result grid.
    old = 'const rep=[...items].sort((a,b)=>(Number(b.popularity||0)+Number(b.score||0)*10+Number(b.votes||0)/100)-(Number(a.popularity||0)+Number(a.score||0)*10+Number(a.votes||0)/100)).slice(0,5),rated=[...items].filter(x=>Number(x.score||0)>0).sort((a,b)=>Number(b.score||0)-Number(a.score||0)||Number(b.votes||0)-Number(a.votes||0)).slice(0,5);$("#personRepresentativeGrid").innerHTML=rep.map(personCardHtml).join("")||\'<div class="personProfileEmpty">表示できる作品がありません。</div>\';$("#personTopRatedGrid").innerHTML=rated.map(personCardHtml).join("")||\'<div class="personProfileEmpty">評価データがありません。</div>\';document.querySelectorAll("[data-person-movie]").forEach(b=>b.onclick=()=>{const m=items.find(x=>String(x.tmdbId||x.id)===b.dataset.personMovie);location.href="search.html?"+new URLSearchParams({id:b.dataset.personMovie,search:m?.title||""}).toString()})'
    if old in text:
        text = text.replace(old, '', 1)

    DISCOVER.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "apply"
    if cmd == "prepare-tests":
        prepare_tests()
    elif cmd == "apply":
        apply()
    else:
        raise SystemExit(f"unknown command: {cmd}")
