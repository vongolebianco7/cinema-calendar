from pathlib import Path
import sys

RAIL_ASSERTION = "    'rankings.html': ['mobile-movie-rails-v1', '.rankGrid{display:flex', '.rankCard{flex:0 0 104px', 'overflow-x:auto'],\n"
LEGACY_RAIL = '<style>/* mobile-movie-rails-v1 */@media(max-width:760px){html,body{max-width:100%;overflow-x:hidden}.wrap,.rankGrid{min-width:0;max-width:100%}.rankGrid{display:flex!important;grid-template-columns:none!important;flex-wrap:nowrap!important;gap:9px!important;width:100%;max-width:100%;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity;padding:2px 1px 18px}.rankCard{flex:0 0 104px;width:104px;min-width:104px;max-width:104px;scroll-snap-align:start}.rankCard .body{padding:7px}.rankCard .title{font-size:11px}.rankCard .meta{font-size:9px}.rankGrid .empty{flex:0 0 100%;width:100%}}</style>'
THREE_COLUMN_STYLE = '''<style>/* rankings-three-column-grid-v1 */
.rankGrid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;overflow:visible!important;padding:0!important}
.rankCard{width:auto!important;min-width:0!important;max-width:none!important}
.rankGrid .empty{grid-column:1/-1;width:auto!important}
.awardGrid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important}
@media(max-width:760px){
  html,body{max-width:100%;overflow-x:hidden}
  .wrap,.rankGrid,.awardGrid{min-width:0;max-width:100%}
  .rankGrid,.awardGrid{gap:6px!important}
  .rankCard .body{padding:7px}
  .rankCard .title{font-size:11px}
  .rankCard .meta{font-size:9px}
  .awardCard{display:flex;flex-direction:column;gap:6px;padding:6px;min-width:0;overflow:hidden}
  .awardPoster{width:100%;height:auto;aspect-ratio:2/3;object-fit:cover}
  .awardTitle{font-size:10px;line-height:1.35;overflow-wrap:anywhere}
  .awardYear,.awardMeta,.awardLinks a{font-size:9px}
  .awardMeta{overflow-wrap:anywhere}
}
</style>'''
TEST_TEXT = '''from pathlib import Path

text = Path("rankings.html").read_text(encoding="utf-8")

required = [
    "/* rankings-three-column-grid-v1 */",
    ".rankGrid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important",
    ".awardGrid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important",
]
missing = [token for token in required if token not in text]
if missing:
    raise SystemExit(f"rankings three-column grid missing: {missing}")

forbidden = [
    "/* mobile-movie-rails-v1 */",
    ".rankGrid{display:flex!important",
    ".rankCard{flex:0 0 104px",
]
present = [token for token in forbidden if token in text]
if present:
    raise SystemExit(f"legacy rankings rail still present: {present}")

print("ranking three-column regression checks passed")
'''


def prepare_tests() -> None:
    rail_test = Path('tests/test_mobile_movie_rails.py')
    text = rail_test.read_text(encoding='utf-8')
    if RAIL_ASSERTION not in text:
        raise SystemExit('expected rankings rail assertion not found')
    rail_test.write_text(text.replace(RAIL_ASSERTION, ''), encoding='utf-8')
    Path('tests/test_rankings_three_column_grid.py').write_text(TEST_TEXT, encoding='utf-8')


def apply() -> None:
    path = Path('rankings.html')
    text = path.read_text(encoding='utf-8')
    text = text.replace(
        '.rankGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}',
        '.rankGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}',
    )
    text = text.replace(
        '.awardGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}',
        '.awardGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}',
    )
    if LEGACY_RAIL not in text:
        raise SystemExit('legacy mobile ranking rail block not found')
    text = text.replace(LEGACY_RAIL, THREE_COLUMN_STYLE)
    text = text.replace(
        '@media(max-width:760px){.awardGrid{grid-template-columns:1fr 1fr}.wrap{padding:0 12px}.rankGrid{grid-template-columns:repeat(3,1fr);gap:6px}.body{padding:7px}.title{font-size:11px}.hero{padding:20px 0 10px}}@media(max-width:480px){.awardGrid{grid-template-columns:1fr}}',
        '@media(max-width:760px){.wrap{padding:0 12px}.rankGrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.body{padding:7px}.title{font-size:11px}.hero{padding:20px 0 10px}}',
    )
    path.write_text(text, encoding='utf-8')


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else ''
    if mode == 'prepare-tests':
        prepare_tests()
    elif mode == 'apply':
        apply()
    else:
        raise SystemExit('usage: apply_ranking_three_column_20260927.py [prepare-tests|apply]')
