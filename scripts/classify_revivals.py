import os, json, urllib.request, urllib.parse, datetime, time

KEY = os.environ["TMDB_API_KEY"]
BASE = "https://api.themoviedb.org/3"
TODAY = datetime.date.today()
WINDOW_START = TODAY - datetime.timedelta(days=75)
WINDOW_END = TODAY + datetime.timedelta(days=180)
MAX_REQUESTS = 140


def get_movie(mid):
    params = urllib.parse.urlencode({
        "api_key": KEY,
        "language": "ja-JP",
        "append_to_response": "release_dates",
    })
    req = urllib.request.Request(
        f"{BASE}/movie/{mid}?{params}",
        headers={"User-Agent": "Cinemap/1.0"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def jp_theatrical_dates(detail):
    out = []
    for region in detail.get("release_dates", {}).get("results", []):
        if region.get("iso_3166_1") != "JP":
            continue
        for row in region.get("release_dates", []):
            if row.get("type") not in (2, 3) or not row.get("release_date"):
                continue
            try:
                out.append(datetime.date.fromisoformat(row["release_date"][:10]))
            except ValueError:
                pass
    return sorted(set(out))


with open("data/theatrical.json", encoding="utf-8") as f:
    data = json.load(f)

movies = data.get("movies", [])
candidates = []
for movie in movies:
    if not movie.get("id") or not movie.get("date"):
        continue
    try:
        current = datetime.date.fromisoformat(movie["date"][:10])
    except ValueError:
        continue
    if WINDOW_START <= current <= WINDOW_END:
        candidates.append((abs((current - TODAY).days), current, movie))

candidates.sort(key=lambda x: (x[0], x[1], str(x[2].get("title", ""))))
changed = 0
checked = 0

for _, current, movie in candidates[:MAX_REQUESTS]:
    try:
        detail = get_movie(movie["id"])
        checked += 1
    except Exception as e:
        print("revival lookup failed", movie.get("id"), movie.get("title"), e)
        continue

    dates = jp_theatrical_dates(detail)
    prior = [d for d in dates if d <= current - datetime.timedelta(days=365)]
    if prior:
        if movie.get("service") != "リバイバル上映" or movie.get("revival") is not True:
            changed += 1
        movie["service"] = "リバイバル上映"
        movie["revival"] = True
        movie["original_jp_release_date"] = prior[0].isoformat()
        movie["revival_evidence"] = "TMDB JP theatrical release history"
    elif movie.get("revival") is True and movie.get("service") == "リバイバル上映":
        # Preserve previously confirmed classifications instead of erasing them
        # when TMDB temporarily returns incomplete historical release metadata.
        pass

    time.sleep(0.12)

with open("data/theatrical.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("revival classification checked:", checked, "changed:", changed)
