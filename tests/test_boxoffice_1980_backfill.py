from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]

class BoxOffice1980BackfillTests(unittest.TestCase):
    def test_yearly_boxoffice_reaches_1980_and_preserves_metric(self):
        data = json.loads((ROOT / "data/boxoffice.json").read_text(encoding="utf-8"))
        years = data.get("by_year", {})
        self.assertIn("1980", years)
        self.assertIn("1999", years)
        self.assertIn("2000", years)
        self.assertIn("2019", years)
        self.assertGreaterEqual(len(years["1980"]), 10)
        self.assertGreaterEqual(len(years["2019"]), 10)
        self.assertTrue(all(x.get("region") in {"邦画", "洋画"} for x in years["1980"]))
        self.assertTrue(all(x.get("metric") == "配給収入" for x in years["1980"]))
        self.assertTrue(all(x.get("metric") == "興行収入" for x in years["2000"]))


    def test_verified_1980_boxoffice_titles_have_canonical_posters(self):
        data = json.loads((ROOT / "data/boxoffice.json").read_text(encoding="utf-8"))
        rows = {row["title"]: row for row in data["by_year"]["1980"]}
        expected = {
            "スター・ウォーズ 帝国の逆襲": (1891, "The Empire Strikes Back", "1980-05-20"),
            "二百三高地": (315559, "二百三高地", "1980-08-02"),
            "ヤマトよ永遠に": (175066, "ヤマトよ永遠に", "1980-08-01"),
            "天平の甍": (365455, "天平の甍", "1980-01-26"),
            "マッドマックス": (9659, "Mad Max", "1979-04-12"),
            "動乱": (392498, "動乱", "1980-01-15"),
            "青い珊瑚礁": (5689, "The Blue Lagoon", "1980-07-05"),
            "バトルクリーク・ブロー": (19267, "The Big Brawl", "1980-08-18"),
            "カリギュラ": (9453, "Caligola", "1980-10-18"),
        }
        for title, (tmdb_id, original_title, release_date) in expected.items():
            row = rows[title]
            self.assertEqual(row.get("tmdbId"), tmdb_id)
            self.assertEqual(row.get("original_title"), original_title)
            self.assertEqual(row.get("tmdb_release_date"), release_date)
            self.assertTrue(row.get("poster", "").startswith("https://image.tmdb.org/t/p/"))
            self.assertEqual(row.get("identity_source"), f"https://www.themoviedb.org/movie/{tmdb_id}")
            self.assertTrue(row.get("identity_checked_at"))
            self.assertTrue(row.get("identity_match"))

    def test_ambiguous_1980_entries_are_not_assigned_an_unverified_poster(self):
        data = json.loads((ROOT / "data/boxoffice.json").read_text(encoding="utf-8"))
        rows = {row["title"]: row for row in data["by_year"]["1980"]}
        unresolved = [
            "ドラえもん のび太の恐竜 / モスラ対ゴジラ",
            "男はつらいよ 寅次郎ハイビスカスの花 / 思えば遠くへ来たもんだ",
            "男はつらいよ 寅次郎春の夢 / 神様のくれた赤ん坊",
        ]
        for title in unresolved:
            self.assertFalse(rows[title].get("tmdbId"))
            self.assertFalse(rows[title].get("poster"))

    def test_verified_2024_boxoffice_titles_have_canonical_posters(self):
        data = json.loads((ROOT / "data/boxoffice.json").read_text(encoding="utf-8"))
        rows = {row["title"]: row for row in data["by_year"]["2024"]}
        expected = {
            "名探偵コナン 100万ドルの五稜星（みちしるべ）": (1209217, "2024-04-12"),
            "劇場版 SPY×FAMILY CODE: White": (1062807, "2023-12-22"),
            "インサイド・ヘッド2": (1022789, "2024-06-11"),
            "あの花が咲く丘で、君とまた出会えたら。": (1153325, "2023-12-08"),
            "怪盗グルーのミニオン超変身": (519182, "2024-06-20"),
            "映画ドラえもん のび太の地球交響楽": (1148677, "2024-03-01"),
            "僕のヒーローアカデミア THE MOVIE ユアネクスト": (1159311, "2024-08-02"),
            "ゴジラxコング 新たなる帝国": (823464, "2024-03-27"),
            "ヴェノム：ザ・ラストダンス": (912649, "2024-10-22"),
            "ジョーカー：フォリ・ア・ドゥ": (889737, "2024-10-01"),
        }
        for title, (tmdb_id, release_date) in expected.items():
            row = rows[title]
            self.assertEqual(row.get("tmdbId"), tmdb_id)
            self.assertEqual(row.get("tmdb_release_date"), release_date)
            self.assertTrue(row.get("poster", "").startswith("https://image.tmdb.org/t/p/w500/"))
            self.assertEqual(row.get("identity_source"), f"https://www.themoviedb.org/movie/{tmdb_id}")
            self.assertTrue(row.get("identity_match"))

    def test_verified_2024_title_uses_exact_match_poster(self):
        data = json.loads((ROOT / "data/boxoffice.json").read_text(encoding="utf-8"))
        row = next(x for x in data["by_year"]["2024"] if x["title"] == "映画クレヨンしんちゃん オラたちの恐竜日記")
        self.assertEqual(row.get("tmdbId"), 1221404)
        self.assertTrue(row.get("poster", "").startswith("https://image.tmdb.org/t/p/w500/"))
        self.assertEqual(row.get("identity_source"), "https://www.themoviedb.org/movie/1221404")
        self.assertEqual(row.get("identity_match"), "exact_tmdb_alternative_title_and_release_year_window")
    def test_ranking_ui_labels_pre_2000_measure_correctly(self):
        text = (ROOT / "rankings.html").read_text(encoding="utf-8")
        self.assertIn('m.metric||"興行収入"', text)
        self.assertIn('1999年以前は配給収入', text)
        self.assertIn('Number(boxEra)<2000', text)

if __name__ == "__main__":
    unittest.main()
