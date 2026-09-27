from pathlib import Path

p = Path(__file__).resolve().parents[1] / "rankings.html"
text = p.read_text(encoding="utf-8")
replacements = [
    ('return row.region==="邦画"?"日本":row.region==="洋画"?"海外":"その他"}', 'return row.region==="邦画"?"日本":"その他"}'),
    ('const regions=["すべて","日本","海外","アメリカ","アジア","ヨーロッパ","その他"]', 'const regions=["すべて","日本","アメリカ","アジア","ヨーロッパ","その他"]'),
    ('let list=boxRegion==="すべて"?enriched:boxRegion==="海外"?enriched.filter(x=>x.region==="洋画"):enriched.filter(x=>x._bucket===boxRegion);', 'let list=boxRegion==="すべて"?enriched:enriched.filter(x=>x._bucket===boxRegion);'),
    ('$("#sourceNote").textContent="日本国内興行収入 · 海外=公式資料の洋画区分 · 国別は取得できた制作国情報で分類 · "+(boxEra==="歴代"?"歴代":""+boxEra+"年")', '$("#sourceNote").textContent="日本国内興行収入 · 制作国別 · 国を特定できない洋画はその他 · "+(boxEra==="歴代"?"歴代":""+boxEra+"年")'),
]
for old, new in replacements:
    if old not in text:
        raise SystemExit(f"pattern not found: {old[:80]}")
    text = text.replace(old, new, 1)
p.write_text(text, encoding="utf-8")
print("Updated box office regions to a single MECE level")
