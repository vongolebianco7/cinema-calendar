#!/usr/bin/env python3
"""Conservative outdoor screening discovery from official event pages and RSS.
Only structured Event records with an explicit date and Tokyo/Kanagawa venue are published.
"""
import datetime as dt
import html
import json
import os
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "outdoor-events.json"
TERMS = ["野外シネマ", "野外映画", "屋外映画上映", "屋外シネマ", "星空上映会", "オープンエアシネマ"]
REGIONS = {"東京都": "東京", "神奈川県": "神奈川", "Tokyo": "東京", "Kanagawa": "神奈川"}
# Only accept a directly fetched organizer/venue page; reject news aggregators and search pages.
BLOCKED = ("news.google.com", "prtimes.jp", "eventernote.com", "x.com", "instagram.com", "facebook.com")
UA = {"User-Agent": "CinelvaEventDiscovery/1.0 (+https://github.com/vongolebianco7/cinema-calendar)"}

def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=15) as response:
        if response.status != 200:
            return ""
        if int(response.headers.get("Content-Length", "0")) > 2_000_000:
            return ""
        return response.read(2_000_000).decode("utf-8", "replace")

def objects(node):
    if isinstance(node, list):
        for item in node:
            yield from objects(item)
    elif isinstance(node, dict):
        if "@graph" in node:
            yield from objects(node["@graph"])
        else:
            yield node

def extract(url):
    if not url.startswith("https://") or any(b in urllib.parse.urlsplit(url).netloc for b in BLOCKED):
        return []
    try:
        page = fetch(url)
    except Exception:
        return []
    if not page:
        return []
    results = []
    scripts = re.findall(r'<script[^>]+type=[^>]*application/ld\+json[^>]*>(.*?)</script>', page, re.I | re.S)
    for raw in scripts:
        try:
            nodes = list(objects(json.loads(html.unescape(raw))))
        except (ValueError, TypeError):
            continue
        for event in nodes:
            kind = event.get("@type", [])
            if isinstance(kind, str):
                kind = [kind]
            if not any("Event" in str(k) for k in kind):
                continue
            name = str(event.get("name", "")).strip()
            description = str(event.get("description", ""))
            if not any(t in name + description + page[:2000] for t in TERMS):
                continue
            start = str(event.get("startDate", ""))[:10]
            try:
                day = dt.date.fromisoformat(start)
            except ValueError:
                continue
            if day < dt.date.today() - dt.timedelta(days=30) or day > dt.date.today() + dt.timedelta(days=400):
                continue
            venue = event.get("location", {})
            if isinstance(venue, list):
                venue = venue[0] if venue else {}
            if not isinstance(venue, dict):
                continue
            address = venue.get("address", {})
            if isinstance(address, str):
                address = {"streetAddress": address}
            if not isinstance(address, dict):
                continue
            region_text = " ".join(str(address.get(k, "")) for k in ("addressRegion", "addressLocality", "streetAddress"))
            area = next((v for k, v in REGIONS.items() if k in region_text), None)
            if not area:
                continue
            place = str(venue.get("name", "") or address.get("streetAddress", ""))
            if not place or not name:
                continue
            canonical = str(event.get("url", url))
            if not canonical.startswith("https://"):
                canonical = url
            slug = re.sub(r"[^a-z0-9]", "", urllib.parse.urlsplit(url).netloc.lower())[:35]
            event_id = f"auto-{slug}-{start}-{abs(__import__('zlib').crc32((name+place).encode())):08x}"
            results.append(dict(id=event_id, date=start, name=name[:150], area=area, place=place[:150], movie="", url=canonical, source_url=url))
    return results

def discover():
    urls = set()
    for term in TERMS:
        q = urllib.parse.quote(f'{term} (東京 OR 神奈川) when:120d')
        feed = f"https://news.google.com/rss/search?q={q}&hl=ja&gl=JP&ceid=JP:ja"
        try:
            root = ET.fromstring(fetch(feed))
        except (ValueError, ET.ParseError, OSError):
            continue
        for item in root.findall(".//item"):
            link = item.findtext("link", "")
            # News RSS URLs are discovery hints only; never treat them as verified event pages.
            if link.startswith("https://") and "news.google.com" not in urllib.parse.urlsplit(link).netloc:
                urls.add(link)
    # Curated official calendars can be extended without changing application code.
    sources = ROOT / "data" / "outdoor-event-sources.json"
    if sources.exists():
        for url in json.loads(sources.read_text()).get("official_pages", []):
            urls.add(url)
    found = []
    for url in sorted(urls)[:80]:
        found.extend(extract(url))
    return found

def main():
    current = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {"events": []}
    by_id = {e["id"]: e for e in current.get("events", [])}
    new = discover()
    for e in new:
        by_id[e["id"]] = e
    current["events"] = sorted(by_id.values(), key=lambda e: (e["date"], e["id"]))
    current["updated_at"] = dt.date.today().isoformat()
    current["discovery_count"] = len(new)
    OUTPUT.write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n")
    print(f"Published {len(current['events'])} records; {len(new)} discovered on this run")

if __name__ == "__main__":
    main()
