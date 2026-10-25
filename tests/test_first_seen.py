"""First inclusion is observed ranking history, never repository creation time."""
import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from scripts import update_rankings as rankings


class FirstSeenTest(unittest.TestCase):
    def annotate(self, data, history, registry=None):
        self.assertTrue(hasattr(rankings, 'annotate_first_seen'), 'first-seen annotation is missing')
        return rankings.annotate_first_seen(data, history, registry)

    def test_initial_history_marks_only_global_first_snapshot_as_baseline(self):
        data = {'metadata': {'generated_at': '2026-10-25T00:30:00Z'}, 'items': [
            {'repo': 'a/old', 'created_date': '2026-10-24'},
            {'repo': 'b/new', 'created_date': '2020-01-01'},
            {'repo': 'c/today'},
        ]}
        registry = self.annotate(data, {
            '2026-10-24': {'b/new': {}, 'a/old': {}},
            '2026-08-29': {'a/old': {}},
        })
        self.assertEqual([(i['first_seen_date'], i['first_seen_is_baseline']) for i in data['items']],
                         [('2026-08-29', True), ('2026-10-24', False), ('2026-10-25', False)])
        self.assertEqual(registry['baseline_date'], '2026-08-29')
        self.assertEqual(data['metadata']['first_seen_baseline_date'], '2026-08-29')

    def test_registry_survives_pruning_absence_and_case_change(self):
        initial = {'metadata': {'generated_at': '2026-08-29T12:00:00Z'}, 'items': [{'repo': 'A/Old'}]}
        registry = self.annotate(initial, {})
        absent = {'metadata': {'generated_at': '2026-11-01T12:00:00Z'}, 'items': []}
        registry = self.annotate(absent, {}, registry)
        returning = {'metadata': {'generated_at': '2026-12-01T12:00:00Z'}, 'items': [{'repo': 'a/old'}, {'repo': 'b/new'}]}
        self.annotate(returning, {'2026-11-30': {}}, registry)
        self.assertEqual(returning['items'][0]['first_seen_date'], '2026-08-29')
        self.assertTrue(returning['items'][0]['first_seen_is_baseline'])
        self.assertEqual(returning['items'][1]['first_seen_date'], '2026-12-01')
        self.assertFalse(returning['items'][1]['first_seen_is_baseline'])

    def test_without_history_first_observation_is_conservative_baseline(self):
        data = {'metadata': {'generated_at': '2026-10-25T00:30:00+08:00'}, 'items': [{'repo': 'a/old'}]}
        self.annotate(data, {})
        self.assertEqual(data['items'][0]['first_seen_date'], '2026-10-24')
        self.assertTrue(data['items'][0]['first_seen_is_baseline'])

    def test_invalid_dates_are_rejected(self):
        for history, generated in [({'2026-02-30': {}}, '2026-10-25T00:00:00Z'),
                                   ({'20261024': {}}, '2026-10-25T00:00:00Z'),
                                   ({}, 'not-a-date')]:
            with self.subTest(history=history, generated=generated), self.assertRaises(ValueError):
                self.annotate({'metadata': {'generated_at': generated}, 'items': []}, history)

    def test_new_item_uses_utc_snapshot_date(self):
        data = {'metadata': {'generated_at': '2026-10-25T00:30:00+08:00'}, 'items': [{'repo': 'b/new'}]}
        self.annotate(data, {'2026-10-23': {'a/old': {}}})
        self.assertEqual(data['items'][0]['first_seen_date'], '2026-10-24')

    def test_offline_backfill_persists_registry_without_modifying_snapshot_timestamp(self):
        self.assertTrue(hasattr(rankings, 'backfill_first_seen'), 'offline backfill is missing')
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            dataset = root / 'rankings.json'
            data_js = root / 'rankings.js'
            registry = root / 'first-seen.json'
            dataset.write_text(json.dumps({'metadata': {'generated_at': '2026-10-25T00:00:00Z'}, 'items': [{'repo': 'a/old'}]}))
            with patch.object(rankings, 'DATA_PATH', dataset), patch.object(rankings, 'DATA_JS_PATH', data_js), \
                 patch.object(rankings, 'FIRST_SEEN_PATH', registry), patch.object(rankings, 'HISTORY_DIR', root / 'missing'):
                rankings.backfill_first_seen()
            result = json.loads(dataset.read_text())
            self.assertEqual(result['metadata']['generated_at'], '2026-10-25T00:00:00Z')
            self.assertTrue(result['items'][0]['first_seen_is_baseline'])
            self.assertEqual(json.loads(registry.read_text())['baseline_date'], '2026-10-25')
            self.assertIn('"first_seen_date":"2026-10-25"', data_js.read_text())

    def test_dataset_saves_lifetime_registry_before_history_is_pruned(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            history = root / 'history'
            history.mkdir()
            old_snapshot = history / '2026-08-01.json'
            old_snapshot.write_text(json.dumps({'items': [{'repo': 'example/academic-paper-skills'}]}))
            repos = json.loads((Path(__file__).parent / 'fixture.json').read_text())
            with patch.object(rankings, 'HISTORY_DIR', history), \
                 patch.object(rankings, 'FIRST_SEEN_PATH', root / 'first-seen.json'), \
                 patch.object(rankings, 'load_previous_snapshot', return_value={}), \
                 patch.object(rankings, 'utc_now', return_value=datetime(2026, 10, 25, tzinfo=timezone.utc)):
                result, _ = rankings.build_dataset({'min_stars': 100}, repos, enrich_skills=False)
            item = next(item for item in result['items'] if item['repo'] == 'example/academic-paper-skills')
            self.assertEqual(item['first_seen_date'], '2026-08-01')
            self.assertTrue(item['first_seen_is_baseline'])
            self.assertFalse(old_snapshot.exists())
            saved = json.loads((history / '2026-10-25.json').read_text())
            saved_item = next(item for item in saved['items'] if item['repo'] == 'example/academic-paper-skills')
            self.assertEqual(saved_item['first_seen_date'], '2026-08-01')
            registry = json.loads((root / 'first-seen.json').read_text())
            self.assertEqual(registry['repositories']['example/academic-paper-skills']['first_seen_date'], '2026-08-01')


if __name__ == '__main__':
    unittest.main()
