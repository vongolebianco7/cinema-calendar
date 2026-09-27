from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGES = ["index.html", "discover.html", "experience.html", "my-cinemap.html", "search.html", "rankings.html", "critic.html", "revivals.html", "theaters.html"]
BRAND_ASSET = "assets/08AF5B56-A987-4D6E-A04C-D20E40483567.png"
ICON_ASSET = "assets/411DC24B-E557-4A36-95D2-5FA3550E7BD7.png"

class BrandIdentityTests(unittest.TestCase):
    def test_primary_pages_use_image_based_b_lockup(self):
        for page in PAGES:
            text = (ROOT / page).read_text(encoding="utf-8")
            self.assertIn("cinemap-brand-image-v3", text, page)
            self.assertIn("gBrandImage", text, page)
            self.assertGreaterEqual(text.count(BRAND_ASSET), 2, page)
            self.assertIn('.gNav{height:56px!important;gap:8px!important}', text, page)
            self.assertIn('.gBrandImage{display:block;width:132px;height:auto;max-width:none}', text, page)
            self.assertIn('@media(max-width:370px){.gBrandImage{width:118px}}', text, page)
            self.assertNotIn("gBrandTile", text, page)
            self.assertNotIn("gBrandGlyph", text, page)
            self.assertNotIn("gBrandBeam", text, page)
            self.assertNotIn("gBrandName", text, page)
            self.assertNotIn("gBrandTagline", text, page)
            self.assertNotIn('src="assets/cinemap-logo.png?v=2"', text, page)

            lockup = f'<a class="gBrand" href="index.html" aria-label="Cinemap"><img class="gBrandImage" src="{BRAND_ASSET}" alt="Cinemap"></a>'
            self.assertGreaterEqual(text.count(lockup), 2, page)

    def test_primary_pages_use_uploaded_icon_asset(self):
        for page in PAGES:
            text = (ROOT / page).read_text(encoding="utf-8")
            self.assertIn(f'rel="icon" href="{ICON_ASSET}" type="image/png"', text, page)
            self.assertIn(f'rel="apple-touch-icon" href="{ICON_ASSET}"', text, page)
            self.assertIn('rel="manifest" href="manifest.webmanifest"', text, page)
            self.assertIn('name="theme-color" content="#0a0c0f"', text, page)

    def test_uploaded_brand_assets_exist(self):
        self.assertTrue((ROOT / BRAND_ASSET).exists())
        self.assertTrue((ROOT / ICON_ASSET).exists())

    def test_my_cinemap_export_keeps_existing_canvas_brand(self):
        text = (ROOT / "js/my-cinemap-art.js").read_text(encoding="utf-8")
        self.assertIn("function drawBrand", text)
        self.assertIn("EXPLORE CINEMA", text)

    def test_manifest_is_cinemap_branded(self):
        manifest = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
        self.assertEqual(manifest["name"], "Cinemap")
        self.assertEqual(manifest["short_name"], "Cinemap")
        self.assertEqual(manifest["theme_color"], "#0a0c0f")

if __name__ == "__main__":
    unittest.main()
