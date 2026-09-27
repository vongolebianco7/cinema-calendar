from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def test_all_my_cinemap_templates_anchor_brand_near_canvas_bottom():
    cinema = read("js/my-cinemap-cinema-templates.js")

    assert "const originalDrawBrand=drawBrand" in cinema
    assert "function brandFooterTop(shape,h,brandHeight" in cinema
    assert "drawBrand=function(ctx,w,h,theme,y){" in cinema
    assert "brandFooterTop(shape,h,theme==='minimal'?30:34)" in cinema
    assert "brandFooterTop(shape,h,36*brandScale)" in cinema
    assert "Math.min(h-118,listBottom+42)" not in cinema


def test_logo_has_a_dedicated_effect_free_safe_zone():
    cinema = read("js/my-cinemap-cinema-templates.js")

    assert "function drawBrandSafeZone(ctx,w,h,p,y,brandHeight" in cinema
    assert "drawBrandSafeZone(ctx,w,h,p,safeY,brandHeight)" in cinema
    assert "drawBrandSafeZone(ctx,w,h,p,footerY,36*brandScale)" in cinema


def test_cache_bump_script_updates_the_full_my_cinemap_script_chain():
    bump = read("scripts/bump_my_cinemap_cache.py")

    assert "my-cinemap-art.js?v=20260927-logo-footer-v15" in bump
    assert "my-cinemap-art-direction.js?v=20260927-logo-footer-v4" in bump
    assert "my-cinemap-cinema-templates.js?v=20260927-logo-footer-v7" in bump
