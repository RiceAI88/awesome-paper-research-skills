import { createSearch } from "./search.js";
export const RESEARCH_TASKS = [
  {
    id: "find",
    categories: ["literature-review"],
    pattern:
      /\b(?:literature[ -](?:search|retrieval|discovery)|paper[ -](?:search|finder|discovery)|academic[ -]search|semantic[ -]scholar|zotero|pubmed|arxiv|cnki)\b|文献.{0,4}(?:检索|搜索|查找|发现)|(?:搜索|检索|查找).{0,4}(?:论文|文献)|知网/i,
  },
  {
    id: "read",
    categories: ["literature-review"],
    pattern:
      /\b(?:read(?:ing|er)?|summari[sz](?:e|ation|ing)|translat(?:e|ion|ing)|zotero)\b|读论文|论文.{0,4}(?:解读|阅读|翻译)|文献阅读/i,
  },
  {
    id: "write",
    categories: ["paper-writing"],
    pattern:
      /\b(?:academic[ -]writing|paper[ -]writing|latex|proofread(?:ing)?|manuscript)\b|论文写作|学术写作|论文润色|论文撰写/i,
  },
  {
    id: "figures",
    categories: [],
    pattern:
      /\b(?:figures?|plots?|plotting|visuali[sz](?:ation|e)|illustrations?|diagrams?|charts?|figures4papers)\b|科研绘图|论文配图|科学绘图|图表|画图|绘制/i,
  },
  {
    id: "reproduce",
    categories: ["experiment-reproducibility"],
    pattern:
      /\b(?:reproduc(?:e|ibility|tion)|replicat(?:e|ion)|benchmark(?:ing)?|experiment(?:al|s)?|ablation)\b|实验复现|实验设计|复现实验|基准测试|消融/i,
  },
  {
    id: "review",
    categories: ["peer-review"],
    pattern:
      /\b(?:peer[ -]review|reviewers?|referee|rebuttal|submission|revision|revise|review[ -](?:paper|manuscript)|pre[ -]submission)\b|审稿|评审|投稿|返修|回复审稿/i,
  },
];

export const TASK_LABEL_KEYS = {
  find: "taskFind",
  read: "taskRead",
  write: "taskWrite",
  figures: "taskFigures",
  reproduce: "taskReproduce",
  review: "taskReview",
};
export function sceneLabelsFor(item, t) {
  return RESEARCH_TASKS.filter((task) => matchesResearchTask(item, task)).map(
    (task) => t(TASK_LABEL_KEYS[task.id]),
  );
}

/* Agent platform catalog — the order here is the display/sort order. */
export const AGENT_PLATFORMS = [
  { id: "antigravity", label: "Antigravity", match: ["antigravity"] },
  { id: "windsurf", label: "Windsurf", match: ["windsurf"] },
  {
    id: "claude-code",
    label: "Claude Code",
    match: ["claude code", "claude-code", "claude code skill"],
  },
  { id: "codex", label: "Codex", match: ["codex"] },
  {
    id: "opencode",
    label: "OpenCode",
    match: ["opencode", "open code", "open-code"],
  },
  { id: "cursor", label: "Cursor", match: ["cursor"] },
  { id: "gemini", label: "Gemini", match: ["gemini"] },
  { id: "cline", label: "Cline", match: ["cline"] },
  { id: "mcp", label: "MCP", match: ["mcp"] },
];

export const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
export const REPOSITORY_URL =
  "https://github.com/RiceAI88/awesome-paper-research-skills";
export function detectAgents(item) {
  if (Array.isArray(item.agents) && item.agents.length) return item.agents;
  const text = [item.repo, item.description, ...(item.topics || [])]
    .join(" ")
    .toLowerCase();
  return AGENT_PLATFORMS.filter((p) =>
    p.match.some((term) => text.includes(term)),
  ).map((p) => p.id);
}
const valid = (value, allowed, fallback) =>
  allowed.includes(value) ? value : fallback;
