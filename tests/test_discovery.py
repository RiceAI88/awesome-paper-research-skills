import unittest
from datetime import datetime, timezone
from urllib.error import URLError
from scripts import discovery
from scripts.update_rankings import is_academic_skill_repo, rank_repositories

NOW = datetime(2026, 10, 27, 5, tzinfo=timezone.utc)
def repo(**kwargs):
    return {'nameWithOwner':'example/orion', 'stargazerCount':160, 'description':'A reusable assistant', 'pushedAt':'2026-10-26T00:00:00Z', **kwargs}

class DiscoveryTest(unittest.TestCase):
    def test_search_plan_keeps_popular_and_covers_all_star_bands_with_updated_sort(self):
        plan=discovery.search_plan({'search_queries':['academic skill'], 'min_stars':100}, NOW)
        self.assertEqual(plan[0]['sort'],'stars')
        self.assertTrue(any('pushed:>=2026-09-27' in x['query'] and x['sort']=='updated' for x in plan))
        for band in ['100..499','500..1999','2000..9999','>=10000']:
            self.assertTrue(any('stars:'+band in x['query'] and x['sort']=='updated' for x in plan))
        self.assertEqual(len({x['query'] for x in plan}),len(plan))

    def test_readme_admits_skill_hidden_by_generic_metadata_and_survives_ranking(self):
        item=repo(_readme_evidence={'status':'verified','text':'# Orion\nAgent skills for academic paper writing. Install SKILL.md in Claude Code.'})
        self.assertTrue(is_academic_skill_repo(item)[0])
        self.assertEqual(len(rank_repositories([item])),1)
        self.assertEqual(rank_repositories([item])[0]['description'],'A reusable assistant')

    def test_related_research_guide_does_not_require_skill_keywords(self):
        item=repo(description='从0开始做科研', _readme_evidence={'status':'verified','text':'# 科研入门指南\n本指南帮助研究生开展文献检索与论文写作。'})
        accepted,reasons=is_academic_skill_repo(item)
        self.assertTrue(accepted)
        self.assertIn('admission:related',reasons)

    def test_bibliography_and_generic_coding_tools_cannot_supply_academic_scope(self):
        for text in ['# Universal assistant\nA general coding tool.\n## References\nAcademic paper writing and literature review agent skills.', '# Coding agent\nProgramming assistant.\n## Acknowledgements\nResearch paper tools.']:
            self.assertFalse(is_academic_skill_repo(repo(_readme_evidence={'status':'verified','text':text}))[0])

    def test_generic_skill_catalog_cannot_borrow_a_single_linked_academic_tool(self):
        item=repo(description='Agent skills for every task', _readme_evidence={'status':'verified','text':'# Universal Skills\nA collection of coding and productivity tools.\n## Available tools\n- Academic paper writing helper'})
        self.assertFalse(is_academic_skill_repo(item)[0])

    def test_previously_admitted_document_project_survives_temporarily_missing_readme(self):
        item=repo(_readme_evidence={'status':'missing','previous_eligible':True})
        self.assertTrue(is_academic_skill_repo(item)[0])

    def test_hard_exclusions_apply_to_readme_verified_and_trusted_projects(self):
        base=repo(_readme_evidence={'status':'verified','text':'# Research tool\nAgent skills for academic paper writing.'})
        for change in [{'isFork':True},{'isArchived':True},{'stargazerCount':99}]:
            self.assertFalse(is_academic_skill_repo({**base,**change},trusted_repositories={'example/orion'})[0])

    def test_readme_budget_and_unchanged_cache_then_push_invalidation(self):
        calls=[]
        def fetch(name):
            calls.append(name); return {'text':'# Academic paper writing skills', 'sha':'abc','path':'README.md'}
        verifier=discovery.ReadmeVerifier({},fetch,now=NOW,budget=1)
        first=verifier.review(repo())
        self.assertEqual(first['status'],'verified')
        self.assertEqual(verifier.review(repo())['status'],'verified')
        self.assertEqual(len(calls),1)
        self.assertEqual(verifier.review(repo(nameWithOwner='other/new'))['status'],'deferred')
        self.assertEqual(verifier.review(repo(pushedAt='2026-10-27T00:00:00Z'))['status'],'deferred')

    def test_readme_failures_are_pending_not_verified(self):
        def fail(name): raise URLError('limited')
        verifier=discovery.ReadmeVerifier({},fail,now=NOW,budget=1)
        self.assertEqual(verifier.review(repo())['status'],'pending')
        self.assertEqual(len(verifier.records),1)

if __name__=='__main__': unittest.main()

class CollectionEvidenceIntegrationTest(unittest.TestCase):
    def test_readme_evidence_survives_collection_ranking_and_cached_refresh(self):
        import tempfile, json, base64
        from pathlib import Path
        from unittest.mock import patch
        from scripts import update_rankings as u
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            (root/'history').mkdir()
            catalog=root/'catalog.json'
            config={'min_stars':100,'seed_repositories':['example/orion'],'search_queries':[], 'discovery':{'queries':[],'readme_budget':1}}
            response={'encoding':'base64','content':base64.b64encode(b'# Orion\nAgent skills for academic paper writing.').decode(),'sha':'abc','path':'README.md'}
            with patch.object(u,'HISTORY_DIR',root/'history'),patch.object(u,'DATA_PATH',root/'data.json'),patch.object(u,'CATALOG_PATH',catalog),patch.object(u,'FIRST_SEEN_PATH',root/'first.json'),patch.object(u,'fetch_repository',return_value=repo()),patch.object(u,'github_request',return_value=response) as request,patch.object(u.time,'sleep'),patch.object(u,'utc_now',return_value=NOW):
                first=u.collect_repositories(config,None)
                self.assertEqual(len(first.repositories),1)
                self.assertEqual(first.report['readme_budget']['used'],1)
                self.assertEqual(len(u.rank_repositories(first.repositories)),1)
                catalog.write_text(json.dumps(first.catalog))
                request.reset_mock()
                cached=u.collect_repositories(config,None)
                self.assertEqual(len(cached.repositories),1)
                self.assertEqual(cached.report['readme_budget']['used'],0)
                request.assert_not_called()

