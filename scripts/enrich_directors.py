"""Refresh the existing director snapshot from the approved TMDB API only.

One request per director, no scraping, no generated names or biographies.
Failures preserve the previous director entry. Credits are never capped at 30.
"""
import argparse
import concurrent.futures
import datetime
from functools import lru_cache
import json
import os
from pathlib import Path
import re
import threading
import time
import urllib.parse
import urllib.request
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
JAPANESE = re.compile(r'[ぁ-ゖァ-ヺ\u3400-\u9fff]')
KANA = re.compile(r'[ぁ-ゖァ-ヺ]')
EXCLUDED = re.compile(r'cinema\s*16\b|short\s*films?|shorts?\s*collection|amazing\s*stories:\s*the\s*movie|anthology|compilation|behind.the.scenes|making.of|メイキング|短編|短篇|総集編|オムニバス', re.I)


@lru_cache(maxsize=1)
def name_readings():
    path = ROOT / 'data/director_name_readings.json'
    return json.loads(path.read_text())['directors'] if path.exists() else {}


def compact_work(work):
    work = dict(work)
    work['score'] = work.get('vote_average', work.get('score', 0))
    work['votes'] = work.get('vote_count', work.get('votes', 0))
    for field in ('overview', 'popularity', 'credit_id', 'adult', 'video', 'original_language',
                  'vote_average', 'vote_count', 'poster_path', 'backdrop_path', 'release_date'):
        work.pop(field, None)
    return work


def enrich_director(old, profile, today, aliases=None):
    if str(profile.get('id')) != str(old.get('id')) or not isinstance(profile.get('movie_credits', {}).get('crew'), list):
        raise ValueError('Missing or mismatched TMDB person/directing credits')
    aliases = aliases or {}
    old_names = [] if old.get('name_status') == 'transliterated' else [old.get('nameJa'), old.get('name_ja'), old.get('name')]
    candidates = [profile.get('name'), *profile.get('also_known_as', []), *old_names]
    # also_known_as is multilingual. Han aliases alone do not establish Japanese.
    known = next((aliases[str(name).lower()] for name in candidates if name and str(name).lower() in aliases), '')
    localized = profile.get('name') or ''
    japanese = known or (localized if JAPANESE.search(localized) else '') or next((name.strip() for name in candidates if isinstance(name, str) and KANA.search(name)), '')
    reading = name_readings().get(str(profile['id']))
    transliterated = False
    if not japanese and reading and reading['original_name'] in [old.get('name'), old.get('original_name'), profile.get('name'), *profile.get('also_known_as', [])]:
        japanese = reading['nameJa']
        transliterated = True
    name = japanese or old.get('name') or profile.get('name') or ''
    previous = {str(work.get('id')): work for work in old.get('works', [])}
    works = {}
    for credit in profile['movie_credits']['crew']:
        if credit.get('job') != 'Director' or not isinstance(credit.get('id'), int):
            continue
        work = {**previous.get(str(credit['id']), {}), **credit}
        title = work.get('title') or work.get('original_title') or ''
        if EXCLUDED.search(title + ' ' + (work.get('original_title') or '')):
            continue
        runtime = work.get('runtime') or work.get('duration')
        if isinstance(runtime, (int, float)) and 0 < runtime < 60:
            continue
        if work.get('media_type') in ('tv', 'episode') or work.get('is_short') is True:
            continue
        date = work.get('release_date') or work.get('date') or ''
        if date and date > today:
            continue
        poster_path = work.get('poster_path')
        work = compact_work(work)
        works[str(credit['id'])] = {**work, 'title': title, 'year': date[:4] or work.get('year'), 'date': date,
            'director': name, 'director_id': profile['id'], 'job': 'Director', 'is_director': True,
            'poster': 'https://image.tmdb.org/t/p/w342' + poster_path if poster_path else work.get('poster'),
            'source': 'tmdb', 'source_url': f"https://www.themoviedb.org/movie/{credit['id']}"}
    biography = profile.get('biography') or ''
    return {**old, 'id': profile['id'], 'name': name, 'nameJa': japanese,
        'original_name': profile.get('name') or old.get('name'),
        'also_known_as': list(dict.fromkeys(filter(None, [old.get('name'), *profile.get('also_known_as', [])]))),
        'name_status': 'transliterated' if transliterated else 'japanese' if japanese else 'japanese_unavailable',
        'profile_path': profile.get('profile_path'), 'birthday': profile.get('birthday'),
        'deathday': profile.get('deathday'), 'place_of_birth': profile.get('place_of_birth'),
        'biography_ja': biography if JAPANESE.search(biography) else '',
        'source_url': f"https://www.themoviedb.org/person/{profile['id']}",
        'credits_source_url': f"https://api.themoviedb.org/3/person/{profile['id']}/movie_credits",
        'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'works': sorted(works.values(), key=lambda work: (work.get('date') or '', work['id']), reverse=True),
        'coverage': {'source': 'tmdb_director_movie_credits', 'truncated': False,
                     'runtime_unverified': sum(not work.get('runtime') for work in works.values())}}


