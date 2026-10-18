"""Build a compact, sourced director catalog for mobile My Cinelva."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = json.loads((ROOT / "data/directors.json").read_text())
result = {"generated_at": source.get("generated_at"), "directors": {}}
for key, director in source.get("directors", {}).items():
    slim = {k: director.get(k) for k in (
        "id", "name", "nameJa", "original_name", "also_known_as", "profile_path",
        "birthday", "deathday", "place_of_birth", "biography_ja", "coverage", "source_url"
    ) if director.get(k) is not None}
    slim["works"] = []
    for work in director.get("works", []):
        slim["works"].append({k: work[k] for k in (
            "id", "title", "original_title", "year", "date", "runtime", "poster",
            "director", "director_id", "job", "is_director", "source",
            "source_url", "genre_ids", "genres"
        ) if k in work})
    result["directors"][key] = slim
out = ROOT / "data/directors-mobile.json"
out.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n")
print(f"Wrote {len(result['directors'])} directors to {out}, {out.stat().st_size} bytes")
