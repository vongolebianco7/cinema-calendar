from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AWARDS = ROOT / "data" / "awards.json"
RANKINGS = ROOT / "rankings.html"
TEST = ROOT / "tests" / "test_awards_2010_2022_coverage.py"

OSCAR = "https://www.oscars.org/oscars/ceremonies/{year}"
CANNES = "https://www.festival-cannes.com/en/retrospective/"
VENICE = "https://www.labiennale.org/en/history/recent-years"
BERLIN = "https://www.berlinale.de/en/archive/awards-juries/awards.html"
GLOBES = "https://goldenglobes.com/winners-nominees/"
BAFTA = "https://www.bafta.org/awards/film/"

# Ceremony/festival year -> (film, recipient where applicable).
OSCAR_DIRECTOR = {
    2010: ("The Hurt Locker", "Kathryn Bigelow"),
    2011: ("The King's Speech", "Tom Hooper"),
    2012: ("The Artist", "Michel Hazanavicius"),
    2013: ("Life of Pi", "Ang Lee"),
    2014: ("Gravity", "Alfonso Cuarón"),
    2015: ("Birdman or (The Unexpected Virtue of Ignorance)", "Alejandro G. Iñárritu"),
    2016: ("The Revenant", "Alejandro G. Iñárritu"),
    2017: ("La La Land", "Damien Chazelle"),
    2018: ("The Shape of Water", "Guillermo del Toro"),
    2019: ("Roma", "Alfonso Cuarón"),
    2020: ("Parasite", "Bong Joon Ho"),
    2021: ("Nomadland", "Chloé Zhao"),
    2022: ("The Power of the Dog", "Jane Campion"),
}
CANNES_PALME = {
    2010: "Uncle Boonmee Who Can Recall His Past",
    2011: "The Tree of Life",
    2012: "Amour",
    2013: "Blue Is the Warmest Colour",
    2014: "Winter Sleep",
    2015: "Dheepan",
    2016: "I, Daniel Blake",
    2017: "The Square",
    2018: "Shoplifters",
    2019: "Parasite",
    # 2020 Festival de Cannes was cancelled; do not invent a Palme d'Or.
    2021: "Titane",
    2022: "Triangle of Sadness",
}
VENICE_LION = {
    2010: "Somewhere",
    2011: "Faust",
    2012: "Pietà",
    2013: "Sacro GRA",
    2014: "A Pigeon Sat on a Branch Reflecting on Existence",
    2015: "From Afar",
    2016: "The Woman Who Left",
    2017: "The Shape of Water",
    2018: "Roma",
    2019: "Joker",
    2020: "Nomadland",
    2021: "Happening",
    2022: "All the Beauty and the Bloodshed",
}
BERLIN_BEAR = {
    2010: "Honey",
    2011: "A Separation",
    2012: "Caesar Must Die",
    2013: "Child's Pose",
    2014: "Black Coal, Thin Ice",
    2015: "Taxi",
    2016: "Fire at Sea",
    2017: "On Body and Soul",
    2018: "Touch Me Not",
    2019: "Synonyms",
    2020: "There Is No Evil",
    2021: "Bad Luck Banging or Loony Porn",
    2022: "Alcarràs",
}
GLOBE_DRAMA = {
    2010: "Avatar",
    2011: "The Social Network",
    2012: "The Descendants",
    2013: "Argo",
    2014: "12 Years a Slave",
    2015: "Boyhood",
    2016: "The Revenant",
    2017: "Moonlight",
    2018: "Three Billboards Outside Ebbing, Missouri",
    2019: "Bohemian Rhapsody",
    2020: "1917",
    2021: "Nomadland",
    2022: "The Power of the Dog",
}
BAFTA_FILM = {
    2010: "The Hurt Locker",
    2011: "The King's Speech",
    2012: "The Artist",
    2013: "Argo",
    2014: "12 Years a Slave",
    2015: "Boyhood",
    2016: "The Revenant",
    2017: "La La Land",
    2018: "Three Billboards Outside Ebbing, Missouri",
    2019: "Roma",
    2020: "1917",
    2021: "Nomadland",
    2022: "The Power of the Dog",
}


def row(year: int, organization: str, category: str, title: str, source: str) -> dict:
    return {
        "year": year,
        "organization": organization,
        "category": category,
        "title": title,
        "source": source,
    }


