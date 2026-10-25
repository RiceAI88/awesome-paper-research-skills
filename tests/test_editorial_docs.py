"""Editorial document checks compare reviewed content, never whole-repo activity."""
import unittest
import urllib.error

from scripts import check_editorial_docs as monitor


REPO = 'example/research'
OLD = 'a' * 40
NEW = 'b' * 40
COMMIT = 'c' * 40


def manifest():
    return {'repos': {REPO: {'reviewed_at': '2026-10-25', 'documents': [{
        'path': 'README.md', 'ref': 'main', 'blob_sha': OLD,
        'reviewed_commit': COMMIT,
        'source_url': f'https://github.com/{REPO}/blob/{COMMIT}/README.md',
    }]}}}


def response(blob=OLD, commit='d' * 40):
    def fetch(url):
        if '/commits/' in url:
            return {'sha': commit}
        if '/contents/' in url:
            return {'type': 'file', 'sha': blob}
        raise AssertionError(url)
    return fetch


class EditorialDocumentTests(unittest.TestCase):
    def check(self, fetch=None, previous=None, baseline=None):
        return monitor.check_documents(baseline or manifest(), fetch or response(), previous)['repos'][REPO]

    def test_unchanged_content_is_current(self):
        result = self.check()
        self.assertEqual(result['status'], 'current')
        self.assertFalse(result['needs_review'])
        self.assertEqual(result['documents'][0]['current_blob_sha'], OLD)

    def test_changed_content_requires_review_and_compare_link(self):
        result = self.check(response(NEW))
        self.assertEqual(result['status'], 'changed')
        self.assertTrue(result['needs_review'])
        self.assertEqual(result['documents'][0]['status'], 'changed')
        self.assertIn(f'{COMMIT}...'+ 'd' * 40, result['documents'][0]['diff_url'])

    def test_removed_document_requires_review(self):
        def fetch(url):
            if '/commits/' in url:
                return {'sha': 'd' * 40}
            raise urllib.error.HTTPError(url, 404, 'Not Found', {}, None)
        result = self.check(fetch)
        self.assertEqual(result['status'], 'changed')
        self.assertEqual(result['documents'][0]['status'], 'removed')
        self.assertTrue(result['needs_review'])

    def test_rate_limit_and_network_error_are_not_current(self):
        for error in (urllib.error.HTTPError('https://api.github.com', 429, 'rate limited', {}, None),
                      urllib.error.HTTPError('https://api.github.com', 403, 'forbidden', {}, None),
                      urllib.error.URLError('offline')):
            with self.subTest(error=error):
                def fetch(url):
                    raise error
                result = self.check(fetch)
                self.assertEqual(result['status'], 'error')
                self.assertIsNone(result['documents'][0]['current_blob_sha'])
                self.assertFalse(result['needs_review'])

    def test_consecutive_errors_preserve_pending_for_same_baseline(self):
        previous = {'repos': {REPO: self.check(response(NEW))}}
        def fetch(url):
            raise urllib.error.URLError('offline')
        for _ in range(2):
            result = self.check(fetch, previous)
            self.assertEqual(result['status'], 'error')
            self.assertTrue(result['needs_review'])
            previous = {'repos': {REPO: result}}

    def test_new_reviewed_baseline_does_not_inherit_old_pending(self):
        previous = {'repos': {REPO: self.check(response(NEW))}}
        revised = manifest()
        revised['repos'][REPO]['documents'][0]['blob_sha'] = NEW
        def fetch(url):
            raise urllib.error.URLError('offline')
        self.assertFalse(self.check(fetch, previous, revised)['needs_review'])

    def test_unrelated_code_commit_does_not_require_review(self):
        self.assertFalse(self.check(response(OLD, 'e' * 40))['needs_review'])

    def test_invalid_manifest_rejected_before_fetch(self):
        bad = manifest()
        bad['repos'][REPO]['documents'][0]['path'] = '../secret'
        with self.assertRaises(ValueError):
            self.check(baseline=bad)
        bad = manifest()
        bad['repos'][REPO]['documents'][0]['source_url'] = 'https://evil.test/README.md'
        with self.assertRaises(ValueError):
            self.check(baseline=bad)

    def test_default_branch_is_resolved_when_ref_omitted(self):
        baseline = manifest()
        del baseline['repos'][REPO]['documents'][0]['ref']
        def fetch(url):
            if url.endswith('/repos/example/research'):
                return {'default_branch': 'master'}
            if '/commits/master' in url:
                return {'sha': 'd' * 40}
            if '/contents/README.md?ref=' in url:
                return {'type': 'file', 'sha': OLD}
            raise AssertionError(url)
        self.assertEqual(self.check(fetch, baseline=baseline)['status'], 'current')

    def test_summary_surfaces_changed_paths_and_compare_link(self):
        report = monitor.check_documents(manifest(), response(NEW))
        summary = monitor.render_summary(report)
        self.assertIn('README.md', summary)
        self.assertIn('/compare/', summary)
        self.assertIn('changed', summary)


if __name__ == '__main__':
    unittest.main()
