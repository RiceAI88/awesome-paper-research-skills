import React from "react";
import {
  Button,
  Card,
  Empty,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { StarFilled, StarOutlined, SwapOutlined } from "@ant-design/icons";
import { Sparkline } from "./TrendCharts";
import { safeExternalUrl } from "../domain";
export function QualityBadges({ item, t }) {
  return (
    <Space size={[4, 4]} wrap>
      {item.skills_count != null && <Tag>{item.skills_count} skills</Tag>}
      {item.verifies_citations && <Tag color="purple">{t("citeCheck")} ✓</Tag>}
      {item.stale && <Tag>{t("staleTag")}</Tag>}
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
  state,
  update,
  toggleCompare,
  t,
  fmt,
  history,
}) {
  const cat = (item) => item.category?.[state.lang] || item.category?.en || "";
  const actions = (item) => (
    <Actions {...{ item, state, update, toggleCompare, t }} />
  );
  const open = (item) => update((s) => ({ ...s, repo: item.repo }));
  const link = (item) => (
    <Typography.Link
      href={safeExternalUrl(item.url) || undefined}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="repo-name"
    >
      {item.repo}
    </Typography.Link>
  );
  const columns = [
    { title: "#", dataIndex: "rank", width: 55 },
    {
      title: t("repo"),
      key: "repo",
      width: 300,
      render: (_, item) => (
        <div>
          {link(item)}
          <div className="repo-meta">
            {item.language || "GitHub"}
            {item.topics?.length
              ? ` · ${item.topics.slice(0, 3).join(", ")}`
              : ""}
          </div>
          <QualityBadges item={item} t={t} />
        </div>
      ),
    },
    {
      title: "Stars",
      dataIndex: "stars",
      width: 125,
      render: (stars, item) => (
        <div className="stars-value">
          {fmt(stars)}
          {item.star_delta_7d > 0 && <small>+{fmt(item.star_delta_7d)}</small>}
        </div>
      ),
    },
    {
      title: t("trend"),
      key: "trend",
      width: 130,
      render: (_, item) => (
        <span className="trend-value">
          {item.trend?.[state.lang] || item.trend?.en || "—"}
        </span>
      ),
    },
    {
      title: t("spark"),
      key: "spark",
      width: 125,
      render: (_, item) => (
        <Sparkline repo={item.repo} history={history} label={t("noHistory")} />
      ),
    },
    {
      title: t("category"),
      key: "category",
      width: 115,
      render: (_, item) => <Tag color="purple">{cat(item)}</Tag>,
    },
    {
      title: t("description"),
      dataIndex: "description",
      width: 260,
      render: (value) => (
        <div className="description-clamp" title={value}>
          {value || "—"}
        </div>
      ),
    },
    { title: t("updatedCol"), dataIndex: "last_push_date", width: 110 },
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
          <Card
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
              <Tag color="purple">{cat(item)}</Tag>
              <span className="trend-value">{item.trend?.[state.lang]}</span>
            </div>
            <div className="card-stars">
              {fmt(item.stars)} <small>Stars</small>
            </div>
            <p className="description-clamp">{item.description}</p>
            <div className="card-chart">
              <Sparkline
                repo={item.repo}
                history={history}
                width={240}
                height={32}
                label={t("noHistory")}
              />
            </div>
            <div className="card-meta">
              <span>{item.language || "GitHub"}</span>
              <span>{item.last_push_date}</span>
            </div>
            <QualityBadges item={item} t={t} />
          </Card>
        ))}
      </div>
    );
  return (
    <Table
      className="ranking-table"
      rowKey="repo"
      columns={columns}
      dataSource={items}
      pagination={false}
      scroll={{ x: 1305 }}
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
  );
}
