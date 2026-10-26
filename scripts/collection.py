"""Persistent collection: search discovers; direct requests maintain known entries."""
from dataclasses import dataclass
from urllib.error import HTTPError, URLError


@dataclass
class SearchResult:
    repositories: list
    total: int
    incomplete: bool = False
    limit_reached: bool = False


@dataclass
class CollectionResult:
    repositories: list
    catalog: dict
    report: dict


def cached_metadata(item):
    return {"nameWithOwner": item["repo"], "name": item["repo"].split("/")[-1],
            "description": item.get("description", ""), "stargazerCount": item.get("stars", 0),
            "url": item.get("url"), "homepageUrl": item.get("homepage"),
            "forksCount": item.get("forks", 0), "openIssuesCount": item.get("open_issues", 0),
            "watchersCount": item.get("watchers", 0), "sizeKb": item.get("size_kb", 0),
            "hasIssues": item.get("has_issues", False), "hasWiki": item.get("has_wiki", False),
            "hasDiscussions": item.get("has_discussions", False), "license": item.get("license", {}),
            "pushedAt": item.get("last_push_date"),
            "createdAt": item.get("created_date"), "isArchived": False, "isFork": False,
            "primaryLanguage": {"name": item.get("language", "")},
            "defaultBranch": item.get("default_branch", ""),
            "repositoryTopics": {"nodes": [{"topic": {"name": t}} for t in item.get("topics", [])]}}


def collect(config, *, catalog, previous_items, known_names, fetch, search, eligible, now):
    entries = {k.lower(): dict(v) for k, v in catalog.get("repositories", {}).items()}
    previous = {k.lower(): v for k, v in previous_items.items()}
    names = {n.lower(): n for n in [*known_names, *previous_items, *config.get("seed_repositories", []), *(key for key, entry in entries.items() if entry.get("eligible"))]}
    excluded = {n.lower() for n in config.get("exclude_repositories", [])}
    report = {"generated_at": now, "status": "complete", "fatal": False, "pending": [], "rejected": [], "searches": [], "changes": []}
    output, attempted, confirmed = {}, set(), 0

    def accept(raw, old_name=None):
        nonlocal confirmed
        confirmed += 1
        key = raw["nameWithOwner"].lower()
        old = entries.get(key, {})
        good, reasons = eligible(raw)
        if key in excluded:
            good, reasons = False, ["explicit_exclusion"]
        if old_name and old_name != key:
            entries[old_name] = {"alias_of": key, "last_attempt_at": now}
            raw["_previous_names"] = [old_name]
            report["changes"].append({"repo": old_name, "action": "renamed", "to": key})
        entries[key] = {"metadata": raw, "eligible": good, "status": "active" if good else "excluded", "last_success_at": now, "last_attempt_at": now, "reasons": reasons}
        if old.get("status") == "pending":
            report["changes"].append({"repo": key, "action": "recovered"})
        if good:
            raw["_metadata_checked_at"] = now
            output[key] = raw
            if not old.get("eligible"):
                report["changes"].append({"repo": key, "action": "restored" if key in previous else "added"})
        else:
            output.pop(key, None)
            report["rejected"].append({"repo": key, "reasons": reasons})
            if old.get("eligible") or (not old and key in previous):
                report["changes"].append({"repo": key, "action": "removed", "reasons": reasons})

    for key, name in sorted(names.items()):
        if key in attempted:
            continue
        if entries.get(key, {}).get("alias_of"):
            continue
        attempted.add(key)
        if key in excluded:
            entries[key] = {"eligible": False, "status": "excluded", "reasons": ["explicit_exclusion"], "last_attempt_at": now}
            continue
        try:
            raw = fetch(name)
            if raw is None:
                raise URLError("empty repository response")
            attempted.add(raw["nameWithOwner"].lower())
            accept(raw, key)
        except (HTTPError, URLError, TimeoutError, OSError) as error:
            reason = f"http_{error.code}" if isinstance(error, HTTPError) else "network_error"
            old = entries.get(key, {})
            item = previous.get(key)
            raw = dict(old.get("metadata") or (cached_metadata(item) if item else {}))
            retain = old.get("eligible", bool(item))
            checked = old.get("last_success_at") or (item or {}).get("_observed_at")
            if retain and raw:
                raw.update(_retained_pending=True, _metadata_checked_at=checked, _pending_reason=reason)
                output[key] = raw
            entries[key] = {**old, "metadata": old.get("metadata") or raw, "eligible": retain, "status": "pending", "last_attempt_at": now, "last_success_at": checked, "reasons": [reason]}
            if old.get("status") != "pending":
                report["changes"].append({"repo": key, "action": "pending", "reason": reason})
            report["pending"].append({"repo": key, "reason": reason, "retained": bool(retain and raw)})
    for query in config.get("search_queries", []):
        try:
            result = search(query)
            report["searches"].append({"query": query, "total": result.total, "returned": len(result.repositories), "incomplete": result.incomplete, "limit_reached": result.limit_reached})
            for raw in result.repositories:
                key = raw["nameWithOwner"].lower()
                if key not in attempted and key not in output:
                    accept(raw)
        except (HTTPError, URLError, TimeoutError, OSError):
            report["searches"].append({"query": query, "error": "request_failed"})
    report["fatal"] = confirmed == 0
    if report["pending"] or any(r.get("error") or r.get("incomplete") for r in report["searches"]) or report["fatal"]:
        report["status"] = "partial"
    return CollectionResult(list(output.values()), {"schema_version": 1, "repositories": entries}, report)
