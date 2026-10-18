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
