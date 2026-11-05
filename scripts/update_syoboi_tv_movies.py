"""Refresh anime-related movie broadcast rows from Syoboi Calendar's public API.

The source publishes anime and anime-related schedules only. Category 8 is the
source's explicit movie category; it is not a nationwide all-broadcaster feed.
"""

import datetime as dt
from dataclasses import dataclass
import json
import os
import random
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "tv.json"
SOURCE_URL = "https://cal.syoboi.jp/rss2.php?days=7&filter=2&alt=json"
USER_AGENT = "Cinelva/1.0 (+https://cinelva.vercel.app/feedback.html)"
JST = ZoneInfo("Asia/Tokyo")


@dataclass
class FeedResponse:
    payload: object | None
    metadata: dict


def _as_programs(payload):
    """Accept a bare list and common nested JSON representations of RSS items."""
    if isinstance(payload, list):
        if all(isinstance(item, dict) for item in payload):
            return payload
        raise ValueError("Syoboi program list contains non-object rows")
    if isinstance(payload, dict):
        # The endpoint documents JSON as raw schedule data, while its exact
        # wrapper is not fixed by the published field list. Walk only known
        # collection keys so metadata objects cannot be mistaken for rows.
        for key, value in payload.items():
            if key.casefold() in {"items", "item", "programs", "program", "prog", "list"}:
                if isinstance(value, list) and all(isinstance(item, dict) for item in value):
                    return value
                if isinstance(value, dict):
                    nested = _as_programs(value)
                    if nested:
                        return nested
        for value in payload.values():
            if isinstance(value, dict):
                try:
                    nested = _as_programs(value)
                    if nested:
                        return nested
                except ValueError:
                    continue
    raise ValueError("Syoboi response did not contain a program list")


def _broadcast_datetime(program):
    value = program.get("StTimeU") or program.get("st_time_unix")
    if value is None:
        value = program.get("StTime") or program.get("start_time")
    if isinstance(value, (int, float)) or (isinstance(value, str) and value.isdigit()):
        seconds = float(value)
        if seconds > 10_000_000_000:
            seconds /= 1000
        return dt.datetime.fromtimestamp(seconds, tz=dt.timezone.utc).astimezone(JST)
    if isinstance(value, str):
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=JST)
        return parsed.astimezone(JST)
    return None


def _category(program):
    try:
        return int(program.get("Cat"))
    except (TypeError, ValueError):
        return -1


def _key(item):
    normalized_title = " ".join(str(item.get("title", "")).split()).casefold()
    return normalized_title, item.get("date"), " ".join(str(item.get("service", "")).split()).casefold()


def _write_snapshot(path, snapshot):
    encoded = json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n"
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=".tv-", suffix=".json.tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as output:
            output.write(encoded)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def normalize_feed(payload, *, now=None, title_metadata=None):
    """Return future category-8 movie broadcasts, excluding all other programs."""
    now = now or dt.datetime.now(JST)
    if now.tzinfo is None:
        now = now.replace(tzinfo=JST)
    now = now.astimezone(JST)
    records = {}
    for program in _as_programs(payload):
        if not isinstance(program, dict) or _category(program) != 8:
            continue
        title = str(program.get("Title") or program.get("title") or "").strip()
        when = _broadcast_datetime(program)
        service = str(program.get("ChName") or program.get("channel") or "").strip()
        if not title or not when or when < now or not service:
            continue
        row = {
            "title": title,
            "date": when.date().isoformat(),
            "time": when.strftime("%H:%M"),
            "event": "tv",
            "service": service,
            "program": title,
            "source": "しょぼいカレンダー公開番組表（映画カテゴリ）",
            "source_url": SOURCE_URL,
            "source_id": "syoboi_calendar",
            "collection_method": "automated_public_api",
            "source_program_id": str(program.get("PID") or program.get("pid") or ""),
            "source_title_id": str(program.get("TID") or program.get("tid") or ""),
        }
        metadata = (title_metadata or {}).get(row["source_title_id"], {})
        if metadata.get("TitleEN"):
            row["original_title"] = metadata["TitleEN"]
        try:
            year = int(metadata.get("FirstYear"))
            if 1888 <= year <= 2100:
                row["release_year"] = year
                row["year"] = year
        except (TypeError, ValueError):
            pass
        records.setdefault(_key(row), row)
    return sorted(records.values(), key=lambda row: (row["date"], row["time"], row["title"], row["service"]))


def parse_title_metadata(xml_text):
    root = ET.fromstring(xml_text)
    result_code = next((node.text for node in root.iter() if node.tag.split("}")[-1].lower() == "code"), None)
    if result_code is not None and result_code != "200":
        raise ValueError(f"Syoboi TitleLookup returned result code {result_code}")
    metadata = {}
    allowed = {"TID", "Title", "TitleEN", "FirstYear", "Cat"}
    for node in root.iter():
        fields = {child.tag.split("}")[-1]: (child.text or "").strip() for child in list(node)}
        if "TID" not in fields or "Title" not in fields:
            continue
        metadata[fields["TID"]] = {key: value for key, value in fields.items() if key in allowed}
    return metadata


