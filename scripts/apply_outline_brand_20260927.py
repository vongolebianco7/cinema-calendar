from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    "index.html", "discover.html", "experience.html", "my-cinemap.html",
    "search.html", "rankings.html", "critic.html", "revivals.html", "theaters.html",
]

BRAND_ASSET = "assets/08AF5B56-A987-4D6E-A04C-D20E40483567.png"
ICON_ASSET = "assets/411DC24B-E557-4A36-95D2-5FA3550E7BD7.png"

BRAND_HTML = (
    f'<a class="gBrand" href="index.html" aria-label="Cinemap">'
    f'<img class="gBrandImage" src="{BRAND_ASSET}" alt="Cinemap"></a>'
)

BRAND_CSS = r'''<style id="cinemap-brand-image-v3">
/* Approved B brand is a fixed artwork asset. CSS only controls placement/size. */
.gBrand{display:inline-flex!important;align-items:center!important;justify-content:flex-start!important;flex:0 0 auto;min-width:0;text-decoration:none!important;line-height:0}
.gBrandImage{display:block;width:132px;height:auto;max-width:none}
.gNav{height:58px!important;gap:8px!important}
@media(max-width:430px){
  .gNav{height:56px!important;gap:8px!important}
  .gBrandImage{width:132px}
  .gSearchForm{height:33px!important}
}
@media(max-width:370px){.gBrandImage{width:118px}}
</style>'''


def patch_page(path: Path):
    text = path.read_text(encoding="utf-8")

    text, n = re.subn(
        r'<style id="(?:cinemap-live-header-brand-v1|cinemap-outline-brand-v2|cinemap-brand-image-v3)">.*?</style>',
        BRAND_CSS,
        text,
        count=1,
        flags=re.S,
    )
    if n != 1:
        raise SystemExit(f"Expected one brand style block in {path.name}, found {n}")

    # Replace both visible-header and drawer brand lockups with the exact approved image.
    text, count = re.subn(
        r'<a class="gBrand" href="index\.html"(?: aria-label="Cinemap")?>.*?</a>',
        BRAND_HTML,
        text,
        flags=re.S,
    )
    if count < 2:
        # Recover older markup where the class was missing from the anchor.
        text = re.sub(
            r'<a href="index\.html"><span class="gBrandTile".*?</a>',
            BRAND_HTML,
            text,
            flags=re.S,
        )

    if text.count(BRAND_HTML) < 2:
        raise SystemExit(f"Expected two image brand lockups in {path.name}")

    # Use the approved uploaded square icon directly for browser/home-screen icons.
    text, icon_count = re.subn(
        r'<link rel="icon"[^>]*>',
        f'<link rel="icon" href="{ICON_ASSET}" type="image/png">',
        text,
        count=1,
    )
    if icon_count != 1:
        raise SystemExit(f"Expected one favicon link in {path.name}")

    text, apple_count = re.subn(
        r'<link rel="apple-touch-icon"[^>]*>',
        f'<link rel="apple-touch-icon" href="{ICON_ASSET}">',
        text,
        count=1,
    )
    if apple_count != 1:
        raise SystemExit(f"Expected one apple-touch-icon link in {path.name}")

    # Prevent any legacy CSS/HTML-built logo pieces from surviving.
    for legacy in ["gBrandTile", "gBrandGlyph", "gBrandBeam", "gBrandName", "gBrandTagline"]:
        if legacy in text:
            raise SystemExit(f"Legacy brand token {legacy} survived in {path.name}")

    path.write_text(text, encoding="utf-8")


for page in PAGES:
    patch_page(ROOT / page)

print("Applied approved image-based Cinemap B brand to", len(PAGES), "pages")
