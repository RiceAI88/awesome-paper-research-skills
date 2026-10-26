import React from "react";

export function RechargeAd({ t }) {
  return (
    <aside
      className="sponsor-banner recharge-banner"
      aria-label={`${t("advertisement")} · ${t("rechargeTitle")}`}
      data-testid="gpt-recharge-ad"
    >
      <div className="sponsor-content">
        <span className="sponsor-label">{t("advertisement")}</span>
        <span className="sponsor-brand">{t("rechargeTitle")}</span>
        <span className="sponsor-copy">{t("rechargeDescription")}</span>
      </div>
      <a
        className="sponsor-cta"
        href="https://catfk.com/shop/1991"
        target="_blank"
        rel="sponsored noopener noreferrer"
      >
        {t("rechargeAction")} <span aria-hidden="true">↗</span>
      </a>
    </aside>
  );
}
