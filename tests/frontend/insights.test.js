import test from "node:test";
import assert from "node:assert/strict";
import { buildInsightData, createColorMaps } from "../../src/insights.js";
const items = [
  {
    repo: "a/first",
    stars: 200,
    star_delta_7d: 0,
    category: { id: "writing", zh: "写作", en: "Writing" },
  },
  {
    repo: "b/second",
    stars: 150,
    star_delta_7d: 20,
    category: { id: "writing", zh: "写作", en: "Writing" },
  },
  {
    repo: "c/third",
    stars: 100,
    star_delta_7d: -3,
    category: { id: "reading", zh: "阅读", en: "Reading" },
  },
  {
    repo: "d/zero",
    stars: 0,
    star_delta_7d: 0,
    category: { id: "reading", zh: "阅读", en: "Reading" },
  },
];
test("category totals and growth use current filtered data, scatter retains signed growth", () => {
  const data = buildInsightData(items, {}, "2026-10-24T10:00:00Z", 30);
  assert.equal(
    data.categories.reduce((sum, c) => sum + c.count, 0),
    4,
  );
  assert.deepEqual(
    data.growth.map((i) => i.repo),
    ["b/second"],
  );
  assert.deepEqual(
    data.scatter.map((i) => i.growth),
    [0, 20, -3],
  );
  assert.equal(data.trends.length, 0);
  assert.equal(buildInsightData([], {}, "bad", 30).scatter.length, 0);
});
test("history uses exact dates, rejects invalid/future snapshots and deduplicates without filling gaps", () => {
  const history = {
    series: {
      "a/first": [
        { date: "2026-08-01", stars: 50 },
        { date: "2026-10-01", stars: 100 },
        { date: "2026-10-20", stars: 180 },
        { date: "2026-10-20", stars: 190 },
        { date: "2026-10-24", stars: 200 },
        { date: "2026-10-25", stars: 300 },
        { date: "invalid", stars: 8 },
        { date: "2026-02-30", stars: 8 },
        { date: "2026-10-22", stars: null },
      ],
    },
  };
  const data = buildInsightData(items, history, "2026-10-24T10:00:00Z", 30);
  assert.deepEqual(
    data.trends.map((p) => [p.date, p.stars]),
    [
      ["2026-10-01", 100],
      ["2026-10-20", 190],
      ["2026-10-24", 200],
    ],
  );
  assert.deepEqual(
    data.trends.map((p) => p.repo),
    ["a/first", "a/first", "a/first"],
  );
  assert.equal(buildInsightData(items, history, "bad", 30).trends.length, 0);
});
test("series colors remain bound to full repository/category identifiers when filtering or sorting", () => {
  const colors = createColorMaps(items);
  assert.notEqual(colors.repos["a/first"], colors.repos["b/second"]);
  assert.equal(
    colors.categories.writing,
    colors.categories[items[1].category.id],
  );
  assert.deepEqual(createColorMaps([...items].reverse()), colors);
  const subset = buildInsightData(items.slice(1, 3), {}, "2026-10-24", 60);
  assert.equal(
    subset.categories.reduce((s, c) => s + c.count, 0),
    2,
  );
  assert.deepEqual(
    subset.growth.map((i) => i.repo),
    ["b/second"],
  );
});
