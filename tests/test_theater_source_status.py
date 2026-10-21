import ast
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class TheaterSourceStatus(unittest.TestCase):
    def test_updaters_compile_without_running_network_collection(self):
        for name in ('update_theaters_osm.py', 'update_theater_master.py'):
            path = ROOT / 'scripts' / name
            compile(path.read_text(), str(path), 'exec')

    def test_osm_closed_tags_are_excluded_without_guessing_missing_status(self):
        path = ROOT / 'scripts/update_theaters_osm.py'
        tree = ast.parse(path.read_text())
        function = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == 'is_closed')
        namespace = {}
        exec(compile(ast.Module(body=[function], type_ignores=[]), str(path), 'exec'), namespace)
        closed = namespace['is_closed']
        for tags in ({'disused': 'yes'}, {'closed': 'true'}, {'demolished:amenity': 'cinema'}):
            self.assertTrue(closed(tags))
        for tags in ({}, {'amenity': 'cinema'}, {'closed': 'no'}, {'disused:amenity': 'shop'}):
            self.assertFalse(closed(tags))

    def test_osm_identity_does_not_depend_on_missing_or_rounded_coordinates(self):
        path = ROOT / 'scripts/update_theaters_osm.py'
        tree = ast.parse(path.read_text())
        function = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == 'source_identity')
        namespace = {}
        exec(compile(ast.Module(body=[function], type_ignores=[]), str(path), 'exec'), namespace)
        identity = namespace['source_identity']
        self.assertNotEqual(identity({'type': 'node', 'id': 1, 'name': 'Cinema'}), identity({'type': 'node', 'id': 2, 'name': 'Cinema'}))
        self.assertNotEqual(identity({'type': 'node', 'id': 1}), identity({'type': 'way', 'id': 1}))
        self.assertIsNone(identity({'name': 'Cinema'}))


if __name__ == '__main__':
    unittest.main()
