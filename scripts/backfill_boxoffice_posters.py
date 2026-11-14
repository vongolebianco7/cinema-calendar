#!/usr/bin/env python3
"""Recover historical Japanese box-office artwork from TMDB's official API.

The box-office year is the Japanese market year, not necessarily a film's
original release year. Only a unique exact-title TMDB movie released in the
market year or up to two years earlier is eligible. Clearly separated film
titles in a shared market row are looked up independently and retain the shared
gross; ambiguous titles and titles without a dated TMDB identity stay unresolved.
"""
import datetime
import json
import os
import re
import tempfile
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOXOFFICE = ROOT / "data/boxoffice.json"
MOVIES = ROOT / "data/movies.json"
DIRECTORS = ROOT / "data/directors-mobile.json"
RANKINGS = ROOT / "data/rankings"
SEARCH = "https://api.themoviedb.org/3/search/movie"
DETAILS = "https://api.themoviedb.org/3/movie/{}"
IMAGE_BASE = "https://image.tmdb.org/t/p/w500"
MAX_DAILY_LOOKUPS = 100
MAX_MANUAL_LOOKUPS = 200
MAX_ALTERNATIVE_TITLE_CANDIDATES = 3

# KADOKAWA's official product entry confirms the Japan premiere date for the
# 2009 film titled ドロップ. TMDB also returns another exact-title result from
# 2008, so only the result with this reviewed JP release date is eligible.
REVIEWED_JAPANESE_RELEASE_DATES = {
    (2009, "ドロップ"): "2009-03-20",
}

