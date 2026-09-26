import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
errors = []

registry = json.loads((ROOT / "data" / "source_registry.json").read_text(encoding="utf-8"))
youtube = next((x for x in registry.get("sources", []) if x.get("id") == "youtube_api"), None)
if not youtube:
    errors.append("youtube_api missing from source_registry.json")
elif youtube.get("mode") != "disabled":
    errors.append("youtube_api must remain disabled until production compliance review and activation")

route = (ROOT / "backend" / "app" / "api" / "critic-videos" / "route.ts").read_text(encoding="utf-8")
for required in ["YOUTUBE_API_KEY", "YOUTUBE_CRITIC_ENABLED", 'process.env.YOUTUBE_CRITIC_ENABLED==="true"', "youtube/v3/search", "Cache-Control", "no-store"]:
    if required not in route:
        errors.append(f"critic-videos route missing safety requirement: {required}")

search = (ROOT / "search.html").read_text(encoding="utf-8")
for required in [
    "developers.google.com/static/youtube/images/youtube-logos-2x.png",
    "Cinemap独自の視点分類",
    "privacy.html",
    "terms.html",
    "https://www.youtube.com/t/terms",
]:
    if required not in search:
        errors.append(f"search.html missing Critic Map disclosure: {required}")

if "videos.sort(" in search:
    errors.append("search.html must not locally reorder YouTube API search results")

# Screening-format recommendation v2 regression gates.
for required in [
    'const FORMAT_ORDER=["standard","imax","dolby_cinema","motion","screenx"]',
    'data/screening_format_evidence.json',
    'function scoreScreeningFormats(',
    'function formatReasonHtml(',
    'function formatSources(',
    '上映方式おすすめの理由',
]:
    if required not in search:
        errors.append(f"search.html missing screening-format v2 requirement: {required}")
if '{name:"Dolby Atmos"' in search:
    errors.append("Dolby Atmos must not be a peer top-level screening format")
if 'sources:e.sources||[]' in search:
    errors.append("screening-format cards must not reuse all evidence sources indiscriminately")

evidence_path = ROOT / "data" / "screening_format_evidence.json"
if not evidence_path.exists():
    errors.append("screening_format_evidence.json is missing")
else:
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    if evidence.get("source_policy") != "official-first; unknown when unverified":
        errors.append("screening format evidence must use official-first / unknown fallback policy")
    if not evidence.get("films"):
        errors.append("screening format evidence has no verified film fixtures")
    for group in [evidence.get("films", {}), evidence.get("title_fixtures", {})]:
        for key, row in group.items():
            for src in row.get("sources", []):
                if not src.get("formats"):
                    errors.append(f"screening evidence source missing format scope: {key} / {src.get('label','source')}")

critic = (ROOT / "critic.html").read_text(encoding="utf-8")
for required in [
    "developers.google.com/static/youtube/images/youtube-logos-2x.png",
    "Cinemap独自",
    "Cinemap独自の絞り込み・分類",
    "privacy.html",
    "terms.html",
    "https://www.youtube.com/t/terms",
    "https://www.youtube.com/",
    "観たのでCritic Mapを開く",
    "同じ視点：",
]:
    if required not in critic:
        errors.append(f"critic.html missing Critic Map requirement: {required}")
if "videos.sort(" in critic:
    errors.append("critic.html must not locally reorder YouTube API search results")
for required in ["function withTimeout(", "data-retry-movie", "読み込みがタイムアウトしました"]:
    if required not in critic:
        errors.append(f"critic.html missing resilient movie-loading requirement: {required}")

privacy = (ROOT / "privacy.html").read_text(encoding="utf-8")
for required in ["YouTube API Services", "https://www.youtube.com/t/terms", "https://policies.google.com/privacy"]:
    if required not in privacy:
        errors.append(f"privacy.html missing: {required}")

terms = (ROOT / "terms.html").read_text(encoding="utf-8")
if "https://www.youtube.com/t/terms" not in terms:
    errors.append("terms.html missing YouTube Terms link")

if errors:
    print("Critic Map compliance check failed:")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Critic Map compliance check passed.")
print("YouTube critic integration remains gated and disabled by default.")