def existing_name_aliases():
    source = (ROOT / 'js/cinelva-records-page.js').read_text()
    pairs = json.loads(re.search(r'directorJapaneseNames = new Map\((\[.*?\])\);', source, re.S)[1])
    extra = json.loads(re.search(r'for\(const \[en,ja\] of Object.entries\((\{.*?\})\)\)', source, re.S)[1])
    return {**dict(pairs), **extra}


def person_name_key(name):
    return ''.join(c for c in unicodedata.normalize('NFKD', str(name)).casefold()
                   if c.isalnum() and not unicodedata.combining(c))


def verify_director_runtimes(director, request):
    """Verify a bounded directorography against movie metadata, excluding known shorts."""
    works = []
    for index, work in enumerate(director.get('works', [])):
        if index < 100 and not work.get('runtime'):
            detail = request('/movie/' + str(int(work['id'])))
            if detail.get('id') != work['id']:
                raise ValueError('Mismatched movie metadata')
            work = {**work, 'runtime': detail.get('runtime')}
        runtime = work.get('runtime')
        if isinstance(runtime, (int, float)) and 0 < runtime < 60:
            continue
        if EXCLUDED.search(str(work.get('title', '')) + ' ' + str(work.get('original_title', ''))):
            continue
        works.append(work)
    return {**director, 'works': works, 'coverage': {**director.get('coverage', {}),
        'runtime_unverified': sum(not work.get('runtime') for work in works)}}