export function restoreState(storage, hash = "", defaults = {}, items = []) {
  const get = (key) => {
    try {
      return storage?.getItem(key);
    } catch {
      return null;
    }
  };
  const array = (key) => {
    try {
      const parsed = JSON.parse(get(key));
      return Array.isArray(parsed)
        ? [...new Set(parsed.filter((v) => typeof v === "string"))]
        : [];
    } catch {
      return [];
    }
  };
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  const repositories = new Set(items.map((i) => i.repo));
  return {
    query: p.get("q") || "",
    includeRelated: p.get("related") === "1" || p.get("today") === "related",
    section: valid(p.get("section"), ["ranking", "insights"], "ranking"),
    category: "all",
    task: valid(
      p.get("task") ||
        {
          "paper-writing": "write",
          "literature-review": "find",
          "peer-review": "review",
          "experiment-reproducibility": "reproduce",
        }[p.get("cat")],
      RESEARCH_TASKS.map((t) => t.id),
      "all",
    ),
    agent: valid(
      p.get("agent"),
      AGENT_PLATFORMS.map((a) => a.id),
      "all",
    ),
    sort: valid(
      p.get("sort"),
      ["rank", "trend", "stars", "updated", "delta30", "delta7", "newest"],
      "rank",
    ),
    lang: valid(
      p.get("lang"),
      ["zh", "en"],
      valid(get("ars-lang"), ["zh", "en"], defaults.lang || "zh"),
    ),
    theme: valid(
      p.get("theme"),
      ["light", "dark"],
      valid(get("ars-theme"), ["light", "dark"], defaults.theme || "light"),
    ),
    view: valid(
      p.get("view"),
      ["table", "card"],
      valid(get("ars-view"), ["table", "card"], defaults.view || "table"),
    ),
    favorites: array("ars-favorites"),
    compare: array("ars-compare")
      .filter((repo) => repositories.has(repo))
      .slice(0, 3),
    favOnly: p.get("fav") === "1",
    newOnly: p.get("new") === "1",
    todayOnly: valid(p.get("today"), ["skill", "related"], ""),
    repo: repositories.has(p.get("repo")) ? p.get("repo") : null,
  };
}
export function serializeState(state) {
  const p = new URLSearchParams();
  if (state.query) p.set("q", state.query);
  for (const [key, param, fallback] of [
    ["section", "section", "ranking"],
    ["task", "task", "all"],
    ["agent", "agent", "all"],
    ["sort", "sort", "rank"],
    ["view", "view", null],
    ["lang", "lang", "zh"],
    ["theme", "theme", "light"],
  ])
    if (state[key] !== fallback) p.set(param, state[key]);
  if (state.includeRelated) p.set("related", "1");
  if (state.favOnly) p.set("fav", "1");
  if (state.newOnly) p.set("new", "1");
  if (state.todayOnly) p.set("today", state.todayOnly);
  if (state.repo) p.set("repo", state.repo);
  return p.size ? "#" + p.toString() : "";
}
export function matchesResearchTask(item, task) {
  return (
    task.categories.includes(item.category?.id) ||
    task.pattern.test(
      [item.repo, item.description, ...(item.topics || [])].join(" "),
    )
  );
}
export function filterItems(items, state) {
  const q = state.query.trim();
  const search = createSearch(q);
  const task = RESEARCH_TASKS.find((t) => t.id === state.task);
  const result = items.filter((item) => {
    if (
      state.includeRelated !== undefined &&
      item.repository_kind !== "skill" &&
      !(state.includeRelated && item.repository_kind === "related")
    )
      return false;
    if (state.newOnly && !item.new_this_week) return false;
    if (
      state.todayOnly &&
      (!item.new_today || item.repository_kind !== state.todayOnly)
    )
      return false;
    if (task && !matchesResearchTask(item, task)) return false;
    if (state.agent !== "all" && !detectAgents(item).includes(state.agent))
      return false;
    if (state.favOnly && !state.favorites.includes(item.repo)) return false;
    return (
      !q ||
      search.matches(
        [
          item.repo,
          item.description,
          item.category?.zh,
          item.category?.en,
          item.trend?.zh,
          item.trend?.en,
          ...(item.topics || []),
          item.language,
          ...detectAgents(item).flatMap((id) => [
            id,
            AGENT_PLATFORMS.find((a) => a.id === id)?.label,
          ]),
        ].join(" "),
      )
    );
  });
  const ranks = (a, b) => a.rank - b.rank;
  const sorts = {
    rank: ranks,
    stars: (a, b) => b.stars - a.stars || ranks(a, b),
    trend: (a, b) => b.trend_score - a.trend_score || b.stars - a.stars,
    updated: (a, b) =>
      (b.last_push_date || "").localeCompare(a.last_push_date || ""),
    delta7: (a, b) =>
      (b.star_delta_7d || 0) - (a.star_delta_7d || 0) || ranks(a, b),
    newest: (a, b) =>
      (Date.parse(b.first_seen_at || b.first_seen_date) || 0) -
        (Date.parse(a.first_seen_at || a.first_seen_date) || 0) || ranks(a, b),
    delta30: (a, b) =>
      (b.star_delta_30d ?? b.star_delta_7d ?? 0) -
        (a.star_delta_30d ?? a.star_delta_7d ?? 0) || b.stars - a.stars,
  };
  return result
    .sort(sorts[state.sort] || ranks)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}
