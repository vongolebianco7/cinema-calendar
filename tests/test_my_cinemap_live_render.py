from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/"my-cinemap.html").read_text(encoding="utf-8")
ART=(ROOT/"js/my-cinemap-art.js").read_text(encoding="utf-8")
TOOLS=(ROOT/"js/my-cinemap-tools.js").read_text(encoding="utf-8")

def test_template_preview_css_is_available_without_helper_js():
    assert '<style id="my-cinemap-template-preview-v2">' in HTML
    assert '.templatePreview .previewRanks' in HTML
    assert '.templatePreview .previewRank' in HTML

def test_helper_script_cache_key_is_bumped():
    assert 'my-cinemap-tools.js?v=20260927-my-cinemap-live-v13' in ART
    assert 'my-cinemap-preview-v9' not in ART

def test_existing_selected_movies_backfill_missing_poster():
    assert 'async function fillMovieDetails(movie)' in TOOLS
    assert 'if(!movie.poster&&detail.poster){movie.poster=detail.poster;changed=true}' in TOOLS
    assert 'picks.forEach(fillMovieDetails)' in TOOLS
    assert 'fillDirector(' not in TOOLS
