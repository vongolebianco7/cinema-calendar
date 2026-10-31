#!/usr/bin/env python3
"""Discover possible streaming announcements from explicitly configured official RSS feeds.
Candidates are never published as release dates without verification.
"""
import datetime as dt
import json
import pathlib
import re
import urllib.request
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONFIG = ROOT / "data/streaming-official-feeds.json"
OUTPUT = ROOT / "data/streaming-announcement-candidates.json"
KEYWORDS = re.compile(r"配信|映画|作品|prime video|netflix|disney|apple tv|unext|u-next|wowow|hulu", re.I)
def discover(config=CONFIG, output=OUTPUT, opener=urllib.request.urlopen):
    feeds = json.loads(config.read_text(encoding="utf-8"))
    candidates = []
    for feed in feeds.get("feeds", []):
        url = feed["url"]
        if not url.startswith("https://") or not feed.get("service"):
            raise ValueError("Official feed must have HTTPS URL and service")
        request = urllib.request.Request(url, headers={"User-Agent": "Cinelva-feed-discovery/1.0"})
        with opener(request, timeout=12) as response:
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
    unique = list({(x["service"], x["source_url"]): x for x in candidates}.values())
    if not feeds.get("feeds"):
        print("No verified official RSS endpoints configured; discovery is inactive")
    result = {"candidates": sorted(unique, key=lambda item: (item["service"], item["source_url"]))}
    content = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if output.exists() and output.read_text(encoding="utf-8") == content:
        return len(unique)
    import os
    import tempfile
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=output.parent, delete=False) as tmp:
        tmp.write(content)
        path = tmp.name
    os.replace(path, output)
    return len(unique)
if __name__ == "__main__":
    print("Official feed candidates:", discover())