class ReviewRegressionTest(unittest.TestCase):
    def collect(self, catalog, candidates, *, direct=None, readme=None, now=NOW, budget=1):
        import tempfile,json,base64
        from pathlib import Path
        from unittest.mock import patch
        from contextlib import ExitStack
        from scripts import update_rankings as u,collection
        with tempfile.TemporaryDirectory() as temp, ExitStack() as stack:
            root=Path(temp); (root/'history').mkdir(); (root/'catalog.json').write_text(json.dumps(catalog))
            for field,path in [('HISTORY_DIR',root/'history'),('DATA_PATH',root/'missing'),('FIRST_SEEN_PATH',root/'first'),('CATALOG_PATH',root/'catalog.json')]:stack.enter_context(patch.object(u,field,path))
            stack.enter_context(patch.object(u,'utc_now',return_value=now)); stack.enter_context(patch.object(u.time,'sleep'))
            stack.enter_context(patch.object(u,'fetch_repository',side_effect=lambda name,token:(direct or (lambda name:repo(nameWithOwner=name)))(name)))
            stack.enter_context(patch.object(u,'search_repositories',return_value=collection.SearchResult(candidates,len(candidates))))
            stack.enter_context(patch.object(u.discovery,'search_plan',return_value=[{'query':'test','sort':'updated','max_pages':1,'strategy':'recent'}]))
            def response(path,token):
                text=readme(path) if readme else '# Academic tool\nAgent skills for academic paper writing.'
                return {'encoding':'base64','content':base64.b64encode(text.encode()).decode(),'sha':'abc','path':'README.md'}
            request=stack.enter_context(patch.object(u,'github_request',side_effect=response))
            result=u.collect_repositories({'min_stars':100,'discovery':{'readme_budget':budget}},None)
            return result,request.call_count

    def test_newly_verified_metadata_matching_project_rechecks_after_push(self):
        item=repo(description='Academic paper writing skill')
        first,_=self.collect({},[item])
        self.assertTrue(first.repositories)
        newer=repo(description='Academic paper writing skill',pushedAt='2026-10-27T01:00:00Z')
        second,calls=self.collect(first.catalog,[],direct=lambda name:newer)
        self.assertEqual(calls,1)
        self.assertIn('_readme_evidence',second.repositories[0])

    def test_failed_candidate_cannot_starve_unreviewed_candidate_on_next_run(self):
        from datetime import timedelta
        items=[repo(nameWithOwner='a/fail',description='Academic paper writing skill'),repo(nameWithOwner='b/valid')]
        def readme(path):
            if '/a/fail/' in path:raise URLError('offline')
            return '# Research guide\nA guide to academic paper writing.'
        first,_=self.collect({},items,readme=readme)
        second,_=self.collect(first.catalog,items,readme=readme,now=NOW+timedelta(days=1))
        self.assertEqual([r['nameWithOwner'] for r in second.repositories],['b/valid'])

    def test_rename_with_readme_failure_retains_identity_across_subsequent_refresh(self):
        from scripts import update_rankings as u
        old=repo(nameWithOwner='a/old')
        old['_readme_evidence']={'status':'verified','text':'# Research guide\nA guide to academic paper writing.','checked_at':'2026-10-25T00:00:00Z','pushed_at':old['pushedAt']}
        catalog={'repositories':{'a/old':{'eligible':True,'status':'active','metadata':old}}}
        renamed=repo(nameWithOwner='b/new',pushedAt='2026-10-27T02:00:00Z')
        def fail(path):raise URLError('offline')
        first,_=self.collect(catalog,[],direct=lambda name:renamed.copy(),readme=fail)
        self.assertEqual(len(first.repositories),1)
        second,_=self.collect(first.catalog,[],direct=lambda name:renamed.copy())
        data={'metadata':{'generated_at':'2026-10-27T05:00:00Z'},'items':u.rank_repositories(second.repositories)}
        registry={'baseline_date':'2026-10-24','repositories':{'a/old':{'first_seen_date':'2026-10-25','first_seen_is_baseline':False}}}
        u.annotate_first_seen(data,{},registry)
        self.assertEqual(data['items'][0]['first_seen_date'],'2026-10-25')

    def test_link_lists_and_third_level_headings_cannot_supply_own_purpose(self):
        for tail in ['### Available tools\n- [Academic paper writing helper](https://example.org)', '- [Academic paper writing helper](https://example.org)']:
            item=repo(_readme_evidence={'status':'verified','text':'# Universal skills\nA collection of coding skills.\n'+tail})
            self.assertFalse(is_academic_skill_repo(item)[0])