REVIEWED_TITLE_ALIASES = {
    (1990, "チンプイ"): ["チンプイ エリさま活動大写真"],
    (1981, "ブルージーンズメモリー"): ["Blue Jeans Memory", "ブルージーンズメモリー BLUE JEANS MEMORY"],
    (1981, "青春グラフィティ スニーカーぶるーす"): ["Sneaker Blues", "青春グラフィティ スニーカーぶる〜す"],
    (1988, "ビーバップ・ハイスクール高校与太郎狂騒曲"): ["ビー・バップ・ハイスクール 高校与太郎狂騒曲"],
    (1982, "ブッシュマン"): ["The Gods Must Be Crazy"],
    (1982, "エンドレス・ラブ"): ["Endless Love"],
    (1983, "パーマン バードマンがやってきた!!"): ["Perman: Birdman Has Come", "パーマン バードマンがやって来た！！"],
    (1985, "うる星やつら3 リメンバー・マイ・ラブ"): ["Urusei Yatsura 3: Remember My Love"],
    (1985, "Dr.スランプアラレちゃん ほよよ!夢の都メカポリス"): ["Dr. Slump: Hoyoyo! The City of Dreams, Mechapolis"],
    (1991, "おもいでぽろぽろ"): ["Only Yesterday", "おもひでぽろぽろ"],
    (1991, "ドラえもん のび太のトラビアンナイト"): ["Doraemon: Nobita's Dorabian Nights", "映画ドラえもん のび太のドラビアンナイト"],
    (1991, "ドラゴンボールZ・とびっきり最強対最強"): ["Dragon Ball Z: Cooler's Revenge"],
    (1991, "まじかるタルるートくん"): ["Magical Taruruto-kun"],
    (1992, "ドラゴンボールZ 激突!!100億円パワーの戦士たち"): ["Dragon Ball Z: The Return of Cooler"],
    (1992, "ドラゴンボールZ 激突バトル!!三大超サイヤ人"): ["Dragon Ball Z: Super Android 13"],
    (1993, "ドラえもん ソラえもん号"): ["The Sun Is Our Friend: Hold Out! Soraemon!"],
    (1993, "のび太とブリキの迷宮ドラミちゃん"): ["Doraemon: Nobita and the Tin Labyrinth"],
    (1993, "ドラゴンボールZ 燃えつきろ!熱戦・列戦・超激戦"): ["Dragon Ball Z: Broly - The Legendary Super Saiyan"],
    (1993, "んちゃ!ペンギン村はハレのち晴れ"): ["Dr. Slump: N-cha! From Penguin Village with Love"],
    (1993, "銀河ギリギリ!ぶっちぎりの凄い奴"): ["Dragon Ball Z: Bojack Unbound"],
    (1994, "ドラえもん のび太と夢幻三銃士"): ["Doraemon: Nobita's Three Visionary Swordsmen"],
    (1994, "メイクアップセーラー戦士"): ["Make Up! Sailor Soldiers"],
    (1993, "ドラえもん のび太とブリキの迷宮"): ["Doraemon: Nobita and the Tin Labyrinth"],
    (1993, "ドラミちゃん ハロー恐竜キッズ!!"): ["Dorami-chan: Hello Dinosaur Kids"],
    (1995, "スラムダンク"): ["Slam Dunk"],
    (1995, "ママレードボーイ"): ["Marmalade Boy: The Movie"],
    (1997, "新世紀エヴァンゲリオン劇場版"): ["Neon Genesis Evangelion: Death and Rebirth"],
    (1998, "ドラえもん 南海の大冒険"): ["Doraemon: Nobita's Great Adventure in the South Seas"],
    (2000, "劇場版ポケットモンスター 結晶塔の帝王"): ["Pokémon 3: The Movie"],
    (2000, "ピチュウとピカチュウ"): ["Pikachu & Pichu"],
    (2000, "ザ・キッド"): ["The Kid"],
    (2000, "エクソシスト ディレクターズカット版"): ["The Exorcist: The Version You've Never Seen"],
    (2000, "デジモンアドベンチャー02"): ["Digimon Adventure 02: Diablomon Strikes Back"],
    (2000, "おジャ魔女どれみ♯"): ["Ojamajo Doremi Sharp"],
    (2001, "ONE PIECE"): ["One Piece: The Movie"],
    (2001, "デジモン アドベンチャー02"): ["Digimon Adventure 02: Hurricane Touchdown"],
    (2001, "ジャンゴのダンスカーニバル"): ["Jango's Dance Carnival"],
    (2001, "も~っと!おジャ魔女どれみ"): ["Ojamajo Doremi Motto"],
    (2002, "ギブリーズ episodeII"): ["Ghiblies Episode 2"],
    (2002, "ONE PIECE 珍獣島のチョッパー王国"): ["One Piece: Chopper's Kingdom on the Island of Strange Animals"],
    (2002, "デジモンテイマーズ 爆走デジモン特急"): ["Digimon Tamers: Runaway Locomon"],
    (2003, "七夜の願い星ジラーチ"): ["Pokémon: Jirachi Wish Maker"],
    (2003, "バトル・ロワイアルII 鎮魂歌(レクイエム)"): ["Battle Royale II: Requiem"],
    (2003, "仮面ライダー555(ファイズ )"): ["Kamen Rider 555: Paradise Lost"],
    (2003, "爆竜戦隊アバレンジャー DELUXE"): ["Bakuryuu Sentai Abaranger Deluxe"],
    (2005, "劇場版 仮面ライダーヒビキと7人の戦鬼"): ["Kamen Rider Hibiki and the Seven War Oni"],
    (2005, "魔法戦隊マジレンジャーTHE MOVIE"): ["Mahou Sentai Magiranger the Movie"],
    (2006, "ポケモンレンジャーと蒼海の王子マナフィ"): ["Pokémon Ranger and the Temple of the Sea"],
    (2007, "「ディアルガVSパルキアVSダークライ」"): ["Pokémon: The Rise of Darkrai"],
    (2008, "ギラティナと氷空<そら>の花束シェイミ"): ["Pokémon: Giratina and the Sky Warrior"],
    (2008, "相棒 -劇場版-"): ["Aibou: The Movie"],
    (2008, "絶体絶命!42.195km東京ビッグシティマラソン"): ["Aibou: The Movie"],
    (2011, "海賊戦隊ゴーカイジャー THE MOVIE"): ["Kaizoku Sentai Gokaiger the Movie"],
    (2012, "仮面ライダーオーズ THE MOVIE みんなで宇宙キターッ!"): ["Kamen Rider OOO Wonderful: The Shogun and the 21 Core Medals"],
    (2013, "劇場版 仮面ライダーウィザード イン マジックランド"): ["Kamen Rider Wizard in Magic Land"],
    (2019, "騎士竜戦隊リュウソウジャー THE MOVIE"): ["Kishiryu Sentai Ryusoulger the Movie"],
}
POSTER_CHECK_VERSION = 7
RECHECK_DAYS = 1


def normalize(value):
    return "".join(c for c in unicodedata.normalize("NFKC", str(value or "")).casefold() if c.isalnum())


def exact_title_aliases(title, market_year=None):
    """Return only editorially obvious title forms, never fuzzy substrings."""
    value = unicodedata.normalize("NFKC", str(title or "")).strip()
    aliases = [value]
    if str(market_year or '').isdigit():
        aliases.extend(REVIEWED_TITLE_ALIASES.get((int(market_year), value), []))
    clean = re.sub(r"^[・･\s]+", "", value)
    clean = re.sub(r"^(?:劇場版|映画)\s*", "", clean)
    clean = re.sub(r"\s+他$", "", clean)
    clean = re.sub(r"\s*[：:]\s*ジェームズ・キャメロン\s*\d+周年.*$", "", clean)
    clean = re.sub(r"\s*[（(](?:ディレクターズ?カット|完全版|リマスター)[^）)]*[）)]\s*$", "", clean)
    clean = re.sub(r"\s+(?:\d+周年)?(?:3D)?リマスター\s*$", "", clean)
    if clean and clean not in aliases:
        aliases.append(clean)
    return list(dict.fromkeys(alias for alias in aliases if normalize(alias)))


