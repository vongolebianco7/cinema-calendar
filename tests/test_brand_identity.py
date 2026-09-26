from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGES = ["index.html", "discover.html", "experience.html", "my-cinemap.html", "search.html", "rankings.html", "critic.html", "revivals.html", "theaters.html"]

class BrandIdentityTests(unittest.TestCase):
    def test_primary_pages_use_new_cinemap_wordmark(self):
        for page in PAGES:
            text = (ROOT / page).read_text(encoding="utf-8")
            self.assertIn("gBrandName", text, page)
            self.assertIn("gBrandTagline", text, page)
            self.assertIn("EXPLORE CINEMA", text, page)
            self.assertNotIn('src="assets/cinemap-logo.png?v=2"', text, page)
            self.assertNotIn('.brandA:after{content:""', text, page)

    def test_my_cinemap_export_uses_current_brand(self):
        text = (ROOT / "js/my-cinemap-art.js").read_text(encoding="utf-8")
        self.assertNotIn("assets/cinemap-logo.png?v=2", text)
        self.assertIn("EXPLORE CINEMA", text)
        self.assertIn("Cinemap", text)

    def test_primary_pages_reference_brand_assets(self):
        for page in PAGES:
            text = (ROOT / page).read_text(encoding="utf-8")
            self.assertIn('rel="icon" href="favicon.svg"', text, page)
            self.assertIn('rel="apple-touch-icon" href="apple-touch-icon.png"', text, page)
            self.assertIn('rel="manifest" href="manifest.webmanifest"', text, page)
            self.assertIn('name="theme-color" content="#0a0c0f"', text, page)

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
