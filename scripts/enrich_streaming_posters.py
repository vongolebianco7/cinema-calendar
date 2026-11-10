#!/usr/bin/env python3
"""Attach TMDB poster URLs to official streaming announcements by strict identity.

The official source remains authoritative for date and service. Existing TMDB
IDs are preferred. Without an ID, a title search is eligible only when the
reviewed movie release year is also present and exactly matches one result.
Ambiguous or yearless titles are left without a poster rather than guessed.
"""
import json
import os
import pathlib
import re
import tempfile
import time
import unicodedata
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
INPUT = ROOT / "data/streaming-official-current.json"
CATALOG = ROOT / "data/movies.json"
DIRECTOR_CATALOG = ROOT / "data/directors-mobile.json"
BASE = "https://api.themoviedb.org/3/search/movie"
DETAILS = "https://api.themoviedb.org/3/movie/{}"
IMAGE_BASE = "https://image.tmdb.org/t/p/w500"
LOCAL_TITLE_ALIASES = {
    # U-NEXT adds the descriptive "映画" prefix to its official title.
    "映画 仮面ライダーゼッツ さよならのミッション": "仮面ライダーゼッツ さよならのミッション",
    # Amazon's official November 2026 announcement supplies the original
    # title MADDEN. The reviewed local TMDB catalog stores that title in
    # English, while the streaming row uses the Japanese transcription.
    "マッデン": "Madden",
}


def normalize(value):
    return "".join(c for c in unicodedata.normalize("NFKC", str(value or "")).casefold() if c.isalnum())


def _catalog_records(value):
    """Yield poster-bearing TMDB movie records from supported catalog shapes."""
    if isinstance(value, dict):
        if (value.get("id") and value.get("poster") and
                (value.get("title") or value.get("original_title"))):
            yield value
        for child in value.values():
            yield from _catalog_records(child)
    elif isinstance(value, list):
        for child in value:
            yield from _catalog_records(child)


