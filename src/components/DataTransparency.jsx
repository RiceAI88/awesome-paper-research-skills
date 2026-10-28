import { Reveal } from "./SiteMotion";
import React from "react";
export function DataTransparency({ t, base }) {
  return (
    <Reveal as="section"
      className="data-transparency"
      data-testid="data-transparency"
      aria-labelledby="transparencyHeading"
    >
      <h2 id="transparencyHeading">{t("transparencyTitle")}</h2>
      <p>
        <strong>{t("rankingBasis")}</strong> {t("rankingBasisCopy")}
      </p>
      <p>
        <strong>{t("dataSource")}</strong> {t("dataSourceCopy")}
      </p>
      <a href={base + "docs/methodology.md"}>{t("fullMethodology")}</a>
    </Reveal>
  );
}
