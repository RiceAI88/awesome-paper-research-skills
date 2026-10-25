#!/usr/bin/env python3
"""Check curated source documents against a manually reviewed content baseline.

Uses only Python's standard library. Remote content is never executed and the
review manifest is never rewritten by this script.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHA = re.compile(r'^[0-9a-f]{40}$')
REPO = re.compile(r'^[A-Za-z0-9][A-Za-z0-9_.-]*/[A-Za-z0-9][A-Za-z0-9_.-]*$')


def validate_manifest(manifest):
    """Reject ambiguous paths, malformed baselines and non-GitHub source URLs."""
    repos = manifest.get('repos') if isinstance(manifest, dict) else None
    if not isinstance(repos, dict) or not repos:
        raise ValueError('Manifest must contain a nonempty repos mapping')
    for repo, entry in repos.items():
        if not REPO.fullmatch(repo) or repo.endswith('.git'):
            raise ValueError(f'Invalid repository: {repo}')
        if not isinstance(entry, dict):
            raise ValueError(f'Invalid repository baseline: {repo}')
        date.fromisoformat(entry.get('reviewed_at', ''))
        documents = entry.get('documents')
        if not isinstance(documents, list) or not documents:
            raise ValueError(f'No reviewed documents: {repo}')
        paths = set()
        for document in documents:
            path = document.get('path', '')
            if (not isinstance(path, str) or not path or path.startswith('/')
                    or any(part in ('', '.', '..') for part in path.split('/'))
                    or any(ord(c) < 32 for c in path) or '\\' in path or path in paths):
                raise ValueError(f'Invalid or repeated document path: {path}')
            paths.add(path)
            for key in ('blob_sha', 'reviewed_commit'):
                if not isinstance(document.get(key), str) or not SHA.fullmatch(document[key]):
                    raise ValueError(f'Invalid {key}: {repo}/{path}')
            ref = document.get('ref')
            if ref is not None and (not isinstance(ref, str) or not ref
                                    or any(ord(c) < 32 for c in ref) or '..' in ref
                                    or ref.startswith('/') or '\\' in ref):
                raise ValueError(f'Invalid ref: {repo}/{path}')
            expected = document_url(repo, document['reviewed_commit'], path)
            if document.get('source_url') != expected:
                raise ValueError(f'Source URL must pin reviewed commit and document: {repo}/{path}')
    return manifest


def document_url(repo, ref, path):
    return f'https://github.com/{repo}/blob/{urllib.parse.quote(ref, safe="")}/{urllib.parse.quote(path, safe="/")}'


def github_fetch(url):
    headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'editorial-doc-check',
               'X-GitHub-Api-Version': '2022-11-28'}
    token = os.environ.get('GITHUB_TOKEN')
    if token:
        headers['Authorization'] = f'Bearer {token}'
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def check_documents(manifest, fetch=github_fetch, previous=None):
    """Return an honest snapshot; failed reads retain pending review for this baseline."""
    validate_manifest(manifest)
    report = {'checked_at': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'), 'repos': {}}
    for repo, entry in manifest['repos'].items():
        baseline = {doc['path']: doc['blob_sha'] for doc in entry['documents']}
        old = (previous or {}).get('repos', {}).get(repo, {})
        inherited_pending = old.get('baseline') == baseline and old.get('needs_review') is True
        documents = []
        commits = {}
        default_branch = None
        for doc in entry['documents']:
            path = doc['path']
            ref = doc.get('ref')
            result = {'path': path, 'status': 'error', 'reviewed_blob_sha': doc['blob_sha'],
                      'current_blob_sha': None, 'reviewed_url': doc['source_url'],
                      'current_url': document_url(repo, ref or 'HEAD', path)}
            # Resolve one branch head, then read its pinned contents: this avoids
            # a branch advancing between the commit lookup and the blob lookup.
            try:
                if ref is None:
                    if default_branch is None:
                        default_branch = fetch(f'https://api.github.com/repos/{repo}')['default_branch']
                    ref = default_branch
                if ref not in commits:
                    head = fetch(f'https://api.github.com/repos/{repo}/commits/{urllib.parse.quote(ref, safe="")}')['sha']
                    if not isinstance(head, str) or not SHA.fullmatch(head):
                        raise ValueError('GitHub returned an invalid head commit')
                    commits[ref] = head
                head = commits[ref]
                result['current_url'] = document_url(repo, head, path)
                result['diff_url'] = f'https://github.com/{repo}/compare/{doc["reviewed_commit"]}...{head}'
                url = (f'https://api.github.com/repos/{repo}/contents/{urllib.parse.quote(path, safe="/")}'
                       f'?ref={head}')
                try:
                    current = fetch(url)
                except urllib.error.HTTPError as error:
                    if error.code != 404:
                        raise
                    result['status'] = 'removed'
                else:
                    if not isinstance(current, dict) or current.get('type') != 'file' or not SHA.fullmatch(current.get('sha', '')):
                        raise ValueError('GitHub did not return a regular document blob')
                    result['current_blob_sha'] = current['sha']
                    result['status'] = 'current' if current['sha'] == doc['blob_sha'] else 'changed'
            except (urllib.error.URLError, TimeoutError, OSError, ValueError, KeyError, TypeError) as error:
                result['error'] = str(error)
            documents.append(result)
        changed = any(doc['status'] in ('changed', 'removed') for doc in documents)
        failed = any(doc['status'] == 'error' for doc in documents)
        report['repos'][repo] = {
            'status': 'error' if failed else ('changed' if changed else 'current'),
            'needs_review': changed or (failed and inherited_pending),
            'baseline': baseline, 'documents': documents,
        }
    return report


def render_summary(report):
    lines = ['## Curated document review', '', f'Checked: {report["checked_at"]}', '',
             '| Repository | Status | Needs review | Documents |', '| --- | --- | --- | --- |']
    for repo, result in report['repos'].items():
        details = []
        for doc in result['documents']:
            detail = f'[{doc["path"]}]({doc["current_url"]}): {doc["status"]}'
            if doc['status'] in ('changed', 'removed') and doc.get('diff_url'):
                detail += f' ([compare]({doc["diff_url"]}))'
            if doc.get('error'):
                # API error messages are display data, never Markdown directives.
                detail += ' — ' + doc['error'].replace('|', '\\|').replace('\n', ' ')[:240]
            details.append(detail)
        lines.append(f'| {repo} | {result["status"]} | {str(result["needs_review"]).lower()} | {"; ".join(details)} |')
    return '\n'.join(lines) + '\n'


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, default=ROOT / 'config/editorial-sources.json')
    parser.add_argument('--output', type=Path, default=ROOT / 'data/editorial-status.json')
    args = parser.parse_args(argv)
    try:
        manifest = validate_manifest(json.loads(args.manifest.read_text()))
    except (OSError, ValueError, TypeError, AttributeError) as error:
        print(f'Invalid editorial manifest: {error}', file=sys.stderr)
        return 1
    previous = None
    if args.output.exists():
        try:
            previous = json.loads(args.output.read_text())
        except (OSError, ValueError):
            pass
    report = check_documents(manifest, previous=previous)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    summary = render_summary(report)
    print(summary)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as output:
            output.write(summary)
    # API failures are recorded in the report, and must not trigger external
    # workflow failure notifications or prevent committing this honest snapshot.
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
