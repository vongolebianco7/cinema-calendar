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

        def opener(request, timeout):
            requests.append((request, timeout))
            return Response(payload)

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
        self.assertEqual(row["poster_check_version"], 3)
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
        self.assertEqual(data["by_year"]["1980"][0]["poster_check_version"], 3)
        self.assertEqual(data["by_year"]["1980"][0]["poster_match_status"], "not_found")
        self.assertEqual(len(requests), 2)
        self.assertIn("/movie/10/alternative_titles?", requests[1][0].full_url)

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
        self.assertEqual(row["poster_check_version"], 3)
        self.assertEqual(result["enriched"], 1)
        self.assertEqual(len(requests), 1)

    def test_recent_unresolved_row_is_retried_after_one_day(self):
        recently_checked = {
            "title": "現方式で確認済みの作品",
            "poster_checked_at": "2026-11-08T12:00:00Z",
            "poster_check_version": 3,
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
            "poster_check_version": 3,
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
        self.assertEqual(len(requests), 2)
        self.assertIn("/movie/85/alternative_titles?", requests[1][0].full_url)
        self.assertIn("country=JP", requests[1][0].full_url)
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
        self.assertEqual(len(requests), 2)
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
        self.assertEqual(len(requests), 1)
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


if __name__ == "__main__":
    unittest.main()
