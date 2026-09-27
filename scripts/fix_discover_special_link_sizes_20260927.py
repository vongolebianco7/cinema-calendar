from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "discover.html"
TEST = ROOT / "tests" / "test_discover_special_link_sizes.py"

TEST_CONTENT = r'''from pathlib import Path
html = Path("discover.html").read_text(encoding="utf-8")
required = [
    '/* discover-special-links-equal-v1 */',
    '.specialLinks{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important',
    '.specialLink{width:100%!important;min-height:44px!important;justify-content:center!important',
]
missing = [x for x in required if x not in html]
if missing:
    raise SystemExit("missing equal-button rule: " + " | ".join(missing))
print("discover special-link equal sizing checks passed")
'''

STYLE = r'''<style id="discover-special-links-equal-v1">
/* discover-special-links-equal-v1 */
.specialLinks{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;align-items:stretch!important}
.specialLink{width:100%!important;min-height:44px!important;justify-content:center!important;text-align:center!important;padding:9px 10px!important;font-size:12px!important;line-height:1.25!important;white-space:nowrap!important}
@media(max-width:430px){.specialLinks{grid-template-columns:repeat(2,minmax(0,1fr))!important}.specialLink{min-height:44px!important;font-size:11.5px!important;padding:9px 7px!important}}
</style>'''


def prepare_tests():
    TEST.parent.mkdir(parents=True, exist_ok=True)
    TEST.write_text(TEST_CONTENT, encoding="utf-8")


def apply():
    text = HTML.read_text(encoding="utf-8")
    if 'id="discover-special-links-equal-v1"' in text:
        print("equal special-link sizing already applied")
        return
    anchor = '</head>'
    if anchor not in text:
        raise SystemExit("head closing tag not found")
    text = text.replace(anchor, STYLE + '\n' + anchor, 1)
    HTML.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "apply"
    if cmd == "prepare-tests":
        prepare_tests()
    elif cmd == "apply":
        apply()
    else:
        raise SystemExit(f"unknown command: {cmd}")
