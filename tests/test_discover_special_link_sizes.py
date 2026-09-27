from pathlib import Path
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
