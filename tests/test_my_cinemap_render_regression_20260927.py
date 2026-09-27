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
    for text in (DIRECTION,CINEMA):
        assert "Screening Room" not in text
        assert "cinema-screening" not in text