def search_language(query):
    """Use TMDB's matching display language for a reviewed title alias.

    English aliases searched with ja-JP can return Japanese-only localized
    title fields, so the exact alias comparison then loses the identity proof.
    Keep Japanese aliases in Japanese and use English display fields for Latin
    script aliases. The JP region remains fixed for release metadata.
    """
    value = str(query or "")
    has_latin = bool(re.search(r"[A-Za-z]", value))
    has_japanese = bool(re.search(r"[\u3040-\u30ff\u3400-\u9fff]", value))
    return "en-US" if has_latin and not has_japanese else "ja-JP"


def search_languages(query):
    """Search both TMDB title localizations while keeping JP release scope."""
    primary = search_language(query)
    secondary = "ja-JP" if primary == "en-US" else "en-US"
    return (primary, secondary)


EXPLICIT_GROUPED_TITLE_SPLITS = {
    # The Japanese 1997 market entry reports the original Star Wars trilogy as
    # one package. Keep that reported gross on each separately identified film.
    "スターウォーズ3部作": [
        "スター・ウォーズ エピソード4／新たなる希望",
        "スター・ウォーズ エピソード5／帝国の逆襲",
        "スター・ウォーズ エピソード6／ジェダイの帰還",
    ],
    # Official Shin-Ei 50th-anniversary program lists the two short films
    # paired with the Doraemon feature; the Eiren package gross stays intact
    # for each separately identified film.
    "21エモン他": [
        "21エモン 宇宙行け！裸足のプリンセス",
        "トキメキソーラーくるまによん",
    ],
    # Eiren reports the 1994 RAMPO package as one 1,200-million-yen entry.
    # Shochiku's official database identifies the two same-day versions as
    # separate films; each exact title is looked up independently while the
    # published package gross remains unchanged on both rows.
    "rampo": [
        "ＲＡＭＰＯ（奥山バージョン）",
        "ＲＡＭＰＯ（黛バージョン）",
    ],
    # The 2009 Eiren entry combines a Kamen Rider feature with its separately
    # billed Super Sentai feature; each must resolve to its own TMDB identity.
    "劇場版仮面ライダーディケイド侍戦隊シンケンジャー銀幕版": [
        "劇場版 仮面ライダーディケイド オールライダー対大ショッカー",
        "侍戦隊シンケンジャー銀幕版 天下分け目の戦",
    ],
}

# Official Eiren 2010 entry 23 publishes one gross for the Kamen Rider x
# Kamen Rider x Kamen Rider / Cho-Den-O Trilogy package and names the three
# separately released Trilogy episodes. The current JSON already has two
# slash-split siblings; replace that exact sibling set with the three official
# episode titles, preserving the shared gross on every row.
# Shin-Ei's official 1988 co-bill listing resolves two abbreviated Eiren
# sibling rows to distinct films. Only rename rows without an existing identity;
# the already matched Doraemon row and the shared reported gross remain intact.
EXPLICIT_SOURCE_ROW_TITLE_RENAMES = {
    normalize("ドラえもん のび太のパラレル西遊記 / エスパー魔美 / 星空のダンシング・ドール 他"): {
        normalize("エスパー魔美"): "エスパー魔美 星空のダンシングドール",
        normalize("星空のダンシング・ドール 他"): "ウルトラB ブラックホールからの独裁者B・B!!",
    },
}


EXPLICIT_SOURCE_GROUP_SPLITS = {
    normalize("仮面ライダー×仮面ライダー×仮面ライダー / 超・電王トリロジー"): {
        "source_child_titles": (
            "仮面ライダー×仮面ライダー×仮面ライダー",
            "超・電王トリロジー",
        ),
        "source_title": (
            "仮面ライダー×仮面ライダー×仮面ライダー 超・電王トリロジー"
            "（EPISODE RED ゼロのスタートウィンクル）"
            "（EPISODE BLUE 派遣イマジンはNEWトラル）"
            "（EPISODE YELLOW お宝 DE エンド・パイレーツ）"
        ),
        "film_titles": (
            "超・電王トリロジー EPISODE RED ゼロのスタートウィンクル",
            "超・電王トリロジー EPISODE BLUE 派遣イマジンはNEWトラル",
            "超・電王トリロジー EPISODE YELLOW お宝 DE エンド・パイレーツ",
        ),
    },
}



