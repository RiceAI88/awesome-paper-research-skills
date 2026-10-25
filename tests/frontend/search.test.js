import { highlightParts } from "../../src/highlight.js";
import test from "node:test";
import assert from "node:assert/strict";
import { createSearch, suggestedTaskIds } from "../../src/search.js";
import { filterItems, restoreState } from "../../src/domain.js";
const items = [
  {
    repo: "a/proof",
    description: "Academic proofreading and POLISHING.",
    category: { id: "paper-writing" },
    rank: 1,
  },
  {
    repo: "b/chart",
    description: "Scientific figures and plots.",
    category: { id: "general-research" },
    rank: 2,
  },
  {
    repo: "c/setup",
    description: "Configure a project.",
    category: { id: "general-research" },
    rank: 3,
  },
  {
    repo: "d/zotero",
    description: "Zotero reference manager",
    category: { id: "literature-review" },
    rank: 4,
  },
  {
    repo: "e/other",
    description: "Mendeley integration",
    category: { id: "literature-review" },
    rank: 5,
  },
];
const state = restoreState(null, "", {}, items);
test("Chinese intents find original English descriptions while other filters still apply", () => {
  assert.deepEqual(
    filterItems(items, { ...state, query: "润色" }).map((x) => x.repo),
    ["a/proof"],
  );
  assert.deepEqual(
    filterItems(items, { ...state, query: "绘图" }).map((x) => x.repo),
    ["b/chart"],
  );
  assert.deepEqual(
    filterItems(items, { ...state, query: "文献管理" }).map((x) => x.repo),
    ["d/zotero", "e/other"],
  );
  assert.deepEqual(
    filterItems(items, { ...state, query: "绘图", category: "paper-writing" }),
    [],
  );
  assert.equal(items[0].description, "Academic proofreading and POLISHING.");
});
test("product names and full repository strings do not broaden into unrelated synonyms", () => {
  assert.deepEqual(
    filterItems(items, { ...state, query: "Zotero" }).map((x) => x.repo),
    ["d/zotero"],
  );
  assert.deepEqual(
    filterItems(items, { ...state, query: "a/proof" }).map((x) => x.repo),
    ["a/proof"],
  );
  assert.equal(createSearch("绘图").matches("Configure deployment"), false);
  assert.equal(createSearch("绘图").matches("A figure-generation skill"), true);
  assert.equal(createSearch("no-match").matches("anything"), false);
  assert.equal(createSearch("  ").matches("anything"), true);
});
test("highlight preserves source text and case, merges overlaps, treats regex characters literally", () => {
  const text = "Academic proofreading and POLISHING.";
  const parts = highlightParts(text, "润色");
  assert.equal(parts.map((x) => x.text).join(""), text);
  assert.deepEqual(
    parts.filter((x) => x.match).map((x) => x.text),
    ["proofreading", "POLISHING"],
  );
  assert.deepEqual(
    highlightParts("a+b [x] <script>", "a+b")
      .filter((x) => x.match)
      .map((x) => x.text),
    ["a+b"],
  );
  assert.deepEqual(
    highlightParts("figures", "figure")
      .filter((x) => x.match)
      .map((x) => x.text),
    ["figures"],
  );
  assert.equal(
    highlightParts("<img onerror=x>", "[")
      .map((x) => x.text)
      .join(""),
    "<img onerror=x>",
  );
  assert.deepEqual(highlightParts("Text", ""), [
    { text: "Text", match: false },
  ]);
});
test("task suggestions correspond to known intent and do not infer tasks for arbitrary names", () => {
  assert.ok(suggestedTaskIds("润色").includes("write"));
  assert.ok(suggestedTaskIds("figure").includes("figures"));
  assert.deepEqual(suggestedTaskIds("owner/exact-repo"), []);
});
