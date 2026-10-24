import descriptionRegistry from "../config/descriptions.zh.json" with { type: "json" };
import editorial from "../config/editorial.json" with { type: "json" };
import { safeExternalUrl } from "./domain.js";
export const EDITORIAL_CONTENT = {
  ...editorial,
  descriptions: descriptionRegistry.entries,
};
export const UPDATE_RUNS_URL =
  "https://api.github.com/repos/RiceAI88/awesome-paper-research-skills/actions/workflows/update-rankings.yml/runs?branch=main&per_page=1";
export function summaryFor(item, lang, content = EDITORIAL_CONTENT) {
  if (lang !== "zh") return { text: item.description || "", pending: false };
  const entry = content.descriptions?.[item.repo];
  const valid =
    entry?.summary_zh && entry.source_description === item.description;
  return {
    text: valid ? entry.summary_zh : item.description || "",
    pending: !valid,
    reason: entry ? "changed" : "missing",
  };
}
export function installationFor(item, content = EDITORIAL_CONTENT) {
  const entry = content.installations?.[item.repo];
  const source = entry?.reviewed_at && safeExternalUrl(entry.source_url);
  return source
    ? {
        ...entry,
        command: typeof entry.command === "string" ? entry.command : null,
        source_url: source,
      }
    : {
        command: null,
        source_url:
          (safeExternalUrl(item.url) ||
            "https://github.com/" + encodeURIComponent(item.repo)) + "#readme",
      };
}
export function enrichItem(item, content = EDITORIAL_CONTENT) {
  const summary = summaryFor(item, "zh", content);
  return {
    ...item,
    description_zh: summary.pending ? null : summary.text,
    agents: content.platforms?.[item.repo] || item.agents,
  };
}
export function editorialPicks(visibleItems, content = EDITORIAL_CONTENT) {
  const byRepo = new Map(visibleItems.map((item) => [item.repo, item]));
  return (content.featured || [])
    .filter((pick) => byRepo.has(pick.repo))
    .map((pick) => ({ ...pick, item: byRepo.get(pick.repo) }));
}
export function classifyUpdateRun(run, generatedAt) {
  if (!run || !Number.isInteger(run.id)) return { kind: "unknown" };
  const url = safeExternalUrl(run.html_url);
  const base = {
    url,
    runId: run.id,
    startedAt: run.run_started_at,
    finishedAt: run.updated_at,
  };
  if (
    ["queued", "in_progress", "waiting", "pending", "requested"].includes(
      run.status,
    )
  )
    return { ...base, kind: "running" };
  if (run.status !== "completed") return { ...base, kind: "unknown" };
  if (run.conclusion === "success") {
    const generated = Date.parse(generatedAt),
      started = Date.parse(run.run_started_at);
    return {
      ...base,
      kind:
        Number.isFinite(generated) &&
        Number.isFinite(started) &&
        generated >= started
          ? "success"
          : "publishing",
    };
  }
  if (
    [
      "failure",
      "cancelled",
      "timed_out",
      "action_required",
      "startup_failure",
    ].includes(run.conclusion)
  )
    return { ...base, kind: "failure" };
  return { ...base, kind: "unknown" };
}
