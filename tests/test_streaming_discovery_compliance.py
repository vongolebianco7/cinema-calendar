"""Guard against claiming automatic streaming premiere discovery without approved feeds.

This is intentionally a zero-network compliance test. It does not grant
permission to collect from a service or make any automated premiere claims.
"""
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "data"


class StreamingDiscoveryComplianceTests(unittest.TestCase):
    def test_discovery_requires_registered_approved_feed(self):
        sources = json.loads((DATA / "streaming_sources.json").read_text(encoding="utf-8"))
        feeds = json.loads((DATA / "streaming-official-feeds.json").read_text(encoding="utf-8"))
        registry = json.loads((DATA / "source_registry.json").read_text(encoding="utf-8"))
        approved = {entry["id"]: entry for entry in registry["sources"]
                    if entry.get("mode") == "approved"}
        premiere_purposes = {"release_announcements", "streaming_premiere_feed"}
        names = [service["name"] for service in sources["services"]]
        expected = ["Netflix", "Prime Video", "Disney+", "U-NEXT", "Hulu", "Apple TV+",
                    "Lemino", "ABEMA", "DMM TV", "FOD", "TELASA", "WOWOWオンデマンド"]
        self.assertEqual(names, expected, "Configured streaming services must remain explicit")
        self.assertEqual(len(names), len(set(names)), "Duplicate streaming services")
        approved_feeds = {}
        for feed in feeds["feeds"]:
            self.assertIn(feed["source_id"], approved,
                          "Automated feed is not in the approved source registry")
            purposes = set(approved[feed["source_id"]].get("purpose", []))
            self.assertTrue(purposes & premiere_purposes,
                            "Availability-only/other-purpose approval cannot authorize premiere discovery")
            self.assertTrue(feed.get("url", "").startswith("https://"))
            self.assertIn(feed.get("service"), names, "Feed service must be in the configured catalogue")
            approved_feeds.setdefault(feed["service"], []).append(feed)
        for service in sources["services"]:
            if service.get("auto_premiere_discovery"):
                self.assertIn(service["name"], approved_feeds,
                              "Cannot claim automatic premiere discovery without an approved feed")
            self.assertTrue(service.get("official_url", "").startswith("https://"))

    def test_availability_only_source_cannot_authorize_premieres(self):
        registry = json.loads((DATA / "source_registry.json").read_text(encoding="utf-8"))
        source = next(entry for entry in registry["sources"] if entry["id"] == "justwatch_via_tmdb")
        self.assertEqual(source["mode"], "approved")
        self.assertIn("streaming_availability", source.get("purpose", []))
        self.assertFalse({"release_announcements", "streaming_premiere_feed"} & set(source.get("purpose", [])))

    def test_watch_provider_is_not_premiere_evidence(self):
        sources = json.loads((DATA / "streaming_sources.json").read_text(encoding="utf-8"))
        self.assertIn("current availability observations only", sources["policy"])
        self.assertIn("Official announcements establish premiere dates", sources["policy"])


if __name__ == "__main__":
    unittest.main()
