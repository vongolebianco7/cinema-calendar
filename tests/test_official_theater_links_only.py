from pathlib import Path

found = 0
for name in ("index.html", "search.html"):
    p = Path(name)
    text = p.read_text(encoding="utf-8")
    if "function theaterScheduleHtml(m)" not in text:
        continue
    found += 1
    start = text.index("function theaterScheduleHtml(m)")
    end = text.find("\nfunction ", start + 10)
    block = text[start:] if end < 0 else text[start:end]
    assert "theater-official-links-v1" in block, f"{name}: link-only renderer missing"
    assert "theaterSchedules.schedules" not in block, f"{name}: partial showtime renderer remains"
    assert "上映時間を公式サイトで確認" in block, f"{name}: official-site CTA missing"
assert found >= 1
