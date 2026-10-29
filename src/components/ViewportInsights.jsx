import React, { lazy, Suspense } from "react";
import { Reveal } from "./SiteMotion";
import { ChartSkeleton } from "./ChartSkeleton";
import { ChartBoundary } from "./ChartBoundary";
const Insights = lazy(() => import("./Insights"));
function Placeholder({ t, count, scopeControl, loading = false }) {
  return (
    <section
      className="insights insights-placeholder"
      data-testid="insights-placeholder"
      aria-label={t("insightsTitle")}
      aria-busy={loading}
    >
      <div className="insights-heading">
        <div>
          <h2>{t("insightsTitle")}</h2>
          <p>
            {t("insightsScope")} <b>{count}</b> {t("repos")}
          </p>
        </div>
        <div className="insights-actions">
          {scopeControl}
          {loading && <p role="status">{t("chartsLoading")}</p>}
        </div>
      </div>
      {[
        ["insightGrowth", "sceneDistribution"],
        ["insightTrend", "insightScatter"],
      ].map((row, index) => (
        <div key={index} className={index ? "insights-bottom" : "insights-top"}>
          {row.map((title) => (
            <article className="insight-panel" key={title}>
              <div className="insight-panel-heading">
                <h3>{t(title)}</h3>
              </div>
              <ChartSkeleton label={t("chartsLoading")} height={index ? title === "insightTrend" ? 280 : 300 : title === "insightGrowth" ? 220 : 192} />
            </article>
          ))}
        </div>
      ))}
    </section>
  );
}
export function ViewportInsights(props) {
  return (
    <Reveal id="data-insights" tabIndex={-1} data-testid="insights-viewport">
      <ChartBoundary fallback={props.t("chartUnavailable")}>
        <Suspense
          fallback={
            <Placeholder t={props.t} count={props.items.length} scopeControl={props.scopeControl} loading />
          }
        >
          <Insights {...props} />
        </Suspense>
      </ChartBoundary>
    </Reveal>
  );
}
