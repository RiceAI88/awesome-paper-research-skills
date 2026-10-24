import test from "node:test";
import assert from "node:assert/strict";
import {
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
test("installation mode is grounded in reviewed metadata and never guesses unknown setup", () => {
  assert.equal(installationFor(item, content).mode, "command");
  const manual = {
    installations: {
      "sample/tool": {
        mode: "manual",
        source_url: item.url,
        reviewed_at: "2026-10-25",
      },
    },
  };
  assert.equal(installationFor(item, manual).mode, "manual");
  assert.equal(
    installationFor({ ...item, repo: "unknown/repo" }, content).mode,
    "docs",
  );
  assert.equal(
    installationFor(item, {
      installations: { "sample/tool": { mode: "manual", command: "invented" } },
    }).mode,
    "docs",
  );
  assert.equal(
    installationFor(item, {
      installations: {
        "sample/tool": {
          mode: "manual",
          source_url: "javascript:alert(1)",
          reviewed_at: "2026-10-25",
        },
      },
    }).mode,
    "docs",
  );
  assert.equal(
    installationFor(item, {
      installations: {
        "sample/tool": {
          ...content.installations["sample/tool"],
          command: "   ",
        },
      },
    }).mode,
    "docs",
  );
});