def discover_named_directors(directors, aliases, request, today):
    """Resolve missing supported names, never infer a person from a partial match."""
    seen = {person_name_key(name) for director in directors.values()
            for name in [director.get('name'), director.get('nameJa'), director.get('original_name'),
                         *director.get('also_known_as', [])] if name}
    queries = {}
    for english, japanese in aliases.items():
        if person_name_key(english) not in seen and person_name_key(japanese) not in seen:
            queries.setdefault(japanese, english)
    report = {'added': [], 'unresolved': [], 'failures': []}
    # At most 100 searches and 100 person requests, alongside at most 600 refreshes.
    for japanese, english in list(queries.items())[:100]:
        try:
            found = request('/search/person', {'query': english, 'language': 'en-US'})
            matches = {str(person['id']): person for person in found.get('results', [])
                       if isinstance(person.get('id'), int) and person_name_key(english) in
                       {person_name_key(person.get('name')), person_name_key(person.get('original_name'))}}
            if len(matches) != 1:
                report['unresolved'].append(english)
                continue
            identifier, person = next(iter(matches.items()))
            if identifier in directors:
                continue
            profile = request('/person/' + identifier, {'append_to_response': 'movie_credits'})
            director = enrich_director({'id': person['id'], 'name': person['name']}, profile, today, aliases)
            if not director['works']:
                report['unresolved'].append(english)
                continue
            directors[identifier] = director
            report['added'].append(identifier)
        except Exception as error:
            report['failures'].append({'name': english, 'error': type(error).__name__})
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=800)
    parser.add_argument('--normalize-only', action='store_true')
    parser.add_argument('--discover-names', action='store_true')
    parser.add_argument('--verify-person', type=int)
    args = parser.parse_args()
    key = os.environ.get('TMDB_API_KEY')
    if not key and not args.normalize_only:
        raise SystemExit('TMDB_API_KEY is required; previous snapshot preserved')
    path = ROOT / 'data/directors.json'
    snapshot = json.loads(path.read_text())
    before = json.dumps(snapshot, ensure_ascii=False, sort_keys=True)
    directors = snapshot['directors']
    names = existing_name_aliases()
    today = datetime.date.today().isoformat()
    refresh_budget = 800 - (200 if args.discover_names else 0) - (100 if args.verify_person else 0)
    pending = [] if args.normalize_only else [(key, value) for key, value in directors.items() if not str(value.get('checked_at', '')).startswith(today)][:max(0, min(args.limit, refresh_budget))]
    lock = threading.Lock()
    last_request = [0.0]

    def request(endpoint, params=None):
        with lock:
            time.sleep(max(0, .35 - (time.monotonic() - last_request[0])))
            last_request[0] = time.monotonic()
        query = urllib.parse.urlencode({'api_key': key, 'language': 'ja-JP', **(params or {})})
        req = urllib.request.Request('https://api.themoviedb.org/3' + endpoint + '?' + query, headers={'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=25) as response:
            return json.load(response)

    def refresh(item):
        identifier, old = item
        try:
            profile = request(f'/person/{int(identifier)}', {'append_to_response': 'movie_credits'})
            return identifier, enrich_director(old, profile, today, names), None
        except Exception as error:
            # Do not print exception URLs: they may contain the API key.
            return identifier, old, type(error).__name__

    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for identifier, director, error in pool.map(refresh, pending):
            if error:
                failures.append({'id': identifier, 'error': error})
            else:
                directors[identifier] = director
    discovery = discover_named_directors(directors, names, request, today) if args.discover_names and not args.normalize_only else {'added': [], 'unresolved': [], 'failures': []}
    if args.verify_person and not args.normalize_only:
        identifier = str(args.verify_person)
        if identifier not in directors:
            raise ValueError('Requested director is not in the sourced snapshot')
        directors[identifier] = verify_director_runtimes(directors[identifier], request)
    for identifier, director in directors.items():
        reading = name_readings().get(identifier)
        previous_name = director.get('name')
        known_names = set(names.values())
        if director.get('name_status') == 'japanese' and not KANA.search(previous_name or '') and previous_name != director.get('original_name') and previous_name not in known_names:
            director.update(name=director.get('original_name') or previous_name, name_status='japanese_unavailable', nameJa='')
        if director.get('name_status') == 'japanese_unavailable' and reading and reading['original_name'] in [previous_name, director.get('original_name')]:
            director.update(name=reading['nameJa'], nameJa=reading['nameJa'], name_status='transliterated')
            director['also_known_as'] = list(dict.fromkeys([*director.get('also_known_as', []), previous_name]))
            for work in director.get('works', []):
                if work.get('director') == previous_name:
                    work['director'] = reading['nameJa']
        director['works'] = [compact_work(work) for work in director.get('works', [])]
    if json.dumps(snapshot, ensure_ascii=False, sort_keys=True) != before:
        snapshot['generated_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)
    report = {'attempted': len(pending), 'refreshed': len(pending) - len(failures), 'failures': failures, 'discovery': discovery,
        'japanese_unavailable': [{'id': key, 'name': value.get('name')} for key, value in directors.items() if value.get('name_status') == 'japanese_unavailable'],
        'unrefreshed': [key for key, value in directors.items() if not value.get('checked_at')],
        'photos': sum(bool(value.get('profile_path')) for value in directors.values()),
        'transliterated_names': sum(value.get('name_status') == 'transliterated' for value in directors.values()),
        'japanese_biographies': sum(bool(value.get('biography_ja')) for value in directors.values())}
    report_path = ROOT / 'artifacts/director-enrichment.json'
    report_path.parent.mkdir(exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: value for key, value in report.items() if key not in ('japanese_unavailable', 'failures', 'unrefreshed')}, ensure_ascii=False))
    print('Missing Japanese names:', len(report['japanese_unavailable']), 'Failed:', len(failures))
    if failures or discovery['failures']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
