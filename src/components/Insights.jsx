import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Bar, Line, Scatter } from "@ant-design/plots";
import { Renderer as SVGRenderer } from "@antv/g-svg";
import { Button, Empty, Select } from "antd";
import { buildInsightData, createColorMaps } from "../insights";
import { FONT_FAMILY } from "../domain";
import { ChartBoundary } from "./ChartBoundary";

const chartLabels = {
  zh: {
    insightTrendNote: "当前范围 Stars 最高的 3 个仓库 · 相对窗口内各自起点",
    insightGrowthNote: "近 7 日新增 Stars 最高的 5 个仓库 · 不随历史窗口切换",
    insightScatterNote: "横轴 Stars（对数） · 纵轴近 7 日新增 · 点击查看仓库",
    historyProvenance: "2026-10-24 前的快照来自原项目；只绘制已有数据。",
    noGrowth: "当前范围没有正增长记录。",
    viewChartData: "查看数据与仓库详情",
    insightBaseline: "起点",
    insightSingleSnapshot: "仅一次快照",
    insightBaselineNote: "起点为各仓库窗口内首个非零快照，日期可能不同；缺失日期不补值。",
  },
  en: {
    insightTrendNote: "Top 3 by Stars · relative to each repository’s first observation in the window",
    insightGrowthNote: "Top 5 by 7-day Stars gained · independent of history window",
    insightScatterNote: "Stars (log) × 7-day change · click to view repository",
    historyProvenance: "Snapshots before 2026-10-24 come from the original project; only recorded data is plotted.",
    noGrowth: "No positive growth in this selection.",
    viewChartData: "View data and repository details",
    insightBaseline: "Baseline",
    insightSingleSnapshot: "Single observation",
    insightBaselineNote: "Each baseline is its first non-zero snapshot in this window; dates may differ. No missing dates are filled.",
  },
};

function SvgPlot({ plot: Plot, onReady, ...props }) {
  // Keep renderer internals out of the React wrapper's recursive config walk.
  // The canvas owns its renderer and disposes it with this plot instance.
  const ready = (instance) => {
    instance.chart.getContext().canvas.setRenderer(new SVGRenderer());
    onReady?.(instance);
  };
  return <Plot {...props} onReady={ready} />;
}

