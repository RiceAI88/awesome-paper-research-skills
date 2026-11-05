import React from "react";

export function RechargeAd({ t }) {
  return (
    <aside
      className="support-card"
      aria-label={t("rechargeTitle")}
      data-testid="gpt-recharge-ad"
    >
      <a
        className="support-card-link"
        href="https://catfk.com/shop/1991"
        target="_blank"
        rel="sponsored noopener noreferrer"
      >
        <span className="support-card-heading">
          <strong>{t("rechargeSupport")}</strong>
          <span className="support-card-arrow" aria-hidden="true">
            ↗
          </span>
        </span>
        <span className="support-card-caption">{t("rechargeSummary")}</span>
      </a>
    </aside>
  );
}
