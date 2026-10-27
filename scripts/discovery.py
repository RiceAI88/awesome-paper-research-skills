"""Bounded discovery and auditable README evidence; no generated descriptions."""
import re
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError, URLError

QUERIES = [
    '"academic" "skill"', '"paper writing"', '"literature review"',
    '"research workflow"', '"科研"', '"论文"',
]
ACADEMIC = [
    'academic', 'research paper', 'research papers', 'paper writing', 'paper review',
    'literature review', 'literature search', 'literature discovery', 'peer review',
    'scientific research', 'scientific writing', 'research workflow', 'research guide',
    'research starter', 'phd', 'thesis', 'manuscript', 'reference manager',
    'scientific plotting', 'publication figures', 'bibliometric', 'scientometric', 'science mapping', 'academic poster', 'paper reading', 'paper management', 'citation management',
    '科研', '学术', '论文', '文献检索', '文献阅读', '文献综述', '实验复现',
]
TASK_PURPOSE = re.compile(
    r'(?:paper|academic|thesis|scientific) (?:writing|reading|review|management|search|draft|translation|plotting|poster|figure|workflow|template)'
    r'|literature (?:review|search|discovery|management|retrieval)|reference manager|citation (?:management|check|verif)|manuscript|dissertation|latex'
    r'|research workflow|scientific agent|ai scientist|autonomous research|scientific experiment|laboratory workflow|experiment automation|bibliometric|scientometric|science mapping|academic conference poster|publication figures|学术翻译|科研组图|科研插图|学术插图|科研可视化|(?:agent skills?|skill[.]md).{0,100}(?:academic|scientific|科研|学术)'
    r'|(?:academic|scientific).{0,50}skills?'
    r'|(?:write|read|review|search|manage|draft|translat)[a-z]*.{0,25}(?:research papers?|academic papers?|literature)'
    r'|做科研|写论文|读论文|论文写作|学术写作|论文阅读|论文润色|论文翻译|论文管理|论文检索|论文配图|科研绘图|科学绘图|科研入门|科研工作流|文献|实验复现|毕业论文|学位论文', re.I)

CAPABILITY = ['skill', 'agent skill', 'skill.md', 'claude code', 'codex', 'opencode', 'mcp', 'workflow', 'skills', '技能']
RELATED = ['tool', 'guide', 'handbook', 'starter', 'workflow', 'assistant', 'agent',
           'reference manager', 'resource', '指南', '教程', '工具', '工作流', '助手', '资料']


def search_plan(config, now):
    minimum = int(config.get('min_stars', 100))
    plan = [{'query': f'{q} stars:>={minimum}', 'sort': 'stars', 'max_pages': 2, 'strategy':'popular'}
            for q in config.get('search_queries', [])]
    cutoff = (now - timedelta(days=30)).date().isoformat()
    queries = config.get('discovery', {}).get('queries', QUERIES)
    for q in queries:
        q += ' in:name,description,readme'
        plan.append({'query': f'{q} stars:>={minimum} pushed:>={cutoff}', 'sort':'updated', 'max_pages':1, 'strategy':'recent'})
        for low, high in [(100,499),(500,1999),(2000,9999),(10000,None)]:
            low = max(low, minimum)
            if high is not None and low > high:
                continue
            band = f'{low}..{high}' if high is not None else f'>={low}'
            plan.append({'query':f'{q} stars:{band}', 'sort':'updated', 'max_pages':1, 'strategy':'star_band'})
    return list({p['query']:p for p in plan}.values())


def readme_scope(text):
    # Evidence must describe this project, not projects linked in its bibliography.
    text = re.split(r'^#{1,6}\s+(?:references|bibliography|acknowledg\w*|credits|related projects|参考文献|致谢|相关项目)\b', text, maxsplit=1, flags=re.I|re.M)[0]
    text = re.sub(r'```[\s\S]*?```', '', text)
    text = re.sub(r'<!--[^>]*?-->', '', text, flags=re.S)
    return text[:8000].lower()


