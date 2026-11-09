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
SEARCH = "https://api.themoviedb.org/3/search/movie"
DETAILS = "https://api.themoviedb.org/3/movie/{}"
IMAGE_BASE = "https://image.tmdb.org/t/p/w500"
MAX_DAILY_LOOKUPS = 100
RECHECK_DAYS = 30


def normalize(value):
    return "".join(c for c in unicodedata.normalize("NFKC", str(value or "")).casefold() if c.isalnum())


def grouped_title(title):
    # Historical association records combine separate films with spaced slashes.
    # Do not assign one member's poster to a row representing several titles.
    return bool(re.search(r"\s/\s", str(title or "")))


def valid_poster_path(value):
    return isinstance(value, str) and value.startswith("/") and not value.startswith("//")


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


def backfill(path=BOXOFFICE, api_key=None, opener=urllib.request.urlopen, delay=0.35,
             now=None, limit=MAX_DAILY_LOOKUPS):
    api_key = os.environ.get("TMDB_API_KEY", "") if api_key is None else api_key
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("by_year"), dict):
        raise ValueError("Invalid box-office dataset; refusing to modify it")
    if not api_key:
        return {"enriched": 0, "ambiguous": 0, "unresolved": 0, "grouped": sum(
            grouped_title(row.get("title")) for rows in data["by_year"].values() if isinstance(rows, list)
            for row in rows if isinstance(row, dict) and not row.get("poster"))}

    now = now or datetime.datetime.now(datetime.timezone.utc)
    checked_at = now.astimezone(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
    enriched = ambiguous = unresolved = 0
    last_request = 0.0
    for _, index, market_year, row in candidate_rows(data, now, limit):
        title = str(row.get("title") or "").strip()
        if not title or not normalize(title):
            unresolved += 1
            continue
        existing_id = row.get("tmdbId") or row.get("tmdb_id")
        try:
            if existing_id:
                if not str(existing_id).isdigit() or int(existing_id) <= 0:
                    unresolved += 1
                    continue
                url = DETAILS.format(int(existing_id)) + "?" + urllib.parse.urlencode({"api_key": api_key, "language": "ja-JP"})
                result = fetch_json(url, opener)
                candidates = [result] if result.get("id") == int(existing_id) else []
            else:
                wait = delay - (time.monotonic() - last_request)
                if wait > 0:
                    time.sleep(wait)
                url = SEARCH + "?" + urllib.parse.urlencode({
                    "api_key": api_key, "query": title, "language": "ja-JP", "region": "JP",
                    "include_adult": "false", "page": 1,
                })
                result = fetch_json(url, opener)
                candidates = [movie for movie in result.get("results", [])
                              if normalize(title) in {normalize(movie.get("title")), normalize(movie.get("original_title"))}
                              and eligible_release_year(movie.get("release_date"), market_year)]
                last_request = time.monotonic()
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
                "identity_match": "exact_title_and_release_year_window",
                "poster_checked_at": checked_at,
            })
            enriched += 1
        else:
            row["poster_checked_at"] = checked_at
            if len(unique) > 1:
                ambiguous += 1
            else:
                unresolved += 1

    if enriched or ambiguous or unresolved:
        atomic_write(path, data)
    grouped = sum(grouped_title(row.get("title")) for rows in data["by_year"].values()
                  if isinstance(rows, list) for row in rows if isinstance(row, dict) and not row.get("poster"))
    return {"enriched": enriched, "ambiguous": ambiguous, "unresolved": unresolved, "grouped": grouped}


if __name__ == "__main__":
    try:
        result = backfill()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print("Box-office poster backfill failed:", exc, flush=True)
        raise SystemExit(1)
    print("Box-office poster backfill:", json.dumps(result, ensure_ascii=False, sort_keys=True), flush=True)
