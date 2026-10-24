import React from "react";
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { ExportOutlined } from "@ant-design/icons";
import {
  AGENT_PLATFORMS,
  detectAgents,
  REPOSITORY_URL,
  safeExternalUrl,
} from "../domain";
import { QualityBadges } from "./RepositoryViews";
import { copyText } from "../clipboard";
import { SummaryText, InstallationActions } from "./PracticalInfo";
export function RepositoryDrawer({ item, state, update, t, fmt }) {
  const { message } = App.useApp();
  const copy = async (text, label) => {
    try {
      await copyText(text);
      message.success(label);
    } catch {
      message.error(
        state.lang === "zh"
          ? "复制失败，请稍后重试"
          : "Unable to copy. Please try again.",
      );
    }
  };
  const category = item?.category?.[state.lang] || item?.category?.en || "";
  const agentNames = item
    ? detectAgents(item).map(
        (id) => AGENT_PLATFORMS.find((a) => a.id === id)?.label || id,
      )
    : [];
  const markdown = item
    ? `| ${item.rank} | [${item.repo}](${item.url}) | ${item.stars.toLocaleString()}${item.star_delta_7d ? ` (+${item.star_delta_7d})` : ""} | ${category} | ${agentNames.join(" · ") || t("agentGeneral")} | ${item.last_push_date || ""} |`
    : "";
  const suggest = item
    ? `${REPOSITORY_URL}/issues/new?title=${encodeURIComponent("Recommend: " + item.repo)}&body=${encodeURIComponent(`I'd like to recommend **${item.repo}** (${item.url}) for inclusion.\n\nReason: \n`)}`
    : "";
  const details = item
    ? [
        {
          key: "agents",
          label: t("drAgent"),
          children: (
            <Space wrap>
              {(agentNames.length ? agentNames : [t("agentGeneral")]).map(
                (a) => (
                  <Tag key={a}>{a}</Tag>
                ),
              )}
            </Space>
          ),
        },
        {
          key: "topics",
          label: t("drTopics"),
          children: (
            <Space size={[4, 4]} wrap>
              {item.topics?.length
                ? item.topics.map((topic) => <Tag key={topic}>{topic}</Tag>)
                : "—"}
            </Space>
          ),
        },
        {
          key: "signals",
          label: t("drSignals"),
          children: (
            <Space size={[4, 4]} wrap>
              {item.precision_signals?.length
                ? item.precision_signals.map((signal) => (
                    <Tag key={signal}>{signal}</Tag>
                  ))
                : "—"}
            </Space>
          ),
        },
        { key: "forks", label: t("drForks"), children: fmt(item.forks) },
        {
          key: "issues",
          label: t("drIssues"),
          children: fmt(item.open_issues),
        },
        {
          key: "license",
          label: t("drLicense"),
          children: item.license?.name || item.license?.spdx_id || "—",
        },
        {
          key: "language",
          label: t("drLanguage"),
          children: item.language || "—",
        },
        {
          key: "created",
          label: t("drCreated"),
          children: item.created_date || "—",
        },
        {
          key: "updated",
          label: t("drPushed"),
          children: item.last_push_date || "—",
        },
        {
          key: "trend",
          label: t("drTrend"),
          children: `${fmt(item.trend_score)} · +${fmt(item.star_delta_1d)}/day`,
        },
      ]
    : [];
  return (
    <Drawer
      title={
        item ? (
          <div>
            <div className="drawer-eyebrow">
              {t("drEyebrow")} #{item.rank} · {category}
            </div>
            <span className="drawer-repo">{item.repo}</span>
          </div>
        ) : (
          ""
        )
      }
      open={Boolean(item)}
      onClose={() => update((s) => ({ ...s, repo: null }))}
      size={640}
      className="repository-drawer"
      footer={
        item ? (
          <Space wrap>
            <Button
              type="primary"
              icon={<ExportOutlined aria-hidden="true" />}
              href={safeExternalUrl(item.url) || undefined}
              target="_blank"
              rel="noreferrer"
            >
              {t("drOpenRepo")}
            </Button>
            {safeExternalUrl(item.homepage) && (
              <Button
                href={safeExternalUrl(item.homepage)}
                target="_blank"
                rel="noreferrer"
              >
                {t("drHomepage")}
              </Button>
            )}
            <Button onClick={() => copy(markdown, t("toastCopied"))}>
              {t("drCopyMd")}
            </Button>
            <Button href={suggest} target="_blank" rel="noreferrer">
              {t("drSuggest")}
            </Button>
          </Space>
        ) : null
      }
    >
      {item && (
        <>
          <SummaryText item={item} lang={state.lang} t={t} />
          {state.lang === "zh" && (
            <details className="original-description">
              <summary>{t("originalDescription")}</summary>
              <p>{item.description}</p>
            </details>
          )}
          <InstallationActions item={item} lang={state.lang} t={t} details />
          <QualityBadges item={item} t={t} />
          <div className="drawer-statistics">
            {[
              [t("stars"), item.stars],
              [t("drDelta7d"), item.star_delta_7d || 0],
              [t("drDelta30d"), item.star_delta_30d ?? item.star_delta_7d ?? 0],
              [t("skillsCount"), item.skills_count ?? "—"],
            ].map(([title, value]) => (
              <Statistic key={title} title={title} value={value} />
            ))}
          </div>
          <Descriptions column={1} bordered size="small" items={details} />
        </>
      )}
    </Drawer>
  );
}
