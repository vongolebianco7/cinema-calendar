import unittest
from pathlib import Path

try:
    from scripts.map_ocean_metrics import OCEAN_METRIC_SOURCES, map_ocean_metrics
except ModuleNotFoundError:
    OCEAN_METRIC_SOURCES = None
    map_ocean_metrics = None

ROOT = Path(__file__).resolve().parents[1]


class OceanMetricMappingTests(unittest.TestCase):
    def test_all_ocean_scorecard_ids_have_existing_authoritative_sources(self):
        self.assertIsNotNone(OCEAN_METRIC_SOURCES, "scripts.map_ocean_metrics must exist")
        self.assertEqual(set(OCEAN_METRIC_SOURCES), {f"OC-{i:02d}" for i in range(1, 12)})
        for metric_id, sources in OCEAN_METRIC_SOURCES.items():
            self.assertTrue(sources, metric_id)
            for source in sources:
                self.assertTrue((ROOT / source).exists(), f"{metric_id} source missing: {source}")

    def test_mapper_marks_metric_failed_when_any_authoritative_source_fails(self):
        self.assertIsNotNone(map_ocean_metrics, "scripts.map_ocean_metrics must exist")
        statuses = {source: True for sources in OCEAN_METRIC_SOURCES.values() for source in sources}
        failing_source = OCEAN_METRIC_SOURCES["OC-11"][0]
        statuses[failing_source] = False
        rows = {row["id"]: row for row in map_ocean_metrics(statuses)}
        self.assertEqual(rows["OC-11"]["status"], "fail")
        self.assertEqual(rows["OC-11"]["earned"], 0)

    def test_mapper_awards_full_points_for_passing_sources(self):
        self.assertIsNotNone(map_ocean_metrics, "scripts.map_ocean_metrics must exist")
        statuses = {source: True for sources in OCEAN_METRIC_SOURCES.values() for source in sources}
        rows = {row["id"]: row for row in map_ocean_metrics(statuses)}
        self.assertEqual(rows["OC-01"]["status"], "pass")
        self.assertEqual(rows["OC-01"]["earned"], 1.0)
        self.assertEqual(rows["OC-03"]["earned"], 0.5)
        self.assertEqual(rows["OC-11"]["earned"], 1.0)


if __name__ == "__main__":
    unittest.main()
