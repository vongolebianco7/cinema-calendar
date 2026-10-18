import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path

from scripts.audit_data_freshness import audit

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "quality" / "external-data-registry.json"


class ExternalDataRegistryTests(unittest.TestCase):
    def test_required_categories_are_classified_without_false_automation_claims(self):
        payload = json.loads(REGISTRY.read_text(encoding="utf-8"))
        rows = payload["categories"]
        categories = {row["category"] for row in rows}
        self.assertTrue({"streaming", "theater-schedules", "theater-directory", "television", "box-office", "movies-posters", "awards", "features"} <= categories)
        self.assertEqual(len({row["id"] for row in rows}), len(rows))
        for row in rows:
            self.assertIn(row["status"], {"automated", "manual", "disabled-pending-permission", "disabled-resource-scope", "unavailable"})
            self.assertTrue(row["source"])
            self.assertTrue(row["acquisition"])
            self.assertTrue(row["coverage"])
            if row["status"].startswith("disabled-") or row["status"] == "unavailable":
                self.assertFalse(row["freshness_enforced"], f"{row['id']} cannot refresh while disabled")
        television = next(row for row in rows if row["category"] == "television")
        self.assertEqual(television["status"], "unavailable")
        self.assertFalse(television["freshness_enforced"])

    def test_audit_reports_every_registry_entry_and_only_enforces_declared_datasets(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "fresh.json").write_text('{"generated_at":"2026-10-17T00:00:00Z"}', encoding="utf-8")
            (root / "stale.json").write_text('{"generated_at":"2026-10-01T00:00:00Z"}', encoding="utf-8")
            registry = {"categories": [
                {"id":"fresh","status":"automated","dataset":"fresh.json","generated_at_field":"generated_at","max_age_hours":48,"freshness_enforced":True},
                {"id":"stale-manual","status":"manual","dataset":"stale.json","generated_at_field":"generated_at","max_age_hours":48,"freshness_enforced":False},
                {"id":"missing-source","status":"unavailable","dataset":None,"generated_at_field":None,"max_age_hours":None,"freshness_enforced":False}
            ]}
            report = audit(now=dt.datetime(2026, 10, 17, 12, tzinfo=dt.timezone.utc), registry=registry, root=root)
            self.assertEqual(set(report["datasets"]), {"fresh", "stale-manual", "missing-source"})
            self.assertEqual(report["datasets"]["fresh"]["freshness"], "fresh")
            self.assertEqual(report["datasets"]["stale-manual"]["freshness"], "stale")
            self.assertEqual(report["datasets"]["missing-source"]["freshness"], "not_applicable")
            self.assertEqual(report["enforced_failures"], [])


    def availability_audit(self, snapshot):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "availability.json").write_text(json.dumps(snapshot))
            registry = {"categories": [{"id": "streaming-availability", "status": "automated",
                "dataset": "availability.json", "max_age_hours": 168, "freshness_enforced": True}]}
            return audit(now=dt.datetime(2026, 10, 18, 12, tzinfo=dt.timezone.utc), registry=registry, root=root)

    def test_recent_snapshot_does_not_claim_all_title_observations_are_fresh(self):
        report = self.availability_audit({"generated_at": "2026-10-18T11:00:00Z", "movies": {
            "1": {"checked_at": "2026-10-18T10:00:00Z"},
            "2": {"checked_at": "2026-09-01T10:00:00Z"},
            "3": {},
        }})
        row = report["datasets"]["streaming-availability"]
        self.assertEqual(row["freshness"], "partial")
        self.assertEqual(row["snapshot_freshness"], "fresh")
        self.assertEqual(row["freshness_scope"], "title_observations")
        self.assertEqual(row["observations"]["fresh_7d"], 1)
        self.assertEqual(row["observations"]["stale_7d"], 2)
        self.assertEqual(row["enforcement_scope"], "snapshot_timestamp")
        self.assertEqual(report["enforced_failures"], [])

    def test_expired_snapshot_still_fails_even_when_observed_titles_are_current(self):
        report = self.availability_audit({"generated_at": "2026-09-01T11:00:00Z", "movies": {
            "1": {"checked_at": "2026-10-18T10:00:00Z"},
        }})
        row = report["datasets"]["streaming-availability"]
        self.assertEqual(row["freshness"], "fresh")
        self.assertEqual(row["snapshot_freshness"], "stale")
        self.assertEqual(report["enforced_failures"], ["streaming-availability"])

    def test_malformed_observations_are_not_hidden_by_a_recent_snapshot(self):
        report = self.availability_audit({"generated_at": "2026-10-18T11:00:00Z", "movies": []})
        self.assertEqual(report["datasets"]["streaming-availability"]["freshness"], "invalid")
        self.assertEqual(report["enforced_failures"], ["streaming-availability"])


    def test_no_current_title_observations_are_not_reported_as_fresh(self):
        for movies, expected in [({}, "unknown"), ({"1": {"checked_at": "2026-09-01T10:00:00Z"}}, "stale")]:
            with self.subTest(movies=movies):
                report = self.availability_audit({"generated_at": "2026-10-18T11:00:00Z", "movies": movies})
                row = report["datasets"]["streaming-availability"]
                self.assertEqual(row["freshness"], expected)
                self.assertEqual(row["snapshot_freshness"], "fresh")
                self.assertEqual(row["observations"]["fresh_7d"], 0)
                self.assertEqual(report["enforced_failures"], [])


if __name__ == "__main__":
    unittest.main()
