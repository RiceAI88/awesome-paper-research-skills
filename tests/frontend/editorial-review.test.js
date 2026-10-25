import test from "node:test";
import assert from "node:assert/strict";
import { editorialReviewFor } from "../../src/editorialReview.js";
import { matchesResearchTask, RESEARCH_TASKS } from "../../src/domain.js";
const manifest = {
  repos: { "a/b": { documents: [{ path: "README.md", blob_sha: "abc" }] } },
};
const now = Date.parse("2026-10-25T04:00:00Z");
function report(status = "current", needs_review = false) {
  return {
    checked_at: "2026-10-25T03:00:00Z",
    repos: {
      "a/b": {
        status,
        needs_review,
        baseline: { "README.md": "abc" },
        documents: [],
      },
    },
  };
}
test("review requires matching baseline and a recent successful check", () => {
  assert.equal(
    editorialReviewFor("a/b", report(), manifest, now).kind,
    "current",
  );
  const mismatch = report();
  mismatch.repos["a/b"].baseline["README.md"] = "old";
  assert.equal(
    editorialReviewFor("a/b", mismatch, manifest, now).kind,
    "unknown",
  );
  assert.equal(
    editorialReviewFor("a/b", report(), manifest, now + 4 * 86400000).kind,
    "expired",
  );
  assert.equal(
    editorialReviewFor("a/b", report(), manifest, now - 86400000).kind,
    "unknown",
  );
  assert.equal(
    editorialReviewFor("a/b", report("error"), manifest, now).kind,
    "error",
  );
  assert.equal(editorialReviewFor("missing", report(), manifest, now), null);
});
test("pending review survives errors and expiration, but not a baseline reset", () => {
  assert.equal(
    editorialReviewFor("a/b", report("error", true), manifest, now).kind,
    "changed",
  );
  assert.equal(
    editorialReviewFor(
      "a/b",
      report("changed", true),
      manifest,
      now + 4 * 86400000,
    ).kind,
    "changed",
  );
  const reset = {
    repos: { "a/b": { documents: [{ path: "README.md", blob_sha: "new" }] } },
  };
  assert.equal(
    editorialReviewFor("a/b", report("changed", true), reset, now).kind,
    "unknown",
  );
});
test("comparison tasks use the same category and text rules as task filters", () => {
  assert.equal(
    matchesResearchTask(
      { repo: "a/b", description: "Make scientific figures" },
      RESEARCH_TASKS.find((x) => x.id === "figures"),
    ),
    true,
  );
  assert.equal(
    matchesResearchTask(
      { repo: "a/b", category: { id: "paper-writing" } },
      RESEARCH_TASKS.find((x) => x.id === "write"),
    ),
    true,
  );
  assert.equal(
    matchesResearchTask(
      { repo: "a/b" },
      RESEARCH_TASKS.find((x) => x.id === "write"),
    ),
    false,
  );
});
