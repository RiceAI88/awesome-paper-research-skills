import React from "react";
import { EDITORIAL_CONTENT } from "../practical";
export function DataTransparency({ metadata, lang, t, base }) {
  const provenance = EDITORIAL_CONTENT.provenance;
  return (
    <section
      className="data-transparency"
      data-testid="data-transparency"
      aria-labelledby="transparencyHeading"
    >
      <h2 id="transparencyHeading">{t("transparencyTitle")}</h2>
      <div className="transparency-grid">
        <div>
          <h3>{t("rankingBasis")}</h3>
          <p>{t("rankingBasisCopy")}</p>
          <p>
            {t("trendWindows")} {metadata.trend_window_days || 7} /{" "}
            {metadata.long_window_days || 30} {t("days")} · {t("minStars")}{" "}
            {metadata.min_stars ?? 100} Stars
          </p>
          <a href={base + "docs/methodology.md"}>{t("fullMethodology")}</a>
        </div>
        <div>
          <h3>{t("historySource")}</h3>
          <p>
            {lang === "zh"
              ? `${provenance.local_collection_since} 起由本站采集；此前的历史快照继承自原项目。历史曲线中的导入数据不代表本站当时已运行。`
              : `This site collects data from ${provenance.local_collection_since}. Earlier snapshots were imported from the original project; they do not imply this site was operating then.`}
          </p>
          <a
            href={`${provenance.upstream_repository}/tree/${provenance.upstream_commit}/data/history`}
            target="_blank"
            rel="noreferrer"
          >
            {t("viewUpstreamHistory")}
          </a>
        </div>
        <div>
          <h3>{t("contentBasis")}</h3>
          <p>{t("contentBasisCopy")}</p>
          <p>{t("statusPublicApi")}</p>
        </div>
      </div>
    </section>
  );
}
