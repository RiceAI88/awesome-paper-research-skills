import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ChartBoundary } from "./ChartBoundary";
const Insights = lazy(() => import("./Insights"));
function Placeholder({ t, count, loading = false }) {
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
        {loading && <p role="status">{t("chartsLoading")}</p>}
      </div>
      {[
        ["insightTrend", "categoryLabel"],
        ["insightGrowth", "insightScatter"],
      ].map((row, index) => (
        <div key={index} className={index ? "insights-bottom" : "insights-top"}>
          {row.map((title) => (
            <article className="insight-panel" key={title}>
              <div className="insight-panel-heading">
                <h3>{t(title)}</h3>
              </div>
              <div className="chart-placeholder" aria-hidden="true" />
            </article>
          ))}
        </div>
      ))}
    </section>
  );
}
export function ViewportInsights(props) {
  const container = useRef(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (active || props.enabled === false) return;
    if (typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px", threshold: 0 },
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [active, props.enabled]);
  return (
    <div
      ref={container}
      id="data-insights"
      tabIndex={-1}
      data-testid="insights-viewport"
    >
      {active ? (
        <ChartBoundary fallback={props.t("chartUnavailable")}>
          <Suspense
            fallback={
              <Placeholder t={props.t} count={props.items.length} loading />
            }
          >
            <Insights {...props} />
          </Suspense>
        </ChartBoundary>
      ) : (
        <Placeholder t={props.t} count={props.items.length} />
      )}
    </div>
  );
}