def readme_admission(repo):
    evidence = repo.get('_readme_evidence', {})
    if evidence.get('status') != 'verified':
        if evidence.get('previous_eligible') and evidence.get('status') in ('pending','deferred','missing'):
            return True, ['admission:retained', 'readme_recheck_pending']
        return False, ['readme_'+evidence.get('status','unverified')]
    text = readme_scope(evidence.get('text', ''))
    academic = [word for word in ACADEMIC if word in text]
    intro = re.split(r'^#{2,6}\s+', text, maxsplit=1, flags=re.M)[0][:2500]
    # Linked tools are references, not a declaration of this project's purpose.
    intro = re.sub(r'!?\[[^\]]*\]\([^)]*\)', '', intro)
    intro = re.sub(r'<a\b[^>]*>.*?</a>', '', intro, flags=re.S)
    intro = re.sub(r'^\s*(?:[-*+] |\d+[.)] ).*https?://.*$', '', intro, flags=re.M)
    topics = repo.get('repositoryTopics', {}).get('nodes', [])
    declared = ' '.join([(repo.get('description') or '')[:500], *(n.get('topic', {}).get('name', '') for n in topics)]).lower()
    purpose = (intro + ' ' + (repo.get('description') or '')[:500]).replace('-', ' ')
    if re.search(r'gameplay|mobile game|手游|碧蓝航线|AI资讯|资讯日报|高性价比人生|海外留学|phd admission|scholarships?', purpose, re.I):
        return False, ['nonresearch_primary_purpose']
    focused = bool(TASK_PURPOSE.search(purpose) or re.search(r'academic papers?|research papers?|学术论文|论文|文献', purpose))
    if not academic or not focused:
        return False, ['missing_readme_academic_scope']
    if any(word in text for word in CAPABILITY):
        return True, ['admission:skill_candidate', 'readme_scope', *academic[:3]]
    if any(word in text for word in RELATED):
        return True, ['admission:related', 'readme_scope', *academic[:3]]
    return False, ['missing_readme_project_purpose']


class ReadmeVerifier:
    def __init__(self, cache, fetch, *, now, budget=120):
        self.cache, self.fetch, self.now, self.budget = dict(cache), fetch, now, budget
        self.records = []
        self.used = 0

    def review(self, repo):
        name = repo['nameWithOwner']
        key = name.lower()
        old = self.cache.get(key, {})
        pushed = repo.get('pushedAt')
        try:
            checked = datetime.fromisoformat(old.get('checked_at', '').replace('Z','+00:00'))
            age = self.now - checked
        except (ValueError, TypeError):
            age = timedelta(days=999)
        ttl = timedelta(days=14 if old.get('status')=='verified' else 1)
        cached = old.get('status') in ('verified','missing','pending') and old.get('pushed_at')==pushed and timedelta(0)<=age<ttl
        if cached:
            result = old
        elif self.used >= self.budget:
            result = {'status':'deferred', 'pushed_at':pushed}
        else:
            self.used += 1
            try:
                source = self.fetch(name)
                result = {**source, 'status':'verified' if source.get('text') else 'missing',
                          'checked_at':self.now.isoformat().replace('+00:00','Z'), 'pushed_at':pushed}
                self.cache[key] = result
            except HTTPError as error:
                result = {'status':'missing' if error.code==404 else 'pending', 'pushed_at':pushed,
                          'checked_at':self.now.isoformat().replace('+00:00','Z')}
                self.cache[key] = result
            except (URLError, TimeoutError, OSError, ValueError):
                result = {'status':'pending', 'pushed_at':pushed,
                          'checked_at':self.now.isoformat().replace('+00:00','Z')}
                self.cache[key] = result
        self.records.append({'repo':name, 'status':result['status'], 'cached':cached,
                             'path':result.get('path'), 'sha':result.get('sha')})
        return dict(result)
