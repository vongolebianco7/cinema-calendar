"""Strictly match official feed headlines only to the verified streaming catalog."""
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from discover_streaming_announcements import classify_candidate, find_verified_catalog_match


class VerifiedCatalogCandidateTests(unittest.TestCase):
    def setUp(self):
        self.movie = {
            "service": "Netflix",
            "title": "余命一年、男をかう",
            "date": "2026-11-05",
            "id": 1654940,
            "source_url": "https://about.netflix.com/ja/news/my-movie?edition=jp",
        }
        self.candidate = {
            "service": "Netflix",
            "title": "Netflix映画『余命一年、男をかう』11月5日配信決定！",
            "source_url": "https://about.netflix.com/ja/news/my-movie?edition=jp&utm_source=rss",
            "status": "needs_release_date_verification",
        }

    def test_same_official_source_service_title_date_and_id_is_marked(self):
        self.assertEqual(
            find_verified_catalog_match(self.candidate, [self.movie]),
            {"title": "余命一年、男をかう", "date": "2026-11-05", "tmdb_id": 1654940},
        )
        classified = classify_candidate(self.candidate, [self.movie])
        self.assertEqual(classified["status"], "already_in_verified_catalog")
        self.assertEqual(classified["verified_catalog_match"]["tmdb_id"], 1654940)
        self.assertEqual(self.candidate["status"], "needs_release_date_verification")

    def test_only_utm_parameters_are_ignored(self):
        changed = {**self.candidate, "source_url": self.candidate["source_url"] + "&campaign=other"}
        self.assertIsNone(find_verified_catalog_match(changed, [self.movie]))

    def test_service_and_title_must_match(self):
        wrong_service = {**self.candidate, "service": "Prime Video"}
        wrong_title = {**self.candidate, "title": "Netflix映画の新作情報"}
        self.assertIsNone(find_verified_catalog_match(wrong_service, [self.movie]))
        self.assertIsNone(find_verified_catalog_match(wrong_title, [self.movie]))

    def test_non_unique_release_identity_stays_unverified(self):
        another_date = {**self.movie, "date": "2026-12-05"}
        another_id = {**self.movie, "id": 1654941}
        self.assertIsNone(find_verified_catalog_match(self.candidate, [self.movie, another_date]))
        self.assertIsNone(find_verified_catalog_match(self.candidate, [self.movie, another_id]))

    def test_missing_identity_invalid_date_or_short_title_stays_unverified(self):
        missing_id = {key: value for key, value in self.movie.items() if key != "id"}
        invalid_date = {**self.movie, "date": "2026-02-31"}
        short_title = {**self.movie, "title": "映画"}
        self.assertIsNone(find_verified_catalog_match(self.candidate, [missing_id]))
        self.assertIsNone(find_verified_catalog_match(self.candidate, [invalid_date]))
        self.assertIsNone(find_verified_catalog_match(self.candidate, [short_title]))


if __name__ == "__main__":
    unittest.main()
