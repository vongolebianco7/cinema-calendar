from pathlib import Path
html = Path("theaters.html").read_text(encoding="utf-8")
checks = {
    "table marker": "cinemap-theater-table-v1",
    "scroll wrapper": "theaterTableWrap",
    "table": "theaterTable",
    "theater header": "映画館</th>",
    "area header": "エリア</th>",
    "imax header": "IMAX</th>",
    "dolby header": "Dolby</th>",
    "motion header": "4DX / MX4D</th>",
    "screenx header": "ScreenX</th>",
    "equipment header": "スクリーン設備</th>",
    "strict equipment match": "strictTheaterFormatRows",
    "generic chain guard": "isGenericChainOnly",
    "format-data theater source": "equipmentTheaters",
    "active table renderer": "window.renderDirectory=renderTheaterTable",
    "table scoped scroll": "overflow-x:auto",
    "page overflow guard": "html,body{overflow-x:hidden}",
}
missing = [name for name, marker in checks.items() if marker not in html]
if missing:
    raise SystemExit("missing: " + ", ".join(missing))
print("theater comparison table checks passed")
