from pathlib import Path
import sys

ART = Path('js/my-cinemap-art.js')
HTML = Path('my-cinemap.html')
TEST = Path('tests/test_my_cinemap_three_column_export.py')

OLD = """  // Landscape needs two columns for legible names; ranking otherwise reads down the page.\n  const sparse=items.length>0&&items.length<=3;\n  const columns=sparse?1:shape==='landscape'||(shape==='square'&&layout!=='ranking')?2:1;\n  const rows=columns===2?5:10,gap=columns===2?62:0,cellW=(inner-gap*(columns-1))/columns;\n  const cellH=sparse?Math.min(shape==='landscape'?160:260,available/(items.length+1)):available/rows;\n  const firstRowY=sparse?cursor+available*(items.length===1?.3:.12):cursor;\n"""

NEW = """  // Ranking output is always three vertical columns, regardless of image shape or layout preset.\n  const sparse=items.length>0&&items.length<=3;\n  const columns=3;\n  const rows=Math.max(1,Math.ceil(items.length/columns)),gap=44,cellW=(inner-gap*(columns-1))/columns;\n  const cellH=sparse?Math.min(shape==='landscape'?160:260,available/(Math.max(1,items.length)+1)):available/rows;\n  const firstRowY=sparse?cursor+available*(items.length===1?.3:.12):cursor;\n"""

OLD_POS = "const col=columns===1?0:Math.floor(i/rows),row=columns===1?i:i%rows;"
NEW_POS = "const col=Math.floor(i/rows),row=i%rows;"
OLD_SIZE = "const nameSize=sparse?Math.min(62,cellH*.3):Math.min(columns===2?31:38,Math.max(25,cellH*.24));"
NEW_SIZE = "const nameSize=sparse?Math.min(48,cellH*.26):Math.min(29,Math.max(21,cellH*.19));"

TEST_TEXT = '''from pathlib import Path\n\nart = Path("js/my-cinemap-art.js").read_text(encoding="utf-8")\nhtml = Path("my-cinemap.html").read_text(encoding="utf-8")\n\nrequired = [\n    "const columns=3;",\n    "const rows=Math.max(1,Math.ceil(items.length/columns))",\n    "const col=Math.floor(i/rows),row=i%rows;",\n    "Ranking output is always three vertical columns",\n]\nmissing = [token for token in required if token not in art]\nif missing:\n    raise SystemExit(f"My Cinemap three-column export missing: {missing}")\n\nforbidden = [\n    "const columns=sparse?1:shape==='landscape'||(shape==='square'&&layout!=='ranking')?2:1;",\n    "const rows=columns===2?5:10",\n]\npresent = [token for token in forbidden if token in art]\nif present:\n    raise SystemExit(f"legacy one/two-column export logic remains: {present}")\n\nif "my-cinemap-final-v8" not in html:\n    raise SystemExit("My Cinemap artwork cache-bust version was not bumped")\n\nprint("My Cinemap three-column export regression checks passed")\n'''


def prepare_tests():
    TEST.write_text(TEST_TEXT, encoding='utf-8')


def apply():
    art = ART.read_text(encoding='utf-8')
    if OLD not in art:
        raise SystemExit('expected legacy My Cinemap column block not found')
    if OLD_POS not in art or OLD_SIZE not in art:
        raise SystemExit('expected legacy My Cinemap positioning/size logic not found')
    art = art.replace(OLD, NEW).replace(OLD_POS, NEW_POS).replace(OLD_SIZE, NEW_SIZE)
    ART.write_text(art, encoding='utf-8')

    html = HTML.read_text(encoding='utf-8')
    if 'my-cinemap-final-v7' not in html:
        raise SystemExit('expected My Cinemap v7 asset version not found')
    html = html.replace('my-cinemap-final-v7', 'my-cinemap-final-v8')
    HTML.write_text(html, encoding='utf-8')


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else ''
    if mode == 'prepare-tests':
        prepare_tests()
    elif mode == 'apply':
        apply()
    else:
        raise SystemExit('usage: apply_my_cinemap_three_column_20260927.py [prepare-tests|apply]')
