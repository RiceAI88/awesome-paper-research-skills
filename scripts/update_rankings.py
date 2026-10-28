#!/usr/bin/env python3
"""Update the academic research skills ranking.

The script intentionally uses only the Python standard library so GitHub
Actions can run it without dependency installation.
"""

from __future__ import annotations

import argparse
import base64
import csv
import html
import json
import math
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from email.utils import format_datetime
from pathlib import Path
from typing import Any

try:
    from . import collection, discovery
except ImportError:  # Direct script entry point in Actions.
    import collection
    import discovery


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "ranking.json"
DATA_PATH = ROOT / "data" / "rankings.json"
DATA_JS_PATH = ROOT / "data" / "rankings.js"
HISTORY_JS_PATH = ROOT / "data" / "history.js"
CSV_PATH = ROOT / "data" / "rankings.csv"
README_PATH = ROOT / "README.md"
HISTORY_DIR = ROOT / "data" / "history"
FIRST_SEEN_PATH = ROOT / "data" / "first-seen.json"
CATALOG_PATH = ROOT / "data" / "repository-catalog.json"
COLLECTION_REPORT_PATH = ROOT / "data" / "collection-report.json"
COLLECTION_EVENTS_PATH = ROOT / "data" / "collection-events.json"
REPORTS_DIR = ROOT / "reports"
SITEMAP_PATH = ROOT / "sitemap.xml"
FEED_PATH = ROOT / "feed.xml"
OG_COVER_PATH = ROOT / "assets" / "og-cover.svg"
OG_COVER_PNG_PATH = ROOT / "assets" / "og-cover.png"

# Canonical public URL (GitHub Pages). Used for sitemap / RSS / Open Graph.
SITE_URL = "https://riceai88.github.io/awesome-paper-research-skills"

# How many days of history to retain on disk. Older snapshots are pruned so the
# repo does not grow unboundedly over time.
HISTORY_RETENTION_DAYS = 60
# Window used for the mid-term star delta. A 7-day window smooths out the
# single-day noise that made the previous `star_delta_1d` almost always zero.
DELTA_WINDOW_DAYS = 7
# Longer-horizon window used for the auxiliary `star_delta_30d` and the
# sparkline series. Kept inside the retention window so the data exists.
LONG_WINDOW_DAYS = 30


DEFAULT_MIN_STARS = 100

# Repositories never listed in the ranking itself. The meta-repository must
# stay out of its own leaderboard (its description matches every signal by
# construction), while still being fetched normally when listed as a seed.
DEFAULT_EXCLUDED_REPOSITORIES = [
    "RiceAI88/awesome-paper-research-skills",
    "kael-odin/awesome-academic-research-skills",
]

SKILL_TERMS = [
    "skill",
    "skills",
    "agent skill",
    "agent skills",
    "claude code",
    "codex",
    "open code",
    "opencode",
    "mcp",
    "workflow",
    "pipeline",
    "plugin",
    "assistant",
    # Mainstream AI coding agent / editor names that signal "this is a
    # reusable agent capability" rather than a generic library.
    "cursor",
    "gemini",
    "copilot",
    "antigravity",
    "auggie",
    "roo",
    "cline",
    "continue",
    "agent skill standard",
    "agent skills standard",
]

STRONG_SKILL_TERMS = [
    "skill",
    "skills",
    "agent skill",
    "agent skills",
    "claude code",
    "codex",
    "open code",
    "opencode",
    "workflow",
    "pipeline",
    "plugin",
    "cursor rules",
    "gemini",
    "antigravity",
    "agent skill standard",
    "agent skills standard",
]

ACADEMIC_TERMS = [
    "academic",
    "research",
    "paper",
    "papers",
    "literature",
    "survey",
    "review",
    "peer review",
    "scientific",
    "science",
    "arxiv",
    "latex",
    "phd",
    "thesis",
    "dissertation",
    "experiment",
    "experiments",
    "reproducibility",
    "citation",
    "bibliography",
    "manuscript",
    "journal",
    "conference",
    "proofreading",
    "scholar",
    "source validation",
    # Retrieval / reasoning / publishing-flow signals that still indicate an
    # academic context when combined with a skill signal.
    "retrieval",
    "grounding",
    "reasoning",
    "systematic review",
    "meta-analysis",
    "preprint",
    "doi",
    "bibtex",
    "referee",
    "学者",
    "科研",
    "论文",
    "学术",
    "文献",
    "投稿",
    "实验",
    "综述",
    "复现",
    "审稿",
    "引用",
    "课题",
    "基金",
]

STRONG_ACADEMIC_TERMS = [
    "academic",
    "paper",
    "papers",
    "literature",
    "survey",
    "peer review",
    "scientific",
    "science",
    "arxiv",
    "latex",
    "phd",
    "thesis",
    "dissertation",
    "experiment",
    "experiments",
    "reproducibility",
    "citation",
    "bibliography",
    "manuscript",
    "journal",
    "conference",
    "proofreading",
    "scholar",
    "source validation",
    "autonomous discovery",
    "systematic review",
    "meta-analysis",
    "preprint",
    "doi",
    "bibtex",
    "referee",
    "科研",
    "论文",
    "学术",
    "文献",
    "投稿",
    "实验",
    "综述",
    "复现",
    "审稿",
    "引用",
]

HIGH_CONFIDENCE_ACADEMIC_TERMS = [
    "academic",
    "academic research",
    "academic writing",
    "research skill",
    "research skills",
    "scientific agent",
    "ai scientist",
    "paper writing",
    "research paper",
    "academic paper",
    "paper review",
    "paper reproduction",
    "proofreading",
    "literature review",
    "literature survey",
    "peer review",
    "source validation",
    "phd",
    "latex",
    "manuscript",
    "journal",
    "conference",
    "autonomous discovery",
    "科研",
    "论文",
    "学术",
    "文献",
    "投稿",
]

NEGATIVE_TERMS = [
    "leetcode",
    "interview",
    "wallpaper",
    "screensaver",
    "theme",
    "portfolio",
    "resume",
    "cryptocurrency",
    "crypto",
    "trading bot",
    "trading",
    "quant investment",
    "investment",
    "market analytics",
    "finance application",
    "design alternative",
    "desktop app",
    "prompt engineering guide",
    "curated list of chatgpt prompts",
    "developer-tools",
    "game mod",
    "minecraft",
    "game",
    "cheatsheet",
    "flashcard",
    "recipe",
    "fitness",
    "meal",
    "travel",
]

# Signals that a repository verifies the citations/references it produces —
# the single most differentiating quality feature for literature/deep-research
# skills, where hallucinated references are the dominant failure mode.
CITATION_VERIFICATION_TERMS = [
    "citation verif",
    "verified citation",
    "citations verified",
    "citation valid",
    "reference verif",
    "references verified",
    "引用核验",
    "引用验证",
    "文献核验",
    "零幻觉",
    "zero hallucinat",
    "no hallucinated",
    "hallucination-free",
    "fact-check",
    "source validation",
]

# A repository counts as stale (likely unmaintained) when it has not been
# pushed for this many days AND gained no stars in the 7-day window.
STALE_PUSH_DAYS = 30

CATEGORIES = [
    {
        "id": "deep-research",
        "zh": "深度研究",
        "en": "Deep Research",
        "keywords": ["deep research", "research agent", "autonomous research", "source validation", "discovery"],
    },
    {
        "id": "paper-writing",
        "zh": "论文写作",
        "en": "Paper Writing",
        "keywords": ["paper writing", "manuscript", "latex", "beamer", "overleaf", "bibtex", "proofreading", "revise", "abstract", "introduction", "writing"],
    },
    {
        "id": "literature-review",
        "zh": "文献综述",
        "en": "Literature Review",
        "keywords": ["literature review", "literature survey", "systematic review", "citation", "bibliography", "zotero"],
    },
    {
        "id": "peer-review",
        "zh": "评审反馈",
        "en": "Peer Review",
        "keywords": ["peer review", "reviewer", "feedback", "critique", "referee", "审稿"],
    },
    {
        "id": "experiment-reproducibility",
        "zh": "实验复现",
        "en": "Experiments",
        "keywords": ["experiment", "experiments", "benchmark", "reproduce", "reproducibility", "evaluation", "复现"],
    },
    {
        "id": "discipline-specific",
        "zh": "学科专项",
        "en": "Discipline Specific",
        "keywords": ["economics", "biology", "biotech", "chemistry", "medicine", "phd", "physics", "math", "statistics", "law", "education", "psychology", "sociology", "cv", "nlp", "ml", "drug discovery"],
    },
    {
        "id": "general-research",
        "zh": "综合研究",
        "en": "General Research",
        "keywords": ["academic", "research", "scientific", "science", "scholar"],
    },
]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    # Treat naive timestamps (e.g. bare dates "2026-06-24") as UTC so arithmetic
    # against the aware `now` never fails.
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def date_only(value: str | None) -> str:
    parsed = parse_datetime(value)
    if parsed is None:
        return ""
    return parsed.date().isoformat()


