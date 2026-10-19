from pathlib import Path
from html.parser import HTMLParser
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGES = ["index.html", "discover.html", "experience.html", "my-cinemap.html", "search.html", "rankings.html", "critic.html", "revivals.html", "theaters.html"]
BRAND_ASSET = "assets/08AF5B56-A987-4D6E-A04C-D20E40483567.png"
ICON_ASSET = "assets/411DC24B-E557-4A36-95D2-5FA3550E7BD7.png"


class VisibleCopyParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hidden = 0
        self.copy = []

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "template"}:
            self.hidden += 1
        self.copy.extend(value for key, value in attrs if key in {"alt", "aria-label", "title"} and value)

    def handle_endtag(self, tag):
        if tag in {"script", "style", "template"} and self.hidden:
            self.hidden -= 1

    def handle_data(self, data):
        if not self.hidden:
            self.copy.append(data)

class BrandIdentityTests(unittest.TestCase):
    def test_primary_pages_use_original_symbol_with_cinelva_text(self):
        for page in PAGES:
            text = (ROOT / page).read_text(encoding="utf-8")
            self.assertIn("cinemap-brand-image-v3", text, page)
            self.assertIn("gBrandImage", text, page)
            self.assertNotIn(f'src="{BRAND_ASSET}"', text, page)
            self.assertGreaterEqual(text.count('class="gBrandWord">Cinelva</span>'), 1 if page == "my-cinemap.html" else 2, page)
            if page != "my-cinemap.html": self.assertIn('.gNav{height:56px!important;gap:8px!important}', text, page)
            self.assertIn('.gBrandImage{display:block;width:132px;height:auto;max-width:none}', text, page)
            self.assertIn('@media(max-width:370px){.gBrandImage{width:118px}}', text, page)
            self.assertNotIn("gBrandTile", text, page)
            self.assertNotIn("gBrandGlyph", text, page)
            self.assertNotIn("gBrandBeam", text, page)
            self.assertNotIn("gBrandName", text, page)
            self.assertNotIn("gBrandTagline", text, page)
            self.assertNotIn('src="assets/cinemap-logo.png?v=2"', text, page)

            lockup = f'<a class="gBrand" href="index.html" aria-label="Cinelva"><img class="gBrandImage" src="{ICON_ASSET}" alt=""><span class="gBrandWord">Cinelva</span></a>'
            self.assertGreaterEqual(text.count(lockup), 1 if page == "my-cinemap.html" else 2, page)

    def test_primary_pages_use_uploaded_icon_asset(self):
        for page in PAGES:
            text = (ROOT / page).read_text(encoding="utf-8")
            self.assertIn(f'rel="icon" href="{ICON_ASSET}" type="image/png"', text, page)
            self.assertIn(f'rel="apple-touch-icon" href="{ICON_ASSET}"', text, page)
            self.assertIn('rel="manifest" href="manifest.webmanifest"', text, page)
            self.assertIn('name="theme-color" content="#0a0c0f"', text, page)


    def test_backup_routes_use_original_symbol_and_live_cinelva_wordmark(self):
        for page in ["data-backup.html", "cinelva/data-backup.html"]:
            text = (ROOT / page).read_text(encoding="utf-8")
            self.assertIn(f'<img src="{ICON_ASSET}" alt="">', text, page)
            self.assertIn('<span>Cinelva</span>', text, page)
            self.assertNotIn(f'src="{BRAND_ASSET}"', text, page)

    def test_all_non_ocean_html_routes_include_approved_symbol(self):
        pages = list(ROOT.glob("*.html")) + list((ROOT / "cinelva").glob("*.html")) + list((ROOT / "my-cinelva").glob("*.html"))
        self.assertGreaterEqual(len(pages), 29)
        for page in pages:
            self.assertIn(ICON_ASSET, page.read_text(encoding="utf-8"), str(page))

    def test_my_cinelva_page_uses_approved_symbol_and_wordmark(self):
        text = (ROOT / "my-cinelva/index.html").read_text(encoding="utf-8")
        self.assertIn(f'<img class="gBrandImage" src="../{ICON_ASSET}" alt="">', text)
        self.assertIn('class="gBrandWord">Cinelva</span>', text)
        self.assertNotIn(f'src="{BRAND_ASSET}"', text)

    def test_visible_brand_copy_has_no_retired_cinemap_wordmark(self):
        pages = list(ROOT.glob("*.html")) + list((ROOT / "cinelva").glob("*.html")) + list((ROOT / "my-cinelva").glob("*.html"))
        self.assertGreaterEqual(len(pages), 20)
        for page in pages:
            parser = VisibleCopyParser()
            parser.feed(page.read_text(encoding="utf-8"))
            visible = " ".join(parser.copy)
            self.assertNotIn("Cinemap", visible, str(page))
            self.assertNotIn("CINEMAP", visible, str(page))
            # CINELVA is the current product name; the approved visual wordmark is checked separately.

    def test_retired_ocean_is_not_user_facing_in_backup_or_my_page(self):
        for page in ["data-backup.html", "cinelva/data-backup.html", "cinelva/my-cinemap.html"]:
            parser = VisibleCopyParser()
            parser.feed((ROOT / page).read_text(encoding="utf-8"))
            visible = " ".join(parser.copy).lower()
            self.assertNotIn("ocean", visible, page)
            self.assertNotIn("aquarium", visible, page)

    def test_all_non_ocean_routes_share_pwa_and_open_graph_icon_metadata(self):
        pages = list(ROOT.glob("*.html")) + list((ROOT / "cinelva").glob("*.html")) + list((ROOT / "my-cinelva").glob("*.html"))
        self.assertGreaterEqual(len(pages), 29)
        for page in pages:
            relative = page.relative_to(ROOT).as_posix()
            prefix = "../" if relative.startswith(("cinelva/", "my-cinelva/")) else ""
            text = page.read_text(encoding="utf-8")
            self.assertIn(f'<link rel="icon" href="{prefix}{ICON_ASSET}" type="image/png">', text, relative)
            self.assertIn(f'<link rel="apple-touch-icon" href="{prefix}{ICON_ASSET}">', text, relative)
            self.assertIn(f'<link rel="manifest" href="{prefix}manifest.webmanifest">', text, relative)
            self.assertIn('name="theme-color" content="#0a0c0f"', text, relative)
            self.assertIn('property="og:image" content="https://cinelva.vercel.app/' + ICON_ASSET + '"', text, relative)

    def test_uploaded_brand_assets_exist(self):
        self.assertTrue((ROOT / BRAND_ASSET).exists())
        self.assertTrue((ROOT / ICON_ASSET).exists())

    def test_my_cinemap_export_keeps_existing_canvas_brand(self):
        text = (ROOT / "js/my-cinemap-art.js").read_text(encoding="utf-8")
        self.assertIn("function drawBrand", text)
        self.assertIn("EXPLORE CINEMA", text)

    def test_manifest_is_cinelva_branded_with_existing_symbol(self):
        manifest = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
        self.assertEqual(manifest["name"], "Cinelva")
        self.assertEqual(manifest["short_name"], "Cinelva")
        self.assertTrue(all(item["src"] == ICON_ASSET for item in manifest["icons"]))
        self.assertEqual(manifest["theme_color"], "#0a0c0f")

if __name__ == "__main__":
    unittest.main()