def enrich(path=INPUT, api_key=None, opener=urllib.request.urlopen, delay=0.35, catalog_path=CATALOG):
    # An explicit empty key disables external requests, which keeps offline tests and
    # deployments without credentials from silently inheriting a process secret.
    api_key = os.environ.get("TMDB_API_KEY", "") if api_key is None else api_key
    data = json.loads(path.read_text(encoding="utf-8"))
    rows = data.get("movies") if isinstance(data, dict) else None
    if not isinstance(rows, list) or not rows:
        raise ValueError("Official streaming output is invalid; existing data is preserved")

    # Reuse existing, locally reviewed TMDB identities where the announced
    # title has exactly one normalized match in the canonical movie catalog.
    catalog_paths = [catalog_path]
    if catalog_path.resolve() == CATALOG.resolve():
        # Director credits are refreshed from TMDB movie-credit identities and
        # contain reviewed IDs/posters absent from the compact movie catalog.
        catalog_paths.append(DIRECTOR_CATALOG)
    by_title = {}
    by_id = {}
    for current_path in catalog_paths:
        if not current_path.exists():
            continue
        catalog = json.loads(current_path.read_text(encoding="utf-8"))
        for item in _catalog_records(catalog):
            by_id[str(item["id"])] = item
            for name in (item.get("title"), item.get("original_title")):
                key = normalize(name)
                if key:
                    by_title.setdefault(key, {})[str(item["id"])] = item

    last_request = 0.0
    enriched = ambiguous = unresolved = 0
    candidate_review = []
    for movie in rows:
        if movie.get("poster"):
            continue
        # Preserve existing canonical identities, regardless of alias.
        # A title search must never override a reviewed movie ID.
        identity_values = [movie.get(field) for field in ("tmdb_id", "tmdbId", "id")
                           if movie.get(field) is not None]
        # A canonical TMDB movie URL is also a reviewed identity. Never use a
        # same-title search when the URL and numeric aliases disagree.
        tmdb_url = movie.get("tmdb")
        if isinstance(tmdb_url, str):
            match = re.fullmatch(r"https://www\.themoviedb\.org/movie/([1-9][0-9]*)/?", tmdb_url)
            if match:
                identity_values.append(int(match.group(1)))
        identity_ids = {str(value) for value in identity_values}
        if len(identity_ids) > 1:
            ambiguous += 1
            candidate_review.append({
                "query": movie.get("title"),
                "reason": "conflicting existing TMDB identity aliases; no poster assigned",
                "candidates": [],
            })
            continue
        reviewed_id = identity_values[0] if identity_values else None
        if isinstance(reviewed_id, str) and reviewed_id.isdecimal():
            reviewed_id = int(reviewed_id)
        if reviewed_id is not None and (not isinstance(reviewed_id, int) or reviewed_id <= 0):
            unresolved += 1
            continue
        if isinstance(reviewed_id, int) and reviewed_id > 0:
            # An exact reviewed ID in the local catalog is safe to reuse
            # offline; never replace it with a same-title different movie.
            reviewed_catalog = by_id.get(str(reviewed_id))
            if reviewed_catalog is not None:
                movie["poster"] = reviewed_catalog["poster"]
                movie["id"] = reviewed_id
                movie["tmdb"] = reviewed_catalog.get("tmdb") or (
                    "https://www.themoviedb.org/movie/" + str(reviewed_id)
                )
                enriched += 1
                continue
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
        expected_year = movie.get("release_year") or movie.get("year")
        reviewed_alias = LOCAL_TITLE_ALIASES.get(movie.get("title"))
        if not expected_year and reviewed_alias:
            # A source-reviewed alias may reuse a local identity without a
            # release year only when the alias resolves to one TMDB ID across
            # the entire canonical catalog. Generic same-title records keep
            # requiring a reviewed year, so remakes cannot be guessed.
            alias_matches = by_title.get(normalize(reviewed_alias), {})
            if len(alias_matches) == 1:
                identity = next(iter(alias_matches.values()))
                movie["poster"] = identity["poster"]
                movie["id"] = identity["id"]
                movie["tmdb"] = identity.get("tmdb") or (
                    "https://www.themoviedb.org/movie/" + str(identity["id"])
                )
                release_year = (identity.get("release_year") or identity.get("year") or
                                str(identity.get("release_date") or "")[:4])
                if str(release_year).isdigit() and 1888 <= int(release_year) <= 2100:
                    movie["release_year"] = int(release_year)
                enriched += 1
                continue
            if len(alias_matches) > 1:
                ambiguous += 1
                candidate_review.append({
                    "query": reviewed_alias,
                    "reason": "reviewed alias matched multiple local TMDB identities; no poster assigned",
                    "candidates": [
                        {
                            "id": int(movie_id),
                            "title": identity.get("title"),
                            "original_title": identity.get("original_title"),
                            "release_date": identity.get("release_date") or "",
                            "tmdb_url": identity.get("tmdb") or
                            "https://www.themoviedb.org/movie/" + str(movie_id),
                        }
                        for movie_id, identity in sorted(alias_matches.items())
                    ],
                })
                continue
        if expected_year:
            expected_year = str(expected_year)
        else:
            unresolved += 1
            candidate_review.append({
                "query": movie.get("title") or movie.get("original_title"),
                "reason": "release year missing; strict title/year matching skipped",
                "candidates": [],
            })
            continue
        exact = {}
        for name in (movie.get("title"), movie.get("original_title"), LOCAL_TITLE_ALIASES.get(movie.get("title"))):
            exact.update(by_title.get(normalize(name), {}))
        exact = {
            movie_id: identity for movie_id, identity in exact.items()
            if str(identity.get("release_year") or identity.get("year") or
                   str(identity.get("release_date") or "")[:4]) == expected_year
        }
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
            candidate_review.append({
                "query": movie.get("title") or movie.get("original_title"),
                "reason": "multiple exact identities in canonical movie catalog",
                "candidates": [
                    {
                        "id": int(movie_id),
                        "title": identity.get("title"),
                        "original_title": identity.get("original_title"),
                        "release_date": identity.get("release_date") or "",
                        "source": "canonical movie catalog",
                        "tmdb_url": identity.get("tmdb") or "https://www.themoviedb.org/movie/" + str(movie_id),
                    }
                    for movie_id, identity in sorted(exact.items())
                ],
            })
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
        search_candidates = []
        for candidate in result.get("results", [])[:10]:
            if not candidate.get("id"):
                continue
            search_candidates.append({
                "id": int(candidate["id"]),
                "title": candidate.get("title") or "",
                "original_title": candidate.get("original_title") or "",
                "release_date": candidate.get("release_date") or "",
                "exact_title_match": needle in {
                    normalize(candidate.get("title")),
                    normalize(candidate.get("original_title")),
                },
                "has_poster": bool(candidate.get("poster_path")),
                "tmdb_url": "https://www.themoviedb.org/movie/" + str(candidate["id"]),
            })
        for candidate in result.get("results", []):
            if not candidate.get("id") or not candidate.get("poster_path"):
                continue
            if needle not in {normalize(candidate.get("title")), normalize(candidate.get("original_title"))}:
                continue
            release_date = candidate.get("release_date") or ""
            if expected_year and (not release_date.startswith(str(expected_year) + "-")):
                continue
            matches[int(candidate["id"])] = candidate
        if len(matches) == 1:
            identity = next(iter(matches.values()))
            movie["poster"] = IMAGE_BASE + identity["poster_path"]
            movie["id"] = int(identity["id"])
            movie["tmdb"] = "https://www.themoviedb.org/movie/" + str(identity["id"])
            release_year = (identity.get("release_date") or "")[:4]
            if release_year.isdigit() and 1888 <= int(release_year) <= 2100:
                movie.setdefault("release_year", int(release_year))
            enriched += 1
        elif len(matches) > 1:
            ambiguous += 1
            candidate_review.append({
                "query": title,
                "reason": "multiple exact-title candidates; no identity assigned",
                "candidates": [
                    {
                        "id": int(candidate["id"]),
                        "title": candidate.get("title") or "",
                        "original_title": candidate.get("original_title") or "",
                        "release_date": candidate.get("release_date") or "",
                        "exact_title_match": True,
                        "has_poster": bool(candidate.get("poster_path")),
                        "tmdb_url": "https://www.themoviedb.org/movie/" + str(candidate["id"]),
                    }
                    for candidate in matches.values()
                ],
            })
        else:
            unresolved += 1
            candidate_review.append({
                "query": title,
                "reason": "no unique exact-title candidate; no identity assigned",
                "candidates": search_candidates,
            })

    if candidate_review:
        print(
            "Streaming poster candidate review (unapproved; no IDs or posters assigned): "
            + json.dumps(candidate_review, ensure_ascii=False, sort_keys=True),
            flush=True,
        )

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
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=str(INPUT), help="Streaming JSON snapshot to enrich")
    args = parser.parse_args()
    try:
        counts = enrich(pathlib.Path(args.input))
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"Streaming poster enrichment failed: {exc}", flush=True)
        raise SystemExit(1)
    print("Streaming poster enrichment: enriched=%d ambiguous=%d unresolved=%d" % counts)
