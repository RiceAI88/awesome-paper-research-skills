import React from "react";
import { Empty } from "antd";
export function Sparkline({ repo, history, width = 100, height = 28, label }) {
  const pad = 3;
  const points = (history?.series?.[repo] || [])
    .filter(
      (point) =>
        Number.isFinite(Date.parse(point.date)) &&
        Number.isFinite(point.stars) &&
        point.stars >= 0,
    )
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (!points.length)
    return (
      <svg
        className="mini-area-chart"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
      >
        <title>{label}</title>
        <line
          x1={pad}
          y1={height / 2}
          x2={width - pad}
          y2={height / 2}
          stroke="var(--prs-border)"
          strokeDasharray="3 3"
        />
      </svg>
    );
  const first = points[0],
    last = points.at(-1);
  const stars = points.map((p) => p.stars),
    min = Math.min(...stars),
    max = Math.max(...stars);
  const start = Date.parse(first.date),
    duration = Date.parse(last.date) - start;
  const coordinates = points.map((p) => [
    duration
      ? pad + ((Date.parse(p.date) - start) / duration) * (width - pad * 2)
      : width / 2,
    max === min
      ? height / 2
      : height - pad - ((p.stars - min) / (max - min)) * (height - pad * 2),
  ]);
  const line = coordinates.map((p) => p.join(",")).join(" ");
  const title = `${repo}: ${first.date} — ${last.date}, ${first.stars.toLocaleString()} → ${last.stars.toLocaleString()} Stars`;
  return (
    <svg
      className="mini-area-chart"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {points.length > 1 && (
        <>
          <polygon
            data-area-fill
            points={`${coordinates[0][0]},${height - pad} ${line} ${coordinates.at(-1)[0]},${height - pad}`}
            fill="var(--prs-primary)"
            fillOpacity="0.12"
          />
          <polyline
            points={line}
            fill="none"
            stroke="var(--prs-primary)"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </>
      )}
      <circle
        cx={coordinates.at(-1)[0]}
        cy={coordinates.at(-1)[1]}
        r="2"
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
