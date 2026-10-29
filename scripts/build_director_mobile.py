"""Build a compact, sourced director catalog for mobile My Cinelva."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
raw = (ROOT / "data/directors.json").read_text()
decoder = json.JSONDecoder()
source, end = decoder.raw_decode(raw.lstrip())
if not isinstance(source, dict) or not source.get("directors"):
    raise ValueError("Director catalog missing or empty")
if raw.lstrip()[end:].strip():
    # Repair trailing concurrent-write debris without changing sourced credits.
    print("Repairing trailing invalid content after director JSON document")
    (ROOT / "data/directors.json").write_text(
        json.dumps(source, ensure_ascii=False, indent=2) + chr(10)
    )
result = {"generated_at": source.get("generated_at"), "directors": {}}
for key, director in source.get("directors", {}).items():
    slim = {k: director.get(k) for k in (
        "id", "name", "nameJa", "name_status", "name_source_url", "original_name", "also_known_as", "profile_path",
        "birthday", "deathday", "place_of_birth", "biography_ja", "coverage", "source_url",
        "credits_source_url", "checked_at"
    ) if director.get(k) is not None}
    slim["works"] = []
    for work in director.get("works", []):
        slim["works"].append({k: work[k] for k in (
            "id", "title", "original_title", "year", "date", "runtime", "poster",
            "director", "director_id", "job", "is_director", "source",
            "source_url", "type", "media_type", "mediaType", "format", "work_type", "workType",
            "genre_ids", "genres", "genre_names", "is_tv", "isTV", "is_episode", "isEpisode",
            "is_series", "isSeries", "number_of_episodes", "number_of_seasons", "first_air_date",
            "episode_number", "season_number", "release_dates",
            "theatrical_release_verified", "theatrical_release_source"
        ) if k in work})
    result["directors"][key] = slim
out = ROOT / "data/directors-mobile.json"
out.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n")
print(f"Wrote {len(result['directors'])} directors to {out}, {out.stat().st_size} bytes")
