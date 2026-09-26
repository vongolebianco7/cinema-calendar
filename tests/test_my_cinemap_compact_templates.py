from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = (ROOT / "js/my-cinemap-tools.js").read_text(encoding="utf-8")
ART = (ROOT / "js/my-cinemap-art.js").read_text(encoding="utf-8")
HTML = (ROOT / "my-cinemap.html").read_text(encoding="utf-8")


def test_selected_movies_use_compact_editor_rows():
    for token in ["compactMovieItem", "compactMovieMeta", "movieEditPanel", "編集"]:
        assert token in TOOLS


def test_director_can_be_shown_and_edited():
    for token in ["movieDirector", "監督", "director"]:
        assert token in TOOLS
    assert "m.director" in ART


def test_three_distinct_premium_templates_exist():
    for token in ["Art Deco Cinema", "Gallery / Museum", "Night Theater"]:
        assert token in TOOLS
    for token in ["drawArtDeco", "drawGallery", "drawNightTheater"]:
        assert token in ART


def test_premium_templates_have_vector_illustration_details():
    for token in ["drawProjector", "drawCurtain", "drawFilmStrip", "drawMarquee", "drawGalleryFrames", "drawCinemaFacade"]:
        assert token in ART


def test_hidden_theme_control_does_not_assume_select_options():
    assert 'type="hidden" id="theme"' in HTML
    assert "theme.options" not in TOOLS


def test_design_picker_is_directly_below_export_shape_and_layout_controls():
    export_pos = HTML.index('class="exportOptions"')
    design_pos = HTML.index('<div class="designPicker"')
    art_pos = HTML.index('<div id="art"')
    assert export_pos < design_pos < art_pos
    assert HTML.index('class="panel"') < HTML.index('id="q"') < design_pos


def test_premium_theme_active_state_overrides_template_border_color():
    assert '.themeChoice.premiumTheme.active{' in TOOLS
    assert 'border-color:#f7f1e3!important' in TOOLS
    assert 'box-shadow:0 0 0 2px #f7f1e3' in TOOLS
    assert '.premiumTheme.active:before' in TOOLS
