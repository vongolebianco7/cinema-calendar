import datetime
import json
import tempfile
import unittest
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


class BoxofficePosterBackfillTests(unittest.TestCase):
    def run_rows(self, rows, payload, market_year="1980", **kwargs):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        path.write_text(json.dumps({"by_year": {market_year: rows}, "all_time": []}), encoding="utf-8")
        requests = []
        payloads = list(payload) if isinstance(payload, list) else None

        def opener(request, timeout):
            requests.append((request, timeout))
            response_payload = payloads.pop(0) if payloads else payload
            return Response(response_payload)

        now = datetime.datetime(2026, 11, 10, tzinfo=datetime.timezone.utc)
        result = backfill.backfill(path, api_key="fixture", opener=opener, delay=0,
                                   now=now, catalog_paths=[], **kwargs)
        return json.loads(path.read_text(encoding="utf-8")), requests, result

    def test_unique_exact_title_in_adjacent_release_year_recovers_poster(self):
        data, requests, result = self.run_rows(
            [{"title": "カリギュラ", "gross": 47.2, "year": 1980, "metric": "配給収入"}],
            {"results": [{"id": 9453, "title": "カリギュラ", "original_title": "Caligola",
                          "release_date": "1979-08-14", "poster_path": "/caligula.jpg"}]},
        )
        row = data["by_year"]["1980"][0]
        self.assertEqual(row["tmdbId"], 9453)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w500/caligula.jpg")
        self.assertEqual(row["identity_match"], "exact_title_and_release_year_window")
        self.assertEqual((row["gross"], row["year"], row["metric"]), (47.2, 1980, "配給収入"))
        self.assertEqual(len(requests), 1)
        self.assertIn("api.themoviedb.org/3/search/movie", requests[0][0].full_url)
        self.assertEqual(result["enriched"], 1)

    def test_verified_parman_japanese_title_variant_recovers_its_own_poster(self):
        data, requests, result = self.run_rows(
            [{"title": "パーマン バードマンがやってきた!!", "gross": 10, "year": 1983}],
            {"results": [{
                "id": 859292,
                "title": "パーマン バードマンがやって来た！！",
                "original_title": "パーマン バードマンがやって来た！！",
                "release_date": "1983-03-12",
                "poster_path": "/official-parman-poster.jpg",
            }]},
            market_year="1983",
        )
        row = data["by_year"]["1983"][0]
        self.assertEqual(row["tmdbId"], 859292)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w500/official-parman-poster.jpg")
        self.assertEqual(row["identity_source"], "https://www.themoviedb.org/movie/859292")
        self.assertEqual(row["identity_match"], "exact_cleaned_title_and_release_year_window")
        self.assertEqual((row["gross"], row["year"]), (10, 1983))
        self.assertEqual(result["enriched"], 1)
        self.assertEqual(len(requests), 3)

    def test_verified_ghibli_japanese_title_variant_recovers_its_own_poster(self):
        data, requests, result = self.run_rows(
            [{"title": "おもいでぽろぽろ", "gross": 18.7, "year": 1991}],
            {"results": [{
                "id": 15080,
                "title": "おもひでぽろぽろ",
                "original_title": "おもひでぽろぽろ",
                "release_date": "1991-07-20",
                "poster_path": "/official-only-yesterday-poster.jpg",
            }]},
            market_year="1991",
        )
        row = data["by_year"]["1991"][0]
        self.assertEqual(row["tmdbId"], 15080)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w500/official-only-yesterday-poster.jpg")
        self.assertEqual(row["identity_source"], "https://www.themoviedb.org/movie/15080")
        self.assertEqual(row["identity_match"], "exact_cleaned_title_and_release_year_window")
        self.assertEqual((row["gross"], row["year"]), (18.7, 1991))
        self.assertEqual(result["enriched"], 1)
        self.assertEqual(len(requests), 3)

    def test_verified_blue_jeans_memory_japanese_title_recovers_its_own_poster(self):
        data, requests, result = self.run_rows(
            [{"title": "ブルージーンズメモリー", "gross": 12.5, "year": 1981}],
            {"results": [{
                "id": 547528,
                "title": "ブルージーンズメモリー BLUE JEANS MEMORY",
                "original_title": "ブルージーンズメモリー BLUE JEANS MEMORY",
                "release_date": "1981-07-11",
                "poster_path": "/official-blue-jeans-memory-poster.jpg",
            }]},
            market_year="1981",
        )
        row = data["by_year"]["1981"][0]
        self.assertEqual(row["tmdbId"], 547528)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w500/official-blue-jeans-memory-poster.jpg")
        self.assertEqual(row["identity_source"], "https://www.themoviedb.org/movie/547528")
        self.assertEqual(row["identity_match"], "exact_cleaned_title_and_release_year_window")
        self.assertEqual((row["gross"], row["year"]), (12.5, 1981))
        self.assertEqual(result["enriched"], 1)
        self.assertEqual(len(requests), 3)

    def test_verified_sneaker_blues_japanese_title_recovers_its_own_poster(self):
        data, requests, result = self.run_rows(
            [{"title": "青春グラフィティ スニーカーぶるーす", "gross": 10.8, "year": 1981}],
            {"results": [{
                "id": 548191,
                "title": "青春グラフィティ スニーカーぶる〜す",
                "original_title": "青春グラフィティ スニーカーぶる〜す",
                "release_date": "1981-02-11",
                "poster_path": "/official-sneaker-blues-poster.jpg",
            }]},
            market_year="1981",
        )
        row = data["by_year"]["1981"][0]
        self.assertEqual(row["tmdbId"], 548191)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w500/official-sneaker-blues-poster.jpg")
        self.assertEqual(row["identity_source"], "https://www.themoviedb.org/movie/548191")
        self.assertEqual(row["identity_match"], "exact_cleaned_title_and_release_year_window")
        self.assertEqual((row["gross"], row["year"]), (10.8, 1981))
        self.assertEqual(result["enriched"], 1)
        self.assertEqual(len(requests), 3)

    def test_verified_doraemon_official_japanese_title_variant_recovers_poster(self):
        data, requests, result = self.run_rows(
            [{"title": "ドラえもん のび太のトラビアンナイト",
              "gross": 18.0, "year": 1991, "metric": "配給収入"}],
            {"results": [{
                "id": 188403,
                "title": "映画ドラえもん のび太のドラビアンナイト",
                "original_title": "映画ドラえもん のび太のドラビアンナイト",
                "release_date": "1991-03-09",
                "poster_path": "/official-doraemon-dorabian-nights-poster.jpg",
            }]},
            market_year="1991",
        )
        row = data["by_year"]["1991"][0]
        self.assertEqual(row["tmdbId"], 188403)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w500/official-doraemon-dorabian-nights-poster.jpg")
        self.assertEqual(row["identity_source"], "https://www.themoviedb.org/movie/188403")
        self.assertEqual(row["identity_match"], "exact_cleaned_title_and_release_year_window")
        self.assertEqual((row["gross"], row["year"], row["metric"]), (18.0, 1991, "配給収入"))
        self.assertEqual(result["enriched"], 1)
        self.assertEqual(len(requests), 3)

    def test_verified_chimpui_official_title_recovers_its_own_poster(self):
        data, requests, result = self.run_rows(
            [{"title": "チンプイ", "gross": 19.1, "year": 1990, "metric": "配給収入"}],
            {"results": [{
                "id": 1136099,
                "title": "チンプイ エリさま活動大写真",
                "original_title": "チンプイ エリさま活動大写真",
                "release_date": "1990-03-10",
                "poster_path": "/official-chimpui-poster.jpg",
            }]},
            market_year="1990",
        )
        row = data["by_year"]["1990"][0]
        self.assertEqual(row["tmdbId"], 1136099)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w500/official-chimpui-poster.jpg")
        self.assertEqual(row["identity_source"], "https://www.themoviedb.org/movie/1136099")
        self.assertEqual(row["identity_match"], "exact_cleaned_title_and_release_year_window")
        self.assertEqual((row["gross"], row["year"], row["metric"]), (19.1, 1990, "配給収入"))
        self.assertEqual(result["enriched"], 1)
        self.assertEqual(len(requests), 2)

    def test_reviewed_english_alias_uses_english_tmdb_title_fields(self):
        data, requests, result = self.run_rows(
            [{"title": "ドラゴンボールZ・とびっきり最強対最強", "gross": 16.5,
              "year": 1991}],
            {"results": [{
                "id": 39108,
                "title": "Dragon Ball Z: Cooler's Revenge",
                "original_title": "Dragon Ball Z: Cooler's Revenge",
                "release_date": "1991-07-20",
                "poster_path": "/coolers-revenge-poster.jpg",
            }]},
            market_year="1991",
        )
        row = data["by_year"]["1991"][0]
        self.assertEqual(row["tmdbId"], 39108)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w500/coolers-revenge-poster.jpg")
        self.assertEqual(row["identity_match"], "exact_cleaned_title_and_release_year_window")
        self.assertEqual(result["enriched"], 1)
        self.assertEqual([request[0].full_url.split("language=")[1].split("&")[0]
                          for request in requests], ["ja-JP", "en-US"])

    def test_japanese_alias_retries_english_localization_before_marking_not_found(self):
        data, requests, result = self.run_rows(
            [{"title": "テスト作品", "gross": 8.4, "year": 1980}],
            [
                {"results": [{"id": 987, "title": "Unrelated Film", "original_title": "Unrelated Film", "release_date": "1980-02-01", "poster_path": "/unrelated.jpg"}]},
                {"results": [{"id": 123456, "title": "Test Film",
                              "original_title": "テスト作品", "release_date": "1980-01-01",
                              "poster_path": "/test-film.jpg"}]},
            ],
            market_year="1980",
        )
        row = data["by_year"]["1980"][0]
        self.assertEqual(row["tmdbId"], 123456)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w500/test-film.jpg")
        self.assertEqual(row["identity_match"], "exact_title_and_release_year_window")
        self.assertEqual([request[0].full_url.split("language=")[1].split("&")[0]
                          for request in requests], ["ja-JP", "en-US"])
        self.assertEqual(result["enriched"], 1)

    def test_verified_be_bop_group_match_keeps_each_film_and_shared_gross(self):
        data, requests, result = self.run_rows(
            [{"title": "ビーバップ・ハイスクール高校与太郎狂騒曲 / はいからさんが通る",
              "gross": 12.5, "year": 1988, "metric": "配給収入"}],
            {"results": [{
                "id": 433967,
                "title": "ビー・バップ・ハイスクール 高校与太郎狂騒曲",
                "original_title": "ビー・バップ・ハイスクール 高校与太郎狂騒曲",
                "release_date": "1987-12-12",
                "poster_path": "/official-be-bop-poster.jpg",
            }]},
            market_year="1988",
        )
        rows = data["by_year"]["1988"]
        be_bop, haikara = rows
        self.assertEqual(be_bop["title"], "ビーバップ・ハイスクール高校与太郎狂騒曲")
        self.assertEqual(be_bop["tmdbId"], 433967)
        self.assertEqual(be_bop["poster"], "https://image.tmdb.org/t/p/w500/official-be-bop-poster.jpg")
        self.assertEqual(be_bop["identity_source"], "https://www.themoviedb.org/movie/433967")
        self.assertEqual(be_bop["identity_match"], "exact_title_and_release_year_window")
        self.assertEqual(haikara["title"], "はいからさんが通る")
        self.assertNotIn("tmdbId", haikara)
        self.assertNotIn("poster", haikara)
        self.assertEqual([row["gross"] for row in rows], [12.5, 12.5])
        self.assertEqual([row["year"] for row in rows], [1988, 1988])
        self.assertEqual(result["enriched"], 1)
        self.assertEqual(result["expanded_grouped_films"], 2)

    def test_multiple_exact_title_candidates_remain_unresolved(self):
        data, requests, result = self.run_rows(
            [{"title": "同名作品", "gross": 10, "year": 1980}],
            {"results": [
                {"id": 1, "title": "同名作品", "release_date": "1979-01-01", "poster_path": "/one.jpg"},
                {"id": 2, "title": "同名作品", "release_date": "1980-01-01", "poster_path": "/two.jpg"},
            ]},
        )
        row = data["by_year"]["1980"][0]
        self.assertNotIn("poster", row)
        self.assertNotIn("tmdbId", row)
        self.assertTrue(row["poster_checked_at"])
        self.assertEqual(row["poster_check_version"], backfill.POSTER_CHECK_VERSION)
        self.assertEqual(row["poster_match_status"], "ambiguous")
        self.assertEqual(result["ambiguous"], 1)
        self.assertEqual(len(requests), 1)

    def test_posterless_same_title_candidate_still_makes_identity_ambiguous(self):
        data, requests, result = self.run_rows(
            [{"title": "同名作品", "gross": 10, "year": 1980}],
            {"results": [
                {"id": 1, "title": "同名作品", "release_date": "1979-01-01", "poster_path": "/one.jpg"},
                {"id": 2, "title": "同名作品", "release_date": "1980-01-01", "poster_path": None},
            ]},
        )
        row = data["by_year"]["1980"][0]
        self.assertNotIn("poster", row)
        self.assertNotIn("tmdbId", row)
        self.assertEqual(result["ambiguous"], 1)
        self.assertEqual(len(requests), 1)

    def test_compound_market_row_is_split_and_shared_gross_is_preserved(self):
        data, requests, result = self.run_rows(
            [{"title": "映画A / 映画B", "gross": 15.5, "year": 1980}],
            {"results": []},
        )
        rows = data["by_year"]["1980"]
        self.assertEqual([row["title"] for row in rows], ["映画A", "映画B"])
        self.assertEqual([row["gross"] for row in rows], [15.5, 15.5])
        self.assertEqual([row["source_title"] for row in rows], ["映画A / 映画B"] * 2)
        self.assertEqual(result["expanded_grouped_films"], 2)

    def test_compound_market_titles_are_individually_matchable(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        path.write_text(json.dumps({"by_year": {"1999": [{
            "title": "リング2 / 死国", "gross": 21, "year": 1999,
            "metric": "配給収入", "source_url": "https://example.org/source",
        }]}, "all_time": []}), encoding="utf-8")
        requested_titles = []

        def opener(request, timeout):
            from urllib.parse import parse_qs, urlparse
            title = parse_qs(urlparse(request.full_url).query).get("query", [""])[0]
            requested_titles.append(title)
            movie_id = 9669 if title == "リング2" else 999001
            poster = "/ring2.jpg" if title == "リング2" else "/shikoku.jpg"
            return Response({"results": [{
                "id": movie_id, "title": title, "release_date": "1999-01-01",
                "poster_path": poster,
            }]})

        result = backfill.backfill(path, api_key="fixture", opener=opener, delay=0,
                                  now=datetime.datetime(2026, 11, 10, tzinfo=datetime.timezone.utc),
                                  catalog_paths=[])
        rows = json.loads(path.read_text(encoding="utf-8"))["by_year"]["1999"]
        self.assertEqual(requested_titles, ["リング2", "死国"])
        self.assertEqual([row["title"] for row in rows], ["リング2", "死国"])
        self.assertEqual([row["gross"] for row in rows], [21, 21])
        self.assertEqual([row["tmdbId"] for row in rows], [9669, 999001])
        self.assertEqual([row["poster"].rsplit("/", 1)[-1] for row in rows], ["ring2.jpg", "shikoku.jpg"])
        self.assertEqual(result["enriched"], 2)

    def test_eiren_2010_den_o_trilogy_sibling_rows_expand_to_three_distinct_films(self):
        source_group = "仮面ライダー×仮面ライダー×仮面ライダー / 超・電王トリロジー"
        data = {"by_year": {"2010": [
            {"title": "仮面ライダー×仮面ライダー×仮面ライダー",
             "gross": 13.1, "year": 2010, "metric": "興行収入",
             "source_group_title": source_group,
             "poster_checked_at": "2026-11-14T04:00:00Z",
             "poster_check_version": backfill.POSTER_CHECK_VERSION,
             "poster_match_status": "unresolved",
             "source_url": "https://www.eiren.org/toukei/img/eiren_kosyu/data_2010.pdf"},
            {"title": "超・電王トリロジー", "gross": 13.1, "year": 2010,
             "metric": "興行収入", "source_group_title": source_group,
             "poster_checked_at": "2026-11-14T04:00:00Z",
             "poster_check_version": backfill.POSTER_CHECK_VERSION,
             "poster_match_status": "unresolved",
             "source_url": "https://www.eiren.org/toukei/img/eiren_kosyu/data_2010.pdf"},
        ]}, "all_time": []}
        identities = {
            "超・電王トリロジー EPISODE RED ゼロのスタートウィンクル":
                (7001, "2010-05-22", "/den-o-red.jpg"),
            "超・電王トリロジー EPISODE BLUE 派遣イマジンはNEWトラル":
                (7002, "2010-06-05", "/den-o-blue.jpg"),
            "超・電王トリロジー EPISODE YELLOW お宝 DE エンド・パイレーツ":
                (7003, "2010-06-19", "/den-o-yellow.jpg"),
        }
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        path.write_text(json.dumps(data), encoding="utf-8")
        requested = []

        def opener(request, timeout):
            from urllib.parse import parse_qs, urlparse
            title = parse_qs(urlparse(request.full_url).query).get("query", [""])[0]
            requested.append(title)
            identity = identities.get(title)
            if identity is None:
                return Response({"results": []})
            identifier, release, poster = identity
            return Response({"results": [{
                "id": identifier, "title": title, "original_title": title,
                "release_date": release, "poster_path": poster,
            }]})

        result = backfill.backfill(
            path, api_key="fixture", opener=opener, delay=0,
            now=datetime.datetime(2026, 11, 14, tzinfo=datetime.timezone.utc),
            catalog_paths=[],
        )
        rows = json.loads(path.read_text(encoding="utf-8"))["by_year"]["2010"]
        self.assertEqual(requested, list(identities))
        self.assertEqual([row["title"] for row in rows], list(identities))
        self.assertEqual([row["gross"] for row in rows], [13.1, 13.1, 13.1])
        self.assertEqual([row["tmdbId"] for row in rows], [7001, 7002, 7003])
        self.assertEqual([row["poster"].rsplit("/", 1)[-1] for row in rows], [
            "den-o-red.jpg", "den-o-blue.jpg", "den-o-yellow.jpg",
        ])
        self.assertEqual([row["source_group_title"] for row in rows], [source_group] * 3)
        self.assertEqual([row["source_group_index"] for row in rows], [1, 2, 3])
        self.assertEqual([row["source_group_size"] for row in rows], [3, 3, 3])
        self.assertTrue(all(row["source_title"].startswith(
            "仮面ライダー×仮面ライダー×仮面ライダー 超・電王トリロジー"
        ) for row in rows))
        self.assertEqual(result["expanded_grouped_films"], 3)
        self.assertEqual(result["enriched"], 3)

    def test_eiren_group_sibling_with_existing_poster_is_not_discarded(self):
        source_group = "仮面ライダー×仮面ライダー×仮面ライダー / 超・電王トリロジー"
        poster = "https://image.tmdb.org/t/p/w500/verified.jpg"
        data = {"by_year": {"2010": [
            {"title": "仮面ライダー×仮面ライダー×仮面ライダー",
             "gross": 13.1, "source_group_title": source_group,
             "tmdbId": 111, "poster": poster},
            {"title": "超・電王トリロジー", "gross": 13.1,
             "source_group_title": source_group},
        ]}, "all_time": []}
        self.assertEqual(backfill.expand_grouped_rows(data), 0)
        self.assertEqual(len(data["by_year"]["2010"]), 2)
        self.assertEqual(data["by_year"]["2010"][0]["poster"], poster)
        self.assertEqual(data["by_year"]["2010"][0]["tmdbId"], 111)

    def test_eiren_group_siblings_with_conflicting_gross_are_not_rewritten(self):
        source_group = "仮面ライダー×仮面ライダー×仮面ライダー / 超・電王トリロジー"
        data = {"by_year": {"2010": [
            {"title": "仮面ライダー×仮面ライダー×仮面ライダー",
             "gross": 13.1, "source_group_title": source_group},
            {"title": "超・電王トリロジー", "gross": 12.9,
             "source_group_title": source_group},
        ]}, "all_time": []}
        self.assertEqual(backfill.expand_grouped_rows(data), 0)
        self.assertEqual([row["gross"] for row in data["by_year"]["2010"]], [13.1, 12.9])
        self.assertEqual([row["title"] for row in data["by_year"]["2010"]], [
            "仮面ライダー×仮面ライダー×仮面ライダー", "超・電王トリロジー",
        ])

    def test_star_wars_trilogy_expands_with_original_gross_and_distinct_posters(self):
        data = {"by_year": {"1997": [{
            "title": "スターウォーズ(3部作)", "gross": 19, "year": 1997,
            "region": "洋画", "metric": "配給収入",
            "source_url": "https://www.eiren.org/toukei/1997.html",
        }]}, "all_time": []}
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        path.write_text(json.dumps(data), encoding="utf-8")
        identities = {
            "スター・ウォーズ エピソード4／新たなる希望": (1001, "1977-05-25", "/star-wars-4.jpg"),
            "スター・ウォーズ エピソード5／帝国の逆襲": (1002, "1980-05-21", "/star-wars-5.jpg"),
            "スター・ウォーズ エピソード6／ジェダイの帰還": (1003, "1983-05-25", "/star-wars-6.jpg"),
        }
        requested = []

        def opener(request, timeout):
            from urllib.parse import parse_qs, urlparse
            title = parse_qs(urlparse(request.full_url).query).get("query", [""])[0]
            requested.append(title)
            identity_key = backfill.normalize(title)
            identity = next((item for key, item in identities.items()
                             if backfill.normalize(key) == identity_key), None)
            if identity is None:
                return Response({"results": []})
            identifier, release, poster = identity
            return Response({"results": [{
                "id": identifier, "title": title, "original_title": title,
                "release_date": release, "poster_path": poster,
            }]})

        result = backfill.backfill(path, api_key="fixture", opener=opener, delay=0,
                                  now=datetime.datetime(2026, 11, 10, tzinfo=datetime.timezone.utc),
                                  catalog_paths=[])
        rows = json.loads(path.read_text(encoding="utf-8"))["by_year"]["1997"]
        requested_keys = {backfill.normalize(title) for title in requested}
        identity_keys = {backfill.normalize(title) for title in identities}
        self.assertTrue(identity_keys.issubset(requested_keys))
        self.assertEqual([row["title"] for row in rows], list(identities))
        self.assertEqual([row["gross"] for row in rows], [19, 19, 19])
        self.assertEqual([row["metric"] for row in rows], ["配給収入"] * 3)
        self.assertEqual(len({row["tmdbId"] for row in rows}), 3)
        self.assertEqual(len({row["poster"] for row in rows}), 3)
        self.assertEqual([row["poster"].rsplit("/", 1)[-1] for row in rows], [
            "star-wars-4.jpg", "star-wars-5.jpg", "star-wars-6.jpg",
        ])
        self.assertEqual([row["source_group_index"] for row in rows], [1, 2, 3])
        self.assertEqual([row["source_group_size"] for row in rows], [3, 3, 3])
        self.assertEqual([row["source_title"] for row in rows], ["スターウォーズ(3部作)"] * 3)
        self.assertEqual(result["expanded_grouped_films"], 3)
        self.assertEqual(result["enriched"], 3)

    def test_kamen_rider_and_shinkenger_double_feature_get_separate_posters(self):
        data = {"by_year": {"2009": [{
            "title": "劇場版 仮面ライダーディケイド侍戦隊シンケンジャー 銀幕版",
            "gross": 19, "year": 2009, "region": "邦画",
            "metric": "興行収入",
            "source_url": "https://www.eiren.org/toukei/2009.html",
        }]}, "all_time": []}
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        path.write_text(json.dumps(data), encoding="utf-8")
        identities = {
            "劇場版 仮面ライダーディケイド オールライダー対大ショッカー":
                (30617, "2009-08-08", "/kamen-rider.jpg"),
            "侍戦隊シンケンジャー銀幕版 天下分け目の戦":
                (188297, "2009-08-08", "/shinkenger.jpg"),
        }
        requested = []

        alias_to_identity = {
            backfill.normalize("仮面ライダーディケイド オールライダー対大ショッカー"):
                backfill.normalize("劇場版 仮面ライダーディケイド オールライダー対大ショッカー"),
            backfill.normalize("侍戦隊シンケンジャー銀幕版 天下分け目の戦"):
                backfill.normalize("侍戦隊シンケンジャー銀幕版 天下分け目の戦"),
        }

        def opener(request, timeout):
            from urllib.parse import parse_qs, urlparse
            title = parse_qs(urlparse(request.full_url).query).get("query", [""])[0]
            requested.append(title)
            identity_key = alias_to_identity.get(backfill.normalize(title))
            identity = next((item for key, item in identities.items()
                             if backfill.normalize(key) == identity_key), None)
            if identity is None:
                return Response({"results": []})
            identifier, release, poster = identity
            return Response({"results": [{
                "id": identifier, "title": title, "original_title": title,
                "release_date": release, "poster_path": poster,
            }]})

        result = backfill.backfill(path, api_key="fixture", opener=opener, delay=0,
                                  now=datetime.datetime(2026, 11, 10, tzinfo=datetime.timezone.utc),
                                  catalog_paths=[])
        rows = json.loads(path.read_text(encoding="utf-8"))["by_year"]["2009"]
        requested_keys = {backfill.normalize(title) for title in requested}
        self.assertTrue(set(alias_to_identity).issubset(requested_keys))
        self.assertEqual([row["title"] for row in rows], list(identities))
        self.assertEqual([row["gross"] for row in rows], [19, 19])
        self.assertEqual([row["tmdbId"] for row in rows], [30617, 188297])
        self.assertNotEqual(rows[0]["poster"], rows[1]["poster"])
        self.assertEqual([row["source_group_index"] for row in rows], [1, 2])
        self.assertEqual([row["source_group_size"] for row in rows], [2, 2])
        self.assertEqual(result["expanded_grouped_films"], 2)
        self.assertEqual(result["enriched"], 2)

    def test_explicit_combined_market_titles_are_classified_as_groups(self):
        self.assertTrue(backfill.grouped_title("スターウォーズ(3部作)"))
        self.assertTrue(backfill.grouped_title(
            "劇場版 仮面ライダーディケイド侍戦隊シンケンジャー 銀幕版"))
        self.assertEqual(backfill.split_grouped_titles("スターウォーズ(3部作)"), [
            "スター・ウォーズ エピソード4／新たなる希望",
            "スター・ウォーズ エピソード5／帝国の逆襲",
            "スター・ウォーズ エピソード6／ジェダイの帰還",
        ])

    def test_drop_filters_same_title_tmdb_candidates_by_official_japan_date(self):
        self.assertTrue(backfill.matches_reviewed_release_window(
            "ドロップ", 2009, "2009-03-20"))
        self.assertFalse(backfill.matches_reviewed_release_window(
            "ドロップ", 2009, "2008-05-11"))
        self.assertFalse(backfill.matches_reviewed_release_window(
            "ドロップ", 2009, ""))
        self.assertTrue(backfill.matches_reviewed_release_window(
            "別タイトル", 2009, "2008-01-01"))

    def test_official_1994_rampo_versions_split_with_shared_gross(self):
        data = {"by_year": {"1994": [{
            "title": "RAMPO", "gross": 12.0, "year": 1994,
            "metric": "配給収入",
        }]}}

        self.assertEqual(backfill.expand_grouped_rows(data), 2)
        rows = data["by_year"]["1994"]
        self.assertEqual([row["title"] for row in rows], [
            "ＲＡＭＰＯ（奥山バージョン）",
            "ＲＡＭＰＯ（黛バージョン）",
        ])
        self.assertEqual([row["gross"] for row in rows], [12.0, 12.0])
        self.assertEqual([row["source_group_index"] for row in rows], [1, 2])
        self.assertEqual([row["source_group_size"] for row in rows], [2, 2])
        self.assertEqual([row["source_title"] for row in rows], ["RAMPO", "RAMPO"])
        self.assertTrue(all(not row.get("poster") and not row.get("tmdbId") for row in rows))

    def test_existing_1982_double_bill_siblings_are_not_duplicated(self):
        poster = "https://image.tmdb.org/t/p/w500/good-luck.jpg"
        source_group = "グッドラックLOVE / すっかり・・・その気で!"
        data = {"by_year": {"1982": [
            {"title": "グッドラックLOVE", "gross": 10.5,
             "source_group_title": source_group, "tmdbId": 547500, "poster": poster},
            {"title": "すっかり・・・その気で!", "gross": 10.5,
             "source_group_title": source_group},
        ]}}

        self.assertEqual(backfill.expand_grouped_rows(data), 0)
        rows = data["by_year"]["1982"]
        self.assertEqual(len(rows), 2)
        self.assertEqual([row["title"] for row in rows], [
            "グッドラックLOVE", "すっかり・・・その気で!",
        ])
        self.assertEqual([row["gross"] for row in rows], [10.5, 10.5])
        self.assertEqual(rows[0]["poster"], poster)
        self.assertEqual(rows[0]["tmdbId"], 547500)

    def test_existing_1987_triple_bill_siblings_are_not_duplicated(self):
        source_group = (
            "ドラえもん のび太と竜の騎士 / プロゴルファー猿 "
            "甲賀秘境!影の忍法ゴルファー参上! / "
            "オバケのQ太郎 とびだせ!1/100大作戦"
        )
        poster_a = "https://image.tmdb.org/t/p/w500/doraemon.jpg"
        poster_b = "https://image.tmdb.org/t/p/w500/saru.jpg"
        data = {"by_year": {"1987": [
            {"title": "ドラえもん のび太と竜の騎士", "gross": 15.0,
             "source_group_title": source_group, "tmdbId": 72565, "poster": poster_a},
            {"title": "プロゴルファー猿 甲賀秘境!影の忍法ゴルファー参上!",
             "gross": 15.0, "source_group_title": source_group,
             "tmdbId": 1005349, "poster": poster_b},
            {"title": "オバケのQ太郎 とびだせ!1/100大作戦",
             "gross": 15.0, "source_group_title": source_group},
        ]}}

        self.assertEqual(backfill.expand_grouped_rows(data), 0)
        rows = data["by_year"]["1987"]
        self.assertEqual(len(rows), 3)
        self.assertEqual([row["gross"] for row in rows], [15.0, 15.0, 15.0])
        self.assertEqual([row["poster"] for row in rows[:2]], [poster_a, poster_b])
        self.assertEqual([row["tmdbId"] for row in rows[:2]], [72565, 1005349])
        self.assertFalse(rows[2].get("poster"))
        self.assertFalse(rows[2].get("tmdbId"))

    def test_official_1992_21_emon_package_splits_into_individual_films(self):
        import unicodedata
        from urllib.parse import parse_qs, urlparse

        source_title = "21エモン 他"
        source_url = "https://shin-ei-animation.jp/50th/"
        film_identities = {
            "21エモン 宇宙行け！裸足のプリンセス":
                (21001, "/21-emon-princess.jpg"),
            "トキメキソーラーくるまによん":
                (21002, "/tokimeki-solar.jpg"),
        }
        requested_titles = []
        requests = []

        def opener(request, timeout):
            requests.append((request, timeout))
            title = parse_qs(urlparse(request.full_url).query).get("query", [""])[0]
            requested_titles.append(title)
            official_title = next(
                name for name in film_identities
                if unicodedata.normalize("NFKC", name) == title
            )
            identifier, poster_path = film_identities[official_title]
            return Response({"results": [{
                "id": identifier, "title": official_title, "original_title": official_title,
                "release_date": "1992-03-07", "poster_path": poster_path,
            }]})

        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        path.write_text(json.dumps({"by_year": {"1992": [{
            "title": source_title, "gross": 16.8, "year": 1992,
            "metric": "配給収入", "source_url": source_url,
        }]}, "all_time": []}), encoding="utf-8")
        result = backfill.backfill(
            path, api_key="fixture", opener=opener, delay=0,
            now=datetime.datetime(2026, 11, 10, tzinfo=datetime.timezone.utc),
            catalog_paths=[],
        )
        data = json.loads(path.read_text(encoding="utf-8"))
        rows = data["by_year"]["1992"]
        self.assertEqual(requested_titles, [unicodedata.normalize("NFKC", title) for title in film_identities])
        self.assertEqual([row["title"] for row in rows], list(film_identities))
        self.assertEqual([row["gross"] for row in rows], [16.8, 16.8])
        self.assertEqual([row["metric"] for row in rows], ["配給収入", "配給収入"])
        self.assertEqual([row["source_url"] for row in rows], [source_url, source_url])
        self.assertEqual([row["tmdbId"] for row in rows], [21001, 21002])
        self.assertEqual([row["poster"].rsplit("/", 1)[-1] for row in rows],
                         ["21-emon-princess.jpg", "tokimeki-solar.jpg"])
        self.assertEqual([row["source_group_index"] for row in rows], [1, 2])
        self.assertEqual([row["source_group_size"] for row in rows], [2, 2])
        self.assertEqual(result["expanded_grouped_films"], 2)
        self.assertEqual(result["enriched"], 2)
        self.assertEqual(len(requests), 2)

    def test_official_1988_group_titles_resolve_two_films_without_dropping_doraemon(self):
        from urllib.parse import parse_qs, urlparse

        source_group = (
            "ドラえもん のび太のパラレル西遊記 / エスパー魔美 / "
            "星空のダンシング・ドール 他"
        )
        identities = {
            "エスパー魔美 星空のダンシングドール":
                (88001, "/esper-mami-dancing-doll.jpg"),
            "ウルトラB ブラックホールからの独裁者B・B!!":
                (88002, "/ultra-b-black-hole.jpg"),
        }
        requests = []
        queried_titles = []

        def opener(request, timeout):
            requests.append((request, timeout))
            title = parse_qs(urlparse(request.full_url).query).get("query", [""])[0]
            queried_titles.append(title)
            identifier, poster_path = identities[title]
            return Response({"results": [{
                "id": identifier, "title": title, "original_title": title,
                "release_date": "1988-03-12", "poster_path": poster_path,
            }]})

        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        doraemon = {
            "title": "ドラえもん のび太のパラレル西遊記",
            "gross": 13.6, "year": 1988, "metric": "配給収入",
            "source_group_title": source_group,
            "tmdbId": 136241,
            "poster": "https://image.tmdb.org/t/p/w500/doraemon.jpg",
        }
        path.write_text(json.dumps({"by_year": {"1988": [
            dict(doraemon),
            {"title": "エスパー魔美", "gross": 13.6, "year": 1988,
             "metric": "配給収入", "source_group_title": source_group},
            {"title": "星空のダンシング・ドール 他", "gross": 13.6,
             "year": 1988, "metric": "配給収入",
             "source_group_title": source_group},
        ]}, "all_time": []}), encoding="utf-8")

        result = backfill.backfill(
            path, api_key="fixture", opener=opener, delay=0,
            now=datetime.datetime(2026, 11, 10, tzinfo=datetime.timezone.utc),
            catalog_paths=[],
        )
        rows = json.loads(path.read_text(encoding="utf-8"))["by_year"]["1988"]
        self.assertEqual(queried_titles, list(identities))
        self.assertEqual([row["title"] for row in rows], [
            doraemon["title"], *identities.keys(),
        ])
        self.assertEqual([row["gross"] for row in rows], [13.6, 13.6, 13.6])
        self.assertEqual([row["tmdbId"] for row in rows], [136241, 88001, 88002])
        self.assertEqual([row["poster"].rsplit("/", 1)[-1] for row in rows], [
            "doraemon.jpg", "esper-mami-dancing-doll.jpg", "ultra-b-black-hole.jpg",
        ])
        self.assertEqual([row["source_group_title"] for row in rows], [source_group] * 3)
        self.assertEqual(result["enriched"], 2)
        self.assertEqual(len(requests), 2)

    def test_unspaced_official_double_feature_separators_are_split(self):
        titles = [
            "仮面ライダーダブル/天装戦隊ゴセイジャー",
            "劇場版 仮面ライダーウィザード イン マジックランド/劇場版 獣電戦隊キョウリュウジャー ガブリンチョ・オブ・ミュージック",
            "劇場版ポケットモンスター ベストウィッシュ『神速のゲノセクト ミュウツー覚醒』/ピカチュウとイーブイ☆フレンズ",
            "ポケモン・ザ・ムービーXY「破壊の繭とディアンシー」/ピカチュウ、これなんのカギ?",
        ]
        for title in titles:
            with self.subTest(title=title):
                self.assertTrue(backfill.grouped_title(title))
        self.assertEqual(backfill.split_grouped_titles(titles[0]), [
            "仮面ライダーダブル", "天装戦隊ゴセイジャー",
        ])

    def test_multiple_quoted_features_are_excluded_but_single_slash_titles_stay_eligible(self):
        self.assertTrue(backfill.grouped_title(
            "劇場版ポケットモンスター ベストウィッシュ「ビクティニと黒き英雄ゼクロム」「ビクティニと白き英雄レシラム」"))
        self.assertTrue(backfill.grouped_title("男はつらいよ 寅次郎サラダ記念日/釣りバカ日誌"))
        self.assertTrue(backfill.grouped_title("ドラえもん のび太とアニマル惑星/チンプイ"))
        self.assertTrue(backfill.grouped_title("リング/らせん"))
        self.assertFalse(backfill.grouped_title("007/ムーンレイカー"))
        self.assertFalse(backfill.grouped_title("ケイゾク/映画"))
        self.assertTrue(backfill.grouped_title(
            "劇場版 仮面ライダーオーズ WONDERFUL 将軍と21のコアメダル 海賊戦隊ゴーカイジャー THE MOVIE 空飛ぶ幽霊船"))
        self.assertTrue(backfill.grouped_title(
            "仮面ライダーオーズ THE MOVIE みんなで宇宙キターッ! 特命戦隊ゴーバスターズ THE MOVIE 東京エネタワーを守れ!"))
        self.assertTrue(backfill.grouped_title(
            "劇場版 仮面ライダージオウ Over Quartzer 騎士竜戦隊リュウソウジャー THE MOVIE タイムスリップ!恐竜パニック!!"))
        self.assertTrue(backfill.grouped_title(
            "ポケモン・ザ・ムービーXY 光輪(リング)の超魔神フーパ ピカチュウとポケモンおんがくたい"))
        self.assertFalse(backfill.grouped_title("映画 仮面ライダーオーズ WONDERFUL 将軍と21のコアメダル"))
        self.assertFalse(backfill.grouped_title("海賊戦隊ゴーカイジャー THE MOVIE 空飛ぶ幽霊船"))
        self.assertFalse(backfill.grouped_title("劇場版 仮面ライダージオウ Over Quartzer"))
        self.assertFalse(backfill.grouped_title("ピカチュウとポケモンおんがくたい"))
        self.assertFalse(backfill.grouped_title("仮面ライダー×仮面ライダーW&ディケイド"))

    def test_no_match_is_not_guessed_from_boxoffice_year(self):
        data, requests, result = self.run_rows(
            [{"title": "未登録作品", "gross": 10, "year": 1980}],
            {"results": [{"id": 10, "title": "近い作品", "release_date": "1980-01-01",
                          "poster_path": "/wrong.jpg"}]},
        )
        self.assertNotIn("poster", data["by_year"]["1980"][0])
        self.assertNotIn("tmdbId", data["by_year"]["1980"][0])
        self.assertEqual(result["unresolved"], 1)
        self.assertEqual(data["by_year"]["1980"][0]["poster_check_version"], backfill.POSTER_CHECK_VERSION)
        self.assertEqual(data["by_year"]["1980"][0]["poster_match_status"], "not_found")
        self.assertEqual(len(requests), 3)
        self.assertIn("/movie/10/alternative_titles?", requests[2][0].full_url)

    def test_existing_poster_is_never_replaced_and_missing_key_is_read_only(self):
        data, requests, result = self.run_rows(
            [{"title": "既存", "gross": 5, "year": 1980,
              "poster": "https://image.tmdb.org/t/p/w500/existing.jpg"}],
            {"results": []},
        )
        self.assertEqual(data["by_year"]["1980"][0]["poster"], "https://image.tmdb.org/t/p/w500/existing.jpg")
        self.assertEqual(requests, [])
        self.assertEqual(result["enriched"], 0)

    def test_reuses_unique_verified_local_poster_before_spending_api_lookup(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        catalog = Path(tmp.name) / "movies.json"
        path.write_text(json.dumps({"by_year": {"1998": [{"title": "ディープ・インパクト"}]},
                                    "all_time": []}), encoding="utf-8")
        catalog.write_text(json.dumps({"movies": [{
            "id": 8656, "title": "ディープ・インパクト", "date": "1998-05-08",
            "poster": "https://image.tmdb.org/t/p/w342/verified.jpg",
            "source_url": "https://www.themoviedb.org/movie/8656",
        }]}), encoding="utf-8")
        requests = []

        def opener(request, timeout):
            requests.append((request, timeout))
            return Response({"results": []})

        result = backfill.backfill(
            path, api_key="fixture", opener=opener, delay=0,
            now=datetime.datetime(2026, 11, 10, tzinfo=datetime.timezone.utc),
            catalog_paths=[catalog],
        )
        row = json.loads(path.read_text(encoding="utf-8"))["by_year"]["1998"][0]
        self.assertEqual(row["tmdbId"], 8656)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w342/verified.jpg")
        self.assertEqual(row["identity_match"], "verified_local_exact_title_and_release_year_window")
        self.assertEqual(requests, [])
        self.assertEqual(result["local_enriched"], 1)



    def test_recent_unresolved_row_from_old_matcher_is_rechecked_immediately(self):
        recently_checked = {
            "title": "旧照合方式の未解決作品",
            "poster_checked_at": "2026-11-09T12:00:00Z",
            "poster_check_version": 1,
        }
        data, requests, result = self.run_rows(
            [recently_checked],
            {"results": [{"id": 55, "title": "旧照合方式の未解決作品",
                          "release_date": "1980-01-01", "poster_path": "/restored.jpg"}]},
        )
        row = data["by_year"]["1980"][0]
        self.assertEqual(row["tmdbId"], 55)
        self.assertEqual(row["poster_check_version"], backfill.POSTER_CHECK_VERSION)
        self.assertEqual(result["enriched"], 1)
        self.assertEqual(len(requests), 1)

    def test_recent_unresolved_row_is_retried_after_one_day(self):
        recently_checked = {
            "title": "現方式で確認済みの作品",
            "poster_checked_at": "2026-11-08T12:00:00Z",
            "poster_check_version": backfill.POSTER_CHECK_VERSION,
        }
        data, requests, result = self.run_rows(
            [recently_checked],
            {"results": [{"id": 56, "title": "現方式で確認済みの作品",
                          "release_date": "1980-01-01", "poster_path": "/ignored.jpg"}]},
        )
        row = data["by_year"]["1980"][0]
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w500/ignored.jpg")
        self.assertEqual(result["enriched"], 1)
        self.assertEqual(len(requests), 1)

    def test_recent_row_skipped_by_cooldown_is_explicitly_unexamined(self):
        recently_checked = {
            "title": "冷却期間中の未解決作品",
            "poster_checked_at": "2026-11-09T12:00:00Z",
            "poster_check_version": backfill.POSTER_CHECK_VERSION,
        }
        data, requests, result = self.run_rows(
            [recently_checked],
            {"results": []},
        )
        row = data["by_year"]["1980"][0]
        self.assertEqual(row["poster_match_status"], "unexamined")
        self.assertEqual(row["poster_check_skip_reason"], "cooldown")
        self.assertEqual(result["unexamined"], 1)
        self.assertEqual(requests, [])

    def test_unique_tmdb_japan_alternative_title_recovers_poster(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        path.write_text(json.dumps({"by_year": {"1981": [{"title": "レイダース 失われた聖櫃(アーク)"}]},
                                    "all_time": []}), encoding="utf-8")
        requests = []

        def opener(request, timeout):
            requests.append((request, timeout))
            if "/search/movie?" in request.full_url:
                return Response({"results": [{
                    "id": 85, "title": "インディ・ジョーンズ／レイダース 失われたアーク《聖櫃》",
                    "original_title": "Raiders of the Lost Ark", "release_date": "1981-06-12",
                    "poster_path": "/raiders.jpg",
                }]})
            return Response({"id": 85, "titles": [
                {"iso_3166_1": "JP", "title": "レイダース 失われた聖櫃(アーク)", "type": "working"}
            ]})

        result = backfill.backfill(path, api_key="fixture", opener=opener, delay=0,
                                   now=datetime.datetime(2026, 11, 10, tzinfo=datetime.timezone.utc),
                                   catalog_paths=[])
        row = json.loads(path.read_text(encoding="utf-8"))["by_year"]["1981"][0]
        self.assertEqual(row["tmdbId"], 85)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w500/raiders.jpg")
        self.assertEqual(row["identity_match"],
                         "exact_tmdb_alternative_title_and_release_year_window")
        self.assertEqual(len(requests), 3)
        self.assertIn("/movie/85/alternative_titles?", requests[2][0].full_url)
        self.assertIn("country=JP", requests[2][0].full_url)
        self.assertEqual(result["enriched"], 1)

    def test_unverified_tmdb_search_result_stays_unresolved(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        path.write_text(json.dumps({"by_year": {"1981": [{"title": "レイダース 失われた聖櫃(アーク)"}]},
                                    "all_time": []}), encoding="utf-8")
        requests = []

        def opener(request, timeout):
            requests.append((request, timeout))
            if "/search/movie?" in request.full_url:
                return Response({"results": [{
                    "id": 86, "title": "似ているだけの作品", "original_title": "Other film",
                    "release_date": "1981-06-12", "poster_path": "/wrong.jpg",
                }]})
            return Response({"id": 86, "titles": [
                {"iso_3166_1": "JP", "title": "別の日本語題", "type": "working"}
            ]})

        result = backfill.backfill(path, api_key="fixture", opener=opener, delay=0,
                                   now=datetime.datetime(2026, 11, 10, tzinfo=datetime.timezone.utc),
                                   catalog_paths=[])
        row = json.loads(path.read_text(encoding="utf-8"))["by_year"]["1981"][0]
        self.assertNotIn("tmdbId", row)
        self.assertNotIn("poster", row)
        self.assertEqual(len(requests), 3)
        self.assertEqual(result["unresolved"], 1)

    def test_alias_candidate_overflow_is_unresolved_without_guessing(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        path.write_text(json.dumps({"by_year": {"1981": [{"title": "同名別題"}]},
                                    "all_time": []}), encoding="utf-8")
        requests = []

        def opener(request, timeout):
            requests.append((request, timeout))
            return Response({"results": [
                {"id": n, "title": f"候補{n}", "release_date": "1981-01-01",
                 "poster_path": f"/{n}.jpg"} for n in range(1, 5)
            ]})

        result = backfill.backfill(path, api_key="fixture", opener=opener, delay=0,
                                   now=datetime.datetime(2026, 11, 10, tzinfo=datetime.timezone.utc),
                                   catalog_paths=[])
        row = json.loads(path.read_text(encoding="utf-8"))["by_year"]["1981"][0]
        self.assertNotIn("tmdbId", row)
        self.assertNotIn("poster", row)
        self.assertEqual(len(requests), 2)
        self.assertEqual(result["ambiguous"], 1)

    def test_reuses_unique_verified_ranking_poster(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        ranking = Path(tmp.name) / "jp-action-1990.json"
        path.write_text(json.dumps({"by_year": {"1990": [{"title": "ダイハード2"}]},
                                    "all_time": []}), encoding="utf-8")
        ranking.write_text(json.dumps({"items": [{
            "id": 1573,
            "title": "ダイ・ハード2",
            "year": "1990",
            "poster": "https://image.tmdb.org/t/p/w342/die-hard-2.jpg",
            "tmdb": "https://www.themoviedb.org/movie/1573",
        }]}), encoding="utf-8")

        result = backfill.backfill(
            path, api_key="", now=datetime.datetime(2026, 11, 10, tzinfo=datetime.timezone.utc),
            catalog_paths=[ranking],
        )

        row = json.loads(path.read_text(encoding="utf-8"))["by_year"]["1990"][0]
        self.assertEqual(row["tmdbId"], 1573)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w342/die-hard-2.jpg")
        self.assertEqual(row["identity_match"], "verified_local_exact_title_and_release_year_window")
        self.assertEqual(result["local_enriched"], 1)

    def test_reuses_verified_posters_from_ranking_directory(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        rankings = Path(tmp.name) / "rankings"
        rankings.mkdir()
        path.write_text(json.dumps({"by_year": {"2004": [{"title": "パッション"}]},
                                    "all_time": []}), encoding="utf-8")
        (rankings / "foreign-drama-2000.json").write_text(json.dumps({"items": [{
            "id": 615,
            "title": "パッション",
            "year": "2004",
            "poster": "https://image.tmdb.org/t/p/w342/passion.jpg",
            "tmdb": "https://www.themoviedb.org/movie/615",
        }]}), encoding="utf-8")

        result = backfill.backfill(
            path, api_key="", now=datetime.datetime(2026, 11, 10, tzinfo=datetime.timezone.utc),
            catalog_paths=[rankings],
        )

        row = json.loads(path.read_text(encoding="utf-8"))["by_year"]["2004"][0]
        self.assertEqual(row["tmdbId"], 615)
        self.assertEqual(result["local_enriched"], 1)

    def test_default_catalogs_recover_existing_ranking_identity(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        path.write_text(json.dumps({"by_year": {"1990": [{"title": "ダイハード2"}]},
                                    "all_time": []}), encoding="utf-8")

        result = backfill.backfill(
            path, api_key="", now=datetime.datetime(2026, 11, 10, tzinfo=datetime.timezone.utc),
        )

        row = json.loads(path.read_text(encoding="utf-8"))["by_year"]["1990"][0]
        self.assertEqual(row["tmdbId"], 1573)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w342/8mICv4xxiIBwIOnzJrAkGnsDWUB.jpg")
        self.assertEqual(result["local_enriched"], 1)

    def test_local_same_title_candidates_remain_unresolved(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        path = Path(tmp.name) / "boxoffice.json"
        catalog = Path(tmp.name) / "movies.json"
        path.write_text(json.dumps({"by_year": {"2004": [{"title": "同名作品"}]},
                                    "all_time": []}), encoding="utf-8")
        catalog.write_text(json.dumps({"movies": [
            {"id": 1, "title": "同名作品", "date": "2004-01-01", "poster": "https://image.tmdb.org/t/p/w342/one.jpg"},
            {"id": 2, "title": "同名作品", "date": "2003-01-01", "poster": "https://image.tmdb.org/t/p/w342/two.jpg"},
        ]}), encoding="utf-8")
        result = backfill.backfill(
            path, api_key="", now=datetime.datetime(2026, 11, 10, tzinfo=datetime.timezone.utc),
            catalog_paths=[catalog],
        )
        row = json.loads(path.read_text(encoding="utf-8"))["by_year"]["2004"][0]
        self.assertNotIn("poster", row)
        self.assertNotIn("tmdbId", row)
        self.assertEqual(result["local_enriched"], 0)



    def test_reviewed_kid_alias_uses_official_title_and_japan_market_year(self):
        data, requests, result = self.run_rows(
            [{"title": "ザ・キッド", "gross": 14.5, "year": 2000}],
            [
                {"results": []},
                {"results": [{
                    "id": 900001,
                    "title": "The Kid",
                    "original_title": "The Kid",
                    "release_date": "2000-07-07",
                    "poster_path": "/fixture-the-kid-poster.jpg",
                }]},
            ],
            market_year="2000",
        )
        row = data["by_year"]["2000"][0]
        self.assertEqual(row["tmdbId"], 900001)
        self.assertEqual(row["poster"], "https://image.tmdb.org/t/p/w500/fixture-the-kid-poster.jpg")
        self.assertEqual(row["identity_match"], "exact_cleaned_title_and_release_year_window")
        self.assertEqual((row["gross"], row["year"]), (14.5, 2000))
        self.assertEqual(
            [request[0].full_url.split("language=")[1].split("&")[0] for request in requests],
            ["ja-JP", "en-US"],
        )
        self.assertEqual(result["enriched"], 1)

if __name__ == "__main__":
    unittest.main()
