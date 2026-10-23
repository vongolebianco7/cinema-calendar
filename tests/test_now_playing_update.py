import datetime as dt
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

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


if __name__=='__main__':unittest.main()
