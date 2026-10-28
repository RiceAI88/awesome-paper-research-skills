import React, { createContext, useContext, useEffect } from "react";
import { Button, Table, Tag, Tooltip } from "antd";
import {
  PlatformTags,
  SummaryText,
  InstallationActions,
} from "./PracticalInfo";
import { sceneLabelsFor } from "../domain";
import { Sparkline } from "./TrendCharts";
import { Zhi1keAd } from "./Zhi1keAd";
const AdContext = createContext(null);
function SponsoredRow(props) {
  const t = useContext(AdContext);
  const { "data-sponsor-after": after, ...rowProps } = props;
  return (
    <>
      <tr {...rowProps} />
      {after && (
        <tr className="table-sponsor-row">
          <td colSpan={8}>
            <Zhi1keAd t={t} />
          </td>
        </tr>
      )}
    </>
  );
}
function SceneTags({ item, t }) {
  const labels = sceneLabelsFor(item, t);
  if (!labels.length) return null;
  return (
    <div className="scene-tags">
      <Tag>{labels[0]}</Tag>
      {labels.length > 1 && (
        <Tooltip
          title={labels.slice(1).join(" · ")}
          trigger={["hover", "focus"]}
        >
          <span
            className="scene-overflow"
            tabIndex={0}
            aria-label={labels.slice(1).join(" · ")}
          >
            +{labels.length - 1}
          </span>
        </Tooltip>
      )}
    </div>
  );
}
export default function RepositoryTable({
  onReady,
  state,
  update,
  t,
  fmt,
  link,
  actions,
  badges,
  history,
  ...props
}) {
  useEffect(() => {
    onReady?.("table");
  }, [onReady]);
  const sortHeading = (label, sort, accessible) => (
    <button
      type="button"
      className="table-sort"
      aria-label={accessible}
      aria-pressed={
        state.sort === sort || (sort === "stars" && state.sort === "rank")
      }
      onClick={() => update((s) => ({ ...s, sort }))}
    >
      {label}
      <span aria-hidden="true">
        {state.sort === sort || (sort === "stars" && state.sort === "rank")
          ? " ↓"
          : " ↕"}
      </span>
    </button>
  );
  const columns = [
    {
      title: "#",
      dataIndex: "rank",
      width: 70,
      render: (rank, item) => (
        <span className="card-rank-group">
          <span
            className={`card-rank${rank <= 3 ? ` medal-rank medal-${rank}` : ""}`}
          >
            {String(rank).padStart(2, "0")}
          </span>
          {item.new_today && (
            <Tooltip title={t("dailyBadge")} trigger={["hover", "focus"]}>
              <span className="daily-new-badge" tabIndex={0}>
                {t("newShort")}
              </span>
            </Tooltip>
          )}
        </span>
      ),
    },
    {
      title: t("repo"),
      key: "repo",
      width: 320,
      render: (_, item) => (
        <div className="table-repository">
          {link(item)}
          <div className="table-description-line">
            <SummaryText item={item} t={t} query={state.query} />
            {item.stale && (
              <Tooltip
                title={t("staleReason")}
                trigger={["hover", "focus", "click"]}
              >
                <span
                  data-testid="stale-tag"
                  className="table-maintenance"
                  tabIndex={0}
                  onClick={(event) => event.stopPropagation()}
                >
                  {t("staleTag")}
                </span>
              </Tooltip>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t("drAgent"),
      key: "platforms",
      width: 150,
      render: (_, item) => <PlatformTags item={item} t={t} compact />,
    },
    {
      title: t("installation"),
      key: "installation",
      width: 160,
      render: (_, item) => (
        <InstallationActions item={item} lang={state.lang} t={t} compact />
      ),
    },
    {
      title: t("sceneHeading"),
      key: "scene",
      width: 130,
      render: (_, item) => <SceneTags item={item} t={t} />,
    },
    {
      title: sortHeading("Stars", "stars", t("rankByStars")),
      key: "stars",
      width: 100,
      render: (_, item) => (
        <div className="reference-metrics table-metrics">
          <span className="table-stars">{fmt(item.stars)}</span>
          <Sparkline
            repo={item.repo}
            history={history}
            label={t("noHistory")}
          />
        </div>
      ),
    },
    {
      title: sortHeading(t("shortDelta7"), "delta7", t("sortDelta7Action")),
      key: "delta7",
      width: 110,
      render: (_, item) => (
        <span
          className={`table-growth${item.star_delta_7d ? "" : " no-growth"}`}
        >
          {item.star_delta_7d
            ? `${item.star_delta_7d > 0 ? "+" : ""}${fmt(item.star_delta_7d)}`
            : "—"}
        </span>
      ),
    },
    {
      title: t("actions"),
      key: "actions",
      width: 90,
      fixed: "right",
      render: (_, item) => actions(item),
    },
  ];
  const originalRow = props.onRow;
  return (
    <AdContext.Provider value={t}>
      <Table
        {...props}
        components={{ body: { row: SponsoredRow } }}
        columns={columns}
        onRow={(item, index) => ({
          ...originalRow?.(item, index),
          "data-sponsor-after":
            index === Math.min(8, props.dataSource.length) - 1,
        })}
      />
    </AdContext.Provider>
  );
}