def grouped_title(title):
    # Historical association records usually combine separate films with spaced
    # slashes. Some source rows omit those spaces, so only treat an unspaced
    # slash as a group when the two sides carry clear, distinct franchise/title
    # markers. Ordinary single-film slash titles (007/ムーンレイカー,
    # アベンジャーズ/エンドゲーム, etc.) must remain eligible.
    value = str(title or "")
    if normalize(value) in EXPLICIT_GROUPED_TITLE_SPLITS:
        return True
    # Some official historical market rows concatenate separately billed
    # theatrical features with whitespace only. Exclude only these distinctive
    # paired-title signatures; do not treat every Rider/Sentai crossover as a
    # double feature.
    unseparated_feature_pairs = (
        ("仮面ライダーオーズ WONDERFUL 将軍と21のコアメダル", "海賊戦隊ゴーカイジャー THE MOVIE"),
        ("仮面ライダーオーズ THE MOVIE みんなで宇宙キターッ!", "特命戦隊ゴーバスターズ THE MOVIE"),
        ("仮面ライダージオウ Over Quartzer", "騎士竜戦隊リュウソウジャー THE MOVIE"),
        ("ポケモン・ザ・ムービーXY 光輪(リング)の超魔神フーパ", "ピカチュウとポケモンおんがくたい"),
        ("スラムダンク", "ママレードボーイ"),
        ("のび太とブリキの迷宮", "ドラミちゃん"),
    )
    if any(first in value and second in value for first, second in unseparated_feature_pairs):
        return True

    if re.search(r"\s/\s", value):
        return True

    # Two complete quoted subtitles in one market row are the Pokémon double
    # feature records seen in the official historical rankings.
    if re.search(r"「[^」]+」\s*「[^」]+」|『[^』]+』\s*『[^』]+』", value):
        return True

    # Explicitly separated Kamen Rider / Super Sentai theatrical double bills.
    parts = re.split(r"[/／]", value)
    if len(parts) == 2:
        left, right = parts
        # These franchise pairs are separate market-ranking entries that were
        # serialized without spaces around the separator in older source rows.
        franchise_pairs = (
            ("男はつらいよ", "釣りバカ日誌"),
            ("ドラえもん", "チンプイ"),
            ("リング", "らせん"),
            ("デジモンティマース", "キン肉マンII世"),
        )
        if any((first in left and second in right) or (second in left and first in right)
               for first, second in franchise_pairs):
            return True

        if (("仮面ライダー" in left and "戦隊" in right)
                or ("戦隊" in left and "仮面ライダー" in right)):
            return True

        # Pokémon feature plus its separately billed Pikachu short, marked by
        # a closing Japanese quote immediately before the title separator.
        if re.search(r"[」』]\s*$", left) and re.match(r"\s*ピカチュウ[、と]", right):
            return True

        # A pair of separately titled theatrical features both retain their
        # source's explicit "劇場版" marker around the separator.
        if "劇場版" in left and "劇場版" in right:
            return True

    return False


def split_grouped_titles(title):
    """Return separately billed film titles when the source has a clear slash.

    The original source row is one joint market record, but each billed film
    needs its own TMDB identity and poster. The caller preserves the shared
    gross value on every resulting film record, as requested by the product
    policy; it does not invent a per-film split.
    """
    value = str(title or "").strip()
    explicit_titles = EXPLICIT_GROUPED_TITLE_SPLITS.get(normalize(value))
    if explicit_titles:
        return list(explicit_titles)
    if "スラムダンク" in value and "ママレードボーイ" in value:
        return ["スラムダンク", "ママレードボーイ"]
    if "のび太とブリキの迷宮" in value and "ドラミちゃん" in value:
        return ["ドラえもん のび太とブリキの迷宮", "ドラミちゃん アララ・少年山賊団!"]
    if not grouped_title(value):
        return []
    parts = [part.strip() for part in re.split(r"\s*[/／]\s*", value) if part.strip()]
    if len(parts) == 2:
        return parts
    return []


def clear_inherited_poster_identity(row):
    """A grouped parent/sibling identity must never leak onto child films."""
    for key in (
        "poster", "poster_source", "tmdbId", "tmdb_id", "original_title",
        "tmdb_release_date", "identity_source", "identity_checked_at",
        "identity_match", "poster_checked_at", "poster_check_version",
        "poster_match_status", "poster_check_skip_reason",
    ):
        row.pop(key, None)


