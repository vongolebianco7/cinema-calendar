from pathlib import Path
html = Path("theaters.html").read_text(encoding="utf-8")
checks = {
    "equipment explorer marker": "cinemap-theater-equipment-v1",
    "format filters": 'id="formatFilters"',
    "format all": 'data-format-filter=""',
    "IMAX filter": 'data-format-filter="IMAX"',
    "Dolby Cinema filter": 'data-format-filter="Dolby Cinema"',
    "Dolby Atmos filter": 'data-format-filter="Dolby Atmos"',
    "4DX filter": 'data-format-filter="4DX"',
    "MX4D filter": 'data-format-filter="MX4D"',
    "ScreenX filter": 'data-format-filter="ScreenX"',
    "strict equipment matcher": "strictTheaterFormatRows",
    "screen equipment column": "スクリーン設備</th>",
    "unknown fallback": "未確認",
    "official equipment source": "公式設備情報",
    "experience page link": 'href="experience.html"',
}
missing = [name for name, marker in checks.items() if marker not in html]
if missing:
    raise SystemExit("missing: " + ", ".join(missing))
if "paid_api" in html.lower() or "google places api" in html.lower():
    raise SystemExit("unexpected new paid API marker")
print("theater equipment explorer checks passed")
