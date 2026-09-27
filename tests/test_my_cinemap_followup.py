from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'my-cinemap.html').read_text(encoding='utf-8')
TOOLS=(ROOT/'js/my-cinemap-tools.js').read_text(encoding='utf-8')
ART=(ROOT/'js/my-cinemap-art.js').read_text(encoding='utf-8')

def test_template_cards_show_layout_content():
    assert HTML.count('class="previewRanks"') >= 4
    assert HTML.count('class="previewRank') >= 12

def test_poster_toggle_removed_and_selected_ranking_keeps_posters():
    assert 'id="posterMode"' not in HTML
    assert 'syncPosterPreview' not in TOOLS
    assert 'posterPreviewOff' not in TOOLS
    assert 'posterPreviewOn' not in TOOLS
    assert "m.poster?'<img src=\"'+E(m.poster)+'\">'" in HTML

def test_large_font_has_scaled_fit_floor():
    assert "const fontScale={small:1,medium:1.18,large:1.36}" in ART
    assert "(columns===2?21:24)*fontScale" in ART
    assert "16*fontScale" in ART

def test_first_font_option_editorial_is_removed():
    assert 'value="editorial"' not in HTML
    assert "editorial:{" not in ART
    assert "||'modern'" in ART
