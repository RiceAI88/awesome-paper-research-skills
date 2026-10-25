import React from "react";
import { Tag } from "antd";
import { editorialReviewFor } from "../editorialReview";
import { safeExternalUrl } from "../domain";
export function EditorialReviewNotice({
  repo,
  t,
  details = false,
  evidenceOnly = false,
  compact = false,
}) {
  const review = editorialReviewFor(repo);
  if (!review || (!details && review.kind !== "changed")) return null;
  return (
    <div className="editorial-review-notice" data-review-state={review.kind}>
      {!evidenceOnly && (
        <Tag className={review.kind === "changed" ? "warm-tag" : undefined}>
          {t(
            {
              current: "reviewCurrent",
              changed: "reviewChanged",
              error: "reviewError",
              expired: "reviewExpired",
              unknown: "reviewUnknown",
            }[review.kind],
          )}
        </Tag>
      )}
      {!compact && !evidenceOnly && review.kind === "changed" && (
        <p>{t("reviewHint")}</p>
      )}
      {details && (
        <>
          {review.checkedAt && (
            <small>
              {t("reviewCheckTime")}{" "}
              <time dateTime={review.checkedAt}>
                {review.checkedAt.replace("T", " ").replace(/\.\d+Z$/, " UTC")}
              </time>
            </small>
          )}
          {review.checkFailed && review.kind === "changed" && (
            <p>{t("reviewFailureHint")}</p>
          )}
          {review.documents
            .filter((doc) => ["changed", "removed"].includes(doc.status))
            .map((doc) => (
              <div key={doc.path}>
                <span>{doc.path} · </span>
                {safeExternalUrl(
                  doc.diff_url || doc.current_url || doc.reviewed_url,
                ) && (
                  <a
                    href={safeExternalUrl(
                      doc.diff_url || doc.current_url || doc.reviewed_url,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("reviewDiff")} ↗
                  </a>
                )}
              </div>
            ))}
        </>
      )}
    </div>
  );
}
