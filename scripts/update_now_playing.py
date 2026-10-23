"""Publish a complete JP TMDB now-playing observation; never scrape cinemas."""
import datetime as dt
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
MAX_PAGES = 20
SOURCE = {'id':'tmdb','endpoint':'/movie/now_playing','url':'https://developer.themoviedb.org/reference/movie-now-playing-list'}


def ensure_approved(registry):
    if not any(s.get('id')=='tmdb' and s.get('mode')=='approved' for s in registry.get('sources',[])):
        raise ValueError('TMDB source is not approved')


def collect_now_playing(fetch_page, now):
    first=fetch_page(1)
    pages=first.get('total_pages')
    total=first.get('total_results')
    if type(pages) is not int or not 0<=pages<=MAX_PAGES or type(total) is not int or total<0:
        raise ValueError('Invalid pagination or page budget exceeded')
    today=now.astimezone(dt.timezone(dt.timedelta(hours=9))).date().isoformat()
    movies={}
    for number in range(1,max(1,pages)+1):
        page=first if number==1 else fetch_page(number)
        rows=page.get('results')
        if page.get('page')!=number or page.get('total_pages')!=pages or page.get('total_results')!=total or not isinstance(rows,list) or (not rows and total):
            raise ValueError('Incomplete or inconsistent now-playing page')
        for row in rows:
            identity=row.get('id');title=row.get('title') or row.get('original_title')
            if type(identity) is not int or identity<=0 or not isinstance(title,str) or not title.strip():
                raise ValueError('Invalid movie identity')
            release=row.get('release_date') or ''
            if row.get('adult') or (re.fullmatch(r'\d{4}-\d{2}-\d{2}',release) and release>today):
                continue
            poster=row.get('poster_path') or ''
            movie={
                'id':identity,'tmdbId':identity,'title':title.strip(),
                'original_title':row.get('original_title') or '',
                'year':int(release[:4]) if re.fullmatch(r'\d{4}-\d{2}-\d{2}',release) else None,
                'poster':'https://image.tmdb.org/t/p/w342'+poster if re.fullmatch(r'/[A-Za-z0-9_.-]+\.(?:jpg|png|webp)',poster) else None,
                'score':row.get('vote_average') or 0,'votes':row.get('vote_count') or 0,
                'popularity':row.get('popularity') or 0,'overview':row.get('overview') or '',
                'source_url':f'https://www.themoviedb.org/movie/{identity}',
            }
            movies.setdefault(identity,movie)
    return {'schema_version':1,'region':'JP','language':'ja-JP','source':SOURCE,'complete':True,
            'generated_at':now.isoformat(),'upstream_total_results':total,'movies':list(movies.values())}


def refresh(output, fetch_page, now):
    snapshot=collect_now_playing(fetch_page,now)
    output=Path(output);output.parent.mkdir(parents=True,exist_ok=True)
    temporary=None
    try:
        with tempfile.NamedTemporaryFile(mode='w',encoding='utf-8',dir=output.parent,delete=False) as file:
            temporary=Path(file.name)
            json.dump(snapshot,file,ensure_ascii=False,indent=2,allow_nan=False);file.write('\n')
        os.replace(temporary,output)
    finally:
        if temporary and temporary.exists():temporary.unlink()
    return snapshot


def main():
    ensure_approved(json.loads((ROOT/'data/source_registry.json').read_text()))
    key=os.environ.get('TMDB_API_KEY')
    if not key:raise ValueError('TMDB API credential unavailable')
    deadline=time.monotonic()+120
    def fetch_page(number):
        remaining=deadline-time.monotonic()
        if remaining<=0:raise TimeoutError('Refresh deadline exceeded')
        params=urllib.parse.urlencode({'api_key':key,'language':'ja-JP','region':'JP','page':number})
        request=urllib.request.Request('https://api.themoviedb.org/3/movie/now_playing?'+params,headers={'Accept':'application/json','User-Agent':'Cinelva/1.0'})
        with urllib.request.urlopen(request,timeout=min(15,remaining)) as response:
            return json.load(response)
    result=refresh(ROOT/'data/now_playing.json',fetch_page,dt.datetime.now(dt.timezone.utc))
    print(f"JP now-playing snapshot published: {len(result['movies'])} titles; complete observation {result['generated_at']}")


if __name__=='__main__':
    try:main()
    except Exception as error:
        # Never print request URLs or API credentials on a failed request.
        print('Now-playing refresh failed; previous snapshot retained: '+type(error).__name__,file=sys.stderr)
        sys.exit(1)
