import React from "react";
import { Empty } from "antd";
export function Sparkline({ repo, history, width = 100, height = 28, label }) {
  const points = history?.series?.[repo] || [];
  if (!points.length)
    return (
      <svg width={width} height={height} role="img" aria-label={label}>
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--prs-border)"
          strokeDasharray="3 3"
        />
      </svg>
    );
  const stars = points.map((p) => p.stars),
    min = Math.min(...stars),
    max = Math.max(...stars),
    range = max - min || 1;
  const coordinates = stars.map((s, i) => [
    points.length > 1 ? (i * width) / (points.length - 1) : 0,
    height - 3 - ((s - min) / range) * (height - 6),
  ]);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${repo}: ${min} → ${max} ★`}
    >
      <title>{`${repo}: ${min} → ${max} ★`}</title>
      <polyline
        points={coordinates.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke="var(--prs-primary)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle
        cx={coordinates.at(-1)[0]}
        cy={coordinates.at(-1)[1]}
        r="2.3"
        fill="var(--prs-primary)"
      />
    </svg>
  );
}
export function ComparisonChart({ repos, history, t }) {
  const colors = [
    "var(--prs-primary)",
    "var(--prs-secondary)",
    "var(--prs-deep)",
  ];
  const series = repos
    .map((repo) => history?.series?.[repo] || [])
    .map((points) =>
      points.length
        ? points.map(
            (p) =>
              ((p.stars - (points[0].stars || 1)) / (points[0].stars || 1)) *
              100,
          )
        : [],
    );
  const all = series.flat();
  if (!all.length)
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t("noHistory")}
      />
    );
  const w = 640,
    h = 300,
    pad = 40,
    min = Math.min(0, ...all),
    max = Math.max(0, ...all),
    range = max - min || 1;
  const y = (v) => h - pad - ((v - min) / range) * (h - pad * 2);
  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        role="img"
        aria-label={t("compareTitle")}
      >
        <line
          x1={pad}
          y1={y(0)}
          x2={w - pad}
          y2={y(0)}
          stroke="var(--prs-border)"
          strokeDasharray="4 4"
        />
        {series.map((values, index) =>
          values.length > 1 ? (
            <polyline
              key={repos[index]}
              points={values
                .map(
                  (v, i) =>
                    `${pad + (i / (values.length - 1)) * (w - pad * 2)},${y(v)}`,
                )
                .join(" ")}
              fill="none"
              stroke={colors[index]}
              strokeWidth="2"
            />
          ) : values.length === 1 ? (
            <circle
              key={repos[index]}
              cx={pad}
              cy={y(values[0])}
              r="3"
              fill={colors[index]}
            />
          ) : null,
        )}
      </svg>
      <div className="comparison-legend">
        {repos.map((repo, i) => (
          <span key={repo}>
            <i style={{ background: colors[i] }} />
            {repo}
            {!series[i].length ? ` · ${t("noHistory")}` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
