import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bar, Line, Pie, Scatter } from "@ant-design/plots";
import { Empty, Select } from "antd";
import { buildInsightData, createColorMaps } from "../insights";
import { FONT_FAMILY } from "../domain";
import { ChartBoundary } from "./ChartBoundary";

function ChartFrame({ title, note, id, children, t }) {
  return (
    <article
      className={`insight-panel insight-${id}`}
      data-testid={`insight-${id}`}
      aria-labelledby={`insight-title-${id}`}
    >
      <div className="insight-panel-heading">
        <h3 id={`insight-title-${id}`}>{title}</h3>
        {note && <p>{note}</p>}
      </div>
      <ChartBoundary fallback={t("chartUnavailable")}>{children}</ChartBoundary>
    </article>
  );
}
function NoData({ text }) {
  return (
    <div className="chart-empty">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={text} />
    </div>
  );
}
export default function Insights({
  items,
  allItems,
  history,
  generatedAt,
  state,
  update,
  t,
}) {
  const entered = useRef(new Set());
  const [reducedMotion, setReducedMotion] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReducedMotion(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const entrance = (id) => {
    if (reducedMotion || entered.current.has(id)) return false;
    const settings = {
      trend: { type: "pathIn", duration: 900, delay: 0 },
      categories: { type: "waveIn", duration: 800, delay: 80 },
      growth: { type: "scaleInY", duration: 700, delay: 140 },
      scatter: { type: "fadeIn", duration: 600, delay: 200 },
    };
    return {
      enter: { ...settings[id], easing: "ease-out" },
      update: false,
      exit: false,
    };
  };
  const trendEntrance = entrance("trend");
  const [days, setDays] = useState(60);
  const data = useMemo(
    () => buildInsightData(items, history, generatedAt, days),
    [items, history, generatedAt, days],
  );
  const colors = useMemo(() => createColorMaps(allItems), [allItems]);
  const dark = state.theme === "dark";
  const muted = dark ? "#C5B8BB" : "#797378",
    grid = dark ? "#44383D" : "#E9E4E2";
  const fmt = (value) =>
    new Intl.NumberFormat(state.lang === "zh" ? "zh-CN" : "en-US").format(
      value,
    );
  const signed = (value) => (value > 0 ? "+" : "") + fmt(value);
  const short = (value) =>
    String(value).length > 24
      ? String(value).slice(0, 23) + "…"
      : String(value);
  const open = (repo) => {
    if (repo && items.some((i) => i.repo === repo))
      update((s) => ({ ...s, repo }));
  };
  const category = (id) =>
    update((s) => ({ ...s, category: s.category === id ? "all" : id }));
  const bind =
    (id, callback) =>
    ({ chart }) => {
      entered.current.add(id);
      chart.on("element:click", (event) => {
        const datum = event.data?.data;
        if (datum) callback(datum);
      });
    };
  const base = {
    autoFit: true,
    height: 280,
    animate: false,
    legend: false,
    theme: {
      type: dark ? "dark" : "light",
      axis: {
        labelOpacity: 1,
        labelFill: muted,
        labelFontFamily: FONT_FAMILY,
        titleFill: muted,
        titleFontFamily: FONT_FAMILY,
      },
      view: { viewFill: "transparent" },
    },
    style: { fontFamily: FONT_FAMILY },
    paddingLeft: 50,
    paddingRight: 18,
    paddingTop: 12,
    paddingBottom: 32,
  };
  const numericAxis = {
    title: false,
    labelFill: muted,
    labelOpacity: 1,
    labelFontFamily: FONT_FAMILY,
    labelFontSize: 11,
    grid: true,
    gridStroke: grid,
    gridLineDash: [2, 3],
    tick: false,
    line: false,
    labelFormatter: (value) =>
      new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(Number(value)),
  };
  const repoDomain = Object.keys(colors.repos),
    repoRange = Object.values(colors.repos),
    catDomain = Object.keys(colors.categories),
    catRange = Object.values(colors.categories);
  const latest = new Map(data.trends.map((p) => [p.repo, p]));
  const recordedDates = data.trends.map((p) => p.date).sort();
  const categories = data.categories.map((c) => ({
    ...c,
    label: c[state.lang],
  }));
  return (
    <section
      className="insights"
      data-testid="insights"
      aria-labelledby="insights-heading"
    >
      <div className="insights-heading">
        <div>
          <h2 id="insights-heading">{t("insightsTitle")}</h2>
          <p>
            {t("insightsScope")}{" "}
            <b data-testid="insight-count">{items.length}</b> {t("repos")}
          </p>
        </div>
        <label className="history-window">
          <span>{t("historyWindow")}</span>
          <Select
            aria-label={t("historyWindow")}
            value={days}
            onChange={setDays}
            options={[30, 60].map((value) => ({
              value,
              label: `${value} ${t("days")}`,
            }))}
          />
        </label>
      </div>
      <div className="insights-top">
        <ChartFrame
          id="trend"
          title={t("insightTrend")}
          note={t("insightTrendNote")}
          t={t}
        >
          <div className="insight-legend">
            {data.trendRepos.map((item) => (
              <button
                key={item.repo}
                onClick={() => open(item.repo)}
                title={`${item.repo}${latest.has(item.repo) ? " · " + latest.get(item.repo).date : ""}`}
              >
                <i style={{ background: colors.repos[item.repo] }} />
                <span>{item.repo.split("/").pop()}</span>
                <b>
                  {latest.has(item.repo)
                    ? fmt(latest.get(item.repo).stars)
                    : "—"}
                </b>
              </button>
            ))}
          </div>
          {data.trends.length ? (
            <div
              className="plot-host"
              role="img"
              aria-label={t("insightTrend")}
            >
              <Line
                {...base}
                animate={trendEntrance}
                data={data.trends}
                xField="time"
                yField="stars"
                colorField="repo"
                scale={{
                  x: { type: "time", tickCount: 4 },
                  y: { zero: true, nice: true },
                  color: { domain: repoDomain, range: repoRange },
                }}
                axis={{
                  x: {
                    title: false,
                    labelFill: muted,
                    labelOpacity: 1,
                    labelFontFamily: FONT_FAMILY,
                    labelFontSize: 11,
                    tick: false,
                    labelFormatter: (value) =>
                      new Date(value).toISOString().slice(5, 10),
                  },
                  y: numericAxis,
                }}
                style={{ lineWidth: 1.8 }}
                point={{
                  style: { r: 1 },
                  tooltip: false,
                  animate: trendEntrance
                    ? {
                        enter: { type: "fadeIn", duration: 150, delay: 750 },
                        update: false,
                        exit: false,
                      }
                    : false,
                }}
                tooltip={{
                  title: (datum) => datum.date,
                  items: [
                    (datum) => ({
                      name: datum.repo,
                      value: `${fmt(datum.stars)} Stars`,
                    }),
                  ],
                }}
                onReady={bind("trend", (d) => open(d.repo))}
              />
            </div>
          ) : (
            <NoData text={t("noHistory")} />
          )}
          <p className="chart-footnote">
            {recordedDates.length > 0 && (
              <span>
                {recordedDates[0]} — {recordedDates.at(-1)} ·{" "}
              </span>
            )}
            {t("historyProvenance")}
          </p>
        </ChartFrame>
        <ChartFrame id="categories" title={t("insightCategories")} t={t}>
          {categories.length ? (
            <>
              <div className="donut-wrap">
                <div
                  className="plot-host"
                  role="img"
                  aria-label={t("insightCategories")}
                >
                  <Pie
                    {...base}
                    animate={entrance("categories")}
                    height={210}
                    padding={0}
                    paddingLeft={0}
                    paddingRight={0}
                    paddingTop={0}
                    paddingBottom={0}
                    data={categories}
                    angleField="count"
                    colorField="id"
                    innerRadius={0.7}
                    radius={0.94}
                    scale={{ color: { domain: catDomain, range: catRange } }}
                    style={{
                      stroke: dark ? "#201C1F" : "#FEFDFC",
                      lineWidth: 2,
                    }}
                    tooltip={{
                      title: "label",
                      items: [{ field: "count", name: t("repos") }],
                    }}
                    onReady={bind("categories", (d) => category(d.id))}
                  />
                </div>
                <div className="donut-center" aria-hidden="true">
                  <b>{items.length}</b>
                  <span>{t("repos")}</span>
                </div>
              </div>
              <div className="category-legend">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    data-chart-category={c.id}
                    onClick={() => category(c.id)}
                    aria-pressed={state.category === c.id}
                  >
                    <i style={{ background: colors.categories[c.id] }} />
                    <span>{c.label}</span>
                    <b>{c.count}</b>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <NoData text={t("empty")} />
          )}
        </ChartFrame>
      </div>
      <div className="insights-bottom">
        <ChartFrame
          id="growth"
          title={t("insightGrowth")}
          note={t("insightGrowthNote")}
          t={t}
        >
          {data.growth.length ? (
            <>
              <div
                className="plot-host"
                role="img"
                aria-label={t("insightGrowth")}
              >
                <Bar
                  {...base}
                  animate={entrance("growth")}
                  height={250}
                  data={data.growth}
                  xField="repo"
                  yField="growth"
                  colorField="repo"
                  scale={{
                    color: { domain: repoDomain, range: repoRange },
                    y: { zero: true, nice: true },
                  }}
                  axis={{
                    x: {
                      title: false,
                      tick: false,
                      line: false,
                      labelFill: muted,
                      labelOpacity: 1,
                      labelFontFamily: FONT_FAMILY,
                      labelFontSize: 11,
                      labelFormatter: (value) =>
                        short(String(value).split("/").pop()),
                    },
                    y: numericAxis,
                  }}
                  paddingLeft={165}
                  style={{ maxWidth: 12 }}
                  tooltip={{
                    title: "repo",
                    items: [
                      {
                        field: "growth",
                        name: t("insightGrowth"),
                        valueFormatter: signed,
                      },
                    ],
                  }}
                  onReady={bind("growth", (d) => open(d.repo))}
                />
              </div>
              <div className="growth-values">
                {data.growth.map((item) => (
                  <button
                    key={item.repo}
                    data-growth-repo={item.repo}
                    onClick={() => open(item.repo)}
                  >
                    <span
                      title={`${item.repo}${latest.has(item.repo) ? " · " + latest.get(item.repo).date : ""}`}
                    >
                      {item.repo}
                    </span>
                    <b style={{ color: colors.repos[item.repo] }}>
                      {signed(item.growth)}
                    </b>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <NoData text={t("noGrowth")} />
          )}
        </ChartFrame>
        <ChartFrame
          id="scatter"
          title={t("insightScatter")}
          note={t("insightScatterNote")}
          t={t}
        >
          {data.scatter.length ? (
            <>
              <div
                className="plot-host"
                role="img"
                aria-label={t("insightScatter")}
              >
                <Scatter
                  {...base}
                  animate={entrance("scatter")}
                  height={300}
                  data={data.scatter}
                  xField="stars"
                  yField="growth"
                  colorField="category"
                  scale={{
                    x: { type: "log", nice: true, tickCount: 4 },
                    y: { zero: true, nice: true },
                    color: { domain: catDomain, range: catRange },
                  }}
                  axis={{
                    x: { ...numericAxis, title: "Stars (log)", grid: false },
                    y: numericAxis,
                  }}
                  shapeField={() => "point"}
                  style={{
                    fill: (datum) => colors.categories[datum.category],
                    fillOpacity: 0.8,
                    stroke: (datum) => colors.categories[datum.category],
                    r: 3,
                    lineWidth: 0.5,
                  }}
                  tooltip={{
                    title: "repo",
                    items: [
                      { field: "stars", name: "Stars" },
                      {
                        field: "growth",
                        name: t("insightGrowth"),
                        valueFormatter: signed,
                      },
                    ],
                  }}
                  onReady={bind("scatter", (d) => open(d.repo))}
                />
              </div>
              <details className="chart-data">
                <summary>{t("viewChartData")}</summary>
                <div className="chart-data-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("repo")}</th>
                        <th>Stars</th>
                        <th>{t("insightGrowth")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.scatter.map((item) => (
                        <tr key={item.repo}>
                          <td>
                            <button onClick={() => open(item.repo)}>
                              {item.repo}
                            </button>
                          </td>
                          <td>{fmt(item.stars)}</td>
                          <td>{signed(item.growth)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          ) : (
            <NoData text={t("empty")} />
          )}
        </ChartFrame>
      </div>
    </section>
  );
}
