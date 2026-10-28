import React, { useEffect, useRef } from "react";
import installationDetails from "../../config/installation-details.json";
import {
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
  sceneLabelsFor,
  detectAgents,
  REPOSITORY_URL,
  safeExternalUrl,
} from "../domain";
import { QualityBadges, RepositoryActions } from "./RepositoryViews";
import { useFeedback } from "./FeedbackProvider";
import { copyText } from "../clipboard";
import { SummaryText, InstallationActions } from "./PracticalInfo";
export function RepositoryDrawer({
  item,
  items,
  state,
  update,
  toggleCompare,
  t,
  fmt,
}) {
  const contentRef = useRef(null);
  const position = items.findIndex((entry) => entry.repo === item?.repo);
  useEffect(() => {
    const body = contentRef.current?.closest(".ant-drawer-body");
    if (body) body.scrollTop = 0;
  }, [item?.repo]);
  const navigate = (offset) => {
    const target = position >= 0 && items[position + offset];
    if (target) update((previous) => ({ ...previous, repo: target.repo }));
  };
  const message = useFeedback();
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
  const category = item ? sceneLabelsFor(item, t).join(" · ") : "";
  const agentNames = item
    ? detectAgents(item).map(
        (id) => AGENT_PLATFORMS.find((a) => a.id === id)?.label || id,
      )
    : [];
  const markdown = item
    ? `| ${item.rank} | [${item.repo}](${item.url}) | ${item.stars.toLocaleString()}${item.star_delta_7d ? ` (+${item.star_delta_7d})` : ""} | ${category} | ${agentNames.join(" · ") || t("agentGeneral")} | ${item.last_push_date || ""} |`
    : "";
  const feedback = item
    ? `${REPOSITORY_URL}/issues/new?title=${encodeURIComponent("Information issue: " + item.repo)}&body=${encodeURIComponent(`Repository: **${item.repo}** (${item.url})\n\nIncorrect or outdated information:\n\nSuggested correction and source:\n`)}`
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
            <nav className="detail-navigation" aria-label={t("drBrowse")}>
              <Button
                size="small"
                data-testid="detail-previous"
                disabled={position <= 0}
                onClick={() => navigate(-1)}
              >
                {t("drPrevious")}
              </Button>
              <span
                className="detail-position"
                data-testid="detail-position"
                aria-live="polite"
              >
                {position >= 0
                  ? `${position + 1} / ${items.length}`
                  : t("drOutsideResults")}
              </span>
              <Button
                size="small"
                data-testid="detail-next"
                disabled={position < 0 || position >= items.length - 1}
                onClick={() => navigate(1)}
              >
                {t("drNext")}
              </Button>
            </nav>
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
          <div className="drawer-footer-actions">
            <div className="drawer-primary-actions">
              <RepositoryActions
                {...{ item, state, update, toggleCompare, t }}
                labels
                context="detail"
              />
              <Button
                type="primary"
                icon={<ExportOutlined aria-hidden="true" />}
                href={safeExternalUrl(item.url) || undefined}
                target="_blank"
                rel="noreferrer"
              >
                {t("drOpenRepo")}
              </Button>
            </div>
            <Space wrap className="drawer-secondary-actions">
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
              <Button href={feedback} target="_blank" rel="noreferrer">
                {t("drFeedback")}
              </Button>
            </Space>
          </div>
        ) : null
      }
    >
      {item && (
        <>
          <SummaryText item={item} lang={state.lang} t={t} />
          <InstallationActions
            item={item}
            lang={state.lang}
            t={t}
            details
            detailsInfo={installationDetails[item.repo]}
          />
          <QualityBadges item={item} t={t} />
          <div className="drawer-statistics" ref={contentRef}>
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
