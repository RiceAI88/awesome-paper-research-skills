import React from "react";
import logo from "../assets/zhi1ke-logo.png";

const destination =
  "https://zhi1ke.com/?utm_source=awesome-paper-research-skills&utm_medium=referral&utm_campaign=ranking_front";

export function Zhi1keAd({ t }) {
  return (
    <aside
      className="sponsor-banner"
      aria-label={`${t("advertisement")} · 智一刻 AI`}
      data-testid="zhi1ke-ad"
    >
      <div className="sponsor-brand-block">
        <div className="sponsor-brand">
          <img src={logo} alt="" width={34} height={24} decoding="async" />
          <span>
            智一刻 <small>AI</small>
          </span>
        </div>
        <div className="sponsor-meta">
          <span className="sponsor-label">{t("advertisement")}</span>
          <span className="sponsor-domain">zhi1ke.com</span>
        </div>
      </div>
      <div className="sponsor-copy">
        <h3>{t("sponsorHeadline")}</h3>
        <p>{t("sponsorDescription")}</p>
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
