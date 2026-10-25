import { EditorialReviewNotice } from "./EditorialReviewNotice";
import { Panel } from "./Panel";
import React from "react";
import { editorialPicks } from "../practical";
import { PlatformTags, InstallationActions } from "./PracticalInfo";
export function EditorialPicks({ items, state, t }) {
  const picks = editorialPicks(items);
  if (!picks.length) return null;
  return (
    <section
      className="editorial-section"
      data-testid="editorial-picks"
      aria-labelledby="editorialHeading"
    >
      <div className="editorial-heading">
        <div>
          <h2 id="editorialHeading">{t("editorialTitle")}</h2>
          <p className="sr-only">{t("editorialSubtitle")}</p>
        </div>
      </div>
      <div
        className="editorial-grid"
        tabIndex={0}
        role="region"
        aria-label={t("editorialTitle")}
      >
        {picks.map((pick, index) => (
          <Panel
            key={pick.repo}
            className="editorial-card"
            data-featured={pick.repo}
          >
            <details className="editorial-details">
              <summary
                aria-label={`${pick[`title_${state.lang}`]} · ${t("editorialMore")}`}
              >
                <span className="editorial-index">
                  {String(index + 1).padStart(2, "0")}
                </span>{" "}
                <span className="editorial-title">
                  {pick[`title_${state.lang}`]}
                </span>
              </summary>
              <div className="editorial-expanded">
                <a
                  className="editorial-repo"
                  href={pick.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {pick.repo}
                </a>
                <p className="editorial-audience" data-testid="pick-audience">
                  <strong>{t("pickAudience")}</strong>
                  {pick[`audience_${state.lang}`]}
                </p>
                <p className="editorial-outcome" data-testid="pick-outcome">
                  {pick[`outcome_${state.lang}`]}
                </p>
                <EditorialReviewNotice
                  repo={pick.repo}
                  t={t}
                  details
                  evidenceOnly
                />
                <p className="editorial-reason">
                  <strong>{t("recommendationReason")}</strong>
                  {pick[`reason_${state.lang}`]}
                </p>
                <div className="editorial-evidence">
                  <a href={pick.source_url} target="_blank" rel="noreferrer">
                    {t("pickSource")}
                  </a>
                  <span>
                    {t("docsChecked")}{" "}
                    <time dateTime={pick.reviewed_at}>{pick.reviewed_at}</time>
                  </span>
                  <span>{t("pickDocsOnly")}</span>
                </div>
                <PlatformTags item={pick.item} t={t} />
                <InstallationActions item={pick.item} lang={state.lang} t={t} />
              </div>
            </details>
            <EditorialReviewNotice repo={pick.repo} t={t} compact />
          </Panel>
        ))}
      </div>
    </section>
  );
}
