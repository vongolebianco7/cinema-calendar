"""Bounded movie discovery using TMDB's official Japan provider API."""
import datetime
import importlib.util
import io
import json
from pathlib import Path
import unittest
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "update_availability_discovery", ROOT / "scripts" / "update_availability.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
NOW = datetime.datetime(2026, 11, 8, 8, tzinfo=datetime.timezone.utc)


class JsonResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        self.close()


class AvailabilityDiscoveryTests(unittest.TestCase):
    def test_discovers_only_allowlisted_japan_providers_and_exact_movie_ids(self):
        cache = {
            "42": {"title": "Keep existing", "poster": "https://image.tmdb.org/t/p/w500/keep.jpg"}
        }
        state = {}
        calls = []

        def opener(request, timeout):
            parsed = urlparse(request.full_url)
            query = parse_qs(parsed.query)
            calls.append((parsed.path, query, timeout))
            if parsed.path == "/3/watch/providers/movie":
                return JsonResponse(json.dumps({"results": [
                    {"provider_id": 8, "provider_name": "Netflix"},
                    {"provider_id": 999, "provider_name": "FOD Channel Amazon Channel"},
                    {"provider_id": 17, "provider_name": "ABEMA"},
                ]}).encode())
            self.assertEqual(parsed.path, "/3/discover/movie")
            self.assertEqual(query["watch_region"], ["JP"])
            self.assertEqual(query["with_watch_monetization_types"], ["flatrate|free|ads|rent|buy"])
            if query["with_watch_providers"] == ["8"]:
                return JsonResponse(json.dumps({
                    "page": 1, "total_pages": 2, "results": [
                        {"id": 42, "title": "Keep existing", "poster_path": "/replacement.jpg"},
                        {"id": 501, "title": "New film", "poster_path": "/new-film.jpg"},
                    ]
                }).encode())
            self.assertEqual(query["with_watch_providers"], ["17"])
            return JsonResponse(json.dumps({
                "page": 1, "total_pages": 1, "results": [
                    {"id": 502, "title": "Free film", "poster_path": None}
                ]
            }).encode())

        pages, added, missing, checked = MODULE.discover_provider_candidates(
            cache, state, "test-key", opener=opener, now=NOW, max_pages=2, delay=0)

        self.assertEqual((pages, added, checked), (2, 2, True))
        self.assertIn("FOD", missing)
        self.assertIn("Netflix", state["services_seen"])
        self.assertEqual(cache["501"]["title"], "New film")
        self.assertEqual(cache["501"]["poster"], "https://image.tmdb.org/t/p/w500/new-film.jpg")
        self.assertNotIn("checked_at", cache["501"], "discovery must not imply a provider observation")
        self.assertEqual(cache["42"]["poster"], "https://image.tmdb.org/t/p/w500/keep.jpg")
        self.assertEqual(state["service_pages"]["Netflix"]["next_page"], 2)
        self.assertNotIn("999", str(calls))

    def test_discovery_is_bounded_to_configured_pages(self):
        provider_payload = {"results": [
            {"provider_id": idx, "provider_name": name}
            for idx, name in enumerate(MODULE.DISCOVERY_SERVICE_ORDER, 1)
        ]}
        requests = []

        def opener(request, timeout):
            path = urlparse(request.full_url).path
            requests.append(path)
            if path == "/3/watch/providers/movie":
                return JsonResponse(json.dumps(provider_payload).encode())
            return JsonResponse(b'{"page":1,"total_pages":1,"results":[]}')

        pages, _added, _missing, checked = MODULE.discover_provider_candidates(
            {}, {}, "test-key", opener=opener, now=NOW, max_pages=3, delay=0)
        self.assertEqual((pages, checked), (3, True))
        self.assertEqual(requests.count("/3/discover/movie"), 3)

    def test_provider_list_failure_does_not_claim_discovery_or_mutate_cache(self):
        cache = {}
        state = {"next_service_index": 2}

        def opener(*_args, **_kwargs):
            raise TimeoutError("offline")

        pages, added, missing, checked = MODULE.discover_provider_candidates(
            cache, state, "test-key", opener=opener, now=NOW, delay=0)
        self.assertEqual((pages, added, missing, checked), (0, 0, [], False))
        self.assertEqual(cache, {})
        self.assertEqual(state, {"next_service_index": 2})


if __name__ == "__main__":
    unittest.main()
