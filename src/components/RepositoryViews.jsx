import { SearchHighlight } from "./SearchHighlight";
import { Panel } from "./Panel";
import React, { lazy, useEffect, useState } from "react";
import { Button, Empty, Space, Tag, Tooltip } from "antd";
import { StarFilled, StarOutlined, SwapOutlined } from "@ant-design/icons";
import { PlatformTags } from "./PracticalInfo";
import { useFeedback } from "./FeedbackProvider";
import { DeferredFeature } from "./DeferredFeature";
const RepositoryTable = lazy(() => import("./RepositoryTable"));
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
function Actions({ item, state, update, toggleCompare, t, labels = false }) {
  const message = useFeedback();
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
          aria-label={`${t("favoriteAction")} ${item.repo}`}
          aria-pressed={favorite}
          data-testid={`favorite-${item.repo}`}
          style={{ color: favorite ? "var(--prs-primary)" : undefined }}
          onClick={(e) => {
            e.stopPropagation();
            message.success(t(favorite ? "favoriteRemoved" : "favoriteSaved"));
            update((s) => ({
              ...s,
              favorites: favorite
                ? s.favorites.filter((r) => r !== item.repo)
                : [...s.favorites, item.repo],
            }));
          }}
        >
          {labels && t("favoriteAction")}
        </Button>
      </Tooltip>
      <Tooltip title={t("compareTray")}>
        <Button
          type="text"
          size="small"
          icon={<SwapOutlined aria-hidden="true" />}
          aria-label={`${t("compareTray")} ${item.repo}`}
          aria-pressed={compared}
          data-compare={item.repo}
          onClick={(e) => {
            e.stopPropagation();
            toggleCompare(item.repo);
          }}
        >
          {labels && t("compareTray")}
        </Button>
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
  const resultKey = JSON.stringify([
    state.query,
    state.task,
    state.category,
    state.agent,
    state.sort,
    state.favOnly,
    state.newOnly,
    items.map((item) => item.repo),
  ]);
  const [batch, setBatch] = useState({ key: resultKey, limit: 30 });
  const limit = batch.key === resultKey ? batch.limit : 30;
  const selectedIndex = items.findIndex((item) => item.repo === state.repo);
  const shown = Math.max(limit, Math.ceil((selectedIndex + 1) / 30) * 30);
  useEffect(() => {
    setBatch((previous) => {
      const nextLimit = Math.max(
        previous.key === resultKey ? previous.limit : 30,
        Math.ceil((selectedIndex + 1) / 30) * 30,
      );
      return previous.key === resultKey && previous.limit === nextLimit
        ? previous
        : { key: resultKey, limit: nextLimit };
    });
  }, [resultKey, selectedIndex]);
  const entries = items.slice(0, shown);
  const more = shown < items.length && (
    <div className="ranking-load-more">
      <span role="status">
        {t("showingResults")} {entries.length} / {items.length}
      </span>
      <Button
        data-testid="load-more"
        onClick={() => setBatch({ key: resultKey, limit: shown + 30 })}
      >
        {t("loadMore")}
      </Button>
    </div>
  );
  const cat = (item) => item.category?.[state.lang] || item.category?.en || "";
  const actions = (item) => (
    <Actions
      {...{ item, state, update, toggleCompare, t }}
      labels={state.view === "card"}
    />
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
  if (!items.length)
    return (
      <div data-testid="ranking-empty" className="ranking-empty">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("empty")} />
      </div>
    );
  if (state.view === "card")
    return (
      <>
        <div className="repository-grid">
          {entries.map((item) => (
            <Panel
              key={item.repo}
              data-testid="repo-card"
              className="repository-card"
              tabIndex={0}
              onClick={() => open(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target === e.currentTarget)
                  open(item);
              }}
            >
              <div className="card-top">
                <Tag>#{item.rank}</Tag>
                {actions(item)}
              </div>
              <div className="card-title-row">
                <button
                  type="button"
                  className="repo-name repo-title"
                  onClick={(event) => {
                    event.stopPropagation();
                    open(item);
                  }}
                >
                  <SearchHighlight text={item.repo} query={state.query} />
                </button>
                <a
                  className="repository-external"
                  href={safeExternalUrl(item.url) || undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${t("drOpenRepo")} ${item.repo}`}
                  title="GitHub"
                  onClick={(event) => event.stopPropagation()}
                >
                  ↗
                </a>
              </div>
              <div className="card-key-metrics">
                <div>
                  <strong>{fmt(item.stars)}</strong>
                  <span>Stars</span>
                </div>
                <div className="card-growth">
                  <strong>
                    {item.star_delta_7d > 0 ? "+" : ""}
                    {fmt(item.star_delta_7d || 0)}
                  </strong>
                  <span>{t("statNet7d")}</span>
                </div>
              </div>
              <div className="card-tags">
                <Tag className="warm-tag">{cat(item)}</Tag>
              </div>
              <PlatformTags item={item} t={t} />
              <QualityBadges item={item} t={t} />
            </Panel>
          ))}
        </div>
        {more}
      </>
    );
  return (
    <>
      <DeferredFeature t={t}>
        <RepositoryTable
          onReady={onReady}
          className="ranking-table"
          rowKey="repo"
          {...{ state, t, fmt, history, link, actions }}
          badges={(item) => <QualityBadges item={item} t={t} />}
          dataSource={entries}
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
      {more}
    </>
  );
}