def text_corpus(repo: dict[str, Any]) -> str:
    topics = repo.get("repositoryTopics", {}).get("nodes", [])
    topic_names = []
    for node in topics:
        topic = node.get("topic", {}) if isinstance(node, dict) else {}
        name = topic.get("name")
        if name:
            topic_names.append(name)

    parts = [
        repo.get("nameWithOwner", ""),
        repo.get("name", ""),
        repo.get("description") or "",
        " ".join(topic_names),
    ]
    return " ".join(parts).lower()


def term_hits(corpus: str, terms: list[str]) -> list[str]:
    return [term for term in terms if term.lower() in corpus]


def is_academic_skill_repo(
    repo: dict[str, Any],
    min_stars: int = DEFAULT_MIN_STARS,
    trusted_repositories: set[str] | None = None,
) -> tuple[bool, list[str]]:
    """Return whether a repository is likely an academic/research skill repo.

    The filter is deliberately explicit: a repo needs both a skill/agent signal
    and an academic/research/paper signal. This avoids broad "AI paper" or
    generic "agent" projects dominating the ranking.
    """

    reasons: list[str] = []
    stars = int(repo.get("stargazerCount") or 0)
    if stars < min_stars:
        reasons.append("below_min_stars")

    if repo.get("isArchived"):
        reasons.append("archived")
    if repo.get("isFork"):
        reasons.append("fork")

    corpus = text_corpus(repo)
    skill_hits = term_hits(corpus, SKILL_TERMS)
    strong_skill_hits = term_hits(corpus, STRONG_SKILL_TERMS)
    academic_hits = term_hits(corpus, ACADEMIC_TERMS)
    strong_academic_hits = term_hits(corpus, STRONG_ACADEMIC_TERMS)
    high_confidence_academic_hits = term_hits(corpus, HIGH_CONFIDENCE_ACADEMIC_TERMS)
    negative_hits = term_hits(corpus, NEGATIVE_TERMS)
    trusted_repositories = trusted_repositories or set()
    trusted = repo.get("nameWithOwner") in trusted_repositories

    reasons.extend(skill_hits[:3])
    reasons.extend(academic_hits[:4])
    if trusted:
        reasons.append("trusted_seed")
    if not skill_hits:
        reasons.append("missing_skill_signal")
    if not academic_hits:
        reasons.append("missing_academic_signal")
    if skill_hits and not strong_skill_hits and not trusted:
        reasons.append("missing_strong_skill_signal")
    if academic_hits and not strong_academic_hits and not trusted:
        reasons.append("missing_strong_academic_signal")
    if strong_academic_hits and not high_confidence_academic_hits and not trusted:
        reasons.append("missing_high_confidence_academic_signal")
    if negative_hits:
        reasons.extend([f"negative:{hit}" for hit in negative_hits[:2]])

    accepted = (
        stars >= min_stars
        and not repo.get("isArchived")
        and not repo.get("isFork")
        and bool(skill_hits)
        and (bool(strong_skill_hits) or trusted)
        and bool(academic_hits)
        and (bool(strong_academic_hits) or trusted)
        and (bool(high_confidence_academic_hits) or trusted)
        and not negative_hits
    )
    if repo.get("_readme_evidence") is not None:
        hard_failure = stars < min_stars or repo.get("isArchived") or repo.get("isFork") or bool(negative_hits)
        admitted, evidence_reasons = discovery.readme_admission(repo)
        return bool(admitted and not hard_failure), reasons + evidence_reasons
    return accepted, reasons


def classify_repo(repo: dict[str, Any]) -> dict[str, str]:
    corpus = text_corpus(repo)
    best = CATEGORIES[-1]
    best_score = -1
    for category in CATEGORIES:
        score = sum(1 for keyword in category["keywords"] if keyword.lower() in corpus)
        if score > best_score:
            best = category
            best_score = score
    return {"id": best["id"], "zh": best["zh"], "en": best["en"]}


def previous_stars(previous: dict[str, Any] | None) -> int | None:
    if not previous:
        return None
    if "stars" in previous:
        return int(previous["stars"])
    if "stargazerCount" in previous:
        return int(previous["stargazerCount"])
    return None


def compute_trend_score(
    repo: dict[str, Any],
    previous: dict[str, Any] | None,
    now: datetime | None = None,
    star_delta_window: int = 0,
) -> float:
    now = now or utc_now()
    stars = int(repo.get("stargazerCount") or 0)
    old_stars = previous_stars(previous)
    # Prefer the multi-day window delta when available: it is far less noisy
    # than the single-day delta. Fall back to the previous-run delta otherwise.
    star_delta = max(0, star_delta_window) if star_delta_window else (
        max(0, stars - old_stars) if old_stars is not None else 0
    )

    pushed_at = parse_datetime(repo.get("pushedAt"))
    created_at = parse_datetime(repo.get("createdAt"))

    recency_score = 0.0
    if pushed_at:
        days_since_push = max(0.0, (now - pushed_at).total_seconds() / 86400)
        recency_score = max(0.0, 20.0 - min(days_since_push, 90.0) / 4.5)

    new_repo_score = 0.0
    if created_at:
        age_days = max(0.0, (now - created_at).total_seconds() / 86400)
        new_repo_score = max(0.0, 12.0 - min(age_days, 180.0) / 15.0)

    scale_score = math.log10(stars + 1) * 8 if stars > 0 else 0.0
    score = star_delta * 1.2 + recency_score + new_repo_score + scale_score
    return round(score, 2)


def trend_label(star_delta: int, score: float) -> dict[str, str]:
    if star_delta >= 20 or score >= 70:
        return {"id": "hot", "zh": "热门上升", "en": "Hot"}
    if star_delta > 0 or score >= 35:
        return {"id": "rising", "zh": "持续增长", "en": "Rising"}
    return {"id": "steady", "zh": "稳定", "en": "Steady"}


def rank_repositories(
    repos: list[dict[str, Any]],
    min_stars: int = DEFAULT_MIN_STARS,
    previous_snapshot: dict[str, Any] | None = None,
    trusted_repositories: set[str] | None = None,
    window_snapshot: dict[str, Any] | None = None,
    long_window_snapshot: dict[str, Any] | None = None,
    excluded_repositories: set[str] | None = None,
    now: datetime | None = None,
) -> list[dict[str, Any]]:
    previous_snapshot = previous_snapshot or {}
    trusted_repositories = trusted_repositories or set()
    window_snapshot = window_snapshot or {}
    long_window_snapshot = long_window_snapshot or {}
    excluded_repositories = excluded_repositories or set()
    now = now or utc_now()
    ranked: list[dict[str, Any]] = []

    for repo in repos:
        name = repo["nameWithOwner"]
        if name.lower() in {value.lower() for value in excluded_repositories}:
            continue
        accepted, reasons = is_academic_skill_repo(
            repo,
            min_stars=min_stars,
            trusted_repositories=trusted_repositories,
        )
        if not accepted and not repo.get("_retained_pending"):
            continue

        previous = previous_snapshot.get(name, {}) if isinstance(previous_snapshot, dict) else {}
        stars = int(repo.get("stargazerCount") or 0)
        old_stars = previous_stars(previous)
        star_delta_1d = max(0, stars - old_stars) if old_stars is not None else 0

        # 7-day window delta — the primary growth signal shown to users.
        window_prev = window_snapshot.get(name, {}) if isinstance(window_snapshot, dict) else {}
        window_stars = previous_stars(window_prev)
        star_delta_7d = max(0, stars - window_stars) if window_stars is not None else star_delta_1d

        # 30-day window delta — an auxiliary, longer-horizon signal for the
        # sparkline / drawer. Falls back to the 7-day value when no older
        # snapshot exists (e.g. first weeks of operation).
        long_prev = long_window_snapshot.get(name, {}) if isinstance(long_window_snapshot, dict) else {}
        long_stars = previous_stars(long_prev)
        star_delta_30d = max(0, stars - long_stars) if long_stars is not None else star_delta_7d

        score = compute_trend_score(
            repo,
            previous,
            now=now,
            star_delta_window=star_delta_7d,
        )
        # Trend label is driven by the (less noisy) 7-day delta.
        trend = trend_label(star_delta_7d, score)
        category = classify_repo(repo)
        agents = detect_agents(repo)
        topics = [
            node.get("topic", {}).get("name")
            for node in repo.get("repositoryTopics", {}).get("nodes", [])
            if node.get("topic", {}).get("name")
        ]

        ranked.append(
            {
                "refresh_status": "pending" if repo.get("_retained_pending") else "fresh",
                "metadata_checked_at": repo.get("_metadata_checked_at"),
                "pending_reason": repo.get("_pending_reason"),
                "previous_names": repo.get("_previous_names", []),
                "rank": 0,
                "repo": name,
                "stars": stars,
                "star_delta_1d": star_delta_1d,
                "star_delta_7d": star_delta_7d,
                "star_delta_30d": star_delta_30d,
                "trend_score": score,
                "trend": trend,
                "category": category,
                "description": repo.get("description") or "",
                "language": (repo.get("primaryLanguage") or {}).get("name") or repo.get("language") or "",
                "topics": topics,
                "created_date": date_only(repo.get("createdAt")),
                "last_push_date": date_only(repo.get("pushedAt") or repo.get("updatedAt")),
                "url": repo.get("url") or repo.get("html_url") or "",
                "homepage": repo.get("homepageUrl") or repo.get("homepage") or "",
                "agents": agents,
                "precision_signals": sorted(set(reasons)),
                # Enrichment (only added, never removed from the legacy set).
                "stale": is_stale(repo, star_delta_7d, now),
                "verifies_citations": verifies_citations(repo),
                "forks": int(repo.get("forksCount") or 0),
                "open_issues": int(repo.get("openIssuesCount") or 0),
                "watchers": int(repo.get("watchersCount") or 0),
                "size_kb": int(repo.get("sizeKb") or 0),
                "default_branch": repo.get("defaultBranch") or "",
                "has_issues": bool(repo.get("hasIssues", False)),
                "has_wiki": bool(repo.get("hasWiki", False)),
                "has_discussions": bool(repo.get("hasDiscussions", False)),
                "license": repo.get("license") or {"key": "", "name": "", "spdx_id": ""},
            }
        )

    ranked.sort(key=lambda item: (-item["stars"], -item["trend_score"], item["repo"].lower()))
    for index, item in enumerate(ranked, start=1):
        item["rank"] = index
    return ranked


