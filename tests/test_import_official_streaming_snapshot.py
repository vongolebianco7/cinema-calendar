import json
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

from scripts.import_official_streaming_snapshot import import_snapshot


class OfficialSnapshotImportTests(unittest.TestCase):
    def test_curated_streaming_identity_repairs_use_unique_verified_local_tmdb_records(self):
        snapshot = json.loads(Path("data/streaming-official-current.json").read_text(encoding="utf-8"))
        expected = {
            ("FOD", "愛人／ラ・マン"): (10995, 1992, "https://image.tmdb.org/t/p/w500/hi0NIBxA8ZBiVaUuwlVVMXxlGpA.jpg"),
            ("FOD", "糸"): (612511, 2020, "https://image.tmdb.org/t/p/w500/rMUDmntckRcONFQ26pq3knsj06v.jpg"),
            ("FOD", "オーバーフェンス"): (424995, 2016, "https://image.tmdb.org/t/p/w500/9xTncBPxGurkGg76spb42sWtGdK.jpg"),
        }
        rows = {(row.get("service"), row.get("title")): row for row in snapshot["movies"]}
        for key, (tmdb_id, release_year, poster) in expected.items():
            with self.subTest(title=key[1]):
                row = rows[key]
                self.assertEqual(row["id"], tmdb_id)
                self.assertEqual(row["tmdb_id"], tmdb_id)
                self.assertEqual(row["release_year"], release_year)
                self.assertEqual(row["tmdb"], f"https://www.themoviedb.org/movie/{tmdb_id}")
                self.assertEqual(row["poster"], poster)

        # Same-title remakes stay unresolved until the provider listing is disambiguated.
        for title in ("カラーパープル", "ポルターガイスト"):
            with self.subTest(title=title):
                self.assertNotIn("id", rows[("Prime Video", title)])
                self.assertIsNone(rows[("Prime Video", title)].get("poster"))

    def test_appends_and_only_fills_missing_fields_on_existing_entries(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snapshot, catalog, registry = (root / name for name in ("official.json", "streaming.json", "registry.json"))
            snapshot.write_text(json.dumps({"movies": [
                {"title": "Existing", "date": "2026-11-01", "event": "streaming", "service": "Netflix", "source_url": "https://netflix.com/title", "poster": "https://image.tmdb.org/t/p/w500/a.jpg", "id": 42, "runtime": 101, "source_published_at": "2026-10-29", "observed_at": "2026-11-09T00:00:00+00:00", "verified_at": "2026-11-09T00:00:00+00:00"},
                {"title": "New", "date": "2026-11-02", "event": "streaming", "service": "FOD", "source_url": "https://fod.fujitv.co.jp/news", "poster": "https://image.tmdb.org/t/p/w500/b.jpg", "id": 43},
            ]}), encoding="utf-8")
            catalog.write_text(json.dumps({"movies": [
                {"title": "Existing", "date": "2026-11-01", "event": "streaming", "service": "Netflix", "poster": None, "score": 8, "runtime": 100},
            ]}), encoding="utf-8")
            registry.write_text(json.dumps({"services": [
                {"name": "Netflix", "reviewed_premiere_hosts": ["netflix.com"]},
                {"name": "FOD", "reviewed_premiere_hosts": ["fod.fujitv.co.jp"]},
            ]}), encoding="utf-8")

            self.assertEqual(import_snapshot(snapshot, catalog, registry), (1, 5))
            rows = json.loads(catalog.read_text(encoding="utf-8"))["movies"]
            self.assertEqual(len(rows), 2)
            self.assertEqual(rows[0]["score"], 8)
            self.assertEqual(rows[0]["poster"], "https://image.tmdb.org/t/p/w500/a.jpg")
            self.assertEqual(rows[0]["id"], 42)
            self.assertEqual(rows[0]["runtime"], 100)  # Never overwrite existing catalog metadata.
            self.assertEqual(rows[0]["source_published_at"], "2026-10-29")
            self.assertEqual(rows[0]["verified_at"], "2026-11-09T00:00:00+00:00")

    def test_preserves_runtime_and_source_timestamps_for_new_records(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snapshot, catalog, registry = (root / name for name in ("official.json", "streaming.json", "registry.json"))
            snapshot.write_text(json.dumps({"movies": [{
                "title": "Sirāt", "date": "2026-11-05", "event": "streaming",
                "service": "Netflix", "source_url": "https://netflix.com/jp/title/82169786",
                "announcement_source_url": "https://x.com/NetflixJP", "source_published_at": "2026-10-29",
                "observed_at": "2026-11-09T00:00:00+00:00", "verified_at": "2026-11-09T00:00:00+00:00",
                "poster": "https://image.tmdb.org/t/p/w500/verified.jpg", "id": 1151272,
                "tmdb_id": 1151272, "tmdb": "https://www.themoviedb.org/movie/1151272",
                "release_year": 2025, "runtime": 115,
            }]}), encoding="utf-8")
            catalog.write_text(json.dumps({"movies": []}), encoding="utf-8")
            registry.write_text(json.dumps({"services": [
                {"name": "Netflix", "reviewed_premiere_hosts": ["netflix.com"]},
            ]}), encoding="utf-8")

            self.assertEqual(import_snapshot(snapshot, catalog, registry), (1, 0))
            row = json.loads(catalog.read_text(encoding="utf-8"))["movies"][0]
            self.assertEqual(row["runtime"], 115)
            self.assertEqual(row["id"], 1151272)
            self.assertEqual(row["release_year"], 2025)
            self.assertEqual(row["source_published_at"], "2026-10-29")
            self.assertEqual(row["announcement_source_url"], "https://x.com/NetflixJP")
            self.assertIn("+00:00", row["checked_at"])

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
                {"title": "Reviewed Film", "date": "2026-11-03", "event": "streaming", "service": "Netflix", "source_url": "https://netflix.com/title", "id": 987, "tmdb": "https://www.themoviedb.org/movie/987"},
                {"title": "Reviewed Film Alternate Title", "date": "2026-11-03", "event": "streaming", "service": "Netflix", "source_url": "https://netflix.com/title", "id": 987, "tmdb": "https://www.themoviedb.org/movie/987"},
            ]}), encoding="utf-8")
            catalog.write_text(json.dumps({"movies": []}), encoding="utf-8")
            registry.write_text(json.dumps({"services": [
                {"name": "Netflix", "reviewed_premiere_hosts": ["netflix.com"]},
            ]}), encoding="utf-8")

            self.assertEqual(import_snapshot(snapshot, catalog, registry), (1, 0))
            rows = json.loads(catalog.read_text(encoding="utf-8"))["movies"]
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["title"], "Reviewed Film")
            self.assertEqual(rows[0]["tmdb_id"], 987)

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

    def test_deduplicates_against_existing_catalog_by_tmdb_identity(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snapshot, catalog, registry = (root / name for name in ("official.json", "streaming.json", "registry.json"))
            snapshot.write_text(json.dumps({"movies": [{
                "title": "Reviewed Alternate Title", "date": "2026-11-03", "event": "streaming",
                "service": "Netflix", "source_url": "https://netflix.com/title", "id": 987,
                "tmdb": "https://www.themoviedb.org/movie/987",
                "poster": "https://image.tmdb.org/t/p/w500/verified.jpg",
            }]}), encoding="utf-8")
            catalog.write_text(json.dumps({"movies": [{
                "title": "Existing Japanese Title", "date": "2026-11-03", "event": "streaming",
                "service": "Netflix", "id": 987, "tmdb": "https://www.themoviedb.org/movie/987",
                "poster": None,
            }]}), encoding="utf-8")
            registry.write_text(json.dumps({"services": [{
                "name": "Netflix", "reviewed_premiere_hosts": ["netflix.com"],
            }]}), encoding="utf-8")

            self.assertEqual(import_snapshot(snapshot, catalog, registry), (0, 2))
            rows = json.loads(catalog.read_text(encoding="utf-8"))["movies"]
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["title"], "Existing Japanese Title")
            self.assertEqual(rows[0]["poster"], "https://image.tmdb.org/t/p/w500/verified.jpg")


    def test_same_title_with_different_tmdb_identity_is_not_merged(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snapshot, catalog, registry = (root / name for name in ("official.json", "streaming.json", "registry.json"))
            snapshot.write_text(json.dumps({"movies": [{
                "title": "Same Title", "date": "2026-11-03", "event": "streaming",
                "service": "Netflix", "source_url": "https://netflix.com/title", "id": 988,
                "tmdb": "https://www.themoviedb.org/movie/988",
            }]}), encoding="utf-8")
            catalog.write_text(json.dumps({"movies": [{
                "title": "Same Title", "date": "2026-11-03", "event": "streaming",
                "service": "Netflix", "id": 987, "tmdb": "https://www.themoviedb.org/movie/987",
            }]}), encoding="utf-8")
            registry.write_text(json.dumps({"services": [{
                "name": "Netflix", "reviewed_premiere_hosts": ["netflix.com"],
            }]}), encoding="utf-8")

            self.assertEqual(import_snapshot(snapshot, catalog, registry), (1, 0))
            rows = json.loads(catalog.read_text(encoding="utf-8"))["movies"]
            self.assertEqual({row["id"] for row in rows}, {987, 988})


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
