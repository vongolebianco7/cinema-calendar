import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
errors = []

def text(path):
    return (ROOT / path).read_text(encoding="utf-8")

# Morning Ten Film Festival calendar integration.
special = json.loads(text("data/special_screenings.json"))
rows = special.get("screenings", [])
if not rows:
    errors.append("special_screenings.json has no screenings")
if not any(x.get("special_screening") == "asa10" for x in rows):
    errors.append("Morning Ten Film Festival marker missing")
if "午前十時の映画祭" not in text("index.html"):
    errors.append("Calendar does not expose Morning Ten Film Festival")
for required in ["通常公開", "リバイバル上映", "午前十時の映画祭"]:
    if required not in text("index.html"):
        errors.append(f"Missing theatrical legend: {required}")

# Premium format -> theater screen path.
formats = json.loads(text("data/theater_formats.json")).get("screens", [])
for required in ["IMAX", "Dolby Cinema", "Dolby Atmos", "4DX", "MX4D", "SCREENX"]:
    if not any(x.get("format") == required for x in formats):
        errors.append(f"No verified format entries for {required}")
    if f"format={required.replace(' ', '%20')}" not in text("experience.html"):
        errors.append(f"Experience page does not link to {required}")

# Concierge is now a discovery mode, not a global nav destination.
discover = text("discover.html")
for required in ["条件から探す", "コンシェルジュに相談", 'id="conciergeMode"', "/api/agent"]:
    if required not in discover:
        errors.append(f"Discover concierge integration missing: {required}")
for page in ["index.html","search.html","rankings.html","theaters.html","experience.html","my-cinemap.html","critic.html"]:
    if '<a href="agent.html">映画コンシェルジュ</a>' in text(page):
        errors.append(f"Standalone concierge nav remains in {page}")

if errors:
    print("Discovery/UI integration gate failed:")
    for e in errors:
        print("-", e)
    sys.exit(1)
print("Discovery/UI integration gate passed.")