def backfill_rows() -> list[dict]:
    rows: list[dict] = []
    for year in range(2010, 2023):
        film, director = OSCAR_DIRECTOR[year]
        rows.append(row(year, "アカデミー賞", "監督賞", f"{film} — {director}", OSCAR.format(year=year)))
        if year in CANNES_PALME:
            rows.append(row(year, "カンヌ国際映画祭", "パルム・ドール", CANNES_PALME[year], CANNES))
        rows.append(row(year, "ヴェネチア国際映画祭", "金獅子賞", VENICE_LION[year], VENICE))
        rows.append(row(year, "ベルリン国際映画祭", "金熊賞", BERLIN_BEAR[year], BERLIN))
        rows.append(row(year, "ゴールデングローブ賞", "作品賞（ドラマ）", GLOBE_DRAMA[year], GLOBES))
        rows.append(row(year, "BAFTA", "作品賞", BAFTA_FILM[year], BAFTA))
    return rows


def write_test() -> None:
    TEST.write_text(
        '''import json\nfrom pathlib import Path\n\nROOT = Path(__file__).resolve().parents[1]\ndata = json.loads((ROOT / "data" / "awards.json").read_text(encoding="utf-8"))\nawards = data["awards"]\n\nfor year in range(2010, 2023):\n    rows = [r for r in awards if r["year"] == year]\n    orgs = {r["organization"] for r in rows}\n    categories = {r["category"] for r in rows}\n    assert len(rows) >= 6, f"{year}: only {len(rows)} award rows"\n    assert len(orgs) >= 5, f"{year}: only {sorted(orgs)}"\n    assert len(categories) >= 4, f"{year}: only {sorted(categories)}"\n    assert any(not (r["organization"] == "アカデミー賞" and r["category"] == "作品賞") for r in rows), year\n\n# 2020 Cannes was cancelled, so coverage must expand without fabricating a Palme d'Or.\nassert not any(r["year"] == 2020 and r["organization"] == "カンヌ国際映画祭" and r["category"] == "パルム・ドール" for r in awards)\n\n# Representative regression checks across the range.\nexpected = {\n    (2010, "カンヌ国際映画祭", "パルム・ドール", "Uncle Boonmee Who Can Recall His Past"),\n    (2016, "ベルリン国際映画祭", "金熊賞", "Fire at Sea"),\n    (2019, "ヴェネチア国際映画祭", "金獅子賞", "Joker"),\n    (2022, "BAFTA", "作品賞", "The Power of the Dog"),\n}\nactual = {(r["year"], r["organization"], r["category"], r["title"]) for r in awards}\nassert expected <= actual\n\nrankings = (ROOT / "rankings.html").read_text(encoding="utf-8")\nassert 'if(y<=2022)return "この授賞年は現在、アカデミー賞の作品賞を中心に収録しています。' not in rankings\nassert "主要賞・映画祭の最高賞を中心に収録" in rankings\nprint("award 2010-2022 coverage regression checks passed")\n''',
        encoding="utf-8",
    )


def apply() -> None:
    data = json.loads(AWARDS.read_text(encoding="utf-8"))
    existing = {
        (r["year"], r["organization"], r["category"], r["title"])
        for r in data.get("awards", [])
    }
    additions = [
        r for r in backfill_rows()
        if (r["year"], r["organization"], r["category"], r["title"]) not in existing
    ]
    data["awards"].extend(additions)
    org_order = {
        "アカデミー賞": 0,
        "カンヌ国際映画祭": 1,
        "ヴェネチア国際映画祭": 2,
        "ベルリン国際映画祭": 3,
        "ゴールデングローブ賞": 4,
        "BAFTA": 5,
    }
    data["awards"].sort(
        key=lambda r: (
            -int(r["year"]),
            org_order.get(r["organization"], 99),
            r["category"],
            r["title"],
        )
    )
    data["note"] = (
        "主催者公式発表・公式アーカイブで確認した受賞情報。"
        "2010〜2022年は主要賞・主要国際映画祭の最高賞とアカデミー監督賞を補完。"
        "アカデミー作品賞は第1回（1927/28年対象・1929年授賞）から全授賞年を収録。年は授賞式年。"
    )
    AWARDS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    html = RANKINGS.read_text(encoding="utf-8")
    old = 'if(y<=2022)return "この授賞年は現在、アカデミー賞の作品賞を中心に収録しています。他の賞・映画祭や受賞部門は未収録です。";'
    new = 'if(y<2010)return "この授賞年は現在、アカデミー賞の作品賞を中心に収録しています。他の賞・映画祭や受賞部門は未収録です。";if(y<=2022)return "この授賞年は主要賞・映画祭の最高賞を中心に収録しています。全受賞部門を網羅する一覧ではありません。";'
    if old not in html:
        raise SystemExit("coverageNote target not found; rankings.html changed unexpectedly")
    RANKINGS.write_text(html.replace(old, new, 1), encoding="utf-8")
    print(f"added {len(additions)} award rows")


def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1] not in {"prepare-tests", "apply"}:
        raise SystemExit("usage: apply_awards_2010_2022_backfill_20260927.py prepare-tests|apply")
    if sys.argv[1] == "prepare-tests":
        write_test()
    else:
        apply()


if __name__ == "__main__":
    main()
