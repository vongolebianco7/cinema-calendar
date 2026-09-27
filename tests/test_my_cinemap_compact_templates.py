from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = (ROOT / "js/my-cinemap-tools.js").read_text(encoding="utf-8")
ART = (ROOT / "js/my-cinemap-art.js").read_text(encoding="utf-8")
HTML = (ROOT / "my-cinemap.html").read_text(encoding="utf-8")


def test_selected_movies_use_compact_editor_rows():
    for token in ["compactMovieItem", "compactMovieMeta", "movieEditPanel", "編集"]:
        assert token in TOOLS


def test_director_is_preserved_and_defaulted_from_search_results():
    for token in ["movieDirector", "監督", "director"]:
        assert token in TOOLS
    assert "m.director||m.directors?.[0]||''" in TOOLS
    assert "m.director" in ART
    assert 'api/movie-detail?id=' in TOOLS
    assert 'if(movie.director&&movie.poster)' in TOOLS


def test_four_editorial_templates_exist():
    for token in ["Minimal", "Noir Editorial", "Burgundy Journal", "Blue Grey Archive"]:
        assert token in HTML
    for token in ["drawMinimal", "drawNoir", "drawBurgundy", "drawBlueGray"]:
        assert token in ART


def test_design_picker_is_directly_below_export_shape_and_layout_controls():
    export_pos = HTML.index('class="exportOptions"')
    design_pos = HTML.index('<div class="designPicker"')
    art_pos = HTML.index('<div id="art"')
    assert export_pos < design_pos < art_pos


def test_template_selection_has_visible_active_frame():
    assert '.themeChoice.premiumTheme.active{' in TOOLS
    assert 'box-shadow:0 0 0 2px #f7f1e3' in TOOLS
    assert '.premiumTheme.active:before' in TOOLS


def test_default_title_is_english_and_canned_poem_is_removed():
    assert 'id="title" data-year="2026"' in HTML
    assert 'MY TOP OF '+chr(34)+'+document.getElementById("title").dataset.year' in HTML
    assert 'id="sub" value="" placeholder="ひとこと（任意）"' in HTML
    assert '心に残った10本。' not in HTML
    assert 'あなたの映画を、ここに。' not in ART


def test_illustration_setting_is_removed():
    assert 'illustrationMode' not in HTML
    assert 'visualOptions' not in TOOLS
    assert 'drawAbstractThumb' not in ART


def test_top_three_use_refined_medal_renderer():
    assert "function drawMedal" in ART
    assert "if(i<3)drawMedal" in ART
    for metal in ["#a98c56", "#92969a", "#a77b61"]:
        assert metal in ART


def test_canvas_uses_current_outline_tile_brand():
    assert "function drawBrand" in ART
    assert "EXPLORE CINEMA" in ART
    assert "Bodoni 72" in ART
    assert "ctx.strokeRect" in ART
    assert "assets/cinemap-logo.png?v=2" not in ART
    assert "cinemapLogo" not in ART


def test_hidden_theme_control_does_not_assume_select_options():
    assert 'type="hidden" id="theme"' in HTML
    assert "theme.options" not in TOOLS


def test_phone_photo_flow_shows_a_long_pressable_image():
    assert 'id="saveToPhotos"' in HTML
    assert 'id="saveImageDialog"' in HTML
    assert 'id="saveImagePreview"' in HTML
    assert 'toDataURL' in ART


def test_editorial_export_uses_one_continuous_vertical_rhythm():
    for token in ["const portraitTitleSize=54", "const portraitListTop=244", "const portraitFooterGap=54", "const rowInset=16"]:
        assert token in ART
    assert "cellH=available/rows" not in ART


def test_minimal_theme_has_quieter_warmer_neutral_polish():
    for token in [
        "const minimalPortraitTitleSize=46",
        "const minimalPortraitListTop=232",
        "const minimalMedalScale=.86",
        "const minimalMetaAlpha=.74",
        "const minimalMovieWeight=600",
        "const minimalFooterGap=38",
        "#f3efe7",
        "#b9aa8d",
    ]:
        assert token in ART
    assert "theme==='minimal'?minimalPortraitTitleSize:portraitTitleSize" in ART
    assert "theme==='minimal'?minimalMedalScale:1" in ART
