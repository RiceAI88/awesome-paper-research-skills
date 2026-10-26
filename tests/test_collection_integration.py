import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch
from scripts import update_rankings as updater
from scripts import collection


class CollectionIntegrationTest(unittest.TestCase):
    def test_failed_collection_does_not_build_or_overwrite_published_data(self):
        result = collection.CollectionResult([], {}, {"fatal": True})
        with patch('sys.argv', ['update_rankings.py']), patch.object(updater, 'collect_repositories', return_value=result), patch.object(updater, 'write_collection_state') as report, patch.object(updater, 'build_dataset') as build, patch.object(updater, 'write_outputs') as write:
            self.assertEqual(updater.main(), 1)
            build.assert_not_called()
            write.assert_not_called()
            report.assert_called_once_with(result)

    def test_pending_data_is_not_a_new_history_observation_and_recovery_fills_gap(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(updater, 'HISTORY_DIR', Path(directory)):
            today = datetime(2026, 10, 26, tzinfo=timezone.utc)
            data = {'metadata': {'total': 2}, 'items': [{'repo': 'a/research', 'stars': 100}, {'repo': 'b/research', 'stars': 120, 'refresh_status': 'pending'}]}
            updater.save_history_snapshot(data, today)
            data['items'] = [{'repo': 'a/research', 'stars': 999}, {'repo': 'b/research', 'stars': 125, 'refresh_status': 'fresh'}]
            updater.save_history_snapshot(data, today)
            snapshot = json.loads((Path(directory) / '2026-10-26.json').read_text())
            self.assertEqual({row['repo']: row['stars'] for row in snapshot['items']}, {'a/research': 100, 'b/research': 125})

    def test_truncated_empty_tree_is_unknown_not_related(self):
        for tree, expected in [({'tree': [], 'truncated': True}, 'unknown'), ({'tree': [], 'truncated': False}, 'related'), ({'tree': [{'path': 'SKILL.md', 'type': 'blob'}], 'truncated': True}, 'skill')]:
            item = {'repo': 'a/research'}
            with patch.object(updater, 'github_request', return_value=tree), patch.object(updater.time, 'sleep'):
                updater.enrich_skill_counts([item], None)
            self.assertEqual(item['repository_kind'], expected)
            self.assertEqual(item['skills_count_complete'], not tree['truncated'])

    def test_history_bootstrap_preserves_auxiliary_metadata_on_request_failure(self):
        raw = collection.cached_metadata({'repo': 'a/research', 'stars': 100, 'forks': 9, 'open_issues': 3, 'watchers': 8, 'size_kb': 20, 'has_issues': True, 'license': {'spdx_id': 'MIT'}, 'homepage': 'https://example.org'})
        self.assertEqual(raw['forksCount'], 9)
        self.assertEqual(raw['license']['spdx_id'], 'MIT')
        self.assertEqual(raw['homepageUrl'], 'https://example.org')

    def test_catalog_does_not_relax_real_keyword_rules(self):
        raw = {'nameWithOwner': 'example/academic-workflow', 'stargazerCount': 500, 'description': 'academic workflow', 'isFork': False, 'isArchived': False}
        good, _ = updater.is_academic_skill_repo(raw)
        result = collection.collect({'search_queries': []}, catalog={}, previous_items={}, known_names=[raw['nameWithOwner']], fetch=lambda name: raw, search=None, eligible=updater.is_academic_skill_repo, now='2026-10-26T00:00:00Z')
        self.assertEqual(bool(result.repositories), good)

    def test_explicit_exclusion_applies_to_retained_cache(self):
        raw = {'nameWithOwner': 'example/academic-skills', 'stargazerCount': 500, 'description': 'academic skills', '_retained_pending': True}
        self.assertEqual(updater.rank_repositories([raw], excluded_repositories={'EXAMPLE/academic-skills'}), [])


if __name__ == '__main__':
    unittest.main()
