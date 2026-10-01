import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / '.github' / 'workflows' / 'completeness-scorecard.yml'


class CompletenessWorkflowTests(unittest.TestCase):
    def test_workflow_has_required_score_producer_jobs(self):
        text = WORKFLOW.read_text(encoding='utf-8')
        for job in ['mobile-e2e:', 'journey-e2e:', 'ocean:', 'data-compliance:', 'score:']:
            self.assertIn(job, text)
        self.assertIn('needs: [mobile-e2e, journey-e2e, ocean, data-compliance]', text)

    def test_journey_job_runs_both_mobile_browsers(self):
        text = WORKFLOW.read_text(encoding='utf-8')
        self.assertIn('tests/journeys/core-journeys.mjs', text)
        self.assertIn('CINEMAP_BROWSER=chromium', text)
        self.assertIn('CINEMAP_BROWSER=webkit', text)

    def test_mobile_job_scores_performance_bands(self):
        text = WORKFLOW.read_text(encoding='utf-8')
        self.assertIn('tests/product/performance-score.mjs', text)

    def test_ocean_job_runs_existing_authoritative_checks_and_mapper(self):
        text = WORKFLOW.read_text(encoding='utf-8')
        for required in [
            'tests/ocean-renderer-contract.test.cjs',
            'tests/ocean-milestone-stars.test.cjs',
            'tests/ocean-creature-diversity.test.cjs',
            'tests/ocean-habitat-depth.test.cjs',
            'tests/ocean-rating-ecology.test.cjs',
            'scripts/ocean_persistence_smoke.mjs',
            'tests/ocean-photo-natural-motion.test.cjs',
            'tests/ocean-real-scale-catalog.test.cjs',
            'tests/ocean-500-natural-density.test.cjs',
            'tests/ocean-500-performance-contract.test.cjs',
            'scripts/ocean_visual_smoke.mjs',
            'scripts/map_ocean_metrics.py',
        ]:
            self.assertIn(required, text)

    def test_data_compliance_job_reuses_existing_source_and_critic_checks(self):
        text = WORKFLOW.read_text(encoding='utf-8')
        for required in [
            'scripts/check_sources.py',
            'scripts/check_core_journey.py',
            'scripts/check_critic_map.py',
            'scripts/check_critic_evidence.js',
            'scripts/map_data_compliance_metrics.py',
        ]:
            self.assertIn(required, text)

    def test_score_job_can_fetch_main_baseline_after_bootstrap_merge(self):
        text = WORKFLOW.read_text(encoding='utf-8')
        self.assertIn('push:', text)
        self.assertIn('branches: [main]', text)
        self.assertIn('actions: read', text)
        self.assertIn('gh run list', text)
        self.assertIn('--branch main', text)
        self.assertIn('completeness-score', text)
        self.assertIn('--baseline artifacts/completeness/main-score.json', text)
        self.assertIn('--enforce-phase-a', text)

    def test_all_producer_artifacts_are_downloaded_by_score_job(self):
        text = WORKFLOW.read_text(encoding='utf-8')
        self.assertIn('pattern: completeness-*-metrics', text)
        self.assertIn('merge-multiple: true', text)


if __name__ == '__main__':
    unittest.main()
