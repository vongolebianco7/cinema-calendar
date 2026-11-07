import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from streaming_event_normalization import normalize_premieres

APPROVED_HOSTS = {"Netflix": ["example.org"]}

BASE = dict(title="Film", service="Netflix", date="2026-11-15",
            source_url="https://example.org/official", verified=True,
            content_type="movie")


class NormalizePremiereTests(unittest.TestCase):
    def test_verified_duplicate_is_removed(self):
        self.assertEqual(len(normalize_premieres([BASE, dict(BASE)], APPROVED_HOSTS)), 1)

    def test_same_title_different_release_year_remains_distinct(self):
        a = dict(BASE, release_year=1990)
        b = dict(BASE, release_year=2026)
        self.assertEqual(len(normalize_premieres([a, b], APPROVED_HOSTS)), 2)

    def test_tmdb_identity_deduplicates_aliases(self):
        a = dict(BASE, tmdb_id=123)
        b = dict(BASE, title="別題", tmdb_id=123)
        self.assertEqual(len(normalize_premieres([a, b], APPROVED_HOSTS)), 1)

    def test_no_inferred_identity(self):
        self.assertNotIn("tmdb_id", normalize_premieres([BASE], APPROVED_HOSTS)[0])

    def test_rejects_unverified_or_series_or_unknown_service(self):
        for changes in ({"verified": False}, {"content_type": "tv"},
                        {"service": "Unknown"}, {"date": "unknown"},
                        {"source_url": "http://example.org"}, {"tmdb_id": True}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                normalize_premieres([dict(BASE, **changes)], APPROVED_HOSTS)

    def test_rejects_https_url_outside_approved_service_hosts(self):
        with self.assertRaisesRegex(ValueError, "approved official HTTPS host"):
            normalize_premieres([dict(BASE, source_url="https://unrelated.example.net/notice")],
                                APPROVED_HOSTS)

    def test_rejects_unreviewed_subdomain_of_approved_host(self):
        with self.assertRaisesRegex(ValueError, "approved official HTTPS host"):
            normalize_premieres(
                [dict(BASE, source_url="https://sub.example.org/notice")],
                APPROVED_HOSTS)

    def test_input_is_unchanged(self):
        item = dict(BASE)
        normalize_premieres([item], APPROVED_HOSTS)
        self.assertEqual(item, BASE)


if __name__ == "__main__":
    unittest.main()
