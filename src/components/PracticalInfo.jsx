import React from "react";
import { Button, Space, Tag, Tooltip } from "antd";
import { CopyOutlined, ExportOutlined } from "@ant-design/icons";
import { AGENT_PLATFORMS, detectAgents, safeExternalUrl } from "../domain";
import { EDITORIAL_CONTENT, installationFor } from "../practical";
import { useFeedback } from "./FeedbackProvider";
import { copyText } from "../clipboard";
export function SummaryText({ item, t }) {
  return (
    <div className="practical-description">
      <p className="description-clamp" title={item.description}>
        {item.description || t("noDescription")}
      </p>
    </div>
  );
}
export function PlatformTags({ item, t }) {
  const agents = detectAgents(item);
  const verified = Boolean(EDITORIAL_CONTENT.platforms[item.repo]);
  return (
    <Tooltip title={t(verified ? "platformDocumented" : "platformInferred")}>
      <Space size={[4, 4]} wrap className="platform-tags">
        {agents.length ? (
          agents.map((id) => (
            <Tag key={id}>
              {AGENT_PLATFORMS.find((agent) => agent.id === id)?.label || id}
            </Tag>
          ))
        ) : (
          <Tag>{t("platformUnspecified")}</Tag>
        )}
      </Space>
    </Tooltip>
  );
}
export function InstallationActions({
  item,
  lang,
  t,
  details = false,
  detailsInfo = {},
}) {
  const installation = installationFor(item);
  const message = useFeedback();
  async function copy(event) {
    event.stopPropagation();
    try {
      await copyText(installation.command);
      message.success(t("toastCopiedInstall"));
    } catch {
      message.error(t("copyFailed"));
    }
  }
  return (
    <div
      className="installation-actions"
      onClick={(event) => {
        if (event.target.closest("button,a")) event.stopPropagation();
      }}
    >
      <div className="installation-status">
        <Tag className="warm-tag" data-testid="installation-mode">
          {t(
            {
              command: "installCommandMode",
              manual: "installManualMode",
              docs: "installUnknownMode",
              reference: "installReferenceMode",
            }[installation.mode],
          )}
        </Tag>
      </div>
      {installation[`context_${lang}`] && (
        <div className="installation-context">
          {installation[`context_${lang}`]}
        </div>
      )}
      <Space size={[4, 6]} wrap>
        {installation.command && (
          <Tooltip title={installation.command}>
            <Button
              type="primary"
              size="small"
              icon={<CopyOutlined aria-hidden="true" />}
              data-install={item.repo}
              onClick={copy}
            >
              {t("copyInstall")}
            </Button>
          </Tooltip>
        )}
        <Button
          size="small"
          type={installation.command ? "link" : "default"}
          icon={<ExportOutlined aria-hidden="true" />}
          href={installation.source_url}
          target="_blank"
          rel="noreferrer"
        >
          {t(
            ["docs", "reference"].includes(installation.mode)
              ? "projectDocs"
              : "installDocs",
          )}
        </Button>
      </Space>
      {details && installation.mode === "docs" && (
        <p className="muted">{t("installUnreviewedHint")}</p>
      )}
      {details && detailsInfo[`environment_${lang}`] && (
        <dl className="install-requirements">
          <div>
            <dt>{t("installEnvironment")}</dt>
            <dd data-testid="install-environment">
              {detailsInfo[`environment_${lang}`]}
            </dd>
          </div>
          <div>
            <dt>{t("installDependencies")}</dt>
            <dd data-testid="install-dependencies">
              {detailsInfo[`dependencies_${lang}`]}
            </dd>
          </div>
        </dl>
      )}
      {details && installation.command && (
        <pre className="install-command">{installation.command}</pre>
      )}
      {details && installation.reviewed_at && (
        <div className="installation-review">
          <small className="muted">
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
