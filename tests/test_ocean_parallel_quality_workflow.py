import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / '.github' / 'workflows' / 'ocean-parallel-quality.yml'


class OceanParallelQualityWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.text = WORKFLOW.read_text(encoding='utf-8')

    def test_three_observation_jobs_are_independent_and_share_one_baseline(self):
        for job in ['baseline:', 'performance-probe:', 'iphone-interaction-probe:', 'visual-gap-probe:', 'integrate:']:
            self.assertIn(job, self.text)
        self.assertIn('needs: baseline', self.text)
        self.assertIn('needs: [baseline, performance-probe, iphone-interaction-probe, visual-gap-probe]', self.text)
        self.assertGreaterEqual(self.text.count('BASELINE_SHA: ${{ needs.baseline.outputs.sha }}'), 3)

    def test_observation_jobs_do_not_mutate_ocean_product_code(self):
        self.assertIn('permissions:\n  contents: read', self.text)
        self.assertNotIn('git push', self.text)
        self.assertNotIn('gh pr merge', self.text)

    def test_performance_probe_reuses_authoritative_ocean_checks(self):
        self.assertIn('tests/ocean-500-performance-contract.test.cjs', self.text)
        self.assertIn('scripts/ocean_visual_smoke.mjs', self.text)
        self.assertIn('ocean-performance-evidence', self.text)

    def test_iphone_probe_uses_webkit_and_mobile_journey_contracts(self):
        self.assertIn('CINEMAP_BROWSER=webkit node tests/product/mobile-score.mjs', self.text)
        self.assertIn('CINEMAP_BROWSER=webkit node tests/journeys/core-journeys.mjs', self.text)
        self.assertIn('ocean-iphone-evidence', self.text)

    def test_visual_probe_captures_ocean_evidence_without_subjective_auto_editing(self):
        self.assertIn('node scripts/ocean_visual_smoke.mjs', self.text)
        self.assertIn('ocean-visual-evidence', self.text)
        self.assertIn('artifacts/mobile-smoke/', self.text)

    def test_visual_probe_observes_1000_film_maturity_without_promoting_a_new_performance_contract(self):
        self.assertIn('OCEAN_VISUAL_SCENARIOS=1000 node scripts/ocean_visual_1000_observation.mjs', self.text)
        self.assertIn('"scenarios": [100, 500, 1000]', self.text)
        self.assertNotIn('tests/ocean-1000-performance-contract.test.cjs', self.text)

    def test_integration_job_collects_all_evidence(self):
        for artifact in ['ocean-performance-evidence', 'ocean-iphone-evidence', 'ocean-visual-evidence']:
            self.assertIn(artifact, self.text)
        self.assertIn('ocean-parallel-quality-summary', self.text)


if __name__ == '__main__':
    unittest.main()
