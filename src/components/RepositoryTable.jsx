import React, { useEffect } from "react";
import { Table, Tag } from "antd";
import {
  PlatformTags,
  SummaryText,
  InstallationActions,
} from "./PracticalInfo";
import { sceneLabelsFor } from "../domain";
import { Sparkline } from "./TrendCharts";
export default function RepositoryTable({
  onReady,
  state,
  t,
  fmt,
  history,
  link,
  actions,
  badges,
  ...props
}) {
  useEffect(() => {
    onReady?.("table");
  }, [onReady]);
  const cat = (item) => sceneLabelsFor(item, t).join(" · ") || "—";
  const columns = [
    {
      title: "#",
      dataIndex: "rank",
      width: 65,
      render: (rank, item) => (
        <span className="card-rank-group">
          <span
            className={`card-rank${rank <= 3 ? ` medal-rank medal-${rank}` : ""}`}
          >
            {String(rank).padStart(2, "0")}
          </span>
        </span>
      ),
    },
    {
      title: t("repo"),
      key: "repo",
      width: 330,
      render: (_, item) => (
        <div>
          {link(item)}
          <SummaryText
            item={item}
            lang={state.lang}
            t={t}
            query={state.query}
          />
          {badges(item)}
        </div>
      ),
    },
    {
      title: t("drAgent"),
      key: "platforms",
      width: 180,
      render: (_, item) => <PlatformTags item={item} t={t} />,
    },
    {
      title: t("installation"),
      key: "installation",
      width: 220,
      render: (_, item) => (
        <InstallationActions item={item} lang={state.lang} t={t} />
      ),
    },
    {
      title: t("taskHeading"),
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
          <span>{fmt(item.stars)} Stars</span>
          <span className="table-growth">
            {state.lang === "zh" ? "近 7 日" : "7 days"}{" "}
            {item.star_delta_7d
              ? `${item.star_delta_7d > 0 ? "+" : ""}${fmt(item.star_delta_7d)}`
              : "—"}
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
      title: t("actions"),
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, item) => actions(item),
    },
  ];
  return <Table {...props} columns={columns} />;
}
