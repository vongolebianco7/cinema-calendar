"""Resolve curated awards against existing TMDB catalog without external requests.
Never choose between same-title works; retain source titles and unresolved identities.
"""
import hashlib
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def normalized(value):
    return ''.join(c for c in unicodedata.normalize('NFKC', str(value)).casefold() if c.isalnum())

def enrich(data, catalog):
    index = {}
    by_id = {}
    for movie in catalog:
        mid = movie.get('tmdbId') or movie.get('tmdb_id') or movie.get('id')
        if not str(mid).isdigit():
            continue
        year = movie.get('year') or str(movie.get('release_date') or movie.get('date') or '')[:4]
        canonical = {**by_id.get(str(mid), {}), **movie, 'id': int(mid)}
        # Empty metadata must not erase verified artwork already found for this ID.
        for field in ['poster', 'poster_path', 'posterUrl', 'poster_url']:
            if not movie.get(field) and by_id.get(str(mid), {}).get(field):
                canonical[field] = by_id[str(mid)][field]
        by_id[str(mid)] = canonical
        for name in [movie.get('title'), movie.get('original_title'), movie.get('originalTitle')]:
            if name:
                index.setdefault(normalized(name), {})[str(mid)] = {**movie, 'id': int(mid), 'year': int(year) if str(year).isdigit() else None}
    for row in data['awards']:
        title = row.get('film_title') or row['title']
        if ' — ' in title and any(word in row['category'] for word in ['男優', '女優', '監督', '脚本', '作曲']):
            title, recipient = title.rsplit(' — ', 1)
            row['recipient'] = recipient
        row['film_title'] = title
        key = f"{row['organization']}|{row['year']}|{normalized(title)}"
        row['work_id'] = row.get('work_id') or 'award-work:' + hashlib.sha256(key.encode()).hexdigest()[:20]
        if row.get('tmdb_id'):
            continue
        candidates = [m for m in index.get(normalized(title), {}).values() if m['year'] and 0 <= int(row['year']) - m['year'] <= 2]
        if len(candidates) == 1:
            movie = candidates[0]
            row.update(tmdb_id=movie['id'], release_year=movie['year'], match_status='resolved', match_method='unique_catalog_title_and_release_year')
        else:
            row['match_status'] = 'ambiguous' if len(candidates) > 1 else 'unresolved'
    catalog = {str(m.get('tmdbId') or m.get('tmdb_id') or m.get('id')): m for m in data.get('catalog', [])}
    for row in data['awards']:
        mid = str(row.get('tmdb_id') or '')
        movie = by_id.get(mid)
        if not movie:
            continue
        artwork = next((movie.get(k) for k in ['poster', 'poster_path', 'posterUrl', 'poster_url'] if movie.get(k)), '')
        if artwork.startswith('/'):
            artwork = 'https://image.tmdb.org/t/p/w342' + artwork
        if artwork.startswith('https://'):
            row['poster'] = artwork
            catalog[mid] = {**{k: movie[k] for k in ['title', 'original_title', 'year', 'date', 'score', 'votes'] if k in movie}, 'id': int(mid), 'poster': artwork}
        row.setdefault('display_title', movie.get('title', row['film_title']))
        release = movie.get('year') or str(movie.get('release_date') or movie.get('date') or '')[:4]
        if str(release).isdigit():
            row.setdefault('release_year', int(release))
    data['catalog'] = list(catalog.values())
    data['schema_version'] = 2
    data['coverage'] = data.get('coverage', {})
    data['matching_note'] = 'ID優先。既存TMDBカタログの作品名・公開年が一意に一致する場合だけIDを補完。未照合・同名異作品は推測しない。年代別の全件性は未確認。'
    return data


def enrich_boxoffice(data, catalog):
    """Reuse exact movie metadata; never change sourced amounts or rankings."""
    by_id, names = {}, {}
    for movie in catalog:
        mid = movie.get('tmdbId') or movie.get('tmdb_id') or movie.get('id')
        if not str(mid).isdigit():
            continue
        artwork = next((movie.get(k) for k in ['poster', 'poster_path', 'posterUrl', 'poster_url'] if movie.get(k)), '')
        if artwork.startswith('/'):
            artwork = 'https://image.tmdb.org/t/p/w342' + artwork
        item = {**movie, 'tmdbId': int(mid), 'poster': artwork}
        if artwork.startswith('https://'):
            by_id[str(mid)] = item
        for title in [movie.get('title'), movie.get('original_title'), movie.get('originalTitle')]:
            if title:
                names.setdefault(normalized(title), {})[str(mid)] = item
    rows_with_year = [(r, r.get('year')) for r in data.get('all_time', [])]
    rows_with_year += [(r, r.get('year') or year) for year, rows in data.get('by_year', {}).items() for r in rows]
    for row, year in rows_with_year:
        mid = row.get('tmdbId') or row.get('tmdb_id')
        movie = by_id.get(str(mid)) if mid else None
        if movie and str(year).isdigit():
            release = str(movie.get('year') or movie.get('date') or movie.get('release_date') or '')[:4]
            # A verified old film ID can be a stale same-title remake match.
            # Correct only when the sourced market year has one exact-title,
            # exact-release-year candidate and the old ID predates it by >3 years.
            exact = [m for m in names.get(normalized(row.get('title', '')), {}).values()
                     if str(m.get('year') or m.get('date') or m.get('release_date') or '')[:4] == str(year)]
            if release.isdigit() and int(year) - int(release) > 3 and len(exact) == 1:
                movie = by_id.get(str(exact[0]['tmdbId'])) or movie
        if not mid:
            candidates = list(names.get(normalized(row.get('title', '')), {}).values())
            # A same-title remake anywhere in the catalog keeps identity unresolved.
            if len(candidates) == 1:
                candidate = candidates[0]
                release = str(candidate.get('year') or candidate.get('date') or candidate.get('release_date') or '')[:4]
                if release.isdigit() and str(year).isdigit() and 0 <= int(year) - int(release) <= 2:
                    movie = by_id.get(str(candidate['tmdbId']))
        if movie:
            row.update(tmdbId=movie['tmdbId'], poster=movie['poster'])
    return data

if __name__ == '__main__':
    path = ROOT / 'data/awards.json'
    data = json.loads(path.read_text())
    movies = json.loads((ROOT / 'data/movies.json').read_text())['movies']
    directors = json.loads((ROOT / 'data/directors.json').read_text())['directors']
    works = [w for d in directors.values() for w in d.get('works', [])]
    def collect(value):
        if isinstance(value, list):
            return [movie for item in value for movie in collect(item)]
        if isinstance(value, dict):
            if value.get('title') and (value.get('tmdbId') or value.get('id')):
                return [value]
            return [movie for item in value.values() for movie in collect(item)]
        return []
    ranked = []
    for name in ['rankings.json', 'rankings_year.json']:
        ranked.extend(collect(json.loads((ROOT / 'data' / name).read_text())))
    local = works + ranked + movies + data.get('catalog', [])
    data = enrich(data, local)
    box_path = ROOT / 'data/boxoffice.json'
    box = enrich_boxoffice(json.loads(box_path.read_text()), local)
    box_path.write_text(json.dumps(box, ensure_ascii=False, separators=(',', ':')))
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f"Awards: {len(data['awards'])}; resolved IDs: {sum(bool(a.get('tmdb_id')) for a in data['awards'])}; coverage remains partial")
