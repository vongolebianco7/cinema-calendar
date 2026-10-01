import unittest

try:
    from scripts.ci_touched_areas import classify_paths
except ModuleNotFoundError:
    classify_paths = None


class TouchedAreaTests(unittest.TestCase):
    def test_known_product_paths_map_to_stable_areas(self):
        self.assertIsNotNone(classify_paths, "scripts.ci_touched_areas must exist")
        self.assertEqual(classify_paths(["discover.html"]), {"discover"})
        self.assertEqual(classify_paths(["search.html"]), {"movie-detail"})
        self.assertEqual(classify_paths(["my-cinemap.html"]), {"my-cinemap"})
        self.assertEqual(classify_paths(["critic.html", "data/critic_evidence.json"]), {"critic", "data-quality"})
        self.assertEqual(classify_paths(["js/ocean-photo-renderer.js"]), {"ocean"})

    def test_shared_navigation_or_unknown_product_path_is_conservative(self):
        self.assertIsNotNone(classify_paths, "scripts.ci_touched_areas must exist")
        self.assertEqual(classify_paths(["js/global-nav.js"]), {"all"})
        self.assertEqual(classify_paths(["mystery-product-file.html"]), {"all"})

    def test_docs_only_changes_do_not_claim_product_area(self):
        self.assertIsNotNone(classify_paths, "scripts.ci_touched_areas must exist")
        self.assertEqual(classify_paths(["docs/notes.md"]), set())


if __name__ == "__main__":
    unittest.main()
