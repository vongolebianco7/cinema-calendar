from pathlib import Path
import re

p = Path(__file__).resolve().parents[1] / "rankings.html"
text = p.read_text(encoding="utf-8")

# Use the official box-office source's 邦画/洋画 split as the primary classification.
# Country metadata remains only as a fallback when a row has no official region value.
text, n = re.subn(
    r'function productionBucket\(movie,row\)\{.*?\}\nasync function renderBox\(\)\{',
    'function productionBucket(movie,row){if(row.region==="邦画")return "国内";if(row.region==="洋画")return "国外";const raw=[...(movie?.countries||[]),...(movie?.origin_country||[]),...(movie?.production_countries||[]),...(row.country?[row.country]:[]),...(row.production_country?[row.production_country]:[])];const cs=raw.map(x=>typeof x==="string"?x:String(x?.name||x?.iso_3166_1||x?.code||"")).filter(Boolean);const isJapan=cs.some(c=>{const v=c.toLowerCase();return v==="jp"||v.includes("japan")});return isJapan?"国内":"国外"}\nasync function renderBox(){',
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit("productionBucket/renderBox pattern not found")

text, n = re.subn(
    r'const regions=\[[^\]]*\];\$\("#boxRegionChips"\)',
    'const regions=["すべて","国内","国外"];$("#boxRegionChips")',
    text,
    count=1,
)
if n != 1:
    raise SystemExit("box-office regions pattern not found")

text = text.replace(
    '$("#sourceNote").textContent="日本国内興行収入 · 制作国別 · 国を特定できない洋画はその他 · "+(boxEra==="歴代"?"歴代":""+boxEra+"年")',
    '$("#sourceNote").textContent="日本国内興行収入 · 国内/国外は公式資料の邦画/洋画区分を優先 · "+(boxEra==="歴代"?"歴代":""+boxEra+"年")',
)
text = text.replace(
    '$("#sourceNote").textContent="日本国内興行収入 · 海外=公式資料の洋画区分 · 国別は取得できた制作国情報で分類 · "+(boxEra==="歴代"?"歴代":""+boxEra+"年")',
    '$("#sourceNote").textContent="日本国内興行収入 · 国内/国外は公式資料の邦画/洋画区分を優先 · "+(boxEra==="歴代"?"歴代":""+boxEra+"年")',
)

p.write_text(text, encoding="utf-8")
print("Updated box office filters to domestic/foreign split")
