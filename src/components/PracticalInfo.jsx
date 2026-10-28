import React from "react";
import { SearchHighlight } from "./SearchHighlight";
import { EditorialReviewNotice } from "./EditorialReviewNotice";
import { Button, Space, Tag, Tooltip } from "antd";
import { CopyOutlined, ExportOutlined } from "@ant-design/icons";
import { AGENT_PLATFORMS, detectAgents, safeExternalUrl } from "../domain";
import { EDITORIAL_CONTENT, installationFor } from "../practical";
import { useFeedback } from "./FeedbackProvider";
import { copyText } from "../clipboard";
export function SummaryText({ item, t, query = "" }) {
  return (
    <div className="practical-description">
      <p className="description-clamp" title={item.description}>
        <SearchHighlight
          text={item.description || t("noDescription")}
          query={query}
        />
      </p>
    </div>
  );
}
export function PlatformTags({ item, t, compact = false }) {
  const agents = detectAgents(item);
  if (compact) {
    const labels = agents.map(
      (id) => AGENT_PLATFORMS.find((agent) => agent.id === id)?.label || id,
    );
    return (
      <Tooltip title={labels.join(" · ") || t("platformUnspecifiedHint")}>
        <span className="card-platforms">
          {labels.slice(0, 2).join(" · ") || t("agentGeneral")}
          {labels.length > 2 && ` +${labels.length - 2}`}
        </span>
      </Tooltip>
    );
  }
  const verified = Boolean(EDITORIAL_CONTENT.platforms[item.repo]);
  return (
    <Tooltip
      title={t(
        !agents.length
          ? "platformUnspecifiedHint"
          : verified
            ? "platformDocumented"
            : "platformInferred",
      )}
    >
      <Space size={[4, 4]} wrap className="platform-tags">
        {agents.length ? (
          agents.map((id) => (
            <Tag key={id}>
              {AGENT_PLATFORMS.find((agent) => agent.id === id)?.label || id}
            </Tag>
          ))
        ) : (
          <Tag>{t("agentGeneral")}</Tag>
        )}
      </Space>
    </Tooltip>
  );
}
export function InstallationMode({ item, t, short = false }) {
  const installation = installationFor(item);
  const label = t(
    {
      command: "installCommandMode",
      manual: "installManualMode",
      docs: "installUnknownMode",
      reference: "installReferenceMode",
    }[installation.mode],
  );
  return (
    <Tooltip title={label}>
      <Tag
        className={`install-mode install-mode-${installation.mode}`}
        data-testid="installation-mode"
        tabIndex={0}
      >
        {short
          ? t(
              {
                command: "installShortCommand",
                manual: "installShortManual",
                docs: "installPendingShort",
                reference: "installShortReference",
              }[installation.mode],
            )
          : label}
      </Tag>
    </Tooltip>
  );
}

export function CopyInstallButton({
  item,
  t,
  iconOnly = false,
  primary = false,
}) {
  const installation = installationFor(item);
  const message = useFeedback();
  if (!installation.command) return null;
  return (
    <Tooltip title={t("copyInstall")}>
      <Button
        type={primary ? "primary" : iconOnly ? "text" : "default"}
        size="small"
        icon={<CopyOutlined aria-hidden="true" />}
        aria-label={t("copyInstall")}
        data-install={item.repo}
        onClick={async (event) => {
          event.stopPropagation();
          try {
            await copyText(installation.command);
            message.success(t("toastCopiedInstall"));
          } catch {
            message.error(t("copyFailed"));
          }
        }}
      >
        {!iconOnly && t("copyInstall")}
      </Button>
    </Tooltip>
  );
}

export function InstallationRequirements({ item, lang, t, detailsInfo = {} }) {
  const installation = installationFor(item);
  return (
    <div className="installation-evidence">
      {installation[`context_${lang}`] && (
        <p className="installation-context">
          {installation[`context_${lang}`]}
        </p>
      )}
      {installation.mode === "docs" && <p>{t("installUnreviewedHint")}</p>}
      {(detailsInfo[`environment_${lang}`] ||
        detailsInfo[`dependencies_${lang}`]) && (
        <dl className="install-requirements">
          <div>
            <dt>{t("installEnvironment")}</dt>
            <dd data-testid="install-environment">
              {detailsInfo[`environment_${lang}`] || "—"}
            </dd>
          </div>
          <div>
            <dt>{t("installDependencies")}</dt>
            <dd data-testid="install-dependencies">
              {detailsInfo[`dependencies_${lang}`] || "—"}
            </dd>
          </div>
        </dl>
      )}
      <EditorialReviewNotice repo={item.repo} t={t} lang={lang} details />
      {installation.reviewed_at && (
        <div className="installation-review">
          <small>
            {t("docsChecked")} {installation.reviewed_at}
          </small>
          {/^[a-f0-9]{40}$/.test(detailsInfo.source_commit || "") && (
            <a
              href={installation.source_url.replace(
                /\/blob\/[^/]+\//,
                `/blob/${detailsInfo.source_commit}/`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              {t("installSnapshot")}
            </a>
          )}
          {(detailsInfo.additional_sources || [])
            .map(safeExternalUrl)
            .filter(Boolean)
            .map((url, index) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                {t("installMoreDocs")} {index + 1}
              </a>
            ))}
        </div>
      )}
    </div>
  );
}

export function InstallationActions({
  item,
  lang,
  t,
  details = false,
  detailsInfo = {},
  compact = false,
  hideExtras = false,
}) {
  const installation = installationFor(item);
  return (
    <div
      className={`installation-actions${details ? " installation-details" : " installation-compact"}${compact ? " installation-inline" : ""}`}
      onClick={(event) => {
        if (event.target.closest("button,a")) event.stopPropagation();
      }}
    >
      <div className="installation-status">
        <InstallationMode item={item} t={t} short={compact} />
      </div>
      {!compact && !details && installation[`context_${lang}`] && (
        <div className="installation-context">
          {installation[`context_${lang}`]}
        </div>
      )}
      {details && installation.command && (
        <div className="install-command-block">
          <div className="install-command-heading">
            <span>{t("installCommandHeading")}</span>
            <CopyInstallButton item={item} t={t} primary />
          </div>
          <pre className="install-command" tabIndex={0}>
            {installation.command}
          </pre>
        </div>
      )}
      <Space size={[4, 6]} wrap>
        {!details && <CopyInstallButton item={item} t={t} iconOnly={compact} />}
        <Button
          size="small"
          type={compact ? "text" : "link"}
          icon={<ExportOutlined aria-hidden="true" />}
          aria-label={t(
            ["docs", "reference"].includes(installation.mode)
              ? "projectDocs"
              : "installDocs",
          )}
          href={installation.source_url}
          target="_blank"
          rel="noreferrer"
        >
          {!compact &&
            t(
              ["docs", "reference"].includes(installation.mode)
                ? "projectDocs"
                : "installDocs",
            )}
        </Button>
      </Space>
      {details && !hideExtras && (
        <InstallationRequirements {...{ item, lang, t, detailsInfo }} />
      )}
    </div>
  );
}
