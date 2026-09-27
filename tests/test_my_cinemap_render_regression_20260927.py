from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ART=(ROOT/'js/my-cinemap-art.js').read_text(encoding='utf-8')
DIRECTION=(ROOT/'js/my-cinemap-art-direction.js').read_text(encoding='utf-8')
CINEMA=(ROOT/'js/my-cinemap-cinema-templates.js').read_text(encoding='utf-8')


def test_unknown_font_falls_back_to_modern():
    assert "font=artFonts[fontKey]||artFonts.modern" in ART
    assert "artFonts.editorial" not in ART
    assert "font=artFonts[fontKey]||artFonts.modern" in CINEMA
    assert "artFonts.editorial" not in CINEMA


def test_removed_sage_renderer_is_not_referenced():
    assert "sage:drawSage" not in ART
    assert "my-cinemap-art-direction.js?v=20260927-cinema-backgrounds-v4" in ART


def test_editorial_font_option_is_removed():
    assert "value=\"editorial\"" not in DIRECTION
    assert "const FONT_VALUES=['modern','clean','classic']" in DIRECTION


def test_selected_ranking_poster_is_not_hidden():
    assert "#list .item>:nth-child(2){display:none!important}" not in DIRECTION
    assert "#list .item>:nth-child(2){" in DIRECTION
    assert "display:block!important" in DIRECTION
    assert "grid-template-columns:22px 42px minmax(0,1fr)!important" in DIRECTION
    assert "#list .item>:nth-child(3){grid-column:3!important" in DIRECTION


def test_screening_room_is_not_reintroduced():
    assert "Screening Room" not in DIRECTION
    assert "{id:'cinema-screening'" not in DIRECTION
    assert "'cinema-screening':" not in CINEMA


def test_cinema_templates_honor_font_size_control():
    assert "const fontScale={small:1,medium:1.18,large:1.36}[artValue('fontSize')]||1;" in CINEMA
    assert "const nameSize=(columns===2?" in CINEMA
    assert ")*fontScale;" in CINEMA
    assert "singleMetaSize)*fontScale" in CINEMA
    assert "16*fontScale" in CINEMA
