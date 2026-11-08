"""Guard against repeated calendar entries backed by duplicate TMDB records."""
import json
import unittest
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def identity_fingerprint(row):
    """Use independent film metadata, not title or TMDB ID alone."""
    normalize = lambda value: " ".join(str(value or "").casefold().split())
    return (
        normalize(row.get("title")),
        row.get("date"),
        normalize(row.get("director")),
        row.get("runtime"),
        normalize(row.get("overview")),
        tuple(normalize(name) for name in row.get("cast", [])),
    )


class TheatricalDuplicateIdentityTests(unittest.TestCase):
    def test_distinct_tmdb_ids_are_not_collapsed_by_title_alone(self):
        first = {
            "id": 100,
            "title": "Same title",
            "date": "2026-11-13",
            "director": "Director A",
            "runtime": 100,
            "overview": "A different story.",
            "cast": ["Actor A"],
        }
        second = dict(first, id=200, overview="Another story.")
        self.assertEqual(first["title"], second["title"])
        self.assertNotEqual(identity_fingerprint(first), identity_fingerprint(second))

    def test_theatrical_source_has_no_identical_film_profiles_under_multiple_ids(self):
        source = json.loads((ROOT / "data/theatrical.json").read_text(encoding="utf-8"))
        grouped = defaultdict(list)
        for row in source.get("movies", []):
            if row.get("event") == "theatrical":
                grouped[identity_fingerprint(row)].append(row)

        duplicates = [rows for rows in grouped.values() if len(rows) > 1]
        self.assertEqual(
            duplicates,
            [],
            "Exact title/date/director/runtime/overview/cast duplicates need manual TMDB-ID review",
        )

    def test_calendar_output_does_not_repeat_identical_theatrical_films(self):
        calendar = json.loads((ROOT / "data/movies.json").read_text(encoding="utf-8"))
        grouped = defaultdict(list)
        for row in calendar.get("movies", []):
            if row.get("event") == "theatrical":
                grouped[identity_fingerprint(row)].append(row)

        duplicates = [rows for rows in grouped.values() if len(rows) > 1]
        self.assertEqual(duplicates, [], "Calendar output repeats an identical theatrical film")


if __name__ == "__main__":
    unittest.main()
