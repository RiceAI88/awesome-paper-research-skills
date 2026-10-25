import test from "node:test";
import assert from "node:assert/strict";
import {
  taskCountsFor,
  recentlyUpdatedCount,
  restoreState,
  filterItems,
} from "../../src/domain.js";
const items = [
  {
    repo: "a/a",
    description: "Scientific figures and paper writing",
    category: { id: "paper-writing" },
    agents: ["codex"],
    rank: 1,
    last_push_date: "2026-10-25",
  },
  {
    repo: "b/b",
    description: "paper reviewer and figures",
    category: { id: "general-research" },
    agents: ["claude-code"],
    rank: 2,
    last_push_date: "2026-09-26",
  },
];
test("task counts follow search/platform/favorites and the same reset-category semantics as clicking a task", () => {
  const state = restoreState(null, "", {}, items);
  const counts = taskCountsFor(items, {
    ...state,
    task: "write",
    category: "paper-writing",
  });
  assert.equal(counts.all, 2);
  assert.equal(counts.figures, 2);
  assert.equal(counts.review, 1);
  assert.equal(
    counts.review,
    filterItems(items, { ...state, task: "review", category: "all" }).length,
  );
  assert.equal(taskCountsFor(items, { ...state, agent: "codex" }).all, 1);
  assert.equal(
    taskCountsFor(items, { ...state, favOnly: true, favorites: ["b/b"] }).write,
    0,
  );
  assert.equal(taskCountsFor(items, { ...state, query: "a/a" }).review, 0);
});
test("updated count uses 30 snapshot calendar days, rejects missing malformed and future dates", () => {
  const dates = [
    "2026-10-25",
    "2026-09-26",
    "2026-09-25",
    "2026-10-26",
    "2026-02-30",
    null,
    "invalid",
  ];
  assert.equal(
    recentlyUpdatedCount(
      dates.map((last_push_date) => ({ last_push_date })),
      "2026-10-25T12:00:00Z",
    ),
    2,
  );
  assert.equal(recentlyUpdatedCount(items, "bad"), 0);
  assert.equal(recentlyUpdatedCount(items, "2026-10-25T12:00:00Z", 1), 1);
});
