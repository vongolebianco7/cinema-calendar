"""Keep current-availability snapshots fresh within the published week window."""
import runpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
availability = runpy.run_path(str(ROOT / "scripts/update_availability.py"))
observation_budget = availability["observation_budget"]
MAX_DAILY_OBSERVATIONS = availability["MAX_DAILY_OBSERVATIONS"]


def test_1602_titles_fit_inside_six_day_freshness_window():
    # ceil(1602 / 6) observations per daily run covers the full observed set.
    assert observation_budget(1602) == 267
    assert observation_budget(1602) * 6 >= 1602


def test_large_catalog_remains_bounded_by_the_safe_daily_cap():
    assert MAX_DAILY_OBSERVATIONS == 320
    assert observation_budget(10000) == MAX_DAILY_OBSERVATIONS


def test_small_catalog_keeps_the_existing_minimum_daily_batch():
    assert observation_budget(1) == 60
