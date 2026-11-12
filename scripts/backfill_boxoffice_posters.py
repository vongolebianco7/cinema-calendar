#!/usr/bin/env python3
"""Recover historical Japanese box-office artwork from TMDB's official API.

The box-office year is the Japanese market year, not necessarily a film's
original release year. Only a unique exact-title TMDB movie released in the
market year or up to two years earlier is eligible. Grouped multi-film rows,
ambiguous titles, and titles without a dated TMDB identity stay unresolved.
Source revenue, order, and market-year fields are never changed.
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
MAX_ALTERNATIVE_TITLE_CANDIDATES = 3
POSTER_CHECK_VERSION = 2
RECHECK_DAYS = 30


def normalize(value):
    return "".join(c for c in unicodedata.normalize("NFKC", str(value or "")).casefold() if c.isalnum())


def grouped_title(title):
    # Historical association records usually combine separate films with spaced
    # slashes. Some source rows omit those spaces, so only treat an unspaced
    # slash as a group when the two sides carry clear, distinct franchise/title
    # markers. Ordinary single-film slash titles (007/ムーンレイカー,
    # アベンジャーズ/エンドゲーム, etc.) must remain eligible.
    value = str(title or "")
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


def valid_poster_path(value):
    return isinstance(value, str) and value.startswith("/") and not value.startswith("//")


def valid_tmdb_poster_url(value):
    return isinstance(value, str) and value.startswith("https://image.tmdb.org/t/p/")


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


def candidate_rows(data, now, limit):
    rows = []
    for market_year, entries in (data.get("by_year") or {}).items():
        if not isinstance(entries, list):
            continue
        for index, row in enumerate(entries):
            if not isinstance(row, dict) or row.get("poster") or grouped_title(row.get("title")):
                continue
            if poster_checked_recently(row, now):
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
            key = normalize(title)
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
            candidates = {}
            for identifier, movie in indexed.get(normalize(row.get("title")), {}).items():
                release = movie.get("date") or movie.get("release_date") or movie.get("year")
                if eligible_release_year(release, market_year):
                    candidates[identifier] = movie
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
                "identity_match": "verified_local_exact_title_and_release_year_window",
                "poster_checked_at": checked_at,
                "poster_check_version": POSTER_CHECK_VERSION,
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
    local_enriched = reuse_verified_local_posters(data, now, catalog_paths)
    if not api_key:
        if local_enriched:
            atomic_write(path, data)
        return {"enriched": local_enriched, "local_enriched": local_enriched,
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

    for _, index, market_year, row in candidate_rows(data, now, limit):
        title = str(row.get("title") or "").strip()
        if not title or not normalize(title):
            unresolved += 1
            continue
        existing_id = row.get("tmdbId") or row.get("tmdb_id")
        match_type = "exact_title_and_release_year_window"
        too_many_alias_candidates = False
        try:
            if existing_id:
                if not str(existing_id).isdigit() or int(existing_id) <= 0:
                    unresolved += 1
                    continue
                url = DETAILS.format(int(existing_id)) + "?" + urllib.parse.urlencode({"api_key": api_key, "language": "ja-JP"})
                result = rate_limited_fetch(url)
                candidates = [result] if result.get("id") == int(existing_id) else []
            else:
                url = SEARCH + "?" + urllib.parse.urlencode({
                    "api_key": api_key, "query": title, "language": "ja-JP", "region": "JP",
                    "include_adult": "false", "page": 1,
                })
                result = rate_limited_fetch(url)
                search_results = result.get("results", [])
                exact_candidates = [movie for movie in search_results
                                    if normalize(title) in {normalize(movie.get("title")), normalize(movie.get("original_title"))}
                                    and eligible_release_year(movie.get("release_date"), market_year)]
                if exact_candidates:
                    candidates = exact_candidates
                else:
                    # TMDB search also indexes alternative names. Verify those candidates
                    # against TMDB's official Japan-scoped alternative-title endpoint
                    # before assigning artwork; search ranking alone is never proof.
                    year_candidates = [movie for movie in search_results
                                       if movie.get("id") and eligible_release_year(movie.get("release_date"), market_year)]
                    if len(year_candidates) > MAX_ALTERNATIVE_TITLE_CANDIDATES:
                        candidates = []
                        too_many_alias_candidates = True
                    else:
                        candidates = []
                        for movie in year_candidates:
                            alt_url = f"https://api.themoviedb.org/3/movie/{int(movie['id'])}/alternative_titles?" + urllib.parse.urlencode({
                                "api_key": api_key, "country": "JP",
                            })
                            alternatives = rate_limited_fetch(alt_url).get("titles", [])
                            if any(normalize(title) == normalize(item.get("title")) for item in alternatives):
                                candidates.append(movie)
                        if candidates:
                            match_type = "exact_tmdb_alternative_title_and_release_year_window"
        except Exception as exc:
            print("TMDB box-office poster lookup skipped:", title, type(exc).__name__)
            # A transient API failure must remain retryable on the next run.
            unresolved += 1
            continue

        unique = {str(movie.get("id")): movie for movie in candidates if movie.get("id")}
        if len(unique) == 1:
            movie = next(iter(unique.values()))
            path_value = movie.get("poster_path")
            if not valid_poster_path(path_value):
                row["poster_checked_at"] = checked_at
                row["poster_check_version"] = POSTER_CHECK_VERSION
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
            })
            enriched += 1
        else:
            row["poster_checked_at"] = checked_at
            row["poster_check_version"] = POSTER_CHECK_VERSION
            if len(unique) > 1 or too_many_alias_candidates:
                ambiguous += 1
            else:
                unresolved += 1

    if enriched or ambiguous or unresolved:
        atomic_write(path, data)
    grouped = sum(grouped_title(row.get("title")) for rows in data["by_year"].values()
                  if isinstance(rows, list) for row in rows if isinstance(row, dict) and not row.get("poster"))
    return {"enriched": enriched, "local_enriched": local_enriched,
            "ambiguous": ambiguous, "unresolved": unresolved, "grouped": grouped}


if __name__ == "__main__":
    try:
        result = backfill()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print("Box-office poster backfill failed:", exc, flush=True)
        raise SystemExit(1)
    print("Box-office poster backfill:", json.dumps(result, ensure_ascii=False, sort_keys=True), flush=True)
