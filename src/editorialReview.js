import reportData from "../data/editorial-status.json" with { type: "json" };
import manifestData from "../config/editorial-sources.json" with { type: "json" };
export function editorialReviewFor(
  repo,
  report = reportData,
  manifest = manifestData,
  now = Date.now(),
) {
  const tracked = manifest.repos?.[repo];
  if (!tracked) return null;
  const entry = report.repos?.[repo];
  const baseline = entry?.baseline || {};
  if (
    !tracked.documents?.length ||
    Object.keys(baseline).length !== tracked.documents.length ||
    !tracked.documents.every((doc) => baseline[doc.path] === doc.blob_sha)
  )
    return { kind: "unknown" };
  const checked = Date.parse(report.checked_at);
  const validTime = Number.isFinite(checked) && checked <= now + 300000;
  const base = {
    checkedAt: validTime ? report.checked_at : null,
    documents: entry.documents || [],
    checkFailed: entry.status === "error",
  };
  if (entry.needs_review) return { ...base, kind: "changed" };
  if (!validTime) return { ...base, kind: "unknown" };
  if (entry.status === "error") return { ...base, kind: "error" };
  if (now - checked > 72 * 3600000) return { ...base, kind: "expired" };
  return { ...base, kind: entry.status === "current" ? "current" : "unknown" };
}
