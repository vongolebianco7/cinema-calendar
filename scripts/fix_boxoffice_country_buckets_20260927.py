from pathlib import Path

p = Path(__file__).resolve().parents[1] / "rankings.html"
text = p.read_text(encoding="utf-8")
old = 'function productionBucket(movie,row){const cs=(movie?.countries||[]).map(x=>String(x));const has=(...keys)=>cs.some(c=>keys.some(k=>c.toLowerCase().includes(k)));if(has("japan"))return "日本";if(has("united states","usa"))return "アメリカ";if(has("south korea","korea","china","hong kong","taiwan","india","thailand","philippines","indonesia","malaysia","singapore"))return "アジア";if(has("united kingdom","france","germany","italy","spain","sweden","norway","denmark","netherlands","belgium","poland"))return "ヨーロッパ";return row.region==="邦画"?"日本":"その他"}'
new = 'function productionBucket(movie,row){const raw=[...(movie?.countries||[]),...(movie?.origin_country||[]),...(movie?.production_countries||[]),...(row.country?[row.country]:[]),...(row.production_country?[row.production_country]:[])];const cs=raw.map(x=>typeof x==="string"?x:String(x?.name||x?.iso_3166_1||x?.code||"")).filter(Boolean);const has=(...keys)=>cs.some(c=>keys.some(k=>c.toLowerCase().includes(k)));if(has("japan","jp"))return "日本";if(has("united states","usa","us"))return "アメリカ";if(has("south korea","republic of korea","korea","kr","china","cn","hong kong","hk","taiwan","tw","india","in","thailand","th","philippines","ph","indonesia","id","malaysia","my","singapore","sg"))return "アジア";if(has("united kingdom","uk","gb","france","fr","germany","de","italy","it","spain","es","sweden","se","norway","no","denmark","dk","netherlands","nl","belgium","be","poland","pl"))return "ヨーロッパ";return row.region==="邦画"?"日本":"その他"}'
if old not in text:
    raise SystemExit("productionBucket source pattern not found")
text = text.replace(old, new, 1)
p.write_text(text, encoding="utf-8")
print("Updated box office country classification")
