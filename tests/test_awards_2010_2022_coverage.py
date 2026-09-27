import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "data" / "awards.json").read_text(encoding="utf-8"))
awards = data["awards"]

for year in range(2010, 2023):
    rows = [r for r in awards if r["year"] == year]
    orgs = {r["organization"] for r in rows}
    categories = {r["category"] for r in rows}
    assert len(rows) >= 6, f"{year}: only {len(rows)} award rows"
    assert len(orgs) >= 5, f"{year}: only {sorted(orgs)}"
    assert len(categories) >= 4, f"{year}: only {sorted(categories)}"
    assert any(not (r["organization"] == "アカデミー賞" and r["category"] == "作品賞") for r in rows), year

# 2020 Cannes was cancelled, so coverage must expand without fabricating a Palme d'Or.
assert not any(r["year"] == 2020 and r["organization"] == "カンヌ国際映画祭" and r["category"] == "パルム・ドール" for r in awards)

# Representative regression checks across the range.
expected = {
    (2010, "カンヌ国際映画祭", "パルム・ドール", "Uncle Boonmee Who Can Recall His Past"),
    (2016, "ベルリン国際映画祭", "金熊賞", "Fire at Sea"),
    (2019, "ヴェネチア国際映画祭", "金獅子賞", "Joker"),
    (2022, "BAFTA", "作品賞", "The Power of the Dog"),
}
actual = {(r["year"], r["organization"], r["category"], r["title"]) for r in awards}
assert expected <= actual

rankings = (ROOT / "rankings.html").read_text(encoding="utf-8")
assert 'if(y<=2022)return "この授賞年は現在、アカデミー賞の作品賞を中心に収録しています。' not in rankings
assert "主要賞・映画祭の最高賞を中心に収録" in rankings
print("award 2010-2022 coverage regression checks passed")
