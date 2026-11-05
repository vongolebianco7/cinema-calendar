"""Unit tests for read-only source health evaluation."""
import datetime as dt
import importlib.util
from pathlib import Path
import unittest

MODULE = Path(__file__).resolve().parents[1] / "scripts" / "audit_source_health.py"
spec = importlib.util.spec_from_file_location("audit_source_health", MODULE)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
NOW = dt.datetime(2026, 11, 6, tzinfo=dt.timezone.utc)


class SourceHealthTests(unittest.TestCase):
    def test_age_is_from_observation_not_generated_at(self):
        snapshot = {"generated_at": NOW.isoformat(), "sources": [
            {"id": "tv", "status": "manual",
             "source_observed_at": "2026-10-01T00:00:00Z", "max_age_hours": 168},
            {"id": "tmdb", "status": "automated",
             "source_observed_at": "2026-11-05T00:00:00Z", "max_age_hours": 48},
        ]}
        result = audit.build_report(snapshot, NOW)
        self.assertEqual([s["health"] for s in result["sources"]], ["stale", "fresh"])
        self.assertEqual(result["summary"]["manual"], 1)

    def test_disabled_and_unknown_are_not_fresh(self):
        snapshot = {"sources": [
            {"id": "showtimes", "status": "disabled-pending-permission",
             "source_observed_at": NOW.isoformat(), "max_age_hours": 48},
            {"id": "events", "status": "manual", "max_age_hours": 168},
        ]}
        result = audit.build_report(snapshot, NOW)
        self.assertEqual([s["health"] for s in result["sources"]], ["disabled", "unknown"])

    def test_future_timestamp_is_not_fresh(self):
        result = audit.build_report({"sources": [{"id": "a", "status": "automated",
            "source_observed_at": "2026-11-07T00:00:00Z", "max_age_hours": 48}]}, NOW)
        self.assertEqual(result["sources"][0]["health"], "unknown")

    def test_recent_source_does_not_hide_stale_title_observations(self):
        result = audit.build_report({"sources": [{
            "id": "streaming", "status": "automated",
            "source_observed_at": NOW.isoformat(), "max_age_hours": 168,
            "observations": {"total": 100, "fresh": 35, "stale": 65}
        }]}, NOW)
        source = result["sources"][0]
        self.assertEqual(source["health"], "fresh")
        self.assertEqual(source["title_level_freshness"]["fresh_pct"], 35.0)

    def test_invalid_observation_counts_do_not_claim_coverage(self):
        result = audit.build_report({"sources": [{
            "id": "streaming", "status": "automated",
            "source_observed_at": NOW.isoformat(), "max_age_hours": 168,
            "observations": {"total": 10, "fresh": 11, "stale": 0}
        }]}, NOW)
        self.assertIsNone(result["sources"][0]["title_level_freshness"])

    def test_reject_duplicate_ids(self):
        with self.assertRaises(ValueError):
            audit.build_report({"sources": [{"id": "a"}, {"id": "a"}]}, NOW)

    def test_reject_invalid_input(self):
        with self.assertRaises(ValueError):
            audit.build_report({"sources": {}}, NOW)


if __name__ == "__main__":
    unittest.main()