def expand_grouped_rows(data):
    """Split verified group siblings or explicit slash-separated rows by film."""
    expanded = 0
    for market_year, rows in (data.get("by_year") or {}).items():
        if not isinstance(rows, list):
            continue

        # Rename only the two unresolved child rows from the verified 1988
        # source group. Never overwrite a sibling with an established identity.
        for row in rows:
            if not isinstance(row, dict) or row.get("poster") or row.get("tmdbId") or row.get("tmdb_id"):
                continue
            renames = EXPLICIT_SOURCE_ROW_TITLE_RENAMES.get(
                normalize(row.get("source_group_title")), {}
            )
            replacement_title = renames.get(normalize(row.get("title")))
            if replacement_title:
                clear_inherited_poster_identity(row)
                row["title"] = replacement_title

        # Some source rows were already split on "/" before this backfill was
        # introduced. Only rewrite a known source group when its complete,
        # expected sibling set is present, all siblings report the same gross,
        # and no sibling already has an identity/poster that would be discarded.
        replacements = {}
        consumed = set()
        for group_key, spec in EXPLICIT_SOURCE_GROUP_SPLITS.items():
            matching = [
                index for index, row in enumerate(rows)
                if isinstance(row, dict)
                and normalize(row.get("source_group_title")) == group_key
            ]
            expected_children = {
                normalize(title) for title in spec["source_child_titles"]
            }
            actual_children = {
                normalize(rows[index].get("title")) for index in matching
            }
            if (len(matching) != len(spec["source_child_titles"])
                    or actual_children != expected_children):
                continue
            source_rows = [rows[index] for index in matching]
            if (any(row.get("gross") != source_rows[0].get("gross")
                    for row in source_rows[1:])
                    or any(row.get("poster") or row.get("tmdbId") or row.get("tmdb_id")
                           for row in source_rows)):
                continue

            source_group_title = source_rows[0].get("source_group_title")
            group_id = f"{market_year}:{normalize(source_group_title)}"
            generated = []
            for index, title in enumerate(spec["film_titles"], start=1):
                film = dict(source_rows[0])
                clear_inherited_poster_identity(film)
                film.update({
                    "title": title,
                    "source_title": spec["source_title"],
                    "source_group_id": group_id,
                    "source_group_index": index,
                    "source_group_size": len(spec["film_titles"]),
                })
                generated.append(film)
            replacements[matching[0]] = generated
            consumed.update(matching)
            expanded += len(generated)

        result = []
        for index, row in enumerate(rows):
            if index in replacements:
                result.extend(replacements[index])
                continue
            if index in consumed:
                continue
            if not isinstance(row, dict) or row.get("source_group_id"):
                result.append(row)
                continue
            titles = split_grouped_titles(row.get("title"))
            if not titles:
                result.append(row)
                continue
            source_title = row["title"]
            group_id = f"{market_year}:{normalize(source_title)}"
            for group_index, title in enumerate(titles, start=1):
                film = dict(row)
                clear_inherited_poster_identity(film)
                film.update({
                    "title": title,
                    "source_title": source_title,
                    "source_group_id": group_id,
                    "source_group_index": group_index,
                    "source_group_size": len(titles),
                })
                result.append(film)
            expanded += len(titles)
        data["by_year"][market_year] = result
    return expanded


def valid_poster_path(value):
    return isinstance(value, str) and value.startswith("/") and not value.startswith("//")


def valid_tmdb_poster_url(value):
    return isinstance(value, str) and value.startswith("https://image.tmdb.org/t/p/")


def reviewed_japanese_release_date(title, market_year):
    if not str(market_year or "").isdigit():
        return None
    return REVIEWED_JAPANESE_RELEASE_DATES.get((int(market_year), normalize(title)))


def matches_reviewed_release_window(title, market_year, release_date):
    expected_date = reviewed_japanese_release_date(title, market_year)
    if expected_date:
        return str(release_date or "")[:10] == expected_date
    return eligible_release_year(release_date, market_year)


def eligible_release_year(release_date, market_year):
    release = str(release_date or "")[:4]
    if not release.isdigit() or not str(market_year).isdigit():
        return False
    difference = int(market_year) - int(release)
    return 0 <= difference <= 2


def atomic_write(path, data):
    content = json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n"
    if path.read_text(encoding="utf-8") == content:
        return False
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as tmp:
        tmp.write(content)
        temporary = tmp.name
    os.replace(temporary, path)
    return True


def poster_checked_recently(row, now):
    if row.get("poster_check_version") != POSTER_CHECK_VERSION:
        return False
    checked = row.get("poster_checked_at")
    if not checked:
        return False
    try:
        when = datetime.datetime.fromisoformat(str(checked).replace("Z", "+00:00"))
        if when.tzinfo is None:
            return False
        age = now - when.astimezone(datetime.timezone.utc)
        return datetime.timedelta(0) <= age < datetime.timedelta(days=RECHECK_DAYS)
    except (TypeError, ValueError):
        return False


def candidate_rows(data, now, limit, ignore_cooldown=False):
    rows = []
    for market_year, entries in (data.get("by_year") or {}).items():
        if not isinstance(entries, list):
            continue
        for index, row in enumerate(entries):
            if not isinstance(row, dict) or row.get("poster") or grouped_title(row.get("title")):
                continue
            if not ignore_cooldown and poster_checked_recently(row, now):
                continue
            rows.append((int(market_year) if str(market_year).isdigit() else 0,
                         index, str(market_year), row))
    rows.sort(key=lambda entry: (entry[0], entry[1]))
    return rows[:max(0, int(limit))]