def fetch_title_metadata(programs):
    tids = sorted({str(program.get("TID") or program.get("tid")) for program in programs
                   if isinstance(program, dict) and _category(program) == 8 and (program.get("TID") or program.get("tid"))})
    metadata = {}
    for offset in range(0, len(tids), 100):
        if offset:
            time.sleep(random.uniform(1, 3))
        else:
            # The schedule feed was just requested; keep at least a one-second gap.
            time.sleep(random.uniform(1, 3))
        params = urllib.parse.urlencode({
            "Command": "TitleLookup",
            "TID": ",".join(tids[offset:offset + 100]),
            "Fields": "TID,Title,TitleEN,FirstYear,Cat",
        })
        request = urllib.request.Request(f"https://cal.syoboi.jp/db.php?{params}", headers={"User-Agent": USER_AGENT, "Accept": "application/xml"})
        with urllib.request.urlopen(request, timeout=20) as response:
            xml_text = response.read(2_000_001).decode("utf-8")
            if len(xml_text) > 2_000_000:
                raise ValueError("Syoboi TitleLookup response exceeded the safe size limit")
        metadata.update(parse_title_metadata(xml_text))
    return metadata


def merge_tv_snapshot(current, automated, *, generated_at=None, allow_empty=False):
    """Replace only this source's rows; preserve all manually curated TV records."""
    if not automated and not allow_empty:
        raise ValueError("No valid upcoming Syoboi movie broadcasts; keep the last good snapshot")
    if not isinstance(current, dict) or not isinstance(current.get("movies"), list):
        raise ValueError("Existing television snapshot is malformed; refusing to replace it")
    manual = [row for row in current["movies"] if row.get("source_id") != "syoboi_calendar"]
    manual_keys = {_key(row) for row in manual if isinstance(row, dict)}
    fresh = [row for row in automated if _key(row) not in manual_keys]
    result = dict(current)
    result["movies"] = manual + fresh
    result["automated_movies"] = fresh
    result["automation_generated_at"] = generated_at or dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")
    result["automation_source"] = "syoboi_calendar"
    return result


def fetch_feed(current=None):
    # Follow the provider's bot guidance: one request, cache the result, identify
    # the application, and avoid synchronized requests by adding a small delay.
    time.sleep(random.uniform(1, 30))
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    if current:
        if current.get("source_etag"):
            headers["If-None-Match"] = current["source_etag"]
        if current.get("source_last_modified"):
            headers["If-Modified-Since"] = current["source_last_modified"]
    request = urllib.request.Request(SOURCE_URL, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read(5_000_001)
            if len(raw) > 5_000_000:
                raise ValueError("Syoboi response exceeded the safe size limit")
            metadata = {
                "source_etag": response.headers.get("ETag"),
                "source_last_modified": response.headers.get("Last-Modified"),
                "source_cache_control": response.headers.get("Cache-Control"),
            }
    except urllib.error.HTTPError as error:
        if error.code == 304:
            return FeedResponse(None, {})
        raise
    return FeedResponse(json.loads(raw.decode("utf-8")), metadata)


def run(path=DATA_PATH, *, fetcher=None, now=None):
    path = Path(path)
    try:
        current = json.loads(path.read_text(encoding="utf-8"))
        fetched = fetcher() if fetcher is not None else fetch_feed(current)
        if isinstance(fetched, FeedResponse):
            if fetched.payload is None:
                current["automation_checked_at"] = dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")
                _write_snapshot(path, current)
                print("Syoboi feed returned HTTP 304; cached snapshot remains current")
                return True
            payload = fetched.payload
            metadata = fetched.metadata
        else:
            payload = fetched
            metadata = {}
        programs = _as_programs(payload)
        if not programs:
            raise ValueError("Syoboi feed is unexpectedly empty; keep the last good snapshot")
        title_metadata = fetch_title_metadata(programs)
        automated = normalize_feed(programs, now=now, title_metadata=title_metadata)
        updated = merge_tv_snapshot(current, automated, allow_empty=True)
        updated.update({key: value for key, value in metadata.items() if value})
        updated["automation_checked_at"] = dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")
        _write_snapshot(path, updated)
        print(f"Syoboi movie broadcasts refreshed: {len(automated)} upcoming source records")
        return True
    except Exception as error:  # Keep the previous snapshot and let other daily refreshes continue.
        print(f"Syoboi movie-broadcast refresh skipped; last good snapshot preserved: {error}")
        return False


if __name__ == "__main__":
    if not run():
        raise SystemExit(1)
