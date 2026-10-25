import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { installationFor } from "../../src/practical.js";
const content = JSON.parse(readFileSync("config/editorial.json", "utf8"));
const details = JSON.parse(
  readFileSync("config/installation-details.json", "utf8"),
);
test("reviewed installation snapshot covers twenty unique repositories with bilingual prerequisites and pinned sources", () => {
  const repos = content.installation_audit?.repos || [];
  assert.equal(repos.length, 20);
  assert.equal(new Set(repos).size, 20);
  for (const repo of repos) {
    const entry = { ...content.installations[repo], ...details[repo] };
    for (const field of [
      "environment_zh",
      "environment_en",
      "dependencies_zh",
      "dependencies_en",
      "context_zh",
      "context_en",
      "source_url",
      "reviewed_at",
      "source_commit",
    ])
      assert.ok(entry[field], `${repo} missing ${field}`);
    assert.match(entry.source_commit, /^[a-f0-9]{40}$/);
    assert.match(
      entry.source_url,
      new RegExp("^https://github.com/" + repo + "/blob/"),
    );
    if (entry.command)
      assert.doesNotMatch(entry.command, /你的用户名|<YOUR_|YOUR_API_KEY/);
  }
});
test("reviewed reference directories are not presented as an installer or an unreviewed item", () => {
  const item = {
    repo: "reference/directory",
    url: "https://github.com/reference/directory",
  };
  const result = installationFor(item, {
    installations: {
      [item.repo]: {
        mode: "reference",
        source_url: item.url,
        reviewed_at: "2026-10-25",
      },
    },
  });
  assert.equal(result.mode, "reference");
  assert.equal(result.command, null);
});
