import React, { useEffect, useState } from "react";
import { countVisit, VISIT_SITE } from "../visits";

export function VisitCounter({ t, lang }) {
  const enabled =
    location.origin === new URL(VISIT_SITE).origin &&
    location.pathname.startsWith(new URL(VISIT_SITE).pathname) &&
    !navigator.webdriver;
  const [totals, setTotals] = useState(undefined);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    countVisit().then((value) => {
      if (active) setTotals(value);
    });
    return () => {
      active = false;
    };
  }, [enabled]);
  if (!enabled) return null;
  const fmt = (value) =>
    value.toLocaleString(lang === "en" ? "en-US" : "zh-CN");
  return (
    <div
      className="visit-counter"
      data-testid="visit-counter"
      title={t("visitCounterHint")}
    >
      {totals ? (
        <>
          <span>
            {t("visitViews")} <strong>{fmt(totals.views)}</strong>
            {lang === "zh" ? " 次" : ""}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t("visitVisitors")} <strong>{fmt(totals.visitors)}</strong>
            {lang === "zh" ? " 人" : ""}
          </span>
        </>
      ) : (
        <span role="status">
          {t(totals === undefined ? "visitLoading" : "visitUnavailable")}
        </span>
      )}
      <a href="https://busuanzi.9420.ltd/" target="_blank" rel="noreferrer">
        {t("visitProvider")}
      </a>
    </div>
  );
}
