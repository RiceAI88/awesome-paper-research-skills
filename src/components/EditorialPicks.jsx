import React from "react";
import { Card, Typography } from "antd";
import { EDITORIAL_CONTENT, editorialPicks } from "../practical";
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
          <p>{t("editorialSubtitle")}</p>
        </div>
        <span>
          {t("docsChecked")} {EDITORIAL_CONTENT.reviewed_at}
        </span>
      </div>
      <div className="editorial-grid">
        {picks.map((pick) => (
          <Card
            key={pick.repo}
            size="small"
            className="editorial-card"
            data-featured={pick.repo}
          >
            <h3>{pick[`title_${state.lang}`]}</h3>
            <Typography.Link
              className="editorial-repo"
              href={pick.source_url}
              target="_blank"
              rel="noreferrer"
            >
              {pick.repo}
            </Typography.Link>
            <p className="editorial-reason">
              <strong>{t("recommendationReason")}</strong>
              {pick[`reason_${state.lang}`]}
            </p>
            <PlatformTags item={pick.item} t={t} />
            <InstallationActions item={pick.item} lang={state.lang} t={t} />
          </Card>
        ))}
      </div>
    </section>
  );
}