export function persistState(storage, state) {
  for (const [key, value] of Object.entries({
    lang: state.lang,
    theme: state.theme,
    view: state.view,
    favorites: JSON.stringify(state.favorites),
    compare: JSON.stringify(state.compare),
  })) {
    try {
      storage?.setItem("ars-" + key, value);
    } catch {
      /* Browsing remains available when storage is disabled. */
    }
  }
}
export function safeExternalUrl(url) {
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

export function taskCountsFor(items, state) {
  const eligible = filterItems(items, {
    ...state,
    task: "all",
    category: "all",
  });
  return Object.fromEntries([
    ["all", eligible.length],
    ...RESEARCH_TASKS.map((task) => [
      task.id,
      eligible.filter((item) => matchesResearchTask(item, task)).length,
    ]),
  ]);
}
export function recentlyUpdatedCount(items, generatedAt, days = 30) {
  const day = String(generatedAt).slice(0, 10);
  const anchor = Date.parse(day + "T00:00:00Z");
  if (
    !Number.isFinite(anchor) ||
    new Date(anchor).toISOString().slice(0, 10) !== day ||
    !Number.isInteger(days) ||
    days < 1
  )
    return 0;
  const cutoff = anchor - (days - 1) * 86400000;
  return items.filter((item) => {
    const date = item.last_push_date;
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      return false;
    const timestamp = Date.parse(date + "T00:00:00Z");
    return (
      Number.isFinite(timestamp) &&
      new Date(timestamp).toISOString().slice(0, 10) === date &&
      timestamp >= cutoff &&
      timestamp <= anchor
    );
  }).length;
}

export function isNewThisWeek(item, generatedAt) {
  if (item.first_seen_is_baseline) return false;
  const rawDay = String(generatedAt).slice(0, 10),
    first = item.first_seen_date;
  const rawDate = Date.parse(rawDay + "T00:00:00Z"),
    instant = Date.parse(generatedAt);
  if (
    !Number.isFinite(rawDate) ||
    !Number.isFinite(instant) ||
    new Date(rawDate).toISOString().slice(0, 10) !== rawDay
  )
    return false;
  const day = new Date(instant).toISOString().slice(0, 10);
  const now = Date.parse(day + "T00:00:00Z"),
    stamp = Date.parse(first + "T00:00:00Z");
  if (
    !Number.isFinite(now) ||
    !Number.isFinite(stamp) ||
    new Date(stamp).toISOString().slice(0, 10) !== first
  )
    return false;
  const monday = now - ((new Date(now).getUTCDay() + 6) % 7) * 86400000;
  return stamp >= monday && stamp <= now;
}

export function beijingDay(instant = Date.now()) {
  const time = new Date(instant).getTime();
  return Number.isFinite(time)
    ? new Date(time + 8 * 3600000).toISOString().slice(0, 10)
    : "";
}
export function isNewToday(item, now = Date.now()) {
  if (item.first_seen_is_baseline) return false;
  const today = beijingDay(now);
  if (!today) return false;
  if (item.first_seen_at != null) {
    if (
      typeof item.first_seen_at !== "string" ||
      !/(?:Z|[+-]\d{2}:\d{2})$/.test(item.first_seen_at)
    )
      return false;
    return beijingDay(item.first_seen_at) === today;
  }
  const date = item.first_seen_date;
  const stamp = Date.parse(date + "T00:00:00Z");
  return (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(stamp) &&
    new Date(stamp).toISOString().slice(0, 10) === date &&
    date === today
  );
}
