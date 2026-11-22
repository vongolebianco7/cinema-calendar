#!/usr/bin/env python3
"""Discover possible streaming announcements from explicitly configured official RSS feeds.
Candidates are never published as release dates without verification.
"""
import ipaddress
import json
import os
import pathlib
import re
import socket
import tempfile
from datetime import date, datetime, timezone
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONFIG = ROOT / "data/streaming-official-feeds.json"
OUTPUT = ROOT / "data/streaming-announcement-candidates.json"
VERIFIED_CATALOG = ROOT / "data/streaming-official-current.json"
KEYWORDS = re.compile(r"配信|映画|作品|prime video|netflix|disney|apple tv|unext|u-next|wowow|hulu", re.I)
ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def canonical_source_url(value):
    """Ignore tracking only; keep all other URL components significant."""
    if not isinstance(value, str):
        return ""
    parsed = urlparse(value)
    if parsed.scheme.lower() != "https" or not parsed.hostname or parsed.username or parsed.password:
        return ""
    query = sorted(
        (key, item)
        for key, item in parse_qsl(parsed.query, keep_blank_values=True)
        if not key.lower().startswith("utm_")
    )
    return urlunparse((
        "https",
        parsed.netloc.lower(),
        parsed.path,
        parsed.params,
        urlencode(query, doseq=True),
        "",
    ))


def normalized_title(value):
    if not isinstance(value, str):
        return ""
    return "".join(
        char for char in unicodedata.normalize("NFKC", value).casefold()
        if char.isalnum()
    )


def find_verified_catalog_match(candidate, verified_movies):
    """Return one strict same-source film identity, or None when uncertain."""
    service = candidate.get("service")
    candidate_url = canonical_source_url(candidate.get("source_url"))
    headline = normalized_title(candidate.get("title"))
    if not service or not candidate_url or not headline:
        return None

    matches = {}
    for movie in verified_movies:
        if movie.get("service") != service:
            continue
        if canonical_source_url(movie.get("source_url")) != candidate_url:
            continue
        title = movie.get("title")
        normalized = normalized_title(title)
        release_date = movie.get("date")
        tmdb_id = movie.get("tmdb_id") or movie.get("id")
        if len(normalized) < 6 or normalized not in headline:
            continue
        if not isinstance(release_date, str) or not ISO_DATE.fullmatch(release_date):
            continue
        try:
            date.fromisoformat(release_date)
        except ValueError:
            continue
        if isinstance(tmdb_id, bool) or not isinstance(tmdb_id, int) or tmdb_id <= 0:
            continue
        identity = (tmdb_id, release_date, normalized)
        matches[identity] = {"title": title, "date": release_date, "tmdb_id": tmdb_id}

    if len(matches) != 1:
        return None
    return next(iter(matches.values()))


def classify_candidate(candidate, verified_movies):
    result = dict(candidate)
    match = find_verified_catalog_match(candidate, verified_movies)
    if match:
        result["status"] = "already_in_verified_catalog"
        result["verified_catalog_match"] = match
    return result


def discover(config=CONFIG, output=OUTPUT, opener=urllib.request.urlopen,
             catalog=VERIFIED_CATALOG, now=None):
    feeds = json.loads(config.read_text(encoding="utf-8"))
    catalog_data = json.loads(catalog.read_text(encoding="utf-8"))
    verified_movies = catalog_data.get("movies")
    if not isinstance(verified_movies, list):
        raise ValueError("Verified streaming catalog must contain a movies list")

    candidates = []
    for feed in feeds.get("feeds", []):
        url = feed["url"]
        if not url.startswith("https://") or not feed.get("service"):
            raise ValueError("Official feed must have HTTPS URL and service")
        hostname = (urlparse(url).hostname or "").lower()
        if not hostname or hostname in {"localhost", "127.0.0.1"} or hostname.endswith(".local"):
            raise ValueError("Non-public feed hostname refused")
        for address in socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM):
            ip = ipaddress.ip_address(address[4][0])
            if not ip.is_global:
                raise ValueError("Official feed resolved to a non-public address")
        request = urllib.request.Request(url, headers={"User-Agent": "Cinelva-feed-discovery/1.0"})
        with opener(request, timeout=12) as response:
            final_url = response.geturl() if hasattr(response, "geturl") else url
            if not final_url.startswith("https://") or (urlparse(final_url).hostname or "").lower() != hostname:
                raise ValueError("Feed redirected outside the configured HTTPS hostname")
            raw = response.read(1_000_001)
        if len(raw) > 1_000_000:
            raise ValueError("Official feed exceeded size limit")
        root = ET.fromstring(raw)
        entries = root.findall(".//item")
        if not entries:
            entries = root.findall(".//{http://www.w3.org/2005/Atom}entry")
        for entry in entries[:60]:
            title = (entry.findtext("title") or entry.findtext("{http://www.w3.org/2005/Atom}title") or "").strip()
            link = (entry.findtext("link") or "").strip()
            if not link:
                atom = entry.find("{http://www.w3.org/2005/Atom}link")
                link = atom.get("href", "") if atom is not None else ""
            if title and KEYWORDS.search(title) and link.startswith("https://"):
                candidates.append({"service": feed["service"], "title": title, "source_url": link, "status": "needs_release_date_verification"})
    unique = list({(item["service"], item["source_url"]): item for item in candidates}.values())
    classified = [classify_candidate(item, verified_movies) for item in unique]
    if not feeds.get("feeds"):
        print("No verified official RSS endpoints configured; discovery is inactive")
    result = {"schema_version": 1}
    if feeds.get("feeds"):
        checked_at = now or datetime.now(timezone.utc)
        if checked_at.tzinfo is None:
            checked_at = checked_at.replace(tzinfo=timezone.utc)
        result.update({
            "generated_at": checked_at.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
            "feeds_checked": len(feeds["feeds"]),
            "candidate_count": len(classified),
            "verified_catalog_matches": sum(
                item.get("status") == "already_in_verified_catalog" for item in classified
            ),
        })
    result["candidates"] = sorted(
        classified, key=lambda item: (item["service"], item["source_url"])
    )
    content = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if output.exists() and output.read_text(encoding="utf-8") == content:
        return len(classified)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=output.parent, delete=False) as tmp:
        tmp.write(content)
        path = tmp.name
    os.replace(path, output)
    return len(classified)


if __name__ == "__main__":
    print("Official feed candidates:", discover())
