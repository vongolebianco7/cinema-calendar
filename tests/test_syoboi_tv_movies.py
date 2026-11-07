import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock
from zoneinfo import ZoneInfo

from scripts import update_syoboi_tv_movies
from scripts.update_syoboi_tv_movies import FeedResponse, merge_tv_snapshot, normalize_feed, parse_title_metadata, run


JST = ZoneInfo("Asia/Tokyo")
NOW = dt.datetime(2026, 11, 1, 9, 0, tzinfo=JST)


def epoch(value):
    return int(value.astimezone(dt.timezone.utc).timestamp())


class SyoboiMovieBroadcastTests(unittest.TestCase):
    def test_feed_accepts_nested_rss_item_shapes_and_rejects_malformed_collections(self):
        row = {"Cat": 8, "Title": "映画", "TID": 1}
        self.assertEqual(update_syoboi_tv_movies._as_programs({"rss": {"channel": {"item": [row]}}}), [row])
        self.assertEqual(update_syoboi_tv_movies._as_programs({"items": {"item": [row]}}), [row])
        with self.assertRaisesRegex(ValueError, "non-object"):
            update_syoboi_tv_movies._as_programs(["not a program"])

    def test_only_future_movie_category_broadcasts_are_imported_and_deduplicated(self):
        feed = [
            {"Cat": 8, "Title": "未来の映画", "TID": 1, "PID": 10, "ChName": "BS局", "StTimeU": epoch(NOW + dt.timedelta(days=1))},
            {"Cat": "8", "Title": "未来の映画", "TID": 1, "PID": 11, "ChName": "BS局", "StTimeU": epoch(NOW + dt.timedelta(days=1))},
            {"Cat": 1, "Title": "テレビアニメ", "TID": 2, "PID": 12, "ChName": "地上波", "StTimeU": epoch(NOW + dt.timedelta(days=1))},
            {"Cat": 8, "Title": "放送済み映画", "TID": 3, "PID": 13, "ChName": "BS局", "StTimeU": epoch(NOW - dt.timedelta(days=1))},
            {"Cat": 8, "Title": "チャンネル不明", "TID": 4, "PID": 14, "StTimeU": epoch(NOW + dt.timedelta(days=1))},
        ]
        rows = normalize_feed(feed, now=NOW, title_metadata={"1": {"TitleEN": "Future Film", "FirstYear": "2020"}})
        self.assertEqual(len(rows), 1)
        self.assertEqual((rows[0]["title"], rows[0]["date"], rows[0]["service"]), ("未来の映画", "2026-11-02", "BS局"))
        self.assertEqual(rows[0]["source_id"], "syoboi_calendar")
        self.assertEqual(rows[0]["collection_method"], "automated_public_api")
        self.assertEqual((rows[0]["original_title"], rows[0]["release_year"]), ("Future Film", 2020))

    def test_streaming_only_channels_are_not_mislabeled_as_tv_broadcasts(self):
        channels = ["ABEMA特設その他", "ABEMA", "アニメLIVE2", "アニメ24", "アニメSPECIAL", "なつかしアニメ"]
        channels += ["NHK総合", "BS11", "TOKYO MX", "AT-X"]
        feed = [
            {"Cat": 8, "Title": f"映画{i}", "TID": i + 1, "PID": i + 100,
             "ChName": channel, "StTimeU": epoch(NOW + dt.timedelta(days=1))}
            for i, channel in enumerate(channels)
        ]
        rows = normalize_feed(feed, now=NOW)
        self.assertEqual([row["service"] for row in rows], channels[-4:])
        self.assertTrue(all(row["event"] == "tv" for row in rows))

    def test_documented_title_lookup_metadata_is_parsed_without_inventing_years(self):
        xml = """<ResultSet><Result><Code>200</Code></Result><TitleLookup><Title><TID>42</TID><Title>作品</Title><TitleEN>Film</TitleEN><FirstYear>2021</FirstYear><Cat>8</Cat></Title></TitleLookup></ResultSet>"""
        self.assertEqual(parse_title_metadata(xml), {"42": {"TID": "42", "Title": "作品", "TitleEN": "Film", "FirstYear": "2021", "Cat": "8"}})
        with self.assertRaisesRegex(ValueError, "result code 404"):
            parse_title_metadata("<ResultSet><Result><Code>404</Code></Result></ResultSet>")

    def test_updates_auto_rows_and_preserves_curated_records_and_curated_timestamp(self):
        manual = {"title": "公式確認分", "date": "2026-11-05", "service": "地上波", "source_url": "https://broadcaster.example/"}
        old_auto = {"title": "古い自動行", "date": "2026-11-03", "service": "BS局", "source_id": "syoboi_calendar"}
        incoming = {"title": "新しい自動行", "date": "2026-11-06", "service": "BS局", "source_id": "syoboi_calendar", "source_url": "https://cal.syoboi.jp/rss2.php?days=7&alt=json"}
        original = {"generated_at": "2026-10-22", "movies": [manual, old_auto]}
        updated = merge_tv_snapshot(original, [incoming], generated_at="2026-11-05T00:00:00Z")
        self.assertEqual(updated["generated_at"], "2026-10-22")
        self.assertEqual(updated["movies"], [manual, incoming])
        self.assertEqual(updated["automated_movies"], [incoming])
        self.assertEqual(updated["automation_generated_at"], "2026-11-05T00:00:00Z")

    def test_rescheduled_broadcast_retains_only_verified_artwork_for_the_same_film(self):
        previous = {
            "title": "作品", "source_id": "syoboi_calendar", "source_title_id": "12",
            "source_program_id": "100", "release_year": 2020, "date": "2026-11-02",
            "time": "18:00", "service": "BS局", "id": 123,
            "tmdb": "https://www.themoviedb.org/movie/123",
            "poster": "https://image.tmdb.org/t/p/w500/example.jpg",
        }
        moved = {
            "title": "作品", "source_id": "syoboi_calendar", "source_title_id": "12",
            "source_program_id": "101", "release_year": 2020, "date": "2026-11-03",
            "time": "21:00", "service": "BS局",
        }
        remake = {**moved, "release_year": 2025, "time": "23:00"}
        result = merge_tv_snapshot({"movies": [previous]}, [moved, remake])
        self.assertEqual(result["automated_movies"], [
            {**moved, "id": previous["id"], "tmdb": previous["tmdb"], "poster": previous["poster"]},
            remake,
        ])
        self.assertNotIn("poster", moved)
        conflicting = {**previous, "id": 456, "tmdb": "https://www.themoviedb.org/movie/456"}
        ambiguous = merge_tv_snapshot({"movies": [previous, conflicting]}, [moved])
        self.assertEqual(ambiguous["automated_movies"], [moved])

    def test_normalization_preserves_same_channel_repeat_airings(self):
        program = {"Cat": 8, "Title": "映画", "TID": 1, "PID": 10, "ChName": "BS局"}
        first = {**program, "StTimeU": epoch(NOW + dt.timedelta(hours=1))}
        repeat = {**program, "PID": 11, "StTimeU": epoch(NOW + dt.timedelta(hours=3))}
        self.assertEqual([row["time"] for row in normalize_feed([first, repeat], now=NOW)], ["10:00", "12:00"])

    def test_empty_feed_refuses_to_erase_last_good_snapshot(self):
        with self.assertRaisesRegex(ValueError, "last good snapshot"):
            merge_tv_snapshot({"movies": [{"title": "saved"}]}, [])

    def test_valid_schedule_without_movie_broadcasts_clears_only_old_auto_rows(self):
        manual = {"title": "手動分", "date": "2026-11-05", "service": "地上波"}
        old_auto = {"title": "終了した自動分", "date": "2026-10-30", "service": "BS局", "source_id": "syoboi_calendar"}
        updated = merge_tv_snapshot({"movies": [manual, old_auto]}, [], allow_empty=True)
        self.assertEqual(updated["movies"], [manual])
        self.assertEqual(updated["automated_movies"], [])

    def test_network_failure_keeps_existing_file_byte_for_byte(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "tv.json"
            before = '{"generated_at":"2026-10-22","movies":[{"title":"saved"}]}\n'
            path.write_text(before, encoding="utf-8")
            self.assertFalse(run(path, fetcher=mock.Mock(side_effect=TimeoutError("offline")), now=NOW))
            self.assertEqual(path.read_text(encoding="utf-8"), before)

    def test_default_run_uses_conditional_feed_fetch_with_current_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "tv.json"
            existing = {"movies": [{"title": "cached"}], "source_etag": "etag-1"}
            path.write_text(json.dumps(existing), encoding="utf-8")
            with mock.patch.object(update_syoboi_tv_movies, "fetch_feed", return_value=FeedResponse(None, {})) as fetch:
                self.assertTrue(run(path, now=NOW))
            self.assertEqual(fetch.call_args.args[0]["source_etag"], "etag-1")

    def test_not_modified_response_reuses_rows_and_refreshes_only_check_time(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "tv.json"
            before = {"generated_at": "2026-10-22", "movies": [{"title": "cached"}], "automation_generated_at": "2026-10-30T00:00:00Z"}
            path.write_text(json.dumps(before), encoding="utf-8")
            self.assertTrue(run(path, fetcher=lambda: FeedResponse(None, {}), now=NOW))
            after = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(after["movies"], before["movies"])
            self.assertEqual(after["automation_generated_at"], before["automation_generated_at"])
            self.assertIsNotNone(after["automation_checked_at"])

    def test_registry_declares_limited_public_api_coverage_and_source_gate_approval(self):
        root = Path(__file__).resolve().parents[1]
        external = json.loads((root / "quality" / "external-data-registry.json").read_text(encoding="utf-8"))
        category = next(row for row in external["categories"] if row["id"] == "anime-film-tv-broadcasts")
        self.assertEqual(category["status"], "automated")
        self.assertIn("全国の全局", category["coverage"])
        registry = json.loads((root / "data" / "source_registry.json").read_text(encoding="utf-8"))
        source = next(row for row in registry["sources"] if row["id"] == "syoboi_calendar")
        self.assertEqual(source["mode"], "approved")
        self.assertIn("HTML", " ".join(source["requirements"]))


if __name__ == "__main__":
    unittest.main()
