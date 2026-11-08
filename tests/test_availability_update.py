import importlib.util
import unittest
from pathlib import Path

class AvailabilityUpdateTest(unittest.TestCase):
    def test_provider_categories_keep_free_and_ads_separate(self):
        spec=importlib.util.spec_from_file_location('availability_kinds',Path('scripts/update_availability.py'))
        module=importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        region={
            'flatrate':[{'provider_name':'Netflix'}],
            'free':[{'provider_name':'ABEMA'}],
            'ads':[{'provider_name':'Hulu'}],
            'rent':[{'provider_name':'Amazon Video'}],
            'buy':[{'provider_name':'Apple TV'}],
        }
        groups=module.provider_groups(region)
        self.assertEqual(groups,{
            'flatrate':['Netflix'],
            'free':['ABEMA'],
            'ads':['Hulu'],
            'rent':['Prime Video'],
            'buy':['Apple TV+'],
        })

    def test_failed_batch_does_not_advance_last_successful_update(self):
        spec=importlib.util.spec_from_file_location('availability_update',Path('scripts/update_availability.py'))
        module=importlib.util.module_from_spec(spec)
        try: spec.loader.exec_module(module)
        except KeyError: self.fail('update module must be importable without secrets')
        self.assertTrue(callable(getattr(module,'finish_snapshot',None)))
        old={'generated_at':'2026-10-01','movies':{'1':{'checked_at':'2026-10-01'}}}
        self.assertEqual(module.finish_snapshot(old,old['movies'],0,'2026-10-17'),old)
        updated=module.finish_snapshot(old,old['movies'],1,'2026-10-17')
        self.assertEqual(updated['generated_at'],'2026-10-17')
