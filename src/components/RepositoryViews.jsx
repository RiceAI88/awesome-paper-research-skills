import { SearchHighlight } from "./SearchHighlight";
import { Panel } from "./Panel";
import React, { lazy, useEffect } from "react";
import { Button, Empty, Space, Tag, Tooltip } from "antd";
import { StarFilled, StarOutlined, SwapOutlined } from "@ant-design/icons";
import {
  SummaryText,
  PlatformTags,
  InstallationActions,
} from "./PracticalInfo";
import { DeferredFeature } from "./DeferredFeature";
const RepositoryTable = lazy(() => import("./RepositoryTable"));
import { Sparkline } from "./TrendCharts";
import { safeExternalUrl } from "../domain";
export function QualityBadges({ item, t }) {
  return (
    <Space size={[4, 4]} wrap>
      {item.skills_count != null && <Tag>{item.skills_count} skills</Tag>}
      {item.verifies_citations && (
        <Tag className="warm-tag">{t("citeCheck")} ✓</Tag>
      )}
      {item.stale && (
        <Tooltip title={t("staleReason")} trigger={["hover", "focus", "click"]}>
          <Tag
            color="red"
            className="stale-tag"
            data-testid="stale-tag"
            tabIndex={0}
            onClick={(event) => event.stopPropagation()}
          >
            {t("staleTag")}
          </Tag>
        </Tooltip>
      )}
    </Space>
  );
}
function Actions({ item, state, update, toggleCompare, t }) {
  const favorite = state.favorites.includes(item.repo),
    compared = state.compare.includes(item.repo);
  return (
    <Space size={0}>
      <Tooltip title={t("favoritesOnly")}>
        <Button
          type="text"
          size="small"
          icon={
            favorite ? (
              <StarFilled aria-hidden="true" />
            ) : (
              <StarOutlined aria-hidden="true" />
            )
          }
          aria-label={`favorite ${item.repo}`}
          aria-pressed={favorite}
          data-testid={`favorite-${item.repo}`}
          style={{ color: favorite ? "var(--prs-primary)" : undefined }}
          onClick={(e) => {
            e.stopPropagation();
            update((s) => ({
              ...s,
              favorites: favorite
                ? s.favorites.filter((r) => r !== item.repo)
                : [...s.favorites, item.repo],
            }));
          }}
        />
      </Tooltip>
      <Tooltip title={t("compareTray")}>
        <Button
          type={compared ? "primary" : "text"}
          size="small"
          icon={<SwapOutlined aria-hidden="true" />}
          aria-label={`compare ${item.repo}`}
          aria-pressed={compared}
          data-compare={item.repo}
          onClick={(e) => {
            e.stopPropagation();
            toggleCompare(item.repo);
          }}
        />
      </Tooltip>
    </Space>
  );
}
export function RepositoryViews({
  items,
  filterHeight,
  onReady,
  state,
  update,
  toggleCompare,
  t,
  fmt,
  history,
}) {
  useEffect(() => {
    if (state.view === "card" || !items.length) onReady?.(state.view);
  }, [state.view, items.length, onReady]);
  const cat = (item) => item.category?.[state.lang] || item.category?.en || "";
  const actions = (item) => (
    <Actions {...{ item, state, update, toggleCompare, t }} />
  );
  const open = (item) => update((s) => ({ ...s, repo: item.repo }));
  const link = (item) => (
    <a
      href={safeExternalUrl(item.url) || undefined}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="repo-name"
    >
      <SearchHighlight text={item.repo} query={state.query} />
    </a>
  );
  const columns = [
    { title: "#", dataIndex: "rank", width: 50 },
    {
      title: t("repo"),
      key: "repo",
      width: 350,
      render: (_, item) => (
        <div>
          {link(item)}
          <SummaryText
            item={item}
            lang={state.lang}
            t={t}
            query={state.query}
          />
          <QualityBadges item={item} t={t} />
        </div>
      ),
    },
    {
      title: t("drAgent"),
      key: "platforms",
      width: 190,
      render: (_, item) => <PlatformTags item={item} t={t} />,
    },
    {
      title: t("installation"),
      key: "installation",
      width: 250,
      render: (_, item) => (
        <InstallationActions item={item} lang={state.lang} t={t} />
      ),
    },
    {
      title: t("category"),
      key: "category",
      width: 120,
      render: (_, item) => <Tag className="warm-tag">{cat(item)}</Tag>,
    },
    {
      title: t("referenceMetrics"),
      key: "metrics",
      width: 180,
      render: (_, item) => (
        <div className="reference-metrics">
          <span>
            {fmt(item.stars)} Stars · +{fmt(item.star_delta_7d || 0)} / 7d
          </span>
          <span>{item.trend?.[state.lang] || "—"}</span>
          <Sparkline
            repo={item.repo}
            history={history}
            label={t("noHistory")}
          />
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 85,
      render: (_, item) => actions(item),
    },
  ];
  if (!items.length)
    return (
      <div data-testid="ranking-empty" className="ranking-empty">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("empty")} />
      </div>
    );
  if (state.view === "card")
    return (
      <div className="repository-grid">
        {items.map((item) => (
          <Panel
            key={item.repo}
            data-testid="repo-card"
            className="repository-card"
            tabIndex={0}
            onClick={() => open(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target === e.currentTarget) open(item);
            }}
          >
            <div className="card-top">
              <Tag>#{item.rank}</Tag>
              {actions(item)}
            </div>
            {link(item)}
            <div className="card-tags">
              <Tag className="warm-tag">{cat(item)}</Tag>
              <span className="trend-value">{item.trend?.[state.lang]}</span>
            </div>
            <SummaryText
              item={item}
              lang={state.lang}
              t={t}
              query={state.query}
            />
            <PlatformTags item={item} t={t} />
            <InstallationActions item={item} lang={state.lang} t={t} />
            <div className="reference-metrics card-metrics">
              <span>
                {fmt(item.stars)} Stars · +{fmt(item.star_delta_7d || 0)} / 7d
              </span>
              <Sparkline
                repo={item.repo}
                history={history}
                label={t("noHistory")}
              />
            </div>
            <div className="card-meta">
              <span>{item.language || "GitHub"}</span>
              <span>{item.last_push_date}</span>
            </div>
            <QualityBadges item={item} t={t} />
          </Panel>
        ))}
      </div>
    );
  return (
    <DeferredFeature t={t}>
      <RepositoryTable
        onReady={onReady}
        className="ranking-table"
        rowKey="repo"
        columns={columns}
        dataSource={items}
        pagination={false}
        scroll={{ x: 1305 }}
        sticky={{ offsetHeader: filterHeight }}
        size="middle"
        onRow={(item) => ({
          "data-repo": item.repo,
          tabIndex: 0,
          onClick: (e) => {
            if (!e.target.closest("button,a")) open(item);
          },
          onKeyDown: (e) => {
            if (e.key === "Enter" && e.target === e.currentTarget) open(item);
          },
        })}
      />
    </DeferredFeature>
  );
}
