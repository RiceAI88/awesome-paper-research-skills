import test from "node:test";
import assert from "node:assert/strict";
import {
  restoreState,
  serializeState,
  filterItems,
  taskCountsFor,
} from "../../src/domain.js";
const items = [
  {
    repo: "a/related",
    rank: 1,
    stars: 100,
    repository_kind: "related",
    description: "Paper writing",
  },
  {
    repo: "b/skill",
    rank: 2,
    stars: 90,
    repository_kind: "skill",
    description: "Paper writing",
  },
  {
    repo: "c/skill",
    rank: 3,
    stars: 80,
    repository_kind: "skill",
    description: "Paper search",
  },
  { repo: "d/unknown", rank: 4, stars: 70, repository_kind: "unknown" },
];
const initial = () => restoreState(null, "", {}, items);
test("fresh ranking includes verified Skills only and numbers them from one", () => {
  const state = initial();
  assert.equal(state.includeRelated, false);
  assert.deepEqual(
    filterItems(items, state).map((i) => [i.repo, i.rank]),
    [
      ["b/skill", 1],
      ["c/skill", 2],
    ],
  );
  assert.equal(taskCountsFor(items, state).all, 2);
});
test("related switch includes related only, shares scope and insights tab across refresh", () => {
  const state = { ...initial(), includeRelated: true, section: "insights" };
  assert.deepEqual(
    filterItems(items, state).map((i) => [i.repo, i.rank]),
    [
      ["a/related", 1],
      ["b/skill", 2],
      ["c/skill", 3],
    ],
  );
  const restored = restoreState(null, serializeState(state), {}, items);
  assert.equal(restored.includeRelated, true);
  assert.equal(restored.section, "insights");
  assert.equal(taskCountsFor(items, restored).all, 3);
});
