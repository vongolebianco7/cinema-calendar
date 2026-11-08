import json
import tempfile
import unittest
from unittest.mock import patch
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
            registry.write_text(json.dumps({"services": [
                {"name": "Netflix", "reviewed_premiere_hosts": ["netflix.com"]},
                {"name": "FOD", "reviewed_premiere_hosts": ["fod.fujitv.co.jp"]},
            ]}), encoding="utf-8")

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
            registry.write_text(json.dumps({"services": [
                {"name": "Netflix", "reviewed_premiere_hosts": ["netflix.com"]},
            ]}), encoding="utf-8")
            with self.assertRaises(ValueError):
                import_snapshot(snapshot, catalog, registry)
            self.assertEqual(catalog.read_text(encoding="utf-8"), original)


    def test_uses_shared_normalizer_and_deduplicates_explicit_movie_identity(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snapshot, catalog, registry = (root / name for name in ("official.json", "streaming.json", "registry.json"))
            snapshot.write_text(json.dumps({"movies": [
                {"title": "Reviewed Film", "date": "2026-11-03", "event": "streaming", "service": "Netflix", "source_url": "https://netflix.com/title", "tmdb_id": 987},
                {"title": "Reviewed Film Alternate Title", "date": "2026-11-03", "event": "streaming", "service": "Netflix", "source_url": "https://netflix.com/title", "tmdb_id": 987},
            ]}), encoding="utf-8")
            catalog.write_text(json.dumps({"movies": []}), encoding="utf-8")
            registry.write_text(json.dumps({"services": [
                {"name": "Netflix", "reviewed_premiere_hosts": ["netflix.com"]},
            ]}), encoding="utf-8")

            self.assertEqual(import_snapshot(snapshot, catalog, registry), (1, 0))
            rows = json.loads(catalog.read_text(encoding="utf-8"))["movies"]
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["title"], "Reviewed Film")

    def test_rejects_unreviewed_source_host_without_mutating_catalog(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snapshot, catalog, registry = (root / name for name in ("official.json", "streaming.json", "registry.json"))
            snapshot.write_text(json.dumps({"movies": [{
                "title": "Unapproved source", "date": "2026-11-04", "event": "streaming",
                "service": "Netflix", "source_url": "https://unknown.example/title",
            }]}), encoding="utf-8")
            original = json.dumps({"movies": []})
            catalog.write_text(original, encoding="utf-8")
            registry.write_text(json.dumps({"services": [
                {"name": "Netflix", "reviewed_premiere_hosts": ["netflix.com"]},
            ]}), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "approved official HTTPS host"):
                import_snapshot(snapshot, catalog, registry)
            self.assertEqual(catalog.read_text(encoding="utf-8"), original)

    def test_replace_failure_preserves_last_good_catalog(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snapshot, catalog, registry = (root / name for name in ("official.json", "streaming.json", "registry.json"))
            snapshot.write_text(json.dumps({"movies": [{
                "title": "New", "date": "2026-11-02", "event": "streaming",
                "service": "Netflix", "source_url": "https://netflix.com/title",
            }]}), encoding="utf-8")
            original = '{"movies": []}\n'
            catalog.write_text(original, encoding="utf-8")
            registry.write_text(json.dumps({"services": [
                {"name": "Netflix", "reviewed_premiere_hosts": ["netflix.com"]},
            ]}), encoding="utf-8")

            with patch("os.replace", side_effect=OSError("simulated catalog publish failure")):
                with self.assertRaisesRegex(OSError, "simulated catalog publish failure"):
                    import_snapshot(snapshot, catalog, registry)

            self.assertEqual(catalog.read_text(encoding="utf-8"), original)
            self.assertEqual(list(root.glob(".streaming.json-*.tmp")), [])


if __name__ == "__main__":
    unittest.main()
