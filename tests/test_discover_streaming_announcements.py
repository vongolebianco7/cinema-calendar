import json
import pathlib
import tempfile
import unittest
from datetime import datetime, timezone
from unittest.mock import patch

from scripts.discover_streaming_announcements import discover


class DiscoveryTests(unittest.TestCase):
    def test_rejects_private_dns_before_network_fetch(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            config = root / "feeds.json"
            config.write_text(json.dumps({"feeds": [{"service": "Netflix", "url": "https://example.com/feed"}]}), encoding="utf-8")
            def no_network(*args, **kwargs):
                raise AssertionError("unexpected network call")
            with patch("scripts.discover_streaming_announcements.socket.getaddrinfo", return_value=[(2, 1, 6, "", ("10.0.0.1", 443))]):
                with self.assertRaisesRegex(ValueError, "non-public address"):
                    discover(config, root / "out.json", opener=no_network)

    def test_empty_allowlist_is_stable_and_does_not_fetch(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            config = root / "feeds.json"
            output = root / "candidates.json"
            config.write_text(json.dumps({"feeds": []}), encoding="utf-8")
            def no_network(*args, **kwargs):
                raise AssertionError("unexpected network call")
            self.assertEqual(discover(config, output, opener=no_network), 0)
            first = output.read_bytes()
            self.assertEqual(discover(config, output, opener=no_network), 0)
            self.assertEqual(output.read_bytes(), first)
            self.assertEqual(json.loads(first)["candidates"], [])


    def test_parses_registered_rss_and_atom_as_review_candidates(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            config = root / "feeds.json"
            output = root / "candidates.json"
            feeds = [
                {"service": "Netflix", "url": "https://about.netflix.com/ja/feed.xml"},
                {"service": "Apple TV+", "url": "https://www.apple.com/tv-pr/news-feed.xml"},
            ]
            config.write_text(json.dumps({"feeds": feeds}), encoding="utf-8")
            payloads = {
                feeds[0]["url"]: b"""<?xml version="1.0" encoding="UTF-8"?>
                    <rss><channel><item>
                    <title>Netflix movie Example starts streaming</title>
                    <link>https://about.netflix.com/ja/news/example</link>
                    </item></channel></rss>""",
                feeds[1]["url"]: b"""<?xml version="1.0" encoding="UTF-8"?>
                    <feed xmlns="http://www.w3.org/2005/Atom"><entry>
                    <title>Apple TV announces film Example</title>
                    <link href="https://www.apple.com/tv-pr/news/2026/example/"/>
                    </entry></feed>""",
            }

            class Response:
                def __init__(self, url):
                    self.url = url
                def __enter__(self):
                    return self
                def __exit__(self, *args):
                    return False
                def geturl(self):
                    return self.url
                def read(self, limit):
                    return payloads[self.url][:limit]

            def opener(request, timeout):
                self.assertEqual(timeout, 12)
                return Response(request.full_url)

            public_dns = [(2, 1, 6, "", ("93.184.216.34", 443))]
            with patch("scripts.discover_streaming_announcements.socket.getaddrinfo", return_value=public_dns):
                self.assertEqual(discover(
                    config, output, opener=opener,
                    now=datetime(2026, 11, 18, 1, 23, tzinfo=timezone.utc),
                ), 2)
            result = json.loads(output.read_text(encoding="utf-8"))
            candidates = result["candidates"]
            self.assertEqual({item["service"] for item in candidates}, {"Netflix", "Apple TV+"})
            self.assertTrue(all(item["status"] == "needs_release_date_verification" for item in candidates))
            self.assertEqual(result["generated_at"], "2026-11-18T01:23:00Z")
            self.assertEqual(result["feeds_checked"], 2)
            self.assertEqual(result["candidate_count"], 2)
            self.assertEqual(result["verified_catalog_matches"], 0)


if __name__ == "__main__":
    unittest.main()
