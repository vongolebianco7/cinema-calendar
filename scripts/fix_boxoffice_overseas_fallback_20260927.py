from pathlib import Path

p = Path(__file__).resolve().parents[1] / "rankings.html"
text = p.read_text(encoding="utf-8")
old_bucket = 'return row.region==="邦画"?"日本":"その他"}'
new_bucket = 'return row.region==="邦画"?"日本":row.region==="洋画"?"海外":"その他"}'
if old_bucket not in text:
    raise SystemExit("box office fallback pattern not found")
text = text.replace(old_bucket, new_bucket, 1)
old_regions = 'const regions=["すべて","日本","アメリカ","アジア","ヨーロッパ","その他"]'
new_regions = 'const regions=["すべて","日本","海外","アメリカ","アジア","ヨーロッパ","その他"]'
if old_regions not in text:
    raise SystemExit("box office region list pattern not found")
text = text.replace(old_regions, new_regions, 1)
old_filter = 'let list=boxRegion==="すべて"?enriched:enriched.filter(x=>x._bucket===boxRegion);'
new_filter = 'let list=boxRegion==="すべて"?enriched:boxRegion==="海外"?enriched.filter(x=>x.region==="洋画"):enriched.filter(x=>x._bucket===boxRegion);'
if old_filter not in text:
    raise SystemExit("box office filter pattern not found")
text = text.replace(old_filter, new_filter, 1)
old_note = '$("#sourceNote").textContent="日本国内興行収入 · 制作国別 · "+(boxEra==="歴代"?"歴代":""+boxEra+"年")'
new_note = '$("#sourceNote").textContent="日本国内興行収入 · 海外=公式資料の洋画区分 · 国別は取得できた制作国情報で分類 · "+(boxEra==="歴代"?"歴代":""+boxEra+"年")'
if old_note not in text:
    raise SystemExit("box office source note pattern not found")
text = text.replace(old_note, new_note, 1)
p.write_text(text, encoding="utf-8")
print("Updated box office overseas fallback")
