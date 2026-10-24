import test from "node:test";
import assert from "node:assert/strict";
import {
  summaryFor,
  installationFor,
  editorialPicks,
  enrichItem,
  classifyUpdateRun,
} from "../../src/practical.js";
const item = {
  repo: "sample/tool",
  description: "Original summary",
  url: "https://github.com/sample/tool",
  agents: ["codex"],
};
const content = {
  descriptions: {
    "sample/tool": {
      source_description: "Original summary",
      summary_zh: "基于原文的中文简介",
    },
  },
  installations: {
    "sample/tool": {
      command: "npx skills add sample/tool",
      source_url: "https://github.com/sample/tool#readme",
      reviewed_at: "2026-10-24",
    },
  },
  featured: [
    {
      repo: "sample/tool",
      reason_zh: "明确的使用场景",
      source_url: "https://github.com/sample/tool#readme",
    },
  ],
  platforms: { "sample/tool": ["claude-code", "codex"] },
};
test("Chinese summaries are valid only while the source description matches", () => {
  assert.equal(summaryFor(item, "zh", content).text, "基于原文的中文简介");
  assert.equal(
    summaryFor({ ...item, description: "Changed" }, "zh", content).text,
    "Changed",
  );
  assert.equal(
    summaryFor({ ...item, description: "Changed" }, "zh", content).pending,
    true,
  );
  assert.equal(
    summaryFor({ ...item, repo: "new/tool" }, "zh", content).pending,
    true,
  );
  assert.equal(summaryFor(item, "en", content).text, item.description);
});
test("unverified installation commands are not invented", () => {
  assert.equal(
    installationFor(item, content).command,
    "npx skills add sample/tool",
  );
  const unknown = installationFor(
    { ...item, repo: "new/tool", skills_count: 99 },
    content,
  );
  assert.equal(unknown.command, null);
  assert.equal(unknown.source_url, "https://github.com/sample/tool#readme");
  assert.equal(
    installationFor(item, {
      installations: { "sample/tool": { command: "arbitrary" } },
    }).command,
    null,
  );
});
test("editorial picks keep editorial order and respect the currently visible repositories", () => {
  const second = { ...item, repo: "other/tool", stars: 100000 };
  const extended = {
    ...content,
    featured: [
      { repo: "sample/tool" },
      { repo: "other/tool" },
      { repo: "gone/tool" },
    ],
  };
  assert.deepEqual(
    editorialPicks([second, item], extended).map((p) => p.item.repo),
    ["sample/tool", "other/tool"],
  );
  assert.deepEqual(
    editorialPicks([second], extended).map((p) => p.item.repo),
    ["other/tool"],
  );
});
test("verified platform annotations enrich filtering without changing original objects", () => {
  const enriched = enrichItem(item, content);
  assert.deepEqual(enriched.agents, ["claude-code", "codex"]);
  assert.deepEqual(item.agents, ["codex"]);
  assert.equal(enriched.description, item.description);
});
test("workflow status distinguishes success, failure, running, pending publication and unverified", () => {
  const base = {
    id: 1,
    status: "completed",
    conclusion: "success",
    run_started_at: "2026-10-24T10:00:00Z",
    html_url:
      "https://github.com/RiceAI88/awesome-paper-research-skills/actions/runs/1",
  };
  assert.equal(classifyUpdateRun(base, "2026-10-24T10:05:00Z").kind, "success");
  assert.equal(
    classifyUpdateRun(base, "2026-10-23T10:05:00Z").kind,
    "publishing",
  );
  assert.equal(
    classifyUpdateRun(
      { ...base, conclusion: "failure" },
      "2026-10-24T10:05:00Z",
    ).kind,
    "failure",
  );
  assert.equal(
    classifyUpdateRun(
      { ...base, status: "in_progress", conclusion: null },
      "2026-10-24T10:05:00Z",
    ).kind,
    "running",
  );
  assert.equal(classifyUpdateRun(null, "2026-10-24T10:05:00Z").kind, "unknown");
  assert.equal(
    classifyUpdateRun({ ...base, conclusion: null }, "2026-10-24T10:05:00Z")
      .kind,
    "unknown",
  );
});
