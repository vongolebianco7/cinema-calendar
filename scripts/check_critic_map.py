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

critic = (ROOT / "critic.html").read_text(encoding="utf-8")
for required in [
    "developers.google.com/static/youtube/images/youtube-logos-2x.png",
    "Cinemap独自",
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