def load_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def load_config(path: Path = CONFIG_PATH) -> dict[str, Any]:
    return load_json(path, {})


def validate_snapshot_date(value: str) -> str:
    """Accept only real, canonical YYYY-MM-DD dates."""
    if not isinstance(value, str) or date.fromisoformat(value).isoformat() != value:
        raise ValueError(f"Invalid snapshot date: {value!r}")
    return value


def annotate_first_seen(
    data: dict[str, Any],
    history: dict[str, dict[str, Any]],
    registry: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Annotate actual inclusion dates and retain identities beyond history pruning.

    The first global observation is a baseline: its existing repositories are
    not evidence of new inclusion. Names are case-insensitive on GitHub.
    """
    generated = datetime.fromisoformat(data["metadata"]["generated_at"].replace("Z", "+00:00"))
    if generated.tzinfo is None:
        raise ValueError("Snapshot timestamp must include its timezone")
    today = generated.astimezone(timezone.utc).date().isoformat()
    for day in history:
        validate_snapshot_date(day)
        if day > today:
            raise ValueError(f"History date {day} is after snapshot {today}")

    if registry:
        baseline = validate_snapshot_date(registry["baseline_date"])
        records = {repo.casefold(): dict(record) for repo, record in registry["repositories"].items()}
        for record in records.values():
            recorded = validate_snapshot_date(record["first_seen_date"])
            if recorded < baseline or recorded > today or not isinstance(record["first_seen_is_baseline"], bool):
                raise ValueError("Invalid first-seen registry record")
    else:
        baseline = min(history, default=today)
        records = {}

    for day in sorted(history):
        for repo in history[day]:
            records.setdefault(repo.casefold(), {
                "first_seen_date": day,
                "first_seen_is_baseline": day == baseline,
            })
    for item in data["items"]:
        for alias in item.get("previous_names", []):
            if alias.casefold() in records:
                records.setdefault(item["repo"].casefold(), dict(records[alias.casefold()]))
        record = records.setdefault(item["repo"].casefold(), {
            "first_seen_date": today,
            "first_seen_at": generated.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
            "first_seen_is_baseline": today == baseline,
        })
        item.update(record)
    data["metadata"]["first_seen_baseline_date"] = baseline
    data["metadata"]["first_seen_source"] = "ranking_snapshots"
    return {"baseline_date": baseline, "repositories": dict(sorted(records.items()))}


def persist_first_seen(data: dict[str, Any], history: dict[str, dict[str, Any]]) -> None:
    registry = annotate_first_seen(data, history, load_json(FIRST_SEEN_PATH, None))
    FIRST_SEEN_PATH.parent.mkdir(parents=True, exist_ok=True)
    FIRST_SEEN_PATH.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def backfill_first_seen() -> None:
    """Migrate existing rankings offline, preserving their original timestamp."""
    data = load_json(DATA_PATH, {})
    persist_first_seen(data, load_history_snapshots())
    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    DATA_JS_PATH.write_text(render_data_js(data), encoding="utf-8")


def load_previous_snapshot(path: Path = DATA_PATH) -> dict[str, Any]:
    data = load_json(path, {})
    items = data.get("items", []) if isinstance(data, dict) else []
    return {item["repo"]: item for item in items if item.get("repo")}


def _history_path(date: datetime) -> Path:
    return HISTORY_DIR / f"{date.date().isoformat()}.json"


def load_history_snapshots() -> dict[str, dict[str, Any]]:
    """Return a mapping of ``YYYY-MM-DD`` -> {repo: item} for every snapshot on disk.

    History snapshots let us compute a multi-day star delta instead of relying
    on a single previous-run value that is almost always identical to the
    current value (which made ``star_delta_1d`` stuck at zero).
    """
    snapshots: dict[str, dict[str, Any]] = {}
    if not HISTORY_DIR.exists():
        return snapshots
    for entry in HISTORY_DIR.glob("*.json"):
        validate_snapshot_date(entry.stem)
        data = load_json(entry, {})
        items = data.get("items", []) if isinstance(data, dict) else []
        snapshots[entry.stem] = {item["repo"]: item for item in items if item.get("repo")}
    return snapshots


def find_window_snapshot(
    history: dict[str, dict[str, Any]],
    today: datetime,
    window_days: int,
) -> dict[str, Any] | None:
    """Find the historical snapshot closest to ``window_days`` ago.

    Tolerates missing days (workflow skipped, run failed) by scanning a few
    days around the target. Returns the repo->item mapping for that day, or
    ``None`` if no snapshot exists within the tolerance band.
    """
    for offset in range(window_days, window_days + 5):
        target = today - timedelta(days=offset)
        key = target.date().isoformat()
        if key in history:
            return history[key]
    return None


def save_history_snapshot(data: dict[str, Any], today: datetime) -> None:
    """Persist today's ranking as a dated snapshot and prune old entries."""
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    snapshot_path = _history_path(today)
    # Keep the first observation per day; fill newly recovered entries only.
    snapshot = load_json(snapshot_path, {**data, "items": []})
    seen = {item["repo"].lower() for item in snapshot["items"]}
    for item in data["items"]:
        if item.get("refresh_status") != "pending" and item["repo"].lower() not in seen:
            snapshot["items"].append(item)
            seen.add(item["repo"].lower())
    snapshot["metadata"]["total"] = len(snapshot["items"])
    snapshot_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    cutoff = today - timedelta(days=HISTORY_RETENTION_DAYS)
    for entry in HISTORY_DIR.glob("*.json"):
        try:
            entry_date = datetime.fromisoformat(entry.stem).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        if entry_date < cutoff:
            entry.unlink(missing_ok=True)


RETRYABLE_STATUS_CODES = {403, 429, 500, 502, 503, 504}


def github_request(
    path: str,
    token: str | None,
    params: dict[str, Any] | None = None,
    retries: int = 3,
) -> dict[str, Any]:
    if path.startswith("https://"):
        url = path
    else:
        url = "https://api.github.com" + path
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"

    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "awesome-paper-research-skills-updater",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    last_error: Exception | None = None
    for attempt in range(retries):
        request = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            last_error = error
            # 403 covers both hard rate limits and secondary abuse limits.
            transient = error.code in RETRYABLE_STATUS_CODES
            if not transient or attempt >= retries - 1:
                raise
            retry_after = (error.headers or {}).get("Retry-After") if error.headers else None
            delay = int(retry_after) if retry_after and retry_after.isdigit() else 2**attempt * 2
            print(f"warning: HTTP {error.code} on {url.split('?')[0]}, retrying in {delay}s", file=sys.stderr)
            time.sleep(delay)
        except urllib.error.URLError as error:
            last_error = error
            if attempt >= retries - 1:
                raise
            delay = 2**attempt * 2
            print(f"warning: network error on {url.split('?')[0]}: {error.reason}, retrying in {delay}s", file=sys.stderr)
            time.sleep(delay)
    raise last_error  # pragma: no cover - retries exhausted above


def rest_to_repo(item: dict[str, Any]) -> dict[str, Any]:
    topics = item.get("topics") or []
    license_node = item.get("license") or {}
    return {
        "nameWithOwner": item["full_name"],
        "name": item.get("name") or item["full_name"].split("/")[-1],
        "description": item.get("description") or "",
        "stargazerCount": item.get("stargazers_count") or 0,
        "createdAt": item.get("created_at"),
        "updatedAt": item.get("updated_at"),
        "pushedAt": item.get("pushed_at"),
        "url": item.get("html_url"),
        "homepageUrl": item.get("homepage"),
        "isArchived": item.get("archived", False),
        "isFork": item.get("fork", False),
        "primaryLanguage": {"name": item.get("language") or ""},
        "repositoryTopics": {"nodes": [{"topic": {"name": topic}} for topic in topics]},
        # Enrichment fields (only added, never removed from the legacy set).
        "forksCount": item.get("forks_count") or 0,
        "openIssuesCount": item.get("open_issues_count") or 0,
        "sizeKb": item.get("size") or 0,
        "defaultBranch": item.get("default_branch") or "",
        "hasIssues": bool(item.get("has_issues", False)),
        "hasWiki": bool(item.get("has_wiki", False)),
        "hasDiscussions": bool(item.get("has_discussions", False)),
        "watchersCount": item.get("watchers_count") or 0,
        "license": {
            "key": license_node.get("key") or "",
            "name": license_node.get("name") or "",
            "spdx_id": license_node.get("spdx_id") or "",
        } if isinstance(license_node, dict) else {"key": "", "name": "", "spdx_id": ""},
    }


def search_repositories(
    query: str,
    min_stars: int,
    token: str | None,
    max_pages: int = 2,
    sort: str = "stars",
) -> collection.SearchResult:
    q = f"{query} fork:false archived:false"
    if "stars:" not in query:
        q += f" stars:>={min_stars}"
    items: list[dict[str, Any]] = []
    total, incomplete = 0, False
    for page in range(1, max_pages + 1):
        data = github_request("/search/repositories", token, {
            "q": q, "sort": sort, "order": "desc", "per_page": 100, "page": page,
        })
        page_items = data.get("items", [])
        items.extend(page_items)
        total = data.get("total_count", 0)
        incomplete = incomplete or bool(data.get("incomplete_results"))
        if len(page_items) < 100 or page * 100 >= total:
            break
        time.sleep(1.5)
    return collection.SearchResult([rest_to_repo(item) for item in items], total, incomplete, total > len(items))


def fetch_repository(full_name: str, token: str | None) -> dict[str, Any]:
    return rest_to_repo(github_request(f"/repos/{full_name}", token))


def collect_repositories(config: dict[str, Any], token: str | None) -> collection.CollectionResult:
    # Bootstrap metadata from the latest observation, before rolling history prunes it.
    previous = {}
    for path in [*sorted(HISTORY_DIR.glob("*.json")), DATA_PATH]:
        snapshot = load_json(path, {})
        for item in snapshot.get("items", []):
            if item.get("refresh_status") != "pending":
                previous[item["repo"]] = {**item, "_observed_at": snapshot.get("metadata", {}).get("generated_at")}
    registry = load_json(FIRST_SEEN_PATH, {}).get("repositories", {})
    now = utc_now()
    catalog = load_json(CATALOG_PATH, {})
    entries = catalog.get("repositories", {})
    cache = {k: v.get("metadata", {}).get("_readme_evidence", {}) for k, v in entries.items()}
    def readme(name):
        response = github_request(f"/repos/{name}/readme", token)
        if response.get("encoding") != "base64":
            raise ValueError("Unsupported README encoding")
        return {"text": base64.b64decode(response.get("content", "")).decode("utf-8", errors="replace")[:16000],
                "sha": response.get("sha"), "path": response.get("path")}
    verifier = discovery.ReadmeVerifier(cache, readme, now=now,
        budget=int(config.get("discovery", {}).get("readme_budget", 120)))
    plan = discovery.search_plan(config, now)
    specs = {p["query"]: p for p in plan}
    def fetch(name):
        time.sleep(0.15)
        return fetch_repository(name, token)
    def search(query):
        time.sleep(2.5)
        spec = specs[query]
        return search_repositories(query, int(config.get("min_stars", DEFAULT_MIN_STARS)), token,
                                   max_pages=spec["max_pages"], sort=spec["sort"])
    trusted = set(config.get("seed_repositories", []))
    def eligible(repo):
        legacy, reasons = is_academic_skill_repo(repo, min_stars=int(config.get("min_stars", DEFAULT_MIN_STARS)), trusted_repositories=trusted)
        key = repo["nameWithOwner"].lower()
        old = entries.get(key, {})
        for alias in repo.get("_previous_names", []):
            previous_entry = entries.get(alias.lower(), {})
            if previous_entry.get("eligible") and not old.get("eligible"):
                old = previous_entry
        old_evidence = old.get("metadata", {}).get("_readme_evidence")
        if old_evidence and key not in verifier.cache:
            verifier.cache[key] = old_evidence
        # Only historical metadata-only entries receive migration grandfathering.
        if old.get("eligible") and legacy and old_evidence is None:
            return legacy, reasons
        hard_failure = any(reason in reasons for reason in ("below_min_stars", "archived", "fork")) or any(r.startswith("negative:") for r in reasons)
        if hard_failure:
            return False, reasons
        evidence = verifier.review(repo)
        if old.get("eligible"):
            evidence["previous_eligible"] = True
        repo["_readme_evidence"] = evidence
        return is_academic_skill_repo(repo, min_stars=int(config.get("min_stars", DEFAULT_MIN_STARS)), trusted_repositories=trusted)
    def priority(repo):
        old = entries.get(repo["nameWithOwner"].lower(), {}).get("metadata", {}).get("_readme_evidence", {})
        corpus = text_corpus(repo)
        # Relevant unreviewed candidates first; cached decisions cost no API requests.
        return (bool(old.get("checked_at")), not any(term in corpus for term in discovery.ACADEMIC), old.get("checked_at", ""), repo["nameWithOwner"].lower())
    result = collection.collect({**config, "search_queries": list(specs)}, catalog=catalog, previous_items=previous,
        known_names=list(registry), fetch=fetch, search=search, eligible=eligible, prioritize=priority,
        now=now.replace(microsecond=0).isoformat().replace("+00:00", "Z"))
    result.report["readme_reviews"] = verifier.records
    result.report["readme_budget"] = {"limit": verifier.budget, "used": verifier.used,
        "deferred": sum(row["status"]=="deferred" for row in verifier.records)}
    for row in result.report["searches"]:
        row.update({key: specs[row["query"]][key] for key in ("sort", "strategy")})
    return result


def write_collection_state(result: collection.CollectionResult, data=None) -> None:
    # Diagnostics are written even on failure; the workflow uploads them as an artifact.
    report = result.report
    if data is not None:
        displayed = {item["repo"].lower() for item in data["items"]}
        report["outside_rank_limit"] = [repo["nameWithOwner"] for repo in result.repositories if repo["nameWithOwner"].lower() not in displayed]
    COLLECTION_REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if report["fatal"]:
        return
    CATALOG_PATH.write_text(json.dumps(result.catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    events = load_json(COLLECTION_EVENTS_PATH, [])
    events.extend({"at": report["generated_at"], **event} for event in report["changes"])
    COLLECTION_EVENTS_PATH.write_text(json.dumps(events[-1000:], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def markdown_escape(value: str) -> str:
    return value.replace("|", "\\|").replace("\n", " ").strip()


def truncate(value: str, limit: int) -> str:
    clean = " ".join((value or "").split())
    if len(clean) <= limit:
        return clean
    return clean[: limit - 1].rstrip() + "…"


def agent_badge(corpus: str) -> str:
    """Infer which coding agent a repository targets from its text corpus."""
    badges = []
    if "claude code" in corpus or "claude-code" in corpus or "claude code skill" in corpus:
        badges.append("Claude")
    if "codex" in corpus:
        badges.append("Codex")
    if "opencode" in corpus or "open code" in corpus or "open-code" in corpus:
        badges.append("OpenCode")
    if "mcp" in corpus:
        badges.append("MCP")
    return "/".join(badges) if badges else "通用"


# Canonical platform catalog — mirrors the frontend AGENT_PLATFORMS list.
# Each entry: (backend_id, match_terms). The backend_id is written to the
# JSON `agents` field and CSV `agents` column; the frontend maps it to a
# human label. Keeping the ids stable lets old snapshots filter correctly.
AGENT_PLATFORMS = [
    ("claude-code", ["claude code", "claude-code", "claude code skill"]),
    ("codex", ["codex"]),
    ("opencode", ["opencode", "open code", "open-code"]),
    ("cursor", ["cursor"]),
    ("gemini", ["gemini"]),
    ("cline", ["cline"]),
    ("mcp", ["mcp"]),
]


def detect_agents(repo: dict[str, Any]) -> list[str]:
    """Return the list of target-agent platform ids inferred from the repo corpus."""
    corpus = text_corpus(repo)
    found: list[str] = []
    for platform_id, terms in AGENT_PLATFORMS:
        if any(term in corpus for term in terms):
            found.append(platform_id)
    return found


def verifies_citations(repo: dict[str, Any]) -> bool:
    """Whether the repo advertises citation/reference verification."""
    corpus = text_corpus(repo)
    return any(term in corpus for term in CITATION_VERIFICATION_TERMS)


def is_stale(repo: dict[str, Any], star_delta_7d: int, now: datetime) -> bool:
    """Likely-unmaintained heuristic: no push in STALE_PUSH_DAYS and zero
    7-day star growth. Deliberately conservative — both conditions together."""
    pushed_at = parse_datetime(repo.get("pushedAt"))
    if not pushed_at:
        return False
    days_since_push = (now - pushed_at).total_seconds() / 86400
    return days_since_push >= STALE_PUSH_DAYS and star_delta_7d <= 0


def count_skill_files_in_tree(tree: list[Any]) -> int:
    """Count SKILL.md entries in a git-tree payload (pure, testable)."""
    return sum(
        1
        for node in tree
        if isinstance(node, dict)
        and node.get("type", "blob") == "blob"
        and str(node.get("path", "")).rsplit("/", 1)[-1].lower() == "skill.md"
    )


def count_skill_files(full_name: str, branch: str, token: str | None) -> int | None:
    """Count SKILL.md files in a repository via the git trees API.

    Returns ``None`` when the tree cannot be fetched (missing repo, network,
    rate limit after retries). For very large trees GitHub may return
    ``truncated: true`` — the count is then a lower bound, which is fine for
    display purposes.
    """
    try:
        data = github_request(
            f"/repos/{full_name}/git/trees/{branch or 'HEAD'}",
            token,
            {"recursive": "1"},
        )
    except (urllib.error.HTTPError, urllib.error.URLError) as error:
        print(f"warning: skill tree fetch failed for {full_name}: {error}", file=sys.stderr)
        return None
    count = count_skill_files_in_tree(data.get("tree") or [])
    return count if count or not data.get("truncated") else None


def enrich_skill_counts(items: list[dict[str, Any]], token: str | None) -> None:
    """Identify project type from file evidence; zero in a truncated tree is unknown."""
    for item in items:
        count, complete = None, False
        if item.get("refresh_status") != "pending":
            try:
                tree = github_request(f"/repos/{item['repo']}/git/trees/{item.get('default_branch') or 'HEAD'}", token, {"recursive": "1"})
                count = count_skill_files_in_tree(tree.get("tree") or [])
                complete = not tree.get("truncated", False)
            except (urllib.error.URLError, TimeoutError, OSError):
                pass
            time.sleep(0.15)
        item["skills_count"] = count
        item["skills_count_complete"] = complete
        item["repository_kind"] = "skill" if count else "related" if count == 0 and complete else "unknown"


# Map a backend platform id to a short human label for README / display.
_AGENT_LABELS = {
    "claude-code": "Claude",
    "codex": "Codex",
    "opencode": "OpenCode",
    "cursor": "Cursor",
    "gemini": "Gemini",
    "cline": "Cline",
    "mcp": "MCP",
}


def agents_to_label(agent_ids: list[str]) -> str:
    """Render the structured agents list as a /-joined label (通用 when empty)."""
    labels = [_AGENT_LABELS.get(aid, aid) for aid in agent_ids if aid]
    return "/".join(labels) if labels else "通用"


def is_newcomer(item: dict[str, Any], window_snapshot: dict[str, Any] | None) -> bool:
    """A repo is a newcomer if it was not in the 7-day-ago snapshot."""
    if not window_snapshot:
        return False
    return item["repo"] not in window_snapshot


def render_readme(data: dict[str, Any], window_snapshot: dict[str, Any] | None = None) -> str:
    """Render the visitor guide and type-separated previews from published data.

    window_snapshot is retained for callers shared with the RSS generator;
    README arrivals use persistent first-seen records instead of snapshot absence.
    """
    items = data["items"]
    metadata = data["metadata"]
    skills = [item for item in items if item.get("repository_kind") == "skill"]
    related = [item for item in items if item.get("repository_kind") == "related"]
    pending_count = len(items) - len(skills) - len(related)
    beijing = timezone(timedelta(hours=8))
    generated = parse_datetime(metadata["generated_at"])
    generated_day = generated.astimezone(beijing).date() if generated else None
    updated = generated.astimezone(beijing).strftime("%Y-%m-%d %H:%M UTC+8") if generated else "更新时间待确认"

    def added_today(item: dict[str, Any]) -> bool:
        if not generated_day or item.get("first_seen_is_baseline"):
            return False
        if item.get("first_seen_at") is not None:
            try:
                instant = datetime.fromisoformat(item["first_seen_at"].replace("Z", "+00:00"))
                return instant.tzinfo is not None and instant.astimezone(beijing).date() == generated_day
            except (AttributeError, TypeError, ValueError):
                return False
        try:
            raw = item.get("first_seen_date", "")
            first = date.fromisoformat(raw)
            return first.isoformat() == raw and first == generated_day
        except (TypeError, ValueError):
            return False

    today_skills = [item for item in skills if added_today(item)]

    def preview_rows(entries: list[dict[str, Any]], limit: int) -> str:
        rows = []
        for position, item in enumerate(entries[:limit], 1):
            delta = item.get("star_delta_7d") or 0
            growth = f"{delta:+,}" if delta else "—"
            rows.append(
                f"| {position} | [{markdown_escape(item['repo'])}]({item['url']}) "
                f"| {item['stars']:,} | {growth} | {markdown_escape(agents_to_label(item.get('agents', [])))} "
                f"| {markdown_escape(truncate(item.get('description', ''), 90)) or '仓库未提供简介'} |"
            )
        return "\n".join(rows)

    table_header = "| # | 仓库 | Stars | 近 7 日 | 适用平台 | 作者原文简介 |\n|---:|---|---:|---:|---|---|"
    skill_table = table_header + "\n" + preview_rows(skills, 20) if skills else "暂无已确认类型的 Skills。"
    related_table = table_header + "\n" + preview_rows(related, 10) if related else "暂无科研相关项目。"
    today_lines = [
        f"- **[{markdown_escape(item['repo'])}]({item['url']})** — {markdown_escape(truncate(item.get('description', ''), 90)) or '仓库未提供简介'}"
        for item in today_skills[:5]
    ]
    daily_block = "\n".join(today_lines) if today_lines else "本次更新日暂无新收录的 Skills，已有项目的 Stars 和维护数据仍会刷新。"
    date_badge = metadata["generated_at"][:10].replace("-", "--")

    return f"""# Awesome Paper Research Skills

**发现适合你的论文科研 Skills。**

汇集 GitHub 上用于文献检索、论文阅读、学术写作、科研绘图和实验复现的 Agent Skills，支持按使用场景与适用平台筛选，持续追踪新收录项目和 Stars 增长。科研相关工具、工作流与资料单独标注。

### [打开论文科研 Skills 排行榜 →]({SITE_URL}/)

[![Skills](https://img.shields.io/badge/Skills-{len(skills)}-4f3bd8)](#skills-榜单)
[![Updated](https://img.shields.io/badge/updated-{date_badge}-706b91)](#收录与更新)
[![CI](https://github.com/RiceAI88/awesome-paper-research-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/RiceAI88/awesome-paper-research-skills/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-706b91)](LICENSE)

[今日新增](#今日新增-skills) · [Skills 榜单](#skills-榜单) · [科研相关项目](#科研相关项目) · [收录与更新](#收录与更新) · [推荐项目](CONTRIBUTING.md) · [English](#english)

[![论文科研 Skills 排行榜：场景筛选、项目卡片和今日新增](assets/readme-dashboard.png)]({SITE_URL}/)

*界面预览；图片中的数量仅代表截图时的数据，最新结果以网站为准。*

## 按科研任务找 Skills

| 你想做什么 | 从这里开始 |
|---|---|
| 查找论文、检索参考文献 | [找文献]({SITE_URL}/#task=find) |
| 阅读、总结或翻译论文 | [读论文]({SITE_URL}/#task=read) |
| 整理写作思路、修改表达、处理 LaTeX | [写论文]({SITE_URL}/#task=write) |
| 制作论文配图、图表和科研示意图 | [科研绘图]({SITE_URL}/#task=figures) |
| 复现实验、运行评估与基准测试 | [实验复现]({SITE_URL}/#task=reproduce) |
| 准备投稿、审稿与返修回复 | [投稿审稿]({SITE_URL}/#task=review) |

一个项目可以用于多个场景。网站默认只展示有 `SKILL.md` 文件证据的 Skills；需要科研工具或资料时，可打开“含科研相关项目”。

## 网站怎么用

- **发现新项目**：查看“今日新增”，也可按近 7 日增长、趋势或最近更新排序。
- **找到适合的平台**：搜索关键词，按 Claude Code、Codex、Cursor、MCP 等适用平台筛选；平台信息来自项目声明与规则识别，安装前以项目文档为准。
- **查看使用条件**：点击卡片打开详情，查看安装入口、适用任务、必要依赖与维护信息；已记录安装核对的项目提供核对记录。
- **收藏与对比**：收藏感兴趣的项目，加入对比后比较任务、安装方式、依赖和维护状态；收藏保存在当前浏览器。
- **观察趋势**：切换到“数据洞察”，查看增长、场景分布与规模比较；筛选条件与榜单联动。
- **分享与订阅**：复制当前筛选链接，或使用 [RSS](feed.xml)、[月报](reports/)、[JSON](data/rankings.json) 和 [CSV](data/rankings.csv)。

## 今日新增 Skills

新增 Skills **{len(today_skills)}** · 按本次更新时间所在的北京时间自然日统计 · “新增”指本站首次收录，不是仓库刚创建。

{daily_block}

[查看网站今日新增]({SITE_URL}/#today=skill) · 本节最多展示 5 个，完整列表见网站。初始导入的基线项目不计为今日新增。

## Skills 榜单

Skills **{len(skills)}** · 科研相关项目 **{len(related)}** · 类型待核验 **{pending_count}**

更新时间：**{updated}**。以下为 Skills 前 20 名，按 Stars 降序排列；同 Stars 时依次按趋势分和仓库名排序，筛选项目类型后重新编号。Stars 与增长反映关注度，不代表科研质量、安装兼容性或推荐保证。

{skill_table}

[浏览完整 Skills 榜单]({SITE_URL}/) · 简介保留仓库作者原文，仅截短展示；“—”表示近 7 日增量为 0，缺少历史记录时的计算方式见[排名方法](docs/methodology.md)。

## 科研相关项目

以下为科研工具、工作流和资料等相关项目的前 10 名，独立按 Stars 顺序展示，不混入上方 Skills 排名。

{related_table}

[浏览科研相关项目]({SITE_URL}/#related=1)（打开后与 Skills 合并展示）。类型待核验项目不计入两张表，待文件证据确认后再归类；有 `SKILL.md` 也不等同于已通过安装测试。

## 收录与更新

**数据从哪里来？** 使用 GitHub API 获取仓库公开信息，通过热门搜索、最近更新搜索、Stars 区间搜索和维护者推荐发现候选；新候选读取 README 核验其自身科研用途，已有项目独立复查。搜索与核验有预算和覆盖限制，不保证收齐 GitHub 上所有科研 Skills。

**哪些项目会收录？** 当前 Stars 门槛为 **{metadata['min_stars']}**，排除 fork、归档和明确无关项目。Skills／科研工作流与科研相关工具／指南采用分轨准入；检测默认分支的 `SKILL.md` 文件后标注类型。暂时请求失败时保留此前合格项目的缓存并标记待核验，不因跌出搜索结果就直接移除。

**怎样排名？** 主榜按 Stars 排序，增长来自历史快照；趋势分仅作辅助，也可在网站切换排序。完整规则、字段含义和历史数据说明见[排名方法](docs/methodology.md)，采集过程见[采集报告](data/collection-report.json)与[变更记录](data/collection-events.json)。

**什么时候更新？** [Update rankings](https://github.com/RiceAI88/awesome-paper-research-skills/actions/workflows/update-rankings.yml) 计划每日 **北京时间 10:20（02:20 UTC）**运行。GitHub Actions 定时任务可能排队或延迟，计划时间不等于数据发布时间，也不保证每天都有新增。运行结果见 Actions；有仓库维护权限时，可在该工作流选择 **Run workflow** 手动触发。

README 会由采集脚本自动生成，静态介绍需修改 [`render_readme`](scripts/update_rankings.py)，再用已有数据重新生成；不要只改 README 后等待下一次采集覆盖。采集会同步维护榜单、首次收录记录、近 {HISTORY_RETENTION_DAYS} 天历史快照和订阅资产。

## 推荐项目与参与维护

发现遗漏或分类错误，可[提交推荐 Issue](https://github.com/RiceAI88/awesome-paper-research-skills/issues/new?template=recommend-repo.yml)，附仓库链接、具体科研用途和 Skill／安装文档入口。也欢迎修正文档、核对安装信息、改进搜索和页面体验，详见[贡献指南](CONTRIBUTING.md)。

开发者从[前端开发文档](docs/frontend-development.md)开始；安装记录与精选维护分别见[安装核验](docs/installation-audit.md)和[精选维护说明](docs/editorial-maintenance.md)。

## English

**Awesome Paper Research Skills** helps you discover GitHub Agent Skills for literature search, paper reading, academic writing, scientific figures, experiment reproduction and peer review.

[Open the dashboard]({SITE_URL}/en/) to search by task and platform, inspect installation information, save favorites, compare repositories and explore growth charts. Descriptions stay in the repository author's original language.

The default ranking contains repositories with detected `SKILL.md` files. Research-related tools, workflows and guides are separately labelled and can be included with a toggle; unverified types are excluded from both previews. File detection does not certify quality or successful installation.

Candidates are discovered through popular, recently updated and star-banded searches, then reviewed against README evidence. The main ranking uses Stars; daily arrivals mean first inclusion on this site, measured by the Beijing calendar day. The scheduled daily refresh may be delayed and does not guarantee new entries every day. Search coverage is bounded.

[Methodology](docs/methodology.md) · [Contributing](CONTRIBUTING.md) · [JSON](data/rankings.json) · [CSV](data/rankings.csv) · [RSS](feed.xml)

## 来源与致谢

本项目基于 [kael-odin/awesome-academic-research-skills](https://github.com/kael-odin/awesome-academic-research-skills) 导入并进行后续改版，感谢原作者 [kael-odin](https://github.com/kael-odin) 的开源贡献。

本仓库由 RiceAI88 独立维护，后续将首页迁移至 React，并增加场景入口、项目类型区分、今日新增、项目对比、数据洞察与采集核验机制。保留原项目的 MIT 许可证和版权声明；不代表原作者或与原作者存在隶属关系。早期导入的历史快照不代表本站当时已运行。

## License

[MIT](LICENSE)
"""


def render_csv(items: list[dict[str, Any]]) -> None:
    with CSV_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "rank",
                "repo",
                "stars",
                "star_delta_1d",
                "star_delta_7d",
                "star_delta_30d",
                "trend_score",
                "trend",
                "category",
                "description",
                "language",
                "license",
                "forks",
                "open_issues",
                "agents",
                "skills_count",
                "stale",
                "verifies_citations",
                "last_push_date",
                "url",
            ],
        )
        writer.writeheader()
        for item in items:
            license_name = (item.get("license") or {}).get("name", "") if isinstance(item.get("license"), dict) else ""
            writer.writerow(
                {
                    "rank": item["rank"],
                    "repo": item["repo"],
                    "stars": item["stars"],
                    "star_delta_1d": item["star_delta_1d"],
                    "star_delta_7d": item["star_delta_7d"],
                    "star_delta_30d": item["star_delta_30d"],
                    "trend_score": item["trend_score"],
                    "trend": item["trend"]["en"],
                    "category": item["category"]["en"],
                    "description": item["description"],
                    "language": item.get("language", ""),
                    "license": license_name,
                    "forks": item.get("forks", 0),
                    "open_issues": item.get("open_issues", 0),
                    "agents": "|".join(item.get("agents", [])),
                    "skills_count": "" if item.get("skills_count") is None else item["skills_count"],
                    "stale": bool(item.get("stale", False)),
                    "verifies_citations": bool(item.get("verifies_citations", False)),
                    "last_push_date": item["last_push_date"],
                    "url": item["url"],
                }
            )


def render_data_js(data: dict[str, Any]) -> str:
    # Compact separators: these files are machine-consumed by the dashboard;
    # indenting them tripled the transfer size of history.js for no benefit.
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    return f"window.ACADEMIC_SKILLS_RANKINGS={payload};\n"


def render_history_js(history_payload: dict[str, Any]) -> str:
    payload = json.dumps(history_payload, ensure_ascii=False, separators=(",", ":"))
    return f"window.ACADEMIC_SKILLS_HISTORY={payload};\n"


def write_outputs(data: dict[str, Any], window_snapshot: dict[str, Any] | None = None) -> None:
    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    DATA_JS_PATH.write_text(render_data_js(data), encoding="utf-8")
    history = load_history_snapshots()
    HISTORY_JS_PATH.write_text(render_history_js(render_history_series(history)), encoding="utf-8")
    build_monthly_reports(history)
    render_csv(data["items"])
    README_PATH.write_text(render_readme(data, window_snapshot=window_snapshot), encoding="utf-8")
    write_seo_assets(data, window_snapshot=window_snapshot)


def build_dataset(
    config: dict[str, Any],
    repos: list[dict[str, Any]],
    token: str | None = None,
    enrich_skills: bool = True,
) -> tuple[dict[str, Any], dict[str, Any] | None]:
    min_stars = int(config.get("min_stars", DEFAULT_MIN_STARS))
    now = utc_now()
    previous = load_previous_snapshot()
    history = load_history_snapshots()
    window_snapshot = find_window_snapshot(history, now, DELTA_WINDOW_DAYS)
    long_window_snapshot = find_window_snapshot(history, now, LONG_WINDOW_DAYS)
    trusted_repositories = set(config.get("seed_repositories", []))
    excluded_repositories = set(
        config.get("exclude_repositories", DEFAULT_EXCLUDED_REPOSITORIES)
    )
    items = rank_repositories(
        repos,
        min_stars=min_stars,
        previous_snapshot=previous,
        trusted_repositories=trusted_repositories,
        window_snapshot=window_snapshot,
        long_window_snapshot=long_window_snapshot,
        excluded_repositories=excluded_repositories,
        now=now,
    )
    max_results = int(config.get("max_results", 100))
    if max_results > 0:
        items = items[:max_results]
    for index, item in enumerate(items, start=1):
        item["rank"] = index

    if enrich_skills:
        enrich_skill_counts(items, token)

    generated_at = now.replace(microsecond=0).isoformat().replace("+00:00", "Z")
    data = {
        "metadata": {
            "generated_at": generated_at,
            "min_stars": min_stars,
            "total": len(items),
            "source": "GitHub REST Search API",
            "ranking": "stars_desc_then_trend_score",
            "trend_window_days": DELTA_WINDOW_DAYS,
            "long_window_days": LONG_WINDOW_DAYS,
            "history_retention_days": HISTORY_RETENTION_DAYS,
        },
        "items": items,
    }

    # Keep the lifetime registry before the rolling history can prune entries.
    persist_first_seen(data, history)
    # Persist today's snapshot so future runs can compute the 7-day delta.
    save_history_snapshot(data, now)
    return data, window_snapshot


def render_history_series(history: dict[str, dict[str, Any]]) -> dict[str, Any]:
    """Build a compact per-repo star history series for the frontend sparkline.

    Returns ``{metadata: {...}, series: {repo: [{date, stars}, ...]}}``. Each
    point is a daily snapshot we have on disk; missing days are simply absent
    (the sparkline renderer connects the available points). Only ``stars`` is
    kept per point to keep payload size well under 100 KB for ~100 repos × 30 d.
    """
    series: dict[str, list[dict[str, Any]]] = {}
    for date_key in sorted(history.keys()):
        snapshot = history[date_key]
        if not isinstance(snapshot, dict):
            continue
        for repo, item in snapshot.items():
            if not isinstance(item, dict):
                continue
            stars = item.get("stars") or item.get("stargazerCount")
            if stars is None:
                # Need a stars figure to plot.
                continue
            series.setdefault(repo, []).append({"date": date_key, "stars": int(stars)})
    return {
        "metadata": {
            "series_points": sum(len(points) for points in series.values()),
            "repos": len(series),
            "window_days": HISTORY_RETENTION_DAYS,
        },
        "series": series,
    }


def render_month_report(
    month: str,
    history: dict[str, dict[str, dict[str, Any]]],
    first_seen: dict[str, str],
    prev_repos: set[str],
    all_months: list[str],
) -> str | None:
    """Render one monthly report page (新星 / 上升 / 停滞 / 跌出) as static HTML."""
    dates = sorted(key for key in history if key.startswith(month))
    if not dates:
        return None
    first_snap = history[dates[0]]
    last_snap = history[dates[-1]]

    rows: list[dict[str, Any]] = []
    for repo, item in last_snap.items():
        stars_last = previous_stars(item)
        if stars_last is None:
            continue
        stars_first = previous_stars(first_snap.get(repo, {}))
        base = stars_first if stars_first is not None else stars_last
        rows.append(
            {
                "repo": repo,
                "stars": stars_last,
                "delta": stars_last - base,
                "item": item,
            }
        )

    is_newcomer_month = lambda repo: first_seen.get(repo, "")[:7] == month  # noqa: E731
    newcomers = [r for r in rows if is_newcomer_month(r["repo"])]
    risers = sorted((r for r in rows if r["delta"] > 0), key=lambda r: -r["delta"])[:10]
    stalled = [r for r in rows if r["delta"] <= 0 and not is_newcomer_month(r["repo"])]
    dropped = sorted(prev_repos - set(last_snap))

    def table(entries: list[dict[str, Any]]) -> str:
        if not entries:
            return "<p class='muted'>本月无条目。</p>"
        body = "".join(
            f"<tr><td>{i}</td><td><a href='{r['item'].get('url', '#')}'>{xml_escape(r['repo'])}</a></td>"
            f"<td>{r['stars']:,}</td><td>{r['delta']:+d}</td><td>{xml_escape(r['item'].get('category', {}).get('zh', ''))}</td></tr>"
            for i, r in enumerate(entries, 1)
        )
        return (
            "<table><thead><tr><th>#</th><th>仓库</th><th>月末 Stars</th>"
            "<th>月增量</th><th>分类</th></tr></thead>"
            f"<tbody>{body}</tbody></table>"
        )

    dropped_html = (
        "<ul>"
        + "".join(f"<li>{xml_escape(repo)}</li>" for repo in dropped)
        + "</ul>"
        if dropped
        else "<p class='muted'>本月无跌出仓库。</p>"
    )
    nav = " · ".join(
        f"<a href='{m}.html'>{m}</a>" if m != month else f"<b>{m}</b>" for m in all_months
    )
    total_stars = sum(r["stars"] for r in rows)
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{month} 月度报告 · Awesome Paper Research Skills</title>
<link rel="stylesheet" href="../assets/styles.css" />
<link rel="canonical" href="{SITE_URL}/reports/{month}.html" />
</head>
<body>
<main style="max-width:960px;margin:0 auto;padding:32px 20px">
<p><a href="../">← 返回排行榜</a></p>
<h1>{month} 月度报告</h1>
<p class="muted">收录 {len(rows)} 个仓库 · 合计 {total_stars:,}★ · 报告期 {dates[0]} → {dates[-1]}</p>
<nav>{nav}</nav>

<h2>🆕 本月新收录（{len(newcomers)}）</h2>
{table(newcomers)}
<h2>📈 月度上升前 10</h2>
{table(risers)}
<h2>⏸️ 增长停滞（{len(stalled)}）</h2>
{table(stalled)}
<h2>🚪 本月跌出（{len(dropped)}）</h2>
{dropped_html}

<footer style="margin-top:32px"><a href="../feed.xml">RSS 订阅</a> · <a href="../index.html">可视化榜单</a> · 数据基于每日快照自动生成</footer>
</main>
</body>
</html>
"""


def build_monthly_reports(history: dict[str, dict[str, dict[str, Any]]]) -> None:
    """Render per-month report pages under ``reports/``.

    Past months are frozen (written once) so the 60-day snapshot retention
    never degrades an already-published report; only the current month
    regenerates on every run.
    """
    months = sorted({key[:7] for key in history})
    if not months:
        return
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    current_month = utc_now().strftime("%Y-%m")

    first_seen: dict[str, str] = {}
    for date_key in sorted(history):
        for repo in history[date_key]:
            first_seen.setdefault(repo, date_key)

    for index, month in enumerate(months):
        month_page = REPORTS_DIR / f"{month}.html"
        if month_page.exists() and month != current_month:
            continue
        prev_repos: set[str] = set()
        if index > 0:
            prev_dates = sorted(key for key in history if key.startswith(months[index - 1]))
            if prev_dates:
                prev_repos = set(history[prev_dates[-1]])
        report = render_month_report(month, history, first_seen, prev_repos, months)
        if report:
            month_page.write_text(report, encoding="utf-8")

    links = "".join(f"<li><a href='{m}.html'>{m}</a></li>" for m in reversed(months))
    (REPORTS_DIR / "index.html").write_text(
        f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>月度报告 · Awesome Paper Research Skills</title>
<link rel="stylesheet" href="../assets/styles.css" />
<link rel="canonical" href="{SITE_URL}/reports/" />
</head>
<body>
<main style="max-width:720px;margin:0 auto;padding:32px 20px">
<p><a href="../">← 返回排行榜</a></p>
<h1>月度报告</h1>
<p class="muted">每月自动总结：新收录、上升、停滞与跌出的仓库。</p>
<ul>
{links}
</ul>
</main>
</body>
</html>
""",
        encoding="utf-8",
    )


def xml_escape(value: str) -> str:
    return (
        (value or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def render_sitemap(data: dict[str, Any]) -> str:
    """Generate sitemap.xml covering the dashboard, README, and data endpoints."""
    lastmod = (data.get("metadata", {}).get("generated_at") or "")[:10]
    urls = [
        ("", lastmod, "1.0", "daily"),
        ("en/", lastmod, "0.9", "daily"),
        ("reports/", lastmod, "0.6", "weekly"),
        ("data/rankings.json", lastmod, "0.5", "daily"),
        ("data/rankings.csv", lastmod, "0.4", "daily"),
        ("docs/methodology.md", lastmod, "0.4", "monthly"),
        ("docs/discoverability.md", lastmod, "0.3", "monthly"),
        ("CONTRIBUTING.md", lastmod, "0.3", "monthly"),
    ]
    entries = []
    for path, lm, prio, freq in urls:
        loc = f"{SITE_URL}/{path}" if path else SITE_URL + "/"
        entries.append(
            "  <url>\n"
            f"    <loc>{xml_escape(loc)}</loc>\n"
            f"    <lastmod>{lm}</lastmod>\n"
            f"    <changefreq>{freq}</changefreq>\n"
            f"    <priority>{prio}</priority>\n"
            "  </url>"
        )
    return '<?xml version="1.0" encoding="UTF-8"?>\n' \
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' \
        + "\n".join(entries) + "\n</urlset>\n"


def rfc822_timestamp(value: str) -> str:
    """Render an ISO timestamp as RFC-822 (RSS 2.0 requires it, e.g.
    ``Sat, 26 Sep 2026 07:43:42 GMT``); ISO 8601 fails strict validators."""
    parsed = parse_datetime(value)
    return format_datetime(parsed) if parsed else ""


def render_feed(data: dict[str, Any], window_snapshot: dict[str, Any] | None = None) -> str:
    """Generate an RSS 2.0 feed of newcomers + top trending repos for daily订阅."""
    items = data.get("items", [])
    metadata = data.get("metadata", {})
    generated = rfc822_timestamp(metadata.get("generated_at", ""))
    newcomers = [it for it in items if is_newcomer(it, window_snapshot)]
    trending = sorted(items, key=lambda i: -(i.get("star_delta_7d") or 0))[:10]
    featured = newcomers[:8] + [it for it in trending if it not in newcomers][: (10 - len(newcomers))]
    featured = featured[:12]

    entries = []
    for it in featured:
        title = f"{it['repo']} ({it['stars']:,}★, +{it.get('star_delta_7d') or 0}/7d)"
        link = it.get("url") or ""
        desc = truncate(it.get("description") or "", 200)
        cat = it.get("category", {}).get("en", "")
        guid = f"{SITE_URL}/#{it['repo']}"
        entries.append(
            "    <item>\n"
            f"      <title>{xml_escape(title)}</title>\n"
            f"      <link>{xml_escape(link)}</link>\n"
            f"      <guid isPermaLink=\"false\">{xml_escape(guid)}</guid>\n"
            f"      <description>{xml_escape(desc)}</description>\n"
            f"      <category>{xml_escape(cat)}</category>\n"
            f"      <pubDate>{xml_escape(generated)}</pubDate>\n"
            "    </item>"
        )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n'
        "  <channel>\n"
        f"    <title>Awesome Paper Research Skills</title>\n"
        f"    <link>{SITE_URL}/</link>\n"
        "    <description>每日自动更新的学术论文与科研 Agent Skill 排行榜 · Daily ranking of academic research agent skills on GitHub</description>\n"
        f"    <language>{'zh-CN'}</language>\n"
        f"    <lastBuildDate>{xml_escape(generated)}</lastBuildDate>\n"
        f"    <atom:link href=\"{SITE_URL}/feed.xml\" rel=\"self\" type=\"application/rss+xml\"/>\n"
        + "\n".join(entries) + "\n"
        "  </channel>\n</rss>\n"
    )


def render_og_cover(data: dict[str, Any], lang: str = "zh") -> str:
    """Generate a simple SVG Open Graph cover showing the day's headline stats."""
    metadata = data.get("metadata", {})
    items = data.get("items", [])
    total = metadata.get("total", len(items))
    generated = (metadata.get("generated_at") or "")[:10]
    total_stars = sum(it.get("stars", 0) for it in items)
    top = items[0] if items else None
    # Short enough that a 36px name never collides with the star count below.
    top_name = truncate(top["repo"], 30) if top else "—"
    top_stars = f"{top['stars']:,}★" if top else ""

    # Single CJK-capable family for every text run: cairo's toy font API does
    # not do per-glyph fallback, so a Latin-first stack renders Chinese as
    # tofu. "Noto Sans CJK SC" is installed by fonts-noto-cjk in CI; the
    # later entries keep local (Windows/macOS) previews readable.
    font = "Noto Sans CJK SC, Microsoft YaHei, PingFang SC, sans-serif"

    title = "Paper Research" if lang == "en" else "论文科研 Skills"
    subtitle = "Skills Ranking" if lang == "en" else "排行榜"
    caption = "GitHub rankings · Growth trends · Editorial picks" if lang == "en" else "GitHub 排行 · 增长趋势 · 编辑精选"
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FEFDFC"/>
  <rect x="64" y="56" width="64" height="48" rx="4" fill="#866178"/>
  <text x="96" y="87" text-anchor="middle" font-family="{font}" font-size="18" font-weight="700" fill="#FFFFFF">APRS</text>
  <text x="146" y="87" font-family="{font}" font-size="25" font-weight="600" fill="#292628">Awesome Paper Research Skills</text>
  <line x1="64" y1="128" x2="1136" y2="128" stroke="#E9E4E2"/>
  <text x="64" y="234" font-family="{font}" font-size="72" font-weight="700" fill="#292628">{title}</text>
  <text x="64" y="324" font-family="{font}" font-size="72" font-weight="700" fill="#866178">{subtitle}</text>
  <text x="68" y="384" font-family="{font}" font-size="25" fill="#777074">{caption}</text>
  <line x1="64" y1="426" x2="1136" y2="426" stroke="#E9E4E2"/>
  <text x="68" y="475" font-family="{font}" font-size="24" fill="#292628">{total} repos · {total_stars:,} Stars</text>
  <text x="1136" y="475" text-anchor="end" font-family="{font}" font-size="20" fill="#777074">Updated {generated}</text>
  <text x="68" y="542" font-family="{font}" font-size="19" fill="#777074">#1 {xml_escape(top_name)}</text>
  <text x="1136" y="542" text-anchor="end" font-family="{font}" font-size="24" font-weight="600" fill="#B47C7D">{xml_escape(top_stars)}</text>
  <rect x="0" y="618" width="1200" height="12" fill="#866178"/>
</svg>
"""


def render_og_cover_png(svg_text: str) -> bytes | None:
    """Rasterize the OG cover to PNG when the optional ``cairosvg`` extra is
    installed. Open Graph / Twitter crawlers do not render SVG, so the PNG is
    the image social platforms actually show; locally (no cairosvg) the SVG
    remains the only artifact and nothing fails."""
    try:
        import cairosvg  # type: ignore[import-not-found]
    except ImportError:
        print("info: cairosvg not installed, skipping og-cover.png (pip install cairosvg)", file=sys.stderr)
        return None
    return cairosvg.svg2png(
        bytestring=svg_text.encode("utf-8"),
        output_width=1200,
        output_height=630,
    )


def write_seo_assets(data: dict[str, Any], window_snapshot: dict[str, Any] | None = None) -> None:
    SITEMAP_PATH.write_text(render_sitemap(data), encoding="utf-8")
    FEED_PATH.write_text(render_feed(data, window_snapshot=window_snapshot), encoding="utf-8")
    OG_COVER_PATH.parent.mkdir(parents=True, exist_ok=True)
    for lang, suffix in [("zh", ""), ("en", "-en")]:
        svg_text = render_og_cover(data, lang=lang)
        svg_path = OG_COVER_PATH.with_name(f"og-cover{suffix}.svg")
        png_path = OG_COVER_PNG_PATH.with_name(f"og-cover{suffix}.png")
        svg_path.write_text(svg_text, encoding="utf-8")
        png_bytes = render_og_cover_png(svg_text)
        if png_bytes:
            png_path.write_bytes(png_bytes)


def main() -> int:
    parser = argparse.ArgumentParser(description="Update academic research skill rankings")
    parser.add_argument("--config", default=str(CONFIG_PATH), help="Path to ranking config JSON")
    parser.add_argument("--offline-fixture", help="Use a local JSON list of repository objects instead of GitHub API")
    parser.add_argument("--backfill-first-seen", action="store_true", help="Annotate existing rankings from local history only (no API or other outputs)")
    args = parser.parse_args()

    if args.backfill_first_seen:
        backfill_first_seen()
        return 0

    config = load_config(Path(args.config))
    if args.offline_fixture:
        repos = load_json(Path(args.offline_fixture), [])
        data, window_snapshot = build_dataset(config, repos, enrich_skills=False)
    else:
        token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
        print("Refreshing known repositories and searching for new candidates...", flush=True)
        result = collect_repositories(config, token)
        print(f"Collection: {len(result.repositories)} eligible, {len(result.report.get('pending', []))} pending; {result.report.get('status', 'failed')}", flush=True)
        if result.report["fatal"]:
            write_collection_state(result)
            print("error: no repository metadata could be confirmed; published data preserved", file=sys.stderr)
            return 1
        print("Checking SKILL.md inventories and building rankings...", flush=True)
        data, window_snapshot = build_dataset(config, result.repositories, token=token)
        data["metadata"]["collection"] = {
            "status": result.report["status"],
            "pending_count": len(result.report["pending"]),
            "search_errors": sum(bool(row.get("error") or row.get("incomplete")) for row in result.report["searches"]),
        }
        data["metadata"]["source"] = "GitHub REST API; persistent catalog with search discovery"
        write_collection_state(result, data)
    write_outputs(data, window_snapshot=window_snapshot)
    print(f"updated {len(data['items'])} repositories at {data['metadata']['generated_at']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
