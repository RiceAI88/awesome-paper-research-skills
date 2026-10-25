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
test("trend growth compares each repository with its first positive snapshot in the selected window", () => {
  const history = { series: {
    "a/first": [
      { date: "2026-09-01", stars: 10 },
      { date: "2026-10-01", stars: 100 },
      { date: "2026-10-20", stars: 150 },
      { date: "2026-10-24", stars: 200 },
    ],
    "b/second": [
      { date: "2026-10-20", stars: 40 },
      { date: "2026-10-24", stars: 30 },
    ],
  } };
  const data = buildInsightData(items, history, "2026-10-24", 30);
  assert.deepEqual(data.trends.map(p => [p.repo, p.date, p.stars, p.growthPercent]), [
    ["a/first", "2026-10-01", 100, 0],
    ["a/first", "2026-10-20", 150, 50],
    ["a/first", "2026-10-24", 200, 100],
    ["b/second", "2026-10-20", 40, 0],
    ["b/second", "2026-10-24", 30, -25],
  ]);
  assert.equal(data.trends[0].baselineDate, "2026-10-01");
  assert.equal(data.trends.at(-1).baselineDate, "2026-10-20");
  const shorter = buildInsightData(items, history, "2026-10-24", 5);
  assert.equal(shorter.trends[0].baselineStars, 150);
  assert.ok(Math.abs(shorter.trends[1].growthPercent - 100 / 3) < 1e-10);
});
test("zero baselines stay undefined and a single snapshot stays a single baseline point", () => {
  const data = buildInsightData(items, { series: {
    "a/first": [
      { date: "2026-10-01", stars: 0 },
      { date: "2026-10-20", stars: 50 },
      { date: "2026-10-24", stars: 0 },
    ],
    "b/second": [{ date: "2026-10-24", stars: 12 }],
    "c/third": [{ date: "2026-10-24", stars: 0 }],
  } }, "2026-10-24", 30);
  assert.deepEqual(data.trends.map(p => p.growthPercent), [null, 0, -100, 0, null]);
  assert.deepEqual(data.trends.filter(p => p.repo === "b/second").map(p => [p.date, p.snapshotCount, p.growthPercent]), [["2026-10-24", 1, 0]]);
  assert.equal(data.trends.at(-1).baselineDate, null);
  assert.ok(data.trends.every(p => p.growthPercent === null || Number.isFinite(p.growthPercent)));
});

test("default trend ranks window growth with two real observations before sparse or high-star repositories", () => {
  const candidates = [
    { repo: "big/stable", stars: 100000 },
    { repo: "small/fast", stars: 30 },
    { repo: "small/steady", stars: 40 },
    { repo: "sparse/new", stars: 900 },
  ];
  const series = Object.fromEntries(candidates.map((item, index) => [item.repo,
    index === 3 ? [{ date: "2026-10-24", stars: 900 }] : [
      { date: "2026-10-01", stars: [100000, 10, 20][index] },
      { date: "2026-10-24", stars: [100001, 30, 40][index] },
    ]]));
  const data = buildInsightData(candidates, { series }, "2026-10-24", 30);
  assert.deepEqual(data.trendRepos.map(item => item.repo), ["small/fast", "small/steady", "big/stable"]);
});

test("explicit trend candidates can cross filters without changing category, growth, or scatter scope", () => {
  const selected = [items[2], items[0]];
  const data = buildInsightData([items[1]], { series: {
    "c/third": [{ date: "2026-10-24", stars: 10 }],
    "a/first": [{ date: "2026-10-24", stars: 20 }],
  } }, "2026-10-24", 30, selected);
  assert.deepEqual(data.trendRepos.map(item => item.repo), selected.map(item => item.repo));
  assert.deepEqual(data.scatter.map(item => item.repo), ["b/second"]);
  assert.equal(data.categories[0].count, 1);
});

test("scatter highlights the three largest signed seven-day changes and retains category names", () => {
  const data = buildInsightData(items, {}, "2026-10-24", 30);
  assert.deepEqual(data.scatter.filter(point => point.highlight).map(point => point.repo), ["a/first", "b/second", "c/third"]);
  assert.equal(data.scatter[0].categoryZh, "写作");
  assert.equal(data.scatter[0].categoryEn, "Writing");
  const more = buildInsightData([...items, { repo: "huge/slow", stars: 100000, star_delta_7d: -20 }], {}, "2026-10-24", 30);
  assert.equal(more.scatter.find(point => point.repo === "huge/slow").highlight, false);
});
