#!/usr/bin/env python3
"""Attach TMDB poster URLs to official streaming announcements by exact title.

The official source remains authoritative for date and service. This script
adds artwork only when TMDB returns one distinct exact-title movie identity;
ambiguous titles are left without a poster rather than guessed.
"""
import json
import os
import pathlib
import tempfile
import time
import unicodedata
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
INPUT = ROOT / "data/streaming-official-current.json"
CATALOG = ROOT / "data/movies.json"
BASE = "https://api.themoviedb.org/3/search/movie"
DETAILS = "https://api.themoviedb.org/3/movie/{}"
IMAGE_BASE = "https://image.tmdb.org/t/p/w500"
LOCAL_TITLE_ALIASES = {
    # U-NEXT adds the descriptive "映画" prefix to its official title.
    "映画 仮面ライダーゼッツ さよならのミッション": "仮面ライダーゼッツ さよならのミッション",
}


def normalize(value):
    return "".join(c for c in unicodedata.normalize("NFKC", str(value or "")).casefold() if c.isalnum())


def enrich(path=INPUT, api_key=None, opener=urllib.request.urlopen, delay=0.35, catalog_path=CATALOG):
    api_key = api_key or os.environ.get("TMDB_API_KEY", "")
    data = json.loads(path.read_text(encoding="utf-8"))
    rows = data.get("movies") if isinstance(data, dict) else None
    if not isinstance(rows, list) or not rows:
        raise ValueError("Official streaming output is invalid; existing data is preserved")

    # Reuse existing, locally reviewed TMDB identities where the announced
    # title has exactly one normalized match in the canonical movie catalog.
    catalog = json.loads(catalog_path.read_text(encoding="utf-8")) if catalog_path.exists() else {}
    by_title = {}
    for item in catalog.get("movies", []) if isinstance(catalog, dict) else []:
        if not isinstance(item, dict) or not item.get("id") or not item.get("poster"):
            continue
        for name in (item.get("title"), item.get("original_title")):
            key = normalize(name)
            if key:
                by_title.setdefault(key, {})[str(item["id"])] = item

    last_request = 0.0
    enriched = ambiguous = unresolved = 0
    for movie in rows:
        if movie.get("poster"):
            continue
        reviewed_id = movie.get("tmdb_id")
        if isinstance(reviewed_id, int) and reviewed_id > 0:
            if not api_key:
                unresolved += 1
                continue
            request = urllib.request.Request(
                DETAILS.format(reviewed_id) + "?" + urllib.parse.urlencode({"api_key": api_key, "language": "ja-JP"}),
                headers={"Accept": "application/json"},
            )
            try:
                with opener(request, timeout=15) as response:
                    result = json.load(response)
                if result.get("id") != reviewed_id or not result.get("poster_path"):
                    unresolved += 1
                    continue
                movie["poster"] = IMAGE_BASE + result["poster_path"]
                movie["id"] = reviewed_id
                movie["tmdb"] = "https://www.themoviedb.org/movie/" + str(reviewed_id)
                enriched += 1
            except Exception:
                unresolved += 1
            continue
        exact = {}
        for name in (movie.get("title"), movie.get("original_title"), LOCAL_TITLE_ALIASES.get(movie.get("title"))):
            exact.update(by_title.get(normalize(name), {}))
        if len(exact) == 1:
            identity = next(iter(exact.values()))
            movie["poster"] = identity["poster"]
            movie["id"] = identity["id"]
            movie["tmdb"] = identity.get("tmdb") or "https://www.themoviedb.org/movie/" + str(identity["id"])
            if identity.get("release_year") or identity.get("year"):
                movie["release_year"] = identity.get("release_year") or identity.get("year")
            enriched += 1
            continue
        if len(exact) > 1:
            ambiguous += 1
            continue
        if not api_key:
            unresolved += 1
            continue
        title = movie.get("original_title") or movie.get("title")
        needle = normalize(title)
        if not needle:
            unresolved += 1
            continue
        wait = delay - (time.monotonic() - last_request)
        if wait > 0:
            time.sleep(wait)
        params = urllib.parse.urlencode({
            "api_key": api_key,
            "query": title,
            "language": "ja-JP",
            "region": "JP",
            "include_adult": "false",
            "page": 1,
        })
        request = urllib.request.Request(BASE + "?" + params, headers={"Accept": "application/json"})
        try:
            with opener(request, timeout=15) as response:
                result = json.load(response)
        except Exception:
            unresolved += 1
            last_request = time.monotonic()
            continue
        last_request = time.monotonic()
        matches = {}
        for candidate in result.get("results", []):
            if not candidate.get("id") or not candidate.get("poster_path"):
                continue
            if needle in {normalize(candidate.get("title")), normalize(candidate.get("original_title"))}:
                matches[int(candidate["id"])] = candidate
        if len(matches) == 1:
            movie["poster"] = IMAGE_BASE + next(iter(matches.values()))["poster_path"]
            enriched += 1
        elif len(matches) > 1:
            ambiguous += 1
        else:
            unresolved += 1

    data["poster_enrichment"] = {
        "source": "local catalog or TMDB Search API; unique exact-title matches only",
    }
    content = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if path.read_text(encoding="utf-8") == content:
        return enriched, ambiguous, unresolved
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as tmp:
        tmp.write(content)
        temp_path = tmp.name
    os.replace(temp_path, path)
    return enriched, ambiguous, unresolved


if __name__ == "__main__":
    try:
        counts = enrich()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"Streaming poster enrichment failed: {exc}", flush=True)
        raise SystemExit(1)
    print("Streaming poster enrichment: enriched=%d ambiguous=%d unresolved=%d" % counts)
