import React from "react";
import { App, Button, Space, Tag, Tooltip } from "antd";
import { CopyOutlined, ExportOutlined } from "@ant-design/icons";
import { AGENT_PLATFORMS, detectAgents } from "../domain";
import { EDITORIAL_CONTENT, summaryFor, installationFor } from "../practical";
import { copyText } from "../clipboard";
export function SummaryText({ item, lang, t }) {
  const summary = summaryFor(item, lang);
  return (
    <div className="practical-description">
      <p className="description-clamp" title={summary.text}>
        {summary.text || t("noDescription")}
      </p>
      {summary.pending && (
        <Tag className="summary-pending">
          {t(
            summary.reason === "changed" ? "summaryChanged" : "summaryPending",
          )}
        </Tag>
      )}
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
export function InstallationActions({ item, lang, t, details = false }) {
  const installation = installationFor(item);
  const { message } = App.useApp();
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
          {t("installDocs")}
        </Button>
      </Space>
      {details && installation.command && (
        <pre className="install-command">{installation.command}</pre>
      )}
      {details && installation.reviewed_at && (
        <small className="muted">
          {t("docsChecked")} {installation.reviewed_at}
        </small>
      )}
    </div>
  );
}
