import datetime as dt
import importlib.util
import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.parse

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/update_now_playing.py'
NOW = dt.datetime(2026, 10, 24, 0, 0, tzinfo=dt.timezone.utc)


class NowPlayingUpdateTests(unittest.TestCase):
    def setUp(self):
        self.assertTrue(SCRIPT.exists(), 'nationwide now-playing collector is missing')
        spec = importlib.util.spec_from_file_location('now_playing', SCRIPT)
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)

    def page(self, number, results, pages=1, total=None):
        return dict(page=number, total_pages=pages, total_results=len(results) if total is None else total, results=results)

    def film(self, identity, title='上映中の作品', date='2026-01-01'):
        return dict(id=identity, title=title, release_date=date, poster_path='/poster.jpg', vote_average=7.5, vote_count=10)

    def test_all_pages_deduplicate_and_keep_long_running_titles(self):
        pages = {1:self.page(1,[self.film(1),self.film(2)],2,4),2:self.page(2,[self.film(2),self.film(3)],2,4)}
        called=[]
        result=self.module.collect_now_playing(lambda n:(called.append(n) or pages[n]),NOW)
        self.assertEqual(called,[1,2]); self.assertEqual([x['id'] for x in result['movies']],[1,2,3])
        self.assertEqual(result['region'],'JP');self.assertEqual(result['source']['endpoint'],'/movie/now_playing')
        self.assertEqual(result['movies'][0]['source_url'],'https://www.themoviedb.org/movie/1')
        self.assertTrue(result['complete']);self.assertEqual(result['generated_at'],NOW.isoformat())

    def test_future_releases_and_adult_results_are_not_shown(self):
        rows=[self.film(1,date='2026-10-25'),dict(self.film(2),adult=True),self.film(3)]
        result=self.module.collect_now_playing(lambda n:self.page(1,rows),NOW)
        self.assertEqual([x['id'] for x in result['movies']],[3])

    def test_incomplete_or_invalid_page_preserves_existing_file(self):
        for broken in [RuntimeError('unavailable'),self.page(3,[self.film(2)],2,2),self.page(2,[],2,2)]:
            with self.subTest(broken=str(type(broken))),tempfile.TemporaryDirectory() as directory:
                target=Path(directory)/'now_playing.json';target.write_text('previous verified snapshot')
                def fetch(number):
                    if number==1:return self.page(1,[self.film(1)],2,2)
                    if isinstance(broken,Exception):raise broken
                    return broken
                with self.assertRaises((ValueError,RuntimeError)):self.module.refresh(target,fetch,NOW)
                self.assertEqual(target.read_text(),'previous verified snapshot')

    def test_nonempty_truncated_pages_preserve_prior_snapshot(self):
        for count in [1,2]:
            with self.subTest(pages=count),tempfile.TemporaryDirectory() as directory:
                target=Path(directory)/'now_playing.json';target.write_bytes(b'previous verified snapshot')
                def fetch(number):
                    return self.page(number,[self.film(number)],count,40)
                with self.assertRaises(ValueError):self.module.refresh(target,fetch,NOW)
                self.assertEqual(target.read_bytes(),b'previous verified snapshot')

    def test_over_budget_or_malformed_response_fails_closed(self):
        for page in [self.page(1,[],21,99),self.page(1,[dict(self.film(1),id='invalid')]),self.page(1,[],1,3)]:
            with self.subTest(page=page),self.assertRaises(ValueError):self.module.collect_now_playing(lambda n:page,NOW)

    def test_successful_empty_response_is_a_real_empty_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            target=Path(directory)/'snapshot.json'
            self.module.refresh(target,lambda n:self.page(1,[]),NOW)
            result=json.loads(target.read_text());self.assertTrue(result['complete']);self.assertEqual(result['movies'],[])

    def test_disabled_source_is_rejected(self):
        self.module.ensure_approved({'sources':[{'id':'tmdb','mode':'approved'}]})
        for mode in ['disabled','link_only']:
            with self.assertRaises(ValueError):self.module.ensure_approved({'sources':[{'id':'tmdb','mode':mode}]})

    def test_inconsistent_pages_use_only_official_upstream_window_equivalence(self):
        first=self.page(1,[self.film(1)],2,2)
        first['dates']={'minimum':'2026-09-16','maximum':'2026-10-28'}
        called=[]
        def original(number):return first if number==1 else self.page(2,[self.film(2)],2,3)
        def equivalent(number,minimum,maximum):
            called.append((number,minimum,maximum));return self.page(number,[self.film(number+10)],2,2)
        with tempfile.TemporaryDirectory() as directory:
            target=Path(directory)/'snapshot.json';target.write_text('previous')
            result=self.module.refresh(target,original,NOW,fetch_equivalent=equivalent)
            self.assertEqual([m['id'] for m in result['movies']],[11,12])
            self.assertEqual(called,[(1,'2026-09-16','2026-10-28'),(2,'2026-09-16','2026-10-28')])
            self.assertEqual(result['source']['retrieval_endpoint'],'/discover/movie')
            self.assertEqual(result['source']['upstream_window'],first['dates'])
            self.assertTrue(result['complete'])

    def test_equivalent_failures_or_invalid_dates_preserve_prior_file(self):
        for dates in [None,{'minimum':'2026-10-28','maximum':'2026-09-16'},{'minimum':'bad','maximum':'2026-10-28'},{'minimum':'2026-09-16','maximum':'2026-10-28'}]:
            with self.subTest(dates=dates),tempfile.TemporaryDirectory() as directory:
                target=Path(directory)/'snapshot.json';target.write_bytes(b'previous')
                first=dict(self.page(1,[self.film(1)],2,2),dates=dates)
                def original(number):return first if number==1 else self.page(2,[self.film(2)],2,3)
                def incomplete(number,minimum,maximum):return self.page(number,[self.film(3)],1,2)
                with self.assertRaises(ValueError):self.module.refresh(target,original,NOW,fetch_equivalent=incomplete)
                self.assertEqual(target.read_bytes(),b'previous')

    def test_valid_direct_observation_never_calls_equivalent_source(self):
        with tempfile.TemporaryDirectory() as directory:
            def forbidden(*args):self.fail('Unnecessary equivalent request')
            result=self.module.refresh(Path(directory)/'snapshot.json',lambda n:self.page(1,[self.film(1)]),NOW,fetch_equivalent=forbidden)
            self.assertNotIn('retrieval_endpoint',result['source'])

    def test_real_entrypoint_uses_exact_documented_equivalent_filters(self):
        called=[]
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);(root/'data').mkdir()
            (root/'data/source_registry.json').write_text(json.dumps({'sources':[{'id':'tmdb','mode':'approved'}]}))
            def urlopen(request,timeout):
                parsed=urllib.parse.urlparse(request.full_url);query=urllib.parse.parse_qs(parsed.query)
                called.append((parsed.path,query));self.assertLessEqual(timeout,15)
                if parsed.path.endswith('/now_playing'):
                    number=int(query['page'][0]);data=self.page(number,[self.film(number)],2,2 if number==1 else 3)
                    if number==1:data['dates']={'minimum':'2026-09-16','maximum':'2026-10-28'}
                else:data=self.page(1,[self.film(11)])
                return io.BytesIO(json.dumps(data).encode())
            with patch.object(self.module,'ROOT',root),patch.dict(self.module.os.environ,{'TMDB_API_KEY':'synthetic-test-key'}),patch.object(self.module.urllib.request,'urlopen',urlopen),contextlib.redirect_stdout(io.StringIO()):
                self.module.main()
            path,query=called[-1];self.assertEqual(path,'/3/discover/movie')
            self.assertEqual(query,{'api_key':['synthetic-test-key'],'language':['ja-JP'],'region':['JP'],'page':['1'],'include_adult':['false'],'include_video':['false'],'sort_by':['popularity.desc'],'with_release_type':['2|3'],'release_date.gte':['2026-09-16'],'release_date.lte':['2026-10-28']})
            result=json.loads((root/'data/now_playing.json').read_text());self.assertTrue(result['complete']);self.assertEqual(result['movies'][0]['id'],11)

    def test_invalid_movie_identity_is_not_reinterpreted_as_cache_inconsistency(self):
        with tempfile.TemporaryDirectory() as directory:
            target=Path(directory)/'snapshot.json';target.write_bytes(b'previous')
            def forbidden(*args):self.fail('Malformed source must not be reinterpreted')
            with self.assertRaises(ValueError):self.module.refresh(target,lambda n:self.page(1,[dict(self.film(1),id='bad')]),NOW,fetch_equivalent=forbidden)
            self.assertEqual(target.read_bytes(),b'previous')


if __name__=='__main__':unittest.main()
