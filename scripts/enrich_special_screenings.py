import os, json, urllib.request, urllib.parse, re, difflib, time

KEY = os.environ["TMDB_API_KEY"]
BASE = "https://api.themoviedb.org/3"

ALIASES = {
    "GHOST IN THE SHELL / 攻殻機動隊": "Ghost in the Shell",
    "許されざる者（1960年版）": "The Unforgiven",
    "許されざる者（1992年版）": "Unforgiven",
    "ゴッドファーザー PARTⅡ": "The Godfather Part II",
    "カプリコン・1": "Capricorn One",
    "A.I.": "A.I. Artificial Intelligence",
    "レッド・サン": "Red Sun",
    "用心棒": "Yojimbo",
    "椿三十郎": "Sanjuro",
    "恋人たちの予感": "When Harry Met Sally...",
    "ラブ・アクチュアリー": "Love Actually",
    "ガス人間第1号": "The Human Vapor",
    "オペラ座の怪人": "The Phantom of the Opera",
}

def request(path, params):
    q = dict(params)
    q["api_key"] = KEY
    q.setdefault("language", "ja-JP")
    req = urllib.request.Request(
        BASE + path + "?" + urllib.parse.urlencode(q),
        headers={"User-Agent": "Cinemap/1.0"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def norm(s):
    s = (s or "").lower().normalize("NFKC") if hasattr(str, "normalize") else (s or "").lower()
    return re.sub(r"[\s　・･:：!！?？「」『』【】\[\]()（）/／\-―ー\.…]+", "", s)

def clean_title(title):
    year = None
    m = re.search(r"（(19|20)\d{2}年版）", title or "")
    if m:
        year = re.search(r"\d{4}", m.group(0)).group(0)
    cleaned = re.sub(r"（(?:19|20)\d{2}年版）", "", title or "").strip()
    return cleaned, year

def choose(title, results):
    cleaned, year = clean_title(title)
    queries = [title, ALIASES.get(title), cleaned]
    needles = [norm(x) for x in queries if x]
    scored = []
    for rank, x in enumerate(results[:12]):
        names = [x.get("title"), x.get("original_title")]
        cands = [norm(n) for n in names if n]
        best = 0.0
        for a in needles:
            for b in cands:
                if not a or not b:
                    continue
                if a == b:
                    best = max(best, 1.0)
                elif min(len(a), len(b)) >= 4 and (a in b or b in a):
                    best = max(best, 0.92)
                else:
                    best = max(best, difflib.SequenceMatcher(None, a, b).ratio())
        release = str(x.get("release_date") or "")
        if year and release.startswith(year):
            best += 0.20
        best -= rank * 0.005
        scored.append((best, x))
    scored.sort(key=lambda z: z[0], reverse=True)
    return scored[0][1] if scored and scored[0][0] >= 0.76 else None

with open("data/special_screenings.json", encoding="utf-8") as f:
    data = json.load(f)

cache = {}
updated = 0
for row in data.get("screenings", []):
    if row.get("poster") and row.get("id"):
        continue
    title = row.get("title") or ""
    if title in cache:
        hit = cache[title]
    else:
        cleaned, year = clean_title(title)
        query = ALIASES.get(title) or cleaned or title
        params = {"query": query, "region": "JP", "include_adult": "false"}
        if year:
            params["year"] = year
        try:
            results = request("/search/movie", params).get("results", [])
            # Retry without year because Japanese reissue titles often differ from the original TMDB year.
            if not results and year:
                params.pop("year", None)
                results = request("/search/movie", params).get("results", [])
            hit = choose(title, results)
        except Exception as e:
            print("special screening lookup failed", title, e)
            hit = None
        cache[title] = hit
        time.sleep(0.12)

    if not hit:
        continue
    poster_path = hit.get("poster_path")
    if hit.get("id"):
        row["id"] = hit["id"]
        row["tmdb"] = "https://www.themoviedb.org/movie/" + str(hit["id"])
    if poster_path:
        row["poster"] = "https://image.tmdb.org/t/p/w500" + poster_path
    row["original_title"] = hit.get("original_title") or row.get("original_title")
    row["score"] = hit.get("vote_average", row.get("score", 0))
    row["votes"] = hit.get("vote_count", row.get("votes", 0))
    updated += 1

with open("data/special_screenings.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("special screenings enriched:", updated, "/", len(data.get("screenings", [])))
