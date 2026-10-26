import { Zhi1keAd } from "./Zhi1keAd";
import { SearchHighlight } from "./SearchHighlight";
import { Panel } from "./Panel";
import React, { lazy, useEffect, useState } from "react";
import { Button, Empty, Space, Tag, Tooltip } from "antd";
import { StarFilled, StarOutlined, SwapOutlined } from "@ant-design/icons";
import { PlatformTags, SummaryText } from "./PracticalInfo";
import { useFeedback } from "./FeedbackProvider";
import { DeferredFeature } from "./DeferredFeature";
const RepositoryTable = lazy(() => import("./RepositoryTable"));
import { safeExternalUrl } from "../domain";
export function QualityBadges({
  item,
  t,
  compact = false,
  statusOnly = false,
}) {
  const typeLabel =
    item.skills_count > 0
      ? `${item.skills_count}${item.skills_count_complete === false ? "+" : ""} skills`
      : t(
          item.repository_kind === "related"
            ? "projectRelated"
            : "projectUnknown",
        );
  if (compact)
    return (
      <Tooltip title={t("projectTypeHelp")}>
        <span className="card-project-type">{typeLabel}</span>
      </Tooltip>
    );
  return (
    <Space size={[4, 4]} wrap>
      {!statusOnly && (
        <Tooltip title={t("projectTypeHelp")}>
          <Tag>{typeLabel}</Tag>
        </Tooltip>
      )}
      {item.refresh_status === "pending" && (
        <Tooltip title={t("metadataPendingHelp")}>
          <Tag color="warning">{t("metadataPending")}</Tag>
        </Tooltip>
      )}
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
export function RepositoryActions({
  item,
  state,
  update,
  toggleCompare,
  t,
  labels = false,
  context = "ranking",
}) {
  const message = useFeedback();
  const favorite = state.favorites.includes(item.repo),
    compared = state.compare.includes(item.repo);
  return (
    <Space size={0} className="repository-actions">
      <Tooltip title={t("favoriteAction")}>
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
          data-testid={`${context === "detail" ? "detail-" : ""}favorite-${item.repo}`}
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
  const rowSize = () =>
    matchMedia("(min-width: 1100px)").matches
      ? 4
      : matchMedia("(min-width: 600px)").matches
        ? 2
        : 1;
  const [adAfter, setAdAfter] = useState(rowSize);
  useEffect(() => {
    const wide = matchMedia("(min-width: 1100px)"),
      medium = matchMedia("(min-width: 600px)");
    const sync = () => setAdAfter(rowSize());
    wide.addEventListener("change", sync);
    medium.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      medium.removeEventListener("change", sync);
    };
  }, []);
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
  const actions = (item) => (
    <RepositoryActions
      {...{ item, state, update, toggleCompare, t }}
      labels={false}
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
      <>
        <Zhi1keAd t={t} />
        <div data-testid="ranking-empty" className="ranking-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("empty")}
          />
        </div>
      </>
    );
  if (state.view === "card")
    return (
      <>
        <div className="repository-grid">
          {entries.map((item, index) => (
            <React.Fragment key={item.repo}>
              <Panel
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
                  <span
                    className={`card-rank${item.rank <= 3 ? " leading-rank" : ""}`}
                  >
                    {String(item.rank).padStart(2, "0")}
                  </span>
                  <div
                    className={`card-actions${state.favorites.includes(item.repo) || state.compare.includes(item.repo) ? " has-selection" : ""}`}
                  >
                    {actions(item)}
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
                </div>
                <div className="card-title-row">
                  <span className="repository-owner">
                    {item.repo.split("/")[0]}
                  </span>
                  <button
                    type="button"
                    className="repo-name repo-title"
                    aria-label={item.repo}
                    onClick={(event) => {
                      event.stopPropagation();
                      open(item);
                    }}
                  >
                    <SearchHighlight
                      text={item.repo.split("/").slice(1).join("/")}
                      query={state.query}
                    />
                  </button>
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
                    <span aria-label={t("statNet7d")}>
                      {state.lang === "zh" ? "7 日" : "7d"}
                    </span>
                  </div>
                </div>
                <SummaryText item={item} t={t} query={state.query} />
                <div className="card-status">
                  <QualityBadges item={item} t={t} statusOnly />
                </div>
                <div className="card-info-footer">
                  <PlatformTags item={item} t={t} compact />
                  <QualityBadges item={item} t={t} compact />
                </div>
              </Panel>
              {index === Math.min(adAfter, entries.length) - 1 && (
                <Zhi1keAd t={t} />
              )}
            </React.Fragment>
          ))}
        </div>
        {more}
      </>
    );
  return (
    <>
      <Zhi1keAd t={t} />
      <DeferredFeature t={t}>
        <RepositoryTable
          onReady={onReady}
          className="ranking-table"
          rowKey="repo"
          {...{ state, t, fmt, history, link, actions }}
          badges={(item) => <QualityBadges item={item} t={t} />}
          dataSource={entries}
          pagination={false}
          scroll={{ x: 1180 }}
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