def fetch_json(url, opener):
    request = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "Cinelva/1.0"})
    with opener(request, timeout=15) as response:
        return json.load(response)


def local_catalog_records(data, catalog_paths):
    """Yield already verified TMDB records without making another API request."""
    yield from (data.get("all_time") or [])
    for path in catalog_paths:
        if not path.exists():
            continue
        files = sorted(path.glob("*.json")) if path.is_dir() else [path]
        for catalog_path in files:
            catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
            if catalog_path.name == "directors-mobile.json":
                for director in (catalog.get("directors") or {}).values():
                    yield from (director.get("works") or [])
            elif isinstance(catalog.get("items"), list):
                yield from catalog["items"]
            else:
                yield from (catalog.get("movies") or [])


def reuse_verified_local_posters(data, now, catalog_paths):
    """Reuse a unique exact-title, release-window TMDB identity from local data."""
    indexed = {}
    for movie in local_catalog_records(data, catalog_paths):
        identifier = movie.get("tmdbId") or movie.get("tmdb_id") or movie.get("id")
        poster = movie.get("poster")
        if not identifier or not str(identifier).isdigit() or not valid_tmdb_poster_url(poster):
            continue
        for title in {movie.get("title"), movie.get("original_title")}:
            for alias in exact_title_aliases(title):
                key = normalize(alias)
                if key:
                    indexed.setdefault(key, {})[str(identifier)] = movie

    checked_at = now.astimezone(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
    enriched = 0
    for market_year, rows in (data.get("by_year") or {}).items():
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict) or row.get("poster") or grouped_title(row.get("title")):
                continue
            exact_candidates = {}
            for alias in exact_title_aliases(row.get("title")):
                exact_candidates.update(indexed.get(normalize(alias), {}))
            in_window = {}
            for identifier, movie in exact_candidates.items():
                release = movie.get("date") or movie.get("release_date") or movie.get("year")
                if eligible_release_year(release, market_year):
                    in_window[identifier] = movie
            candidates = in_window or exact_candidates
            if len(candidates) != 1:
                continue
            identifier, movie = next(iter(candidates.items()))
            row.update({
                "tmdbId": int(identifier),
                "original_title": movie.get("original_title") or movie.get("title"),
                "tmdb_release_date": movie.get("date") or movie.get("release_date") or str(movie.get("year") or ""),
                "poster": movie["poster"],
                "identity_source": movie.get("identity_source") or movie.get("source_url") or f"https://www.themoviedb.org/movie/{identifier}",
                "identity_checked_at": checked_at,
                "identity_match": ("verified_local_exact_title_and_release_year_window"
                                    if in_window else
                                    "verified_local_unique_title_outside_release_year_window"),
                "poster_checked_at": checked_at,
                "poster_check_version": POSTER_CHECK_VERSION,
                "poster_match_status": "matched",
                "poster_check_skip_reason": None,
            })
            enriched += 1
    return enriched


