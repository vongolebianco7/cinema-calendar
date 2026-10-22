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

    def test_eastwood_snapshot_has_sourced_feature_credits_not_a_saved_record_total(self):
        import json
        director = json.loads((ROOT / 'data/directors.json').read_text())['directors']['190']
        self.assertGreaterEqual(len(director['works']), 40)
        identifiers = {work['id'] for work in director['works']}
        self.assertTrue({33, 70, 13223, 1106739}.issubset(identifiers))
        self.assertFalse({1309305, 1126932, 524469} & identifiers)
        self.assertEqual(director['coverage']['runtime_unverified'], 0)
        self.assertTrue(all(work['runtime'] >= 30 and work['job'] == 'Director' for work in director['works']))

    def test_spielberg_snapshot_has_complete_sourced_directing_credits(self):
        import json
        director = json.loads((ROOT / 'data/directors.json').read_text())['directors']['488']
        self.assertGreaterEqual(len(director['works']), 40)
        self.assertTrue(all(work['job'] == 'Director' for work in director['works']))
        self.assertEqual(len({work['id'] for work in director['works']}), len(director['works']))

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
        # The raw approved API snapshot retains explicitly untranslated source
        # identities. Check the compact published catalog's Japanese UI labels separately.
        published = json.loads((ROOT / 'data/directors-mobile.json').read_text())['directors']
        self.assertTrue(published)
        for identifier, director in published.items():
            self.assertRegex(director['name'], '[ぁ-ゖァ-ヺ一-鿿]', identifier)
        for identifier, director in directors.items():
            if director.get('name_status') == 'japanese_unavailable':
                self.assertFalse(director.get('nameJa'), identifier)
                self.assertTrue(director.get('original_name'), identifier)
            else:
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


    def test_official_name_entries_retain_primary_credit_provenance(self):
        import datetime
        from urllib.parse import urlparse
        for identifier, entry in self.module.name_readings().items():
            self.assertIn(entry['basis'], ['transliteration', 'official_credit'], identifier)
            self.assertTrue(entry['original_name'], identifier)
            self.assertRegex(entry['nameJa'], '[ぁ-ゖァ-ヺ一-鿿]', identifier)
            if entry['basis'] == 'official_credit':
                url = urlparse(entry['source_url'])
                self.assertEqual(url.scheme, 'https', identifier)
                self.assertTrue(url.hostname, identifier)
                datetime.date.fromisoformat(entry['checked_at'])

    def test_official_credit_name_is_not_mislabeled_as_an_editorial_reading(self):
        profile = self.profile()
        profile.update(id=2946613, name='Yuri Takei', also_known_as=[])
        old = {'id': 2946613, 'name': 'Yuri Takei'}
        result = self.module.enrich_director(old, profile, '2026-10-22')
        self.assertEqual(result['nameJa'], '武井佑吏')
        self.assertEqual(result['name_status'], 'japanese')
        self.assertEqual(result.get('name_source_url'), 'https://www.honbana.com/')
        profile['name'] = 'Different Person'
        mismatched = self.module.enrich_director({'id': 2946613, 'name': 'Different Person'}, profile, '2026-10-22')
        self.assertEqual(mismatched['name_status'], 'japanese_unavailable')

    def test_mobile_projection_retains_name_basis_and_observation_provenance(self):
        import json
        import shutil
        import subprocess
        import sys
        import tempfile
        source = {'generated_at': '2026-10-01', 'directors': {}}
        for identifier, name, status in [('1', '仮のカナ', 'transliterated'), ('2', '武井佑吏', 'japanese'), ('3', 'Unknown Name', 'japanese_unavailable')]:
            source['directors'][identifier] = {'id': int(identifier), 'name': name, 'name_status': status,
                'original_name': 'Retained original', 'name_source_url': 'https://www.honbana.com/',
                'source_url': f'https://www.themoviedb.org/person/{identifier}',
                'credits_source_url': f'https://api.themoviedb.org/3/person/{identifier}/movie_credits',
                'checked_at': '2026-10-01T00:00:00Z', 'works': [{'id': int(identifier), 'job': 'Director'}]}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'scripts').mkdir(); (root / 'data').mkdir()
            shutil.copy(ROOT / 'scripts/build_director_mobile.py', root / 'scripts')
            (root / 'data/directors.json').write_text(json.dumps(source))
            subprocess.run([sys.executable, str(root / 'scripts/build_director_mobile.py')], check=True, capture_output=True)
            mobile = json.loads((root / 'data/directors-mobile.json').read_text())
        for identifier, director in source['directors'].items():
            projected = mobile['directors'][identifier]
            for field in ['name_status', 'original_name', 'name_source_url', 'source_url', 'credits_source_url', 'checked_at']:
                self.assertEqual(projected.get(field), director[field], f'{identifier}: {field}')
            self.assertEqual(projected['works'], director['works'])

    def test_movie_additions_never_overwrite_a_concurrent_director_refresh(self):
        import json
        import os
        import shutil
        import subprocess
        import sys
        import tempfile
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / 'repo'
            for folder in ['scripts', 'data', 'js']:
                (root / folder).mkdir(parents=True)
            for relative in ['scripts/enrich_directors.py', 'scripts/build_director_mobile.py',
                             'data/director_name_readings.json', 'js/cinelva-records-page.js']:
                shutil.copy(ROOT / relative, root / relative)
            latest = {'directors': {
                '1': {'id': 1, 'name': '更新済み監督', 'checked_at': '2026-10-22', 'works': [{'id': 42}]},
                '2': {'id': 2, 'name': '並行追加監督', 'works': [{'id': 43}]}}}
            stale = {'directors': {
                '1': {'id': 1, 'name': '古い監督', 'checked_at': '2026-10-01', 'works': [{'id': 1}]},
                '3': {'id': 3, 'name': '映画更新で追加', 'works': [{'id': 44}]}}}
            (root / 'data/directors.json').write_text(json.dumps(latest))
            incoming = Path(directory) / 'incoming.json'
            incoming.write_text(json.dumps(stale))
            report = Path(directory) / 'report.json'
            env = {key: value for key, value in os.environ.items() if key != 'TMDB_API_KEY'}
            subprocess.run([sys.executable, str(root / 'scripts/enrich_directors.py'), '--normalize-only',
                            '--merge-additions', str(incoming), '--report-path', str(report)],
                           env=env, check=True, capture_output=True)
            merged = json.loads((root / 'data/directors.json').read_text())['directors']
            self.assertEqual(set(merged), {'1', '2', '3'})
            self.assertEqual([work['id'] for work in merged['1']['works']], [42])
            self.assertEqual(merged['1']['checked_at'], '2026-10-22')
            self.assertEqual([work['id'] for work in merged['2']['works']], [43])
            self.assertEqual([work['id'] for work in merged['3']['works']], [44])
            self.assertTrue(report.exists())
            self.assertFalse((root / 'artifacts').exists())

    def test_offline_normalization_projects_every_current_director_without_redating_sources(self):
        import json
        import os
        import re
        import shutil
        import subprocess
        import sys
        import tempfile
        original = json.loads((ROOT / 'data/directors.json').read_text())
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for folder in ['scripts', 'data', 'js']:
                (root / folder).mkdir()
            for relative in ['scripts/enrich_directors.py', 'scripts/build_director_mobile.py',
                             'data/directors.json', 'data/director_name_readings.json', 'js/cinelva-records-page.js']:
                shutil.copy(ROOT / relative, root / relative)
            subprocess.run(['git', 'init', '-q', str(root)], check=True, capture_output=True)
            subprocess.run(['git', 'add', '.'], cwd=root, check=True, capture_output=True)
            subprocess.run(['git', '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture'], cwd=root, check=True, capture_output=True)
            env = {key: value for key, value in os.environ.items() if key != 'TMDB_API_KEY'}
            subprocess.run([sys.executable, str(root / 'scripts/enrich_directors.py'), '--normalize-only'], env=env, check=True, capture_output=True)
            subprocess.run([sys.executable, str(root / 'scripts/build_director_mobile.py')], env=env, check=True, capture_output=True)
            dirty = subprocess.check_output(['git', 'diff', '--name-only', '-z', 'HEAD'], cwd=root).decode().split('\0')
            dirty += subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard', '-z'], cwd=root).decode().split('\0')
            guard = ROOT / 'scripts/verify-production-release.cjs'
            protected = json.loads(subprocess.check_output(['node', '-e', 'const {relevant}=require(process.argv[1]); console.log(JSON.stringify(JSON.parse(process.argv[2]).filter(relevant)))', str(guard), json.dumps([name for name in dirty if name])]))
            self.assertEqual(protected, [], 'offline generation must not introduce unreviewed source artifacts')
            normalized = json.loads((root / 'data/directors.json').read_text())['directors']
            mobile = json.loads((root / 'data/directors-mobile.json').read_text())['directors']
        untranslated = [key for key, director in mobile.items() if not re.search('[ぁ-ゖァ-ヺ一-鿿]', director['name'])]
        self.assertEqual(untranslated, [], 'current source identities need explicit Japanese labels')
        self.assertEqual(mobile.keys(), original['directors'].keys())
        for key, director in original['directors'].items():
            self.assertEqual(normalized[key].get('checked_at'), director.get('checked_at'), key)
            self.assertEqual({work['id'] for work in mobile[key]['works']}, {work['id'] for work in director['works']}, key)
            self.assertEqual(mobile[key].get('name_status'), normalized[key]['name_status'], key)


if __name__ == '__main__':
    unittest.main()
