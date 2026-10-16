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
    for movie in catalog:
        mid = movie.get('tmdbId') or movie.get('id')
        if not str(mid).isdigit():
            continue
        year = movie.get('year')
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
    data['schema_version'] = 2
    data['coverage'] = data.get('coverage', {})
    data['matching_note'] = 'ID優先。既存TMDBカタログの作品名・公開年が一意に一致する場合だけIDを補完。未照合・同名異作品は推測しない。年代別の全件性は未確認。'
    return data

if __name__ == '__main__':
    path = ROOT / 'data/awards.json'
    data = json.loads(path.read_text())
    movies = json.loads((ROOT / 'data/movies.json').read_text())['movies']
    directors = json.loads((ROOT / 'data/directors.json').read_text())['directors']
    works = [w for d in directors.values() for w in d.get('works', [])]
    data = enrich(data, works + movies)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f"Awards: {len(data['awards'])}; resolved IDs: {sum(bool(a.get('tmdb_id')) for a in data['awards'])}; coverage remains partial")
