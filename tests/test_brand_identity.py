from pathlib import Path
import json
import unittest

# Regression contract for the deployed B (Outline Tile) brand treatment.
ROOT = Path(__file__).resolve().parents[1]
PAGES = ["index.html", "discover.html", "experience.html", "my-cinemap.html", "search.html", "rankings.html", "critic.html", "revivals.html", "theaters.html"]

class BrandIdentityTests(unittest.TestCase):
    def test_primary_pages_use_approved_outline_tile_wordmark(self):
        for page in PAGES:
            text = (ROOT / page).read_text(encoding="utf-8")
            self.assertIn("cinemap-outline-brand-v2", text, page)
            self.assertIn("gBrandTile", text, page)
            self.assertIn("gBrandGlyph", text, page)
            self.assertIn("gBrandBeam", text, page)
            self.assertIn("gBrandName", text, page)
            self.assertIn("gBrandTagline", text, page)
            self.assertIn("EXPLORE CINEMA", text, page)
            self.assertIn('flex-direction:row!important', text, page)
            self.assertIn('flex-wrap:nowrap!important', text, page)
            self.assertIn('"Bodoni 72",Didot', text, page)
            self.assertIn('rgba(255,238,204,.78)', text, page)
            self.assertNotIn('src="assets/cinemap-logo.png?v=2"', text, page)
            self.assertNotIn('.brandA:after{content:""', text, page)

            # Both the visible header and drawer must use the horizontal gBrand flex lockup.
            lockup = '<a class="gBrand" href="index.html"><span class="gBrandTile"'
            self.assertGreaterEqual(text.count(lockup), 2, page)
            self.assertNotIn('<a href="index.html"><span class="gBrandTile"', text, page)

    def test_my_cinemap_export_uses_current_outline_tile_brand(self):
        text = (ROOT / "js/my-cinemap-art.js").read_text(encoding="utf-8")
        self.assertIn("function drawBrand", text)
        self.assertIn("EXPLORE CINEMA", text)
        self.assertIn("Bodoni 72", text)
        self.assertIn("ctx.strokeRect", text)
        self.assertNotIn("assets/cinemap-logo.png?v=2", text)
        self.assertNotIn("const cinemapLogo=new Image()", text)

    def test_primary_pages_reference_brand_assets(self):
        for page in PAGES:
            text = (ROOT / page).read_text(encoding="utf-8")
            self.assertIn('rel="icon" href="favicon.svg"', text, page)
            self.assertIn('rel="apple-touch-icon" href="apple-touch-icon.png"', text, page)
            self.assertIn('rel="manifest" href="manifest.webmanifest"', text, page)
            self.assertIn('name="theme-color" content="#0a0c0f"', text, page)

    def test_favicon_uses_outline_tile(self):
        text = (ROOT / "favicon.svg").read_text(encoding="utf-8")
        self.assertIn('id="outline-tile"', text)
        self.assertIn('stroke="#ebe3d6"', text)
        self.assertIn('stop-color="#ffeccc" stop-opacity=".9"', text)
        self.assertIn("Bodoni 72,Didot", text)

    def test_manifest_is_cinemap_branded(self):
        manifest = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
        self.assertEqual(manifest["name"], "Cinemap")
        self.assertEqual(manifest["short_name"], "Cinemap")
        self.assertEqual(manifest["theme_color"], "#0a0c0f")
        self.assertTrue(any(icon.get("src") == "icon-192.png" for icon in manifest["icons"]))
        self.assertTrue(any(icon.get("src") == "icon-512.png" for icon in manifest["icons"]))

    def test_required_icon_files_exist(self):
        for path in ["favicon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png"]:
            self.assertTrue((ROOT / path).exists(), path)

if __name__ == "__main__":
    unittest.main()
