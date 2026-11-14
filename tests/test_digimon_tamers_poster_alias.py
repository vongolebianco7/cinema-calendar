import datetime
import json
import tempfile
import unittest
import urllib.parse
from pathlib import Path

from scripts import backfill_boxoffice_posters as backfill


class Response:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self):
        return json.dumps(self.payload).encode()


class DigimonTamersAliasTests(unittest.TestCase):
    def test_toei_full_title_alias_matches_only_its_2012_movie(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "boxoffice.json"
            path.write_text(json.dumps({"by_year": {"2012": [{
                "title": "特命戦隊ゴーバスターズ THE MOVIE",
                "gross": 11112222,
                "source_group_title": (
                    "仮面ライダーオーズ THE MOVIE みんなで宇宙キターッ! "
                    "特命戦隊ゴーバスターズ THE MOVIE 東京エネタワーを守れ!"
                ),
            }]}, "all_time": []}), encoding="utf-8")
            queries = []

            def opener(request, timeout):
                params = urllib.parse.parse_qs(urllib.parse.urlsplit(request.full_url).query)
                query = params.get("query", [""])[0]
                queries.append(query)
                if query == "特命戦隊ゴーバスターズ THE MOVIE 東京エネタワーを守れ！":
                    return Response({"results": [{
                        "id": 987654322,
                        "title": "特命戦隊ゴーバスターズ THE MOVIE 東京エネタワーを守れ！",
                        "original_title": "Tokumei Sentai Go-Busters the Movie",
                        "release_date": "2012-08-04",
                        "poster_path": "/fixture-only-gobusters.jpg",
                    }]})
                return Response({"results": []})

            result = backfill.backfill(
                path, api_key="fixture", opener=opener, delay=0,
                now=datetime.datetime(2026, 11, 14, tzinfo=datetime.timezone.utc),
                catalog_paths=[],
            )
            row = json.loads(path.read_text(encoding="utf-8"))["by_year"]["2012"][0]

        self.assertIn("特命戦隊ゴーバスターズ THE MOVIE 東京エネタワーを守れ！", queries)
        self.assertEqual(row["tmdbId"], 987654322)
        self.assertEqual(row["poster"],
                         "https://image.tmdb.org/t/p/w500/fixture-only-gobusters.jpg")
        self.assertEqual(row["gross"], 11112222)
        self.assertTrue(row["source_group_title"].startswith("仮面ライダーオーズ"))
        self.assertEqual(result["enriched"], 1)

    def test_official_title_alias_requires_exact_japan_release_and_own_tmdb_poster(self):
        group = "デジモンティマース/キン肉マンII世 / も~っと!おジャ魔女どれみ"
        original = {
            "title": "デジモンティマース",
            "gross": 10,
            "source_group_title": group,
            "source_group_id": "2001:official-group",
            "source_group_index": 1,
            "source_group_size": 3,
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "boxoffice.json"
            path.write_text(json.dumps({"by_year": {"2001": [original]}, "all_time": []}),
                            encoding="utf-8")
            queries = []

            def opener(request, timeout):
                params = urllib.parse.parse_qs(urllib.parse.urlsplit(request.full_url).query)
                query = params.get("query", [""])[0]
                queries.append(query)
                if query == "デジモンテイマーズ 冒険者たちの戦い":
                    return Response({"results": [{
                        "id": 987654321,
                        "title": "デジモンテイマーズ 冒険者たちの戦い",
                        "original_title": "Digimon Tamers: Battle of Adventurers",
                        "release_date": "2001-07-14",
                        "poster_path": "/fixture-only-poster.jpg",
                    }]})
                return Response({"results": []})

            result = backfill.backfill(
                path,
                api_key="fixture",
                opener=opener,
                delay=0,
                now=datetime.datetime(2026, 11, 14, tzinfo=datetime.timezone.utc),
                catalog_paths=[],
            )
            row = json.loads(path.read_text(encoding="utf-8"))["by_year"]["2001"][0]

        self.assertIn("デジモンテイマーズ 冒険者たちの戦い", queries)
        self.assertEqual(row["tmdbId"], 987654321)
        self.assertEqual(row["poster"],
                         "https://image.tmdb.org/t/p/w500/fixture-only-poster.jpg")
        self.assertEqual(row["identity_source"],
                         "https://www.themoviedb.org/movie/987654321")
        self.assertEqual(row["identity_match"],
                         "exact_cleaned_title_and_release_year_window")
        self.assertEqual(row["tmdb_release_date"], "2001-07-14")
        self.assertEqual(row["gross"], 10)
        self.assertEqual(row["source_group_title"], group)
        self.assertEqual(result["enriched"], 1)

    def test_official_alias_rejects_wrong_release_date_and_missing_poster(self):
        for release_date, poster_path in (("2001-07-15", "/poster.jpg"),
                                          ("2001-07-14", None)):
            with self.subTest(release_date=release_date, poster_path=poster_path):
                with tempfile.TemporaryDirectory() as directory:
                    path = Path(directory) / "boxoffice.json"
                    path.write_text(json.dumps({"by_year": {"2001": [{
                        "title": "デジモンティマース",
                        "gross": 10,
                    }]}, "all_time": []}), encoding="utf-8")

                    def opener(request, timeout):
                        params = urllib.parse.parse_qs(
                            urllib.parse.urlsplit(request.full_url).query
                        )
                        if params.get("query", [""])[0] == "デジモンテイマーズ 冒険者たちの戦い":
                            return Response({"results": [{
                                "id": 987654321,
                                "title": "デジモンテイマーズ 冒険者たちの戦い",
                                "original_title": "Digimon Tamers: Battle of Adventurers",
                                "release_date": release_date,
                                "poster_path": poster_path,
                            }]})
                        return Response({"results": []})

                    result = backfill.backfill(
                        path,
                        api_key="fixture",
                        opener=opener,
                        delay=0,
                        now=datetime.datetime(2026, 11, 14, tzinfo=datetime.timezone.utc),
                        catalog_paths=[],
                    )
                    row = json.loads(path.read_text(encoding="utf-8"))["by_year"]["2001"][0]
                    self.assertNotIn("poster", row)
                    self.assertNotIn("tmdbId", row)
                    self.assertEqual(result["enriched"], 0)

    def test_official_release_dates_gate_each_film_and_preserve_shared_gross(self):
        group = "official festival program"
        cases = [
            {
                "year": "1986",
                "title": "オバケのQ太郎 とびだせ!バケバケ大作戦",
                "release_date": "1986-03-15",
                "id": 9860315,
                "poster_path": "/fixture-q-taro-1986.jpg",
                "gross": 13,
            },
            {
                "year": "2000",
                "title": "おジャ魔女どれみ♯",
                "release_date": "2000-07-08",
                "id": 20000708,
                "poster_path": "/fixture-doremi-2000.jpg",
                "gross": 12.7,
            },
            {
                "year": "2001",
                "title": "も~っと!おジャ魔女どれみ",
                "release_date": "2001-07-14",
                "id": 20010714,
                "poster_path": "/fixture-doremi-2001.jpg",
                "gross": 10,
            },
        ]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "boxoffice.json"
            rows = [{
                "title": case["title"],
                "gross": case["gross"],
                "source_group_title": group,
                "source_group_id": f'{case["year"]}:fixture',
            } for case in cases]
            path.write_text(json.dumps({
                "by_year": {year: [row] for year, row in zip(
                    [case["year"] for case in cases], rows
                )},
                "all_time": [],
            }), encoding="utf-8")
            queries = []

            def opener(request, timeout):
                params = urllib.parse.parse_qs(
                    urllib.parse.urlsplit(request.full_url).query
                )
                query = params.get("query", [""])[0]
                queries.append(query)
                for case in cases:
                    if query in backfill.exact_title_aliases(
                        case["title"], case["year"]
                    ):
                        return Response({"results": [{
                            "id": case["id"],
                            "title": query,
                            "original_title": query,
                            "release_date": case["release_date"],
                            "poster_path": case["poster_path"],
                        }]})
                return Response({"results": []})

            result = backfill.backfill(
                path, api_key="fixture", opener=opener, delay=0,
                now=datetime.datetime(2026, 11, 14, tzinfo=datetime.timezone.utc),
                catalog_paths=[],
            )
            saved = json.loads(path.read_text(encoding="utf-8"))["by_year"]

        self.assertEqual(result["enriched"], 3)
        for case in cases:
            with self.subTest(title=case["title"]):
                row = saved[case["year"]][0]
                self.assertEqual(row["tmdbId"], case["id"])
                self.assertEqual(
                    row["poster"],
                    f'https://image.tmdb.org/t/p/w500{case["poster_path"]}',
                )
                self.assertEqual(row["tmdb_release_date"], case["release_date"])
                self.assertEqual(row["gross"], case["gross"])
                self.assertEqual(row["source_group_title"], group)
        self.assertIn(
            "も～っと！おジャ魔女どれみ　カエル石のひみつ", queries
        )



if __name__ == "__main__":
    unittest.main()