def backfill(path=BOXOFFICE, api_key=None, opener=urllib.request.urlopen, delay=0.35,
             now=None, limit=MAX_DAILY_LOOKUPS, catalog_paths=(MOVIES, DIRECTORS, RANKINGS)):
    api_key = os.environ.get("TMDB_API_KEY", "") if api_key is None else api_key
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("by_year"), dict):
        raise ValueError("Invalid box-office dataset; refusing to modify it")
    now = now or datetime.datetime.now(datetime.timezone.utc)
    expanded = expand_grouped_rows(data)
    for rows in data["by_year"].values():
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            row["poster_match_status"] = "matched" if row.get("poster") else "unexamined"
            row["poster_check_skip_reason"] = None if row.get("poster") else "pending"
    force_recheck = os.environ.get("FORCE_BOXOFFICE_POSTER_RECHECK", "").lower() == "true"
    try:
        requested_limit = int(os.environ.get("BOXOFFICE_POSTER_LOOKUP_LIMIT", limit))
    except (TypeError, ValueError):
        requested_limit = limit
    requested_limit = max(0, min(requested_limit, MAX_MANUAL_LOOKUPS))

    local_enriched = reuse_verified_local_posters(data, now, catalog_paths)

    all_candidates = candidate_rows(data, now, 1_000_000, ignore_cooldown=force_recheck)
    selected_candidates = candidate_rows(data, now, requested_limit,
                                         ignore_cooldown=force_recheck)
    selected_rows = {id(row) for _, _, _, row in selected_candidates}
    eligible_rows = {id(row) for _, _, _, row in all_candidates}
    for rows in data["by_year"].values():
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict) or row.get("poster"):
                continue
            if grouped_title(row.get("title")):
                row["poster_check_skip_reason"] = "grouped_title_not_splittable"
            elif not force_recheck and poster_checked_recently(row, now):
                row["poster_check_skip_reason"] = "cooldown"
            elif id(row) in eligible_rows and id(row) not in selected_rows:
                row["poster_check_skip_reason"] = "daily_lookup_limit"
    if not api_key:
        for rows in data["by_year"].values():
            if isinstance(rows, list):
                for row in rows:
                    if isinstance(row, dict) and not row.get("poster") and row.get("poster_check_skip_reason") == "pending":
                        row["poster_check_skip_reason"] = "tmdb_api_key_missing"
        atomic_write(path, data)
        return {"enriched": local_enriched, "local_enriched": local_enriched,
                "expanded_grouped_films": expanded,
                "unexamined": sum(row.get("poster_match_status") == "unexamined"
                                   for rows in data["by_year"].values() if isinstance(rows, list)
                                   for row in rows if isinstance(row, dict)),
                "ambiguous": 0, "unresolved": 0, "grouped": sum(
            grouped_title(row.get("title")) for rows in data["by_year"].values() if isinstance(rows, list)
            for row in rows if isinstance(row, dict) and not row.get("poster"))}

    checked_at = now.astimezone(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
    enriched = local_enriched
    ambiguous = unresolved = 0
    last_request = 0.0

    def rate_limited_fetch(url):
        nonlocal last_request
        wait = delay - (time.monotonic() - last_request)
        if wait > 0:
            time.sleep(wait)
        result = fetch_json(url, opener)
        last_request = time.monotonic()
        return result

    for _, index, market_year, row in selected_candidates:
        title = str(row.get("title") or "").strip()
        if not title or not normalize(title):
            row["poster_check_skip_reason"] = "title_missing"
            unresolved += 1
            continue
        row["poster_check_skip_reason"] = None
        existing_id = row.get("tmdbId") or row.get("tmdb_id")
        match_type = "exact_title_and_release_year_window"
        too_many_alias_candidates = False
        try:
            if existing_id:
                if not str(existing_id).isdigit() or int(existing_id) <= 0:
                    row["poster_match_status"] = "invalid_tmdb_id"
                    unresolved += 1
                    continue
                url = DETAILS.format(int(existing_id)) + "?" + urllib.parse.urlencode({"api_key": api_key, "language": "ja-JP"})
                result = rate_limited_fetch(url)
                candidates = [result] if result.get("id") == int(existing_id) else []
            else:
                aliases = exact_title_aliases(title, market_year)
                alias_keys = {normalize(alias) for alias in aliases}
                search_results_by_id = {}
                for query in aliases:
                    url = SEARCH + "?" + urllib.parse.urlencode({
                        "api_key": api_key, "query": query,
                        "language": search_language(query), "region": "JP",
                        "include_adult": "false", "page": 1,
                    })
                    result = rate_limited_fetch(url)
                    for movie in result.get("results", []):
                        if movie.get("id"):
                            search_results_by_id[str(movie["id"])] = movie
                # Search the alternate title localization if the primary search
                # has no exact title. TMDB may return nearby records while omitting
                # the exact localized title from its primary-language results.
                has_exact_primary_title = any(
                    alias_keys.intersection({normalize(movie.get("title")),
                                             normalize(movie.get("original_title"))})
                    for movie in search_results_by_id.values()
                )
                if not has_exact_primary_title:
                    for query in aliases:
                        alternate_language = search_languages(query)[1]
                        url = SEARCH + "?" + urllib.parse.urlencode({
                            "api_key": api_key, "query": query,
                            "language": alternate_language, "region": "JP",
                            "include_adult": "false", "page": 1,
                        })
                        result = rate_limited_fetch(url)
                        for movie in result.get("results", []):
                            if movie.get("id"):
                                search_results_by_id[str(movie["id"])] = movie
                search_results = list(search_results_by_id.values())
                exact_title_candidates = [movie for movie in search_results
                                          if alias_keys.intersection({normalize(movie.get("title")),
                                                                      normalize(movie.get("original_title"))})]
                exact_candidates = [movie for movie in exact_title_candidates
                                    if matches_reviewed_release_window(
                                        title, market_year, movie.get("release_date"))]
                if exact_candidates:
                    candidates = exact_candidates
                    if not any(normalize(title) in {normalize(movie.get("title")),
                                                    normalize(movie.get("original_title"))}
                               for movie in exact_candidates):
                        match_type = "exact_cleaned_title_and_release_year_window"
                elif len(exact_title_candidates) == 1 and not reviewed_japanese_release_date(
                        title, market_year):
                    # The Japanese box-office year is a market/ranking year and
                    # can differ substantially for theatrical revivals and
                    # anniversary editions. A unique exact TMDB title is still
                    # strong identity evidence; the year remains recorded for
                    # audit but does not block its poster.
                    candidates = exact_title_candidates
                    match_type = "unique_exact_title_alias_outside_release_year_window"
                else:
                    # TMDB search also indexes alternative names. Verify those candidates
                    # against TMDB's official Japan-scoped alternative-title endpoint
                    # before assigning artwork; search ranking alone is never proof.
                    year_candidates = [movie for movie in search_results
                                       if movie.get("id") and matches_reviewed_release_window(
                                           title, market_year, movie.get("release_date"))]
                    alternative_candidates = year_candidates
                    if not alternative_candidates and not reviewed_japanese_release_date(
                            title, market_year):
                        alternative_candidates = [movie for movie in search_results
                                                  if movie.get("id") and movie.get("poster_path")]
                    if len(alternative_candidates) > MAX_ALTERNATIVE_TITLE_CANDIDATES:
                        candidates = []
                        too_many_alias_candidates = True
                    else:
                        candidates = []
                        for movie in alternative_candidates:
                            alt_url = f"https://api.themoviedb.org/3/movie/{int(movie['id'])}/alternative_titles?" + urllib.parse.urlencode({
                                "api_key": api_key, "country": "JP",
                            })
                            alternatives = rate_limited_fetch(alt_url).get("titles", [])
                            if any(normalize(item.get("title")) in alias_keys for item in alternatives):
                                candidates.append(movie)
                        if candidates:
                            in_window = all(matches_reviewed_release_window(
                                title, market_year, movie.get("release_date"))
                                for movie in candidates)
                            match_type = ("exact_tmdb_alternative_title_and_release_year_window"
                                          if in_window else
                                          "unique_exact_tmdb_alternative_title_outside_release_year_window")
        except Exception as exc:
            print("TMDB box-office poster lookup skipped:", title, type(exc).__name__)
            # A transient API failure must remain retryable on the next run.
            row["poster_match_status"] = "retryable_error"
            unresolved += 1
            continue

        unique = {str(movie.get("id")): movie for movie in candidates if movie.get("id")}
        if len(unique) == 1:
            movie = next(iter(unique.values()))
            path_value = movie.get("poster_path")
            if not valid_poster_path(path_value):
                row["poster_checked_at"] = checked_at
                row["poster_check_version"] = POSTER_CHECK_VERSION
                row["poster_match_status"] = "matched_without_poster"
                unresolved += 1
                continue
            mid = int(movie["id"])
            row.update({
                "tmdbId": mid,
                "original_title": movie.get("original_title") or movie.get("title"),
                "tmdb_release_date": movie.get("release_date"),
                "poster": IMAGE_BASE + path_value,
                "identity_source": f"https://www.themoviedb.org/movie/{mid}",
                "identity_checked_at": checked_at,
                "identity_match": match_type,
                "poster_checked_at": checked_at,
                "poster_check_version": POSTER_CHECK_VERSION,
                "poster_match_status": "matched",
                "poster_check_skip_reason": None,
            })
            enriched += 1
        else:
            row["poster_checked_at"] = checked_at
            row["poster_check_version"] = POSTER_CHECK_VERSION
            if len(unique) > 1 or too_many_alias_candidates:
                row["poster_match_status"] = "ambiguous"
                ambiguous += 1
                print("Box-office poster match requires review:", json.dumps({
                    "year": market_year, "title": title,
                    "candidates": [{"id": movie.get("id"), "title": movie.get("title"),
                                    "original_title": movie.get("original_title"),
                                    "release_date": movie.get("release_date"),
                                    "has_poster": bool(movie.get("poster_path"))}
                                   for movie in unique.values()],
                    "too_many_candidates": too_many_alias_candidates,
                }, ensure_ascii=False), flush=True)
            else:
                row["poster_match_status"] = "not_found"
                unresolved += 1
                print("Box-office poster match not found:", json.dumps({
                    "year": market_year, "title": title,
                }, ensure_ascii=False), flush=True)

    atomic_write(path, data)
    grouped = sum(grouped_title(row.get("title")) for rows in data["by_year"].values()
                  if isinstance(rows, list) for row in rows if isinstance(row, dict) and not row.get("poster"))
    return {"enriched": enriched, "local_enriched": local_enriched,
            "expanded_grouped_films": expanded,
            "ambiguous": ambiguous, "unresolved": unresolved, "grouped": grouped,
            "unexamined": sum(row.get("poster_match_status") == "unexamined"
                               for rows in data["by_year"].values() if isinstance(rows, list)
                               for row in rows if isinstance(row, dict))}


if __name__ == "__main__":
    try:
        result = backfill()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print("Box-office poster backfill failed:", exc, flush=True)
        raise SystemExit(1)
    print("Box-office poster backfill:", json.dumps(result, ensure_ascii=False, sort_keys=True), flush=True)
