import React, { useEffect, useRef } from "react";
import installationDetails from "../../config/installation-details.json";
import { Button, Descriptions, Drawer, Space, Tag } from "antd";
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
import {
  SummaryText,
  PlatformTags,
  InstallationActions,
  InstallationRequirements,
} from "./PracticalInfo";
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
    contentRef.current?.querySelectorAll("details[open]").forEach((details) => {
      details.open = false;
    });
  }, [item?.repo]);
  const navigate = (offset) => {
    const target = position >= 0 && items[position + offset];
    if (target) update((previous) => ({ ...previous, repo: target.repo }));
  };
  const message = useFeedback();
  const copy = async (text) => {
    try {
      await copyText(text);
      message.success(t("toastCopied"));
    } catch {
      message.error(t("copyFailed"));
    }
  };
  const category = item ? sceneLabelsFor(item, t).join(" · ") : "";
  const agentNames = item
    ? detectAgents(item).map(
        (id) => AGENT_PLATFORMS.find((a) => a.id === id)?.label || id,
      )
    : [];
  const delta = item?.star_delta_7d || 0;
  const markdown = item
    ? `| ${item.rank} | [${item.repo}](${item.url}) | ${item.stars.toLocaleString()}${delta ? ` (${delta > 0 ? "+" : ""}${delta})` : ""} | ${category} | ${agentNames.join(" · ") || t("agentGeneral")} | ${item.last_push_date || ""} |`
    : "";
  const feedback = item
    ? `${REPOSITORY_URL}/issues/new?title=${encodeURIComponent("Information issue: " + item.repo)}&body=${encodeURIComponent(`Repository: **${item.repo}** (${item.url})\n\nIncorrect or outdated information:\n\nSuggested correction and source:\n`)}`
    : "";
  const details = item
    ? [
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
          key: "delta30",
          label: t("drDelta30d"),
          children: fmt(item.star_delta_30d ?? item.star_delta_7d ?? 0),
        },
      ]
    : [];
  return (
    <Drawer
      title={
        item ? (
          <div>
            <div className="drawer-eyebrow">
              {t("drEyebrow")} #{item.rank}
              {category && ` · ${category}`}
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
                icon={<ExportOutlined aria-hidden="true" />}
                href={safeExternalUrl(item.url) || undefined}
                target="_blank"
                rel="noreferrer"
              >
                {t("drOpenRepo")}
              </Button>
              <details className="drawer-more-actions">
                <summary aria-label={t("moreActions")}>···</summary>
                <div className="drawer-action-menu">
                  {safeExternalUrl(item.homepage) && (
                    <a
                      href={safeExternalUrl(item.homepage)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("drHomepage")}
                    </a>
                  )}
                  <button type="button" onClick={() => copy(markdown)}>
                    {t("drCopyMd")}
                  </button>
                  <a href={feedback} target="_blank" rel="noreferrer">
                    {t("drFeedback")}
                  </a>
                </div>
              </details>
            </div>
          </div>
        ) : null
      }
    >
      {item && (
        <div ref={contentRef} className="drawer-content" key={item.repo}>
          <SummaryText item={item} t={t} />
          <div className="drawer-platforms">
            <span>{t("drAgent")}</span>
            <PlatformTags item={item} t={t} />
          </div>
          <InstallationActions
            item={item}
            lang={state.lang}
            t={t}
            details
            hideExtras
          />
          <dl className="drawer-health">
            <div>
              <dt>Stars</dt>
              <dd>{fmt(item.stars)}</dd>
            </div>
            <div>
              <dt>{t("shortDelta7")}</dt>
              <dd>{delta ? `${delta > 0 ? "+" : ""}${fmt(delta)}` : "—"}</dd>
            </div>
            <div>
              <dt>{t("drPushed")}</dt>
              <dd>
                <time dateTime={item.last_push_date}>
                  {item.last_push_date || "—"}
                </time>
              </dd>
            </div>
            <div>
              <dt>{t("drLicense")}</dt>
              <dd title={item.license?.name}>
                {item.license?.spdx_id && item.license.spdx_id !== "NOASSERTION"
                  ? item.license.spdx_id
                  : item.license?.name || "—"}
              </dd>
            </div>
          </dl>
          <details className="drawer-more">
            <summary>{t("moreRepositoryDetails")}</summary>
            {item.description && (
              <section className="drawer-full-description">
                <h3>{t("drDescription")}</h3>
                <p>{item.description}</p>
              </section>
            )}
            <InstallationRequirements
              item={item}
              lang={state.lang}
              t={t}
              detailsInfo={installationDetails[item.repo]}
            />
            <QualityBadges item={item} t={t} />
            <Descriptions column={1} bordered size="small" items={details} />
          </details>
        </div>
      )}
    </Drawer>
  );
}
