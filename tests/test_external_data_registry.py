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


if __name__ == "__main__":
    unittest.main()
