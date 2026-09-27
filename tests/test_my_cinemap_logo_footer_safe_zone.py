from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def test_all_my_cinemap_templates_anchor_brand_near_canvas_bottom():
    art = read("js/my-cinemap-art.js")
    cinema = read("js/my-cinemap-cinema-templates.js")

    assert "function brandFooterTop(shape,h,brandHeight" in art
    assert "brandFooterTop(shape,h,theme==='minimal'?30:34)" in art
    assert "brandFooterTop(shape,h,36*brandScale)" in cinema
    assert "Math.min(h-118,listBottom+42)" not in cinema
    assert "Math.min(h-92,listBottom+metrics.footerGap)" not in art


def test_logo_has_a_dedicated_effect_free_safe_zone():
    art = read("js/my-cinemap-art.js")
    cinema = read("js/my-cinemap-cinema-templates.js")

    assert "function drawBrandSafeZone(ctx,w,h,p,y,brandHeight" in art
    assert "drawBrandSafeZone(ctx,w,h,p,footerY" in art
    assert "drawBrandSafeZone(ctx,w,h,p,footerY,36*brandScale)" in cinema


def test_my_cinemap_script_chain_is_cache_busted_for_footer_change():
    html = read("my-cinemap.html")
    art = read("js/my-cinemap-art.js")
    direction = read("js/my-cinemap-art-direction.js")

    assert "my-cinemap-art.js?v=20260927-logo-footer-v15" in html
    assert "my-cinemap-art-direction.js?v=20260927-logo-footer-v4" in art
    assert "my-cinemap-cinema-templates.js?v=20260927-logo-footer-v7" in direction