function ChartFrame({ title, note, id, children, t, hidden = false }) {
  return (
    <article
      className={`insight-panel insight-${id}`}
      data-testid={`insight-${id}`}
      id={`insight-panel-${id}`}
      hidden={hidden}
      aria-labelledby={`insight-title-${id}`}
    >
      <div className="insight-panel-heading">
        <h3 id={`insight-title-${id}`}>{title}</h3>
        {note && <p>{note}</p>}
      </div>
      {!hidden && (
        <ChartBoundary fallback={t("chartUnavailable")}>
          {children}
        </ChartBoundary>
      )}
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
  t: translate,
}) {
  const t = (key) => chartLabels[state.lang][key] || translate(key);
  const [isMobile, setIsMobile] = useState(
    () => matchMedia("(max-width: 760px)").matches,
  );
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const query = matchMedia("(max-width: 760px)");
    const change = () => setIsMobile(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  const showAdditional = !isMobile || expanded;
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
      categories: { type: "scaleInY", duration: 800, delay: 80 },
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
  const percent = (value) =>
    (value > 0 ? "+" : "") +
    new Intl.NumberFormat(state.lang === "zh" ? "zh-CN" : "en-US", {
      maximumFractionDigits: 1,
    }).format(value) +
    "%";
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
  const handlers = useRef({ open, category });
  useLayoutEffect(() => {
    handlers.current = { open, category };
  });
  const bind =
    (id) =>
    ({ chart }) => {
      entered.current.add(id);
      chart.on("element:click", (event) => {
        const datum = event.data?.data;
        if (!datum) return;
        if (id === "categories") handlers.current.category(datum.id);
        else handlers.current.open(datum.repo);
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
  const trendDomain = data.trendRepos.map((item) => item.repo);
  const trendRange = dark
    ? ["#DBA8C0", "#C9C1BB", "#D77F88"]
    : ["#6E344F", "#514B48", "#B76473"];
  const trendDashes = [[], [7, 4], [2, 4]];
  const trendStyles = Object.fromEntries(
    trendDomain.map((repo, index) => [
      repo,
      { color: trendRange[index], dash: trendDashes[index] },
    ]),
  );
  const hasTrend = data.trends.some((point) =>
    Number.isFinite(point.growthPercent),
  );
  const recordedDates = data.trends.map((p) => p.date).sort();
  const categories = data.categories.map((c) => ({
    ...c,
    label: c[state.lang],
  }));
  const categoryMax = Math.max(0, ...categories.map((c) => c.count));
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
        <div className="insights-actions">
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
          <Button
            className="mobile-chart-toggle"
            type="text"
            size="small"
            aria-expanded={showAdditional}
            aria-controls="insight-panel-categories insight-panel-growth insight-panel-scatter"
            onClick={() => setExpanded((value) => !value)}
          >
            {t(expanded ? "hideMoreCharts" : "showMoreCharts")}
          </Button>
        </div>
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
                <i
                  style={{
                    background: "none",
                    border: 0,
                    borderRadius: 0,
                    width: 26,
                    height: 10,
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  <svg width="26" height="10" viewBox="0 0 26 10">
                    <line
                      x1="0"
                      y1="5"
                      x2="26"
                      y2="5"
                      stroke={trendStyles[item.repo].color}
                      strokeWidth="2"
                      strokeDasharray={trendStyles[item.repo].dash.join(" ")}
                    />
                  </svg>
                </i>
                <span>
                  {item.repo.split("/").pop()}
                  <small className="trend-baseline">
                    {t("insightBaseline")}:{" "}
                    {latest.get(item.repo)?.baselineDate || "—"}
                    {latest.get(item.repo)?.snapshotCount === 1 &&
                      ` · ${t("insightSingleSnapshot")}`}
                  </small>
                </span>
                <b>
                  {latest.has(item.repo)
                    ? Number.isFinite(latest.get(item.repo).growthPercent)
                      ? percent(latest.get(item.repo).growthPercent)
                      : "—"
                    : "—"}
                </b>
              </button>
            ))}
          </div>
          {hasTrend ? (
            <div
              className="plot-host"
              role="img"
              aria-label={t("insightTrend")}
            >
              <SvgPlot
                plot={Line}
                {...base}
                animate={trendEntrance}
                data={data.trends}
                xField="time"
                yField="growthPercent"
                colorField="repo"
                scale={{
                  x: { type: "time", tickCount: 4 },
                  y: { zero: false, nice: true },
                  color: { domain: trendDomain, range: trendRange },
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
                  y: { ...numericAxis, labelFormatter: (value) => `${value}%` },
                }}
                style={{
                  lineWidth: 2,
                  // G2 passes the entire series to a line mark's style callback.
                  lineDash: (series) => trendStyles[series[0]?.repo]?.dash || [],
                }}
                point={{
                  style: { r: 2.5 },
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
                      value: `${percent(datum.growthPercent)} · ${fmt(datum.stars)} Stars`,
                    }),
                    (datum) => ({
                      name: t("insightBaseline"),
                      value: `${datum.baselineDate} · ${fmt(datum.baselineStars)} Stars`,
                    }),
                  ],
                }}
                onReady={bind("trend")}
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
            {" · "}
            {t("insightBaselineNote")}
          </p>
        </ChartFrame>
        <ChartFrame
          id="categories"
          hidden={!showAdditional}
          title={t("categoryLabel")}
          t={t}
        >
          {categories.length ? (
            <>
              <div
                className="plot-host"
                role="img"
                aria-label={t("categoryLabel")}
              >
                <SvgPlot
                  plot={Bar}
                  {...base}
                  animate={entrance("categories")}
                  height={280}
                  paddingLeft={state.lang === "zh" ? 125 : 175}
                  paddingRight={40}
                  data={categories}
                  xField="label"
                  yField="count"
                  colorField="id"
                  scale={{
                    color: { domain: catDomain, range: catRange },
                    y: {
                      zero: true,
                      nice: true,
                      domain: [
                        0,
                        categoryMax + Math.max(4, Math.ceil(categoryMax * 0.2)),
                      ],
                    },
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
                      labelAutoEllipsis: false,
                    },
                    y: { ...numericAxis, tickCount: 3 },
                  }}
                  label={{
                    text: "count",
                    position: "right",
                    style: {
                      fill: muted,
                      fontFamily: FONT_FAMILY,
                      fontSize: 12,
                      textAlign: "start",
                      dx: 6,
                    },
                  }}
                  style={{ maxWidth: 16 }}
                  tooltip={{
                    title: "label",
                    items: [{ field: "count", name: t("repos") }],
                  }}
                  onReady={bind("categories")}
                />
              </div>
              <div className="category-legend category-filter-controls">
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
      <div className="insights-bottom" hidden={!showAdditional}>
        <ChartFrame
          id="growth"
          hidden={!showAdditional}
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
                <SvgPlot
                  plot={Bar}
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
                  onReady={bind("growth")}
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
          hidden={!showAdditional}
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
                <SvgPlot
                  plot={Scatter}
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
                  onReady={bind("scatter")}
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
