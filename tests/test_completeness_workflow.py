import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / '.github' / 'workflows' / 'completeness-scorecard.yml'


class CompletenessWorkflowTests(unittest.TestCase):
    def test_workflow_has_required_score_producer_jobs(self):
        text = WORKFLOW.read_text(encoding='utf-8')
        for job in ['mobile-e2e:', 'journey-e2e:', 'data-compliance:', 'score:']:
            self.assertIn(job, text)
        self.assertIn('needs: [mobile-e2e, journey-e2e, data-compliance]', text)
        self.assertNotIn('ocean:', text)

    def test_journey_job_runs_both_mobile_browsers(self):
        text = WORKFLOW.read_text(encoding='utf-8')
        self.assertIn('tests/journeys/core-journeys.mjs', text)
        self.assertIn('CINEMAP_BROWSER=chromium', text)
        self.assertIn('CINEMAP_BROWSER=webkit', text)

    def test_mobile_job_scores_performance_bands(self):
        text = WORKFLOW.read_text(encoding='utf-8')
        self.assertIn('tests/product/performance-score.mjs', text)

    def test_retired_ocean_job_and_mapper_are_not_run(self):
        text = WORKFLOW.read_text(encoding='utf-8')
        self.assertNotIn('Ocean', text)
        self.assertNotIn('ocean', text)

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
        self.assertIn('Scorecard version changed', text)

    def test_all_producer_artifacts_are_downloaded_by_score_job(self):
        text = WORKFLOW.read_text(encoding='utf-8')
        self.assertIn('pattern: completeness-*-metrics', text)
        self.assertIn('merge-multiple: true', text)


if __name__ == '__main__':
    unittest.main()
