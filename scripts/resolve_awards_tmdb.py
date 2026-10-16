"""Resolve award identities through the existing approved TMDB API proxy.
No scraping or guessed IDs. Exact title + award/release-year window must be unique.
Run manually: python scripts/resolve_awards_tmdb.py
"""
import concurrent.futures
import datetime
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path
from enrich_award_catalog import normalized

ROOT=Path(__file__).resolve().parents[1]
API='https://backend-one-gray-94.vercel.app/api/movies'

def search(title):
    url=API+'?'+urllib.parse.urlencode({'q':title,'limit':20})
    for attempt in range(2):
        try:
            request=urllib.request.Request(url,headers={'User-Agent':'CinelvaAwardIdentity/1.0'})
            with urllib.request.urlopen(request,timeout=20) as response:
                data=json.load(response)
            return title,data.get('movies',[])+data.get('external',[])
        except Exception:
            if attempt==0:time.sleep(1)
    return title,[]

def choose(row,movies):
    title=normalized(row.get('film_title') or row['title']); year=int(row['year']); matches={}
    for movie in movies:
        mid=movie.get('tmdbId') or movie.get('id'); release=str(movie.get('year') or '')
        if not str(mid).isdigit() or not release.isdigit() or not 0<=year-int(release)<=3:continue
        if title not in {normalized(movie.get(k) or '') for k in ['title','original_title','originalTitle']}:continue
        matches[str(mid)]=movie
    return next(iter(matches.values())) if len(matches)==1 else None

if __name__=='__main__':
    path=ROOT/'data/awards.json';data=json.loads(path.read_text()); rows=data['awards']
    titles=sorted({r.get('film_title') or r['title'] for r in rows if not r.get('tmdb_id')})
    results={}; catalog={str(m['id']):m for m in data.get('catalog',[])}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for title,movies in pool.map(search,titles):
            results[title]=movies
            if len(results)%25==0:print(f'Searched {len(results)}/{len(titles)}',flush=True)
    today=datetime.datetime.now(datetime.timezone.utc).isoformat()
    for row in rows:
        if row.get('tmdb_id'):continue
        movie=choose(row,results.get(row.get('film_title') or row['title'],[]))
        if not movie:continue
        mid=int(movie.get('tmdbId') or movie['id'])
        row.update(tmdb_id=mid,release_year=int(movie['year']),display_title=movie['title'],match_status='resolved',match_method='tmdb_api_exact_title_release_window',identity_source=f'https://www.themoviedb.org/movie/{mid}',identity_checked_at=today)
        catalog[str(mid)]={k:movie[k] for k in ['id','title','original_title','year','poster','score','votes'] if k in movie}
    data['catalog']=list(catalog.values());data['identity_updated_at']=today
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(f"Award IDs resolved: {sum(bool(r.get('tmdb_id')) for r in rows)}/{len(rows)}",flush=True)
