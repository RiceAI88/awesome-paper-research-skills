import unittest
import urllib.error
from scripts import collection


def repo(name="example/research-skills", stars=147, **extra):
    return {"nameWithOwner": name, "description": "Academic research skills for Claude Code", "stargazerCount": stars, "isArchived": False, "isFork": False, **extra}


def eligible(item):
    reasons = [key for key, bad in [("below_min_stars", item["stargazerCount"] < 100), ("archived", item.get("isArchived")), ("fork", item.get("isFork"))] if bad]
    return not reasons, reasons


class CollectionTest(unittest.TestCase):
    def collect(self, fetch=lambda name: repo(name), search=lambda query: collection.SearchResult([], 0), catalog=None, **kwargs):
        return collection.collect(
            {"seed_repositories": [], "search_queries": ["academic skill"], "exclude_repositories": []},
            catalog=catalog or {}, previous_items={"example/research-skills": {"repo": "example/research-skills", "stars": 147, "description": "Academic research skills for Claude Code", "_observed_at": "2026-10-25T00:00:00Z"}},
            known_names=["example/research-skills"], fetch=fetch, search=search, eligible=eligible, now="2026-10-26T00:00:00Z", **kwargs,
        )

    def test_known_repository_survives_search_page_201_omission(self):
        result = self.collect()
        self.assertEqual([r["nameWithOwner"] for r in result.repositories], ["example/research-skills"])
        self.assertEqual(result.report["status"], "complete")

    def test_temporary_fetch_errors_retain_cached_records_without_fresh_timestamp(self):
        for code in [404, 403, 429, 503]:
            def fail(name):
                raise urllib.error.HTTPError("https://api.github.com/repos/" + name, code, "unavailable", {}, None)
            result = self.collect(fetch=fail)
            cached = result.repositories[0]
            self.assertTrue(cached["_retained_pending"])
            self.assertEqual(cached["_metadata_checked_at"], "2026-10-25T00:00:00Z")
            self.assertTrue(result.report["fatal"])
            self.assertIn(str(code), result.report["pending"][0]["reason"])

    def test_confirmed_archival_removes_and_records_reason(self):
        result = self.collect(fetch=lambda name: repo(name, isArchived=True))
        self.assertEqual(result.repositories, [])
        self.assertEqual(result.report["rejected"][0]["reasons"], ["archived"])
        self.assertFalse(result.report["fatal"])

    def test_search_failure_is_reported_but_does_not_delete_known_repository(self):
        def fail(query):
            raise urllib.error.URLError("offline")
        result = self.collect(search=fail)
        self.assertEqual(len(result.repositories), 1)
        self.assertEqual(result.report["status"], "partial")
        self.assertFalse(result.report["fatal"])

    def test_incomplete_search_marks_partial_and_can_add_confirmed_candidates(self):
        result = self.collect(search=lambda query: collection.SearchResult([repo("new/academic-skills", 500)], 800, True))
        self.assertEqual(len(result.repositories), 2)
        self.assertEqual(result.report["status"], "partial")
        self.assertTrue(result.report["searches"][0]["incomplete"])

    def test_known_fresh_metadata_wins_over_search_metadata(self):
        result = self.collect(fetch=lambda name: repo(name, 180), search=lambda query: collection.SearchResult([repo(stars=130)], 1))
        self.assertEqual(result.repositories[0]["stargazerCount"], 180)

    def test_cached_entries_do_not_become_trusted_seeds(self):
        result = self.collect()
        self.assertNotIn("trusted_seed", result.repositories[0])

    def test_renames_deduplicate_and_record_alias(self):
        result = self.collect(fetch=lambda name: repo("new/research-skills"))
        self.assertEqual(len(result.repositories), 1)
        self.assertEqual(result.catalog["repositories"]["example/research-skills"]["alias_of"], "new/research-skills")
        self.assertEqual(result.repositories[0]["_previous_names"], ["example/research-skills"])

    def test_search_caps_are_audited_without_marking_valid_collection_as_failed(self):
        result = self.collect(search=lambda query: collection.SearchResult([], 900, False, True))
        self.assertEqual(result.report["status"], "complete")
        self.assertTrue(result.report["searches"][0]["limit_reached"])


class CanonicalPriorityTest(unittest.TestCase):
    def collect(self, fetch, search, catalog=None, known=None):
        return collection.collect({"search_queries": ["research"]}, catalog=catalog or {}, previous_items={}, known_names=known or ["old/research-skills"], fetch=fetch, search=search, eligible=eligible, now="2026-10-26T00:00:00Z")

    def test_confirmed_archive_after_rename_cannot_be_reintroduced_by_stale_search(self):
        result = self.collect(lambda name: repo("new/research-skills", isArchived=True), lambda query: collection.SearchResult([repo("new/research-skills")], 1))
        self.assertEqual(result.repositories, [])

    def test_canonical_name_is_not_fetched_again_after_redirect_confirmation(self):
        calls = []
        def fetch(name):
            calls.append(name)
            if len(calls) > 1:
                raise urllib.error.URLError("offline")
            return repo("z/research-skills", 180)
        result = self.collect(fetch, lambda query: collection.SearchResult([], 0), known=["a/research-skills", "z/research-skills"])
        self.assertEqual(calls, ["a/research-skills"])
        self.assertEqual(result.repositories[0]["stargazerCount"], 180)
        self.assertFalse(result.repositories[0].get("_retained_pending"))

    def test_rejected_discovery_candidates_do_not_expand_daily_direct_fetches(self):
        calls = []
        catalog = {"repositories": {"generic/chatbot": {"eligible": False, "status": "excluded", "metadata": repo("generic/chatbot")}}}
        result = self.collect(lambda name: calls.append(name) or repo(name), lambda query: collection.SearchResult([], 0), catalog=catalog)
        self.assertEqual(calls, ["old/research-skills"])
        self.assertIn("generic/chatbot", result.catalog["repositories"])

    def test_confirmed_removal_is_not_repeated_from_historical_cache(self):
        name = 'old/research-skills'
        catalog = {'repositories': {name: {'eligible': False, 'status': 'excluded', 'metadata': repo(name, isArchived=True)}}}
        result = collection.collect({'search_queries': []}, catalog=catalog, previous_items={name: {'repo': name, 'stars': 147}}, known_names=[name], fetch=lambda name: repo(name, isArchived=True), search=None, eligible=eligible, now='2026-10-26T00:00:00Z')
        self.assertEqual(result.report['changes'], [])


if __name__ == "__main__":
    unittest.main()
