"""Safe poster hydration for known TMDB availability IDs."""
import datetime
import importlib.util
import io
import json
import os
from pathlib import Path
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "update_availability", ROOT / "scripts" / "update_availability.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
NOW = datetime.datetime(2026, 11, 8, 8, tzinfo=datetime.timezone.utc)


class JsonResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        self.close()


class AvailabilityPosterTests(unittest.TestCase):
    def test_catalog_art_is_joined_only_by_the_same_tmdb_id(self):
        cache = {
            "530915": {"title": "mismatched label", "services": ["U-NEXT"]},
            "85350": {"title": "other title", "poster": "https://image.tmdb.org/t/p/w500/old.jpg"},
        }
        movies = [
            {"id": 530915, "title": "1917", "poster": "https://image.tmdb.org/t/p/w500/1917.jpg"},
            {"id": 85351, "title": "1917", "poster": "https://image.tmdb.org/t/p/w500/wrong.jpg"},
        ]
        self.assertEqual(MODULE.attach_catalog_posters(cache, movies), 1)
        self.assertEqual(cache["530915"]["poster"], "https://image.tmdb.org/t/p/w500/1917.jpg")
        self.assertEqual(cache["530915"]["poster_source"], "TMDB canonical movie catalog")
        self.assertEqual(cache["85350"]["poster"], "https://image.tmdb.org/t/p/w500/old.jpg")

    def test_missing_art_uses_verified_tmdb_movie_details_for_the_same_id(self):
        cache = {"1406894": {"title": "（LOVE SONG）", "services": ["Netflix"]}}
        def opener(request, timeout):
            self.assertIn("/movie/1406894?", request.full_url)
            self.assertEqual(timeout, 15)
            return JsonResponse(b'{"id":1406894,"poster_path":"/love-song.jpg"}')

        updated, failed, attempted = MODULE.enrich_missing_posters(
            cache, "test-key", opener=opener, now=NOW, limit=1, delay=0)
        self.assertEqual((updated, failed, attempted), (1, 0, 1))
        self.assertEqual(cache["1406894"]["poster"], "https://image.tmdb.org/t/p/w500/love-song.jpg")
        self.assertEqual(cache["1406894"]["poster_source"], "TMDB movie details")
        self.assertEqual(cache["1406894"]["poster_checked_at"], NOW.isoformat())

    def test_no_art_result_is_recorded_for_recheck_backoff(self):
        cache = {"530915": {"title": "1917"}}
        def opener(*_args, **_kwargs):
            return JsonResponse(b'{"id":530915,"poster_path":null}')

        updated, failed, attempted = MODULE.enrich_missing_posters(
            cache, "test-key", opener=opener, now=NOW, limit=1, delay=0)
        self.assertEqual((updated, failed, attempted), (0, 0, 1))
        self.assertEqual(cache["530915"]["poster_checked_at"], NOW.isoformat())
        self.assertEqual(MODULE.select_missing_poster_ids(
            cache, NOW + datetime.timedelta(days=29)), [])
        self.assertEqual(MODULE.select_missing_poster_ids(
            cache, NOW + datetime.timedelta(days=31)), [530915])

    def test_main_persists_no_art_check_without_advancing_provider_freshness(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "availability.json"
            previous = {
                "generated_at": "2026-10-01T00:00:00Z",
                "movies": {
                    "530915": {
                        "title": "1917",
                        "services": ["U-NEXT"],
                        "checked_at": "2026-10-01T00:00:00Z",
                    }
                },
            }
            path.write_text(json.dumps(previous), encoding="utf-8")
            (root / "movies.json").write_text('{"movies":[]}', encoding="utf-8")
            (root / "awards.json").write_text('{"catalog":[]}', encoding="utf-8")

            def no_art_lookup(cache, *_args, **_kwargs):
                cache["530915"]["poster_checked_at"] = NOW.isoformat()
                return (0, 0, 1)

            with patch.object(MODULE, "ROOT", root), patch.object(MODULE, "PATH", path), \
                 patch.dict(os.environ, {"TMDB_API_KEY": "test-key"}), \
                 patch.object(MODULE.urllib.request, "urlopen", side_effect=TimeoutError("offline")), \
                 patch.object(MODULE, "enrich_missing_posters", side_effect=no_art_lookup):
                with self.assertRaises(RuntimeError):
                    MODULE.main()

            result = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(result["generated_at"], previous["generated_at"])
            self.assertEqual(result["movies"]["530915"]["poster_checked_at"], NOW.isoformat())

    def test_existing_poster_is_never_overwritten(self):
        existing = "https://image.tmdb.org/t/p/w500/approved.jpg"
        cache = {"530915": {"poster": existing}}
        def opener(*_args, **_kwargs):
            raise AssertionError("an existing poster must not trigger a lookup")

        result = MODULE.enrich_missing_posters(cache, "test-key", opener=opener, now=NOW)
        self.assertEqual(result, (0, 0, 0))
        self.assertEqual(cache["530915"]["poster"], existing)

    def test_wrong_tmdb_response_id_is_not_assigned(self):
        cache = {"530915": {"title": "1917"}}
        def opener(*_args, **_kwargs):
            return JsonResponse(b'{"id":999,"poster_path":"/wrong.jpg"}')

        updated, failed, attempted = MODULE.enrich_missing_posters(
            cache, "test-key", opener=opener, now=NOW, limit=1, delay=0)
        self.assertEqual((updated, failed, attempted), (0, 1, 1))
        self.assertNotIn("poster", cache["530915"])

    def test_recently_checked_missing_art_is_skipped_and_daily_limit_is_bounded(self):
        cache = {
            str(mid): {"poster_checked_at": NOW.isoformat()}
            for mid in range(1, 5)
        }
        cache["5"] = {}
        ids = MODULE.select_missing_poster_ids(cache, NOW, limit=1)
        self.assertEqual(ids, [5])
        self.assertEqual(MODULE.MAX_DAILY_POSTER_LOOKUPS, 80)

    def test_invalid_poster_paths_are_rejected(self):
        self.assertIsNone(MODULE.poster_url("https://attacker.example/image.jpg"))
        self.assertIsNone(MODULE.poster_url("//attacker.example/image.jpg"))
        self.assertEqual(MODULE.poster_url("/movie.jpg"), "https://image.tmdb.org/t/p/w500/movie.jpg")


if __name__ == "__main__":
    unittest.main()
