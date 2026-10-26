import React from "react";
import logo from "../assets/zhi1ke-logo.png";

const destination = "https://zhi1ke.com?pic=6PEB";

export function Zhi1keAd({ t }) {
  return (
    <aside
      className="sponsor-banner"
      aria-label={`${t("advertisement")} · 智一刻 AI`}
      data-testid="zhi1ke-ad"
    >
      <div className="sponsor-content">
        <span className="sponsor-label">{t("advertisement")}</span>
        <span className="sponsor-brand">
          <img src={logo} alt="" width={24} height={18} decoding="async" />
          智一刻 AI
        </span>
        <span className="sponsor-copy">
          {t("sponsorHeadline")} {t("sponsorDescription")}
        </span>
      </div>
      <a
        className="sponsor-cta"
        href={destination}
        target="_blank"
        rel="sponsored noopener noreferrer"
      >
        {t("sponsorAction")} <span aria-hidden="true">↗</span>
      </a>
    </aside>
  );
}
