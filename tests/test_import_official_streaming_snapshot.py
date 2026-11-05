import json
import tempfile
import unittest
from pathlib import Path

from scripts.import_official_streaming_snapshot import import_snapshot


class OfficialSnapshotImportTests(unittest.TestCase):
    def test_appends_and_only_fills_missing_fields_on_existing_entries(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snapshot, catalog, registry = (root / name for name in ("official.json", "streaming.json", "registry.json"))
            snapshot.write_text(json.dumps({"movies": [
                {"title": "Existing", "date": "2026-11-01", "event": "streaming", "service": "Netflix", "source_url": "https://netflix.com/title", "poster": "https://image.tmdb.org/t/p/w500/a.jpg", "id": 42},
                {"title": "New", "date": "2026-11-02", "event": "streaming", "service": "FOD", "source_url": "https://fod.fujitv.co.jp/news", "poster": "https://image.tmdb.org/t/p/w500/b.jpg", "id": 43},
            ]}), encoding="utf-8")
            catalog.write_text(json.dumps({"movies": [
                {"title": "Existing", "date": "2026-11-01", "event": "streaming", "service": "Netflix", "poster": None, "score": 8},
            ]}), encoding="utf-8")
            registry.write_text(json.dumps({"services": [{"name": "Netflix"}, {"name": "FOD"}]}), encoding="utf-8")

            self.assertEqual(import_snapshot(snapshot, catalog, registry), (1, 2))
            rows = json.loads(catalog.read_text(encoding="utf-8"))["movies"]
            self.assertEqual(len(rows), 2)
            self.assertEqual(rows[0]["score"], 8)
            self.assertEqual(rows[0]["poster"], "https://image.tmdb.org/t/p/w500/a.jpg")
            self.assertEqual(rows[0]["id"], 42)

    def test_rejects_unregistered_provider_without_mutating_catalog(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snapshot, catalog, registry = (root / name for name in ("official.json", "streaming.json", "registry.json"))
            snapshot.write_text(json.dumps({"movies": [{"title": "Bad", "date": "2026-11-01", "event": "streaming", "service": "Unknown", "source_url": "https://example.org"}]}), encoding="utf-8")
            original = '{"movies": []}\n'
            catalog.write_text(original, encoding="utf-8")
            registry.write_text(json.dumps({"services": [{"name": "Netflix"}]}), encoding="utf-8")
            with self.assertRaises(ValueError):
                import_snapshot(snapshot, catalog, registry)
            self.assertEqual(catalog.read_text(encoding="utf-8"), original)


if __name__ == "__main__":
    unittest.main()
