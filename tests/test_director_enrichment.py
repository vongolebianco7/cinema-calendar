import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class DirectorEnrichmentTests(unittest.TestCase):
    def setUp(self):
        path = ROOT / 'scripts/enrich_directors.py'
        self.assertTrue(path.exists(), 'director refresh must retain profiles and full directing credits')
        spec = importlib.util.spec_from_file_location('enrich_directors', path)
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)

    def test_discovers_absent_named_director_and_keeps_only_directing_credits(self):
        calls = []
        def request(endpoint, params=None):
            calls.append(endpoint)
            if endpoint == '/search/person':
                return {'results': [{'id': 190, 'name': 'Clint Eastwood'}]}
            profile = self.profile()
            profile.update(id=190, name='Clint Eastwood', also_known_as=[])
            profile['movie_credits']['crew'].append({'id': 100, 'job': 'Actor', 'title': '出演のみ'})
            return profile
        directors = {}
        result = self.module.discover_named_directors(directors, {'clint eastwood': 'クリント・イーストウッド'}, request, '2026-10-18')
        self.assertEqual(result['added'], ['190'])
        self.assertEqual(len(directors['190']['works']), 41)
        self.assertEqual(directors['190']['nameJa'], 'クリント・イーストウッド')
        self.assertEqual(calls, ['/search/person', '/person/190'])
        calls.clear()
        self.module.discover_named_directors(directors, {'clint eastwood': 'クリント・イーストウッド'}, request, '2026-10-18')
        self.assertEqual(calls, [])

    def test_discovery_never_guesses_between_same_named_people(self):
        directors = {}
        def request(endpoint, params=None):
            self.assertEqual(endpoint, '/search/person')
            return {'results': [{'id': 1, 'name': 'Example'}, {'id': 2, 'name': 'Example'}]}
        result = self.module.discover_named_directors(directors, {'example': 'エグザンプル'}, request, '2026-10-18')
        self.assertFalse(directors)
        self.assertEqual(result['unresolved'], ['example'])

    def test_verified_runtime_excludes_short_and_packaged_tv_compilation(self):
        director = {'id': 190, 'works': [
            {'id': 1, 'title': 'Feature'}, {'id': 2, 'title': 'Vanessa in the Garden'},
            {'id': 3, 'title': 'Amazing Stories: The Movie IV'}]}
        def request(endpoint, params=None):
            identifier = int(endpoint.rsplit('/', 1)[1])
            return {'id': identifier, 'runtime': 25 if identifier == 2 else 100}
        result = self.module.verify_director_runtimes(director, request)
        self.assertEqual([work['id'] for work in result['works']], [1])
        self.assertEqual(result['works'][0]['runtime'], 100)
        self.assertEqual(result['coverage']['runtime_unverified'], 0)

    def profile(self):
        return {'id': 1, 'name': 'Example Director', 'also_known_as': ['エグザンプル・ディレクター'],
                'birthday': '1970-01-02', 'place_of_birth': 'Tokyo', 'profile_path': '/person.jpg',
                'biography': '日本語の監督紹介。', 'movie_credits': {'crew': [
                    {'id': i, 'job': 'Director', 'title': f'作品{i}', 'release_date': '2000-01-01'}
                    for i in range(1, 42)]}}

    def test_keeps_all_directing_credits_and_profile(self):
        result = self.module.enrich_director({'id': 1, 'name': 'Example Director'}, self.profile(), '2026-10-18')
        self.assertEqual(len(result['works']), 41)
        self.assertEqual(result['nameJa'], 'エグザンプル・ディレクター')
        self.assertEqual(result['profile_path'], '/person.jpg')
        self.assertEqual(result['birthday'], '1970-01-02')
        self.assertEqual(result['biography_ja'], '日本語の監督紹介。')
        self.assertTrue(all(w['job'] == 'Director' and w['director_id'] == 1 for w in result['works']))

    def test_filters_other_jobs_compilations_known_shorts_and_duplicates(self):
        profile = self.profile()
        profile['movie_credits']['crew'] += [
            {'id': 1, 'job': 'Director', 'title': '重複', 'release_date': '2000-01-01'},
            {'id': 80, 'job': 'Producer', 'title': '製作担当', 'release_date': '2000-01-01'},
            {'id': 81, 'job': 'Director', 'title': 'Cinema16: British Short Films', 'release_date': '2000-01-01'},
            {'id': 82, 'job': 'Director', 'title': '短時間作品', 'runtime': 15, 'release_date': '2000-01-01'},
        ]
        result = self.module.enrich_director({'id': 1}, profile, '2026-10-18')
        self.assertEqual(len(result['works']), 41)

    def test_uses_existing_runtime_and_preserves_unknown_fields(self):
        old = {'id': 1, 'custom': 'keep', 'works': [{'id': 1, 'runtime': 10}, {'id': 2, 'runtime': 120, 'custom': 'film'}]}
        result = self.module.enrich_director(old, self.profile(), '2026-10-18')
        self.assertEqual(result['custom'], 'keep')
        self.assertNotIn(1, [w['id'] for w in result['works']])
        self.assertEqual(next(w for w in result['works'] if w['id'] == 2)['custom'], 'film')

    def test_credit_snapshot_omits_unused_overviews_and_api_transport_fields(self):
        profile = self.profile()
        profile['movie_credits']['crew'][0].update(overview='unneeded text' * 100, popularity=25, credit_id='abc')
        result = self.module.enrich_director({'id': 1}, profile, '2026-10-18')
        work = next(w for w in result['works'] if w['id'] == 1)
        self.assertNotIn('overview', work)
        self.assertNotIn('popularity', work)
        self.assertNotIn('credit_id', work)

    def test_reading_fallback_keeps_original_and_is_not_marked_official(self):
        profile = self.profile()
        profile.update(id=7775, name='Stephen Sommers', also_known_as=[])
        result = self.module.enrich_director({'id': 7775, 'name': 'Stephen Sommers'}, profile, '2026-10-18')
        self.assertEqual(result['nameJa'], 'スティーヴン・ソマーズ')
        self.assertEqual(result['original_name'], 'Stephen Sommers')
        self.assertEqual(result['name_status'], 'transliterated')
        refreshed = self.module.enrich_director(result, profile, '2026-10-18')
        self.assertEqual(refreshed['name_status'], 'transliterated')

    def test_multilingual_han_alias_is_not_mistaken_for_japanese(self):
        profile = self.profile()
        profile.update(id=999991, name='Unmapped Person', also_known_as=['里克·罗曼·沃夫'])
        result = self.module.enrich_director({'id': 999991, 'name': 'Unmapped Person'}, profile, '2026-10-18')
        self.assertEqual(result['name_status'], 'japanese_unavailable')
        self.assertEqual(result['name'], 'Unmapped Person')
        profile['also_known_as'].append('アンマップド・パーソン')
        translated = self.module.enrich_director({'id': 999991}, profile, '2026-10-18')
        self.assertEqual(translated['nameJa'], 'アンマップド・パーソン')

    def test_snapshot_uses_japanese_labels_and_verified_uncapped_credits(self):
        import json
        directors = json.loads((ROOT / 'data/directors.json').read_text())['directors']
        self.assertTrue(directors)
        for identifier, director in directors.items():
            self.assertRegex(director['name'], '[ぁ-ゖァ-ヺ一-鿿]', identifier)
            self.assertFalse(director['coverage']['truncated'])
            self.assertEqual(director['source_url'], f'https://www.themoviedb.org/person/{identifier}')
            works = director['works']
            self.assertEqual(len({work['id'] for work in works}), len(works))
            self.assertTrue(all(work['job'] == 'Director' for work in works))
            if director['name_status'] == 'transliterated':
                self.assertTrue(director['original_name'])

    def test_missing_translation_is_explicit_and_partial_payload_rejected(self):
        profile = self.profile()
        profile['also_known_as'] = []
        result = self.module.enrich_director({'id': 1, 'name': 'Example Director'}, profile, '2026-10-18')
        self.assertEqual(result['name_status'], 'japanese_unavailable')
        self.assertEqual(result['name'], 'Example Director')
        with self.assertRaises(ValueError):
            self.module.enrich_director({'id': 1}, {'id': 1, 'name': 'Example'}, '2026-10-18')


if __name__ == '__main__':
    unittest.main()
