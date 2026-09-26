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
    for token in ["drawProjector", "drawCurtain", "drawFilmStrip"]:
        assert token in ART


def test_hidden_theme_control_does_not_assume_select_options():
    assert 'type="hidden" id="theme"' in HTML
    assert "theme.options" not in TOOLS
