"""Pure, offline normalization for reviewed streaming premiere events (#244).

No network calls, no scraping, no inferred premiere dates or TMDB identities.
"""
from datetime import date
from urllib.parse import urlparse


def normalize_premieres(entries, approved_hosts_by_service):
    """Return validated, deduplicated events without mutating source entries.

    Distinct movie identities are not merged based solely on a similar title.
    Missing TMDB IDs remain unresolved and cannot claim a verified identity.
    """
    known = set(approved_hosts_by_service)
    result = []
    seen = set()
    for entry in entries:
        title = entry.get("title")
        service = entry.get("service")
        day = entry.get("date")
        source_url = entry.get("source_url")
        if not isinstance(title, str) or not title.strip() or service not in known:
            raise ValueError("Unknown service or empty movie title")
        if entry.get("verified") is not True or entry.get("content_type", "movie") != "movie":
            raise ValueError("Only verified movie announcements can be published")
        try:
            if not isinstance(day, str) or date.fromisoformat(day).isoformat() != day:
                raise ValueError("Date must be ISO YYYY-MM-DD")
        except (TypeError, ValueError) as exc:
            raise ValueError("Invalid confirmed premiere date") from exc
        parsed = urlparse(source_url if isinstance(source_url, str) else "")
        host = (parsed.hostname or "").casefold().rstrip(".")
        approved_hosts = {
            str(value).casefold().rstrip(".")
            for value in approved_hosts_by_service.get(service, [])
            if isinstance(value, str) and value
        }
        if parsed.scheme != "https" or not host or host not in approved_hosts:
            raise ValueError("An approved official HTTPS host is required for this service")
        tmdb_id = entry.get("tmdb_id")
        if tmdb_id is not None and (type(tmdb_id) is not int or tmdb_id <= 0):
            raise ValueError("TMDB movie ID must be a positive integer")
        # An explicit ID is strong identity; without it use reviewed title and
        # release year so distinct remakes are not silently collapsed.
        year = entry.get("release_year")
        if year is not None and (type(year) is not int or not 1888 <= year <= 2100):
            raise ValueError("Invalid reviewed release year")
        identity = ("tmdb", tmdb_id) if tmdb_id else (
            "unresolved", title.strip().casefold(), year, entry.get("original_title"))
        key = (service, day, identity)
        if key in seen:
            continue
        seen.add(key)
        record = dict(entry)
        record["title"] = title.strip()
        record["event"] = "streaming"
        record["verification"] = "confirmed"
        result.append(record)
    return result
