import React, { useEffect } from "react";
import { Table, Tag } from "antd";
import {
  PlatformTags,
  SummaryText,
  InstallationActions,
} from "./PracticalInfo";
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
  const cat = (item) => item.category?.[state.lang] || item.category?.en || "";
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
          {badges(item)}
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
  return <Table {...props} columns={columns} />;
}
