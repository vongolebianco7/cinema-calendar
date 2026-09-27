from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "my-cinemap.html").read_text(encoding="utf-8")
TOOLS = (ROOT / "js/my-cinemap-tools.js").read_text(encoding="utf-8")
ART = (ROOT / "js/my-cinemap-art.js").read_text(encoding="utf-8")
API = (ROOT / "backend/app/api/movie-detail/route.ts").read_text(encoding="utf-8")


def test_deep_dive_removed_from_my_cinemap():
    assert '>深掘る<' not in HTML


def test_removed_templates_are_absent():
    for token in ['Sage Museum', 'data-theme="sage"', 'Screen Room', 'data-theme="screenroom"']:
        assert token not in HTML


def test_templates_use_compact_three_column_grid():
    assert 'my-cinemap-compact-templates-v1' in HTML
    assert 'grid-template-columns:repeat(3,minmax(0,1fr))!important' in HTML


def test_font_size_control_has_small_medium_large_and_small_default():
    assert 'id="fontSize"' in HTML
    assert '<option value="small" selected>小</option>' in HTML
    assert '<option value="medium">中</option>' in HTML
    assert '<option value="large">大</option>' in HTML
    assert "fontScale" in ART
    assert "artValue('fontSize')" in ART


def test_preview_poster_toggle_exists_and_is_local_preview_only():
    assert 'id="posterMode"' in HTML
    assert '<option value="off" selected>表示しない</option>' in HTML
    assert '<option value="on">表示する</option>' in HTML
    assert 'posterPreviewOn' in TOOLS
    assert "posterMode" in TOOLS
    assert "drawImage(" not in ART


def test_overseas_director_uses_original_name_without_extra_person_request():
    assert 'director_original_name' in API
    assert 'director_is_japanese' in API
    assert 'director_original_name' in TOOLS
    assert 'director_is_japanese' in TOOLS
    assert '/person/' not in TOOLS
