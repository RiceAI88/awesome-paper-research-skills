import test from "node:test";
import assert from "node:assert/strict";
import {
  filterItems,
  restoreState,
  serializeState,
  detectAgents,
} from "../../src/domain.js";
const item = (
  repo,
  description,
  category = "general-research",
  extra = {},
) => ({
  repo,
  description,
  category: { id: category, zh: "综合研究", en: "Research" },
  topics: [],
  rank: 1,
  stars: 100,
  trend_score: 2,
  last_push_date: "2026-10-20",
  ...extra,
});
const items = [
  item("a/figures", "Scientific figures and diagrams", undefined, {
    agents: ["codex"],
    stars: 200,
  }),
  item("b/writer", "LaTeX paper writing", "paper-writing", {
    stars: 300,
    trend_score: 9,
  }),
  item("c/preview", "Preview website markup", undefined, { stars: 50 }),
];
const store = (values = {}) => ({ getItem: (key) => values[key] ?? null });
const initial = (values = {}, hash = "") =>
  restoreState(
    store(values),
    hash,
    { lang: "zh", theme: "light", view: "table" },
    items,
  );
test("task filtering combines with search, platform and favorites", () => {
  const state = {
    ...initial(),
    task: "figures",
    query: "diagram",
    agent: "codex",
    favOnly: true,
    favorites: ["a/figures"],
  };
  assert.deepEqual(
    filterItems(items, state).map((i) => i.repo),
    ["a/figures"],
  );
  assert.equal(filterItems(items, { ...state, query: "missing" }).length, 0);
  assert.equal(filterItems(items, { ...state, favorites: [] }).length, 0);
});
test("review matching does not mistake preview for peer review", () => {
  const list = [...items, item("d/referee", "Peer review and rebuttal")];
  assert.deepEqual(
    filterItems(list, { ...initial(), task: "review" }).map((i) => i.repo),
    ["d/referee"],
  );
});
test("five sort modes preserve ranking semantics", () => {
  const list = items.map((i, n) => ({
    ...i,
    rank: n + 1,
    star_delta_30d: n,
    last_push_date: `2026-10-${20 + n}`,
  }));
  for (const [sort, first] of [
    ["rank", "a/figures"],
    ["stars", "b/writer"],
    ["trend", "b/writer"],
    ["updated", "c/preview"],
    ["delta30", "c/preview"],
  ])
    assert.equal(filterItems(list, { ...initial(), sort })[0].repo, first);
});
test("all tasks match capabilities and category fallback", () => {
  const definitions = [
    ["find", "Academic search for papers", "general-research"],
    ["read", "Translate and read papers", "general-research"],
    ["write", "LaTeX manuscripts", "general-research"],
    ["figures", "Scientific visualization", "general-research"],
    ["reproduce", "Experiment replication", "general-research"],
    ["review", "Rebuttal and submission", "general-research"],
    ["find", "Library", "literature-review"],
    ["read", "Library", "literature-review"],
  ];
  for (const [task, description, category] of definitions)
    assert.equal(
      filterItems([item("x/tool", description, category)], {
        ...initial(),
        task,
      }).length,
      1,
      task,
    );
});
test("old storage and complete hash round-trip, hash overrides saved preferences", () => {
  const state = initial(
    {
      "ars-lang": "en",
      "ars-theme": "dark",
      "ars-view": "card",
      "ars-favorites": '["a/figures"]',
      "ars-compare": '["a/figures"]',
    },
    "#q=figure&task=figures&agent=codex&sort=stars&view=table&lang=zh&theme=light&fav=1&repo=a%2Ffigures",
  );
  assert.equal(state.lang, "zh");
  assert.equal(state.theme, "light");
  assert.equal(state.view, "table");
  assert.deepEqual(state.favorites, ["a/figures"]);
  assert.deepEqual(state.compare, ["a/figures"]);
  assert.equal(state.repo, "a/figures");
  const recovered = initial({}, serializeState(state));
  for (const key of [
    "query",
    "task",
    "agent",
    "sort",
    "view",
    "lang",
    "theme",
    "favOnly",
    "repo",
  ])
    assert.equal(recovered[key], state[key], key);
});
test("corrupt or inaccessible storage and invalid URL values fall back safely", () => {
  const state = initial(
    {
      "ars-lang": "bad",
      "ars-view": "bad",
      "ars-favorites": "oops",
      "ars-compare": "{}",
    },
    "#task=bad&cat=bad&agent=bad&sort=bad&repo=not-listed&lang=bad&theme=bad",
  );
  assert.equal(state.task, "all");
  assert.equal(state.category, "all");
  assert.equal(state.agent, "all");
  assert.equal(state.sort, "rank");
  assert.equal(state.repo, null);
  assert.equal(state.lang, "zh");
  assert.equal(state.theme, "light");
  assert.deepEqual(state.favorites, []);
  assert.deepEqual(state.compare, []);
  assert.doesNotThrow(() =>
    restoreState(
      {
        getItem() {
          throw Error("blocked");
        },
      },
      "",
      {},
      [],
    ),
  );
  assert.deepEqual(filterItems([], state), []);
});
test("comparison selection is distinct, present and limited to three", () => {
  const list = [...items, item("d/four", "tool")];
  const state = restoreState(
    store({
      "ars-compare":
        '["a/figures","a/figures","b/writer","c/preview","d/four","gone/repo"]',
    }),
    "",
    {},
    list,
  );
  assert.deepEqual(state.compare, ["a/figures", "b/writer", "c/preview"]);
});
test("platform detection uses structured data and supports legacy descriptions", () => {
  assert.deepEqual(
    detectAgents({ agents: ["codex"], description: "Claude Code" }),
    ["codex"],
  );
  assert.deepEqual(detectAgents({ description: "Claude Code and MCP tools" }), [
    "claude-code",
    "mcp",
  ]);
});

test("shared table view stays explicit when the website default is cards", () => {
  assert.match(serializeState({ ...initial(), view: "table" }), /view=table/);
});
