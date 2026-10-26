import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Bar, Line, Scatter } from "@ant-design/plots";
import { Renderer as SVGRenderer } from "@antv/g-svg";
import { Button, Empty, Select, Tooltip } from "antd";
import { buildInsightData, createColorMaps } from "../insights";
import { FONT_FAMILY } from "../domain";
import { ChartBoundary } from "./ChartBoundary";

const chartLabels = {
  zh: {
    insightTrendNote: "窗口内增长最快的 3 个项目",
    insightGrowthNote: "近 7 日新增 Stars 最高的 5 个仓库 · 不随历史窗口切换",
    insightScatterNote: "横轴 Stars（对数） · 纵轴近 7 日新增 · 点击查看仓库",
    comparisonNote: "已选比较仓库 · 相对窗口内各自起点",
    dataSince: "数据自",
    historyDetails: "数据与排名说明",
    categoryTooltip: "分类",
    historyProvenance: "2026-10-24 前的快照来自原项目；只绘制已有数据。",
    noGrowth: "当前范围没有正增长记录。",
    viewChartData: "查看数据与仓库详情",
    insightBaseline: "起点",
    insightSingleSnapshot: "仅一次快照",
    insightBaselineNote:
      "起点为各仓库窗口内首个非零快照，日期可能不同；缺失日期不补值。增长率=(末次Stars−起点Stars)/起点Stars；至少两次有效快照优先，再按增长率降序、仓库名排序。零起点之前不计算增长率。",
  },
  en: {
    insightTrendNote:
      "Top 3 by window growth · at least two valid observations first",
    insightGrowthNote:
      "Top 5 by 7-day Stars gained · independent of history window",
    insightScatterNote: "Stars (log) × 7-day change · click to view repository",
    comparisonNote:
      "Selected comparisons · relative to each baseline in this window",
    dataSince: "Data since",
    historyDetails: "Data and ranking details",
    categoryTooltip: "Category",
    historyProvenance:
      "Snapshots before 2026-10-24 come from the original project; only recorded data is plotted.",
    noGrowth: "No positive growth in this selection.",
    viewChartData: "View data and repository details",
    insightBaseline: "Baseline",
    insightSingleSnapshot: "Single observation",
    insightBaselineNote:
      "Each baseline is its first non-zero snapshot in this window; dates may differ. No missing dates are filled. Growth = (last Stars − baseline Stars) / baseline Stars. Rank series with at least two valid observations first, then growth descending and repository name. Growth before a positive baseline is undefined.",
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

function ChartFrame({ title, note, action, id, children, t, hidden = false }) {
  return (
    <article
      className={`insight-panel insight-${id}`}
      data-testid={`insight-${id}`}
      id={`insight-panel-${id}`}
      hidden={hidden}
      aria-labelledby={`insight-title-${id}`}
    >
      <div className="insight-panel-heading">
        <div className="trend-title-row">
          <h3 id={`insight-title-${id}`}>{title}</h3>
          {action}
        </div>
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
  const selectedTrends = useMemo(
    () =>
      (state.compare || [])
        .map((repo) => allItems.find((item) => item.repo === repo))
        .filter(Boolean),
    [allItems, state.compare],
  );
  const data = useMemo(
    () => buildInsightData(items, history, generatedAt, days, selectedTrends),
    [items, history, generatedAt, days, selectedTrends],
  );
  const colors = useMemo(() => createColorMaps(allItems), [allItems]);
  const dark = state.theme === "dark";
  const muted = dark ? "#B8B3D0" : "#67638C",
    grid = dark ? "#403B59" : "#E7E5F2";
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
    if (repo && allItems.some((i) => i.repo === repo))
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
    ? ["#B3AAEA", "#C1C3D3", "#73CBB6"]
    : ["#4A3FBF", "#67638C", "#0E7C66"];
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
  const trendStart = Date.parse(recordedDates[0] + "T00:00:00Z");
  const trendEnd = Date.parse(recordedDates.at(-1) + "T00:00:00Z");
  const trendTicks = Number.isFinite(trendStart)
    ? [
        ...new Set([
          trendStart,
          Math.round((trendStart + trendEnd) / 2 / 86400000) * 86400000,
          trendEnd,
        ]),
      ]
    : [];
  const starValues = data.scatter.map((item) => item.stars);
  const minExponent = Math.floor(Math.log10(Math.min(...starValues, Infinity)));
  const maxExponent = Math.max(
    minExponent + 1,
    Math.ceil(Math.log10(Math.max(...starValues, 1))),
  );
  const scatterDomain = starValues.length
    ? [10 ** minExponent, 10 ** maxExponent]
    : [1, 10];
  const scatterTicks = starValues.length
    ? Array.from(
        { length: maxExponent - minExponent + 1 },
        (_, index) => 10 ** (minExponent + index),
      )
    : [1, 10];
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
          note={t(
            selectedTrends.length ? "comparisonNote" : "insightTrendNote",
          )}
          action={
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
          }
          t={t}
        >
          <div className="chart-keyboard-controls">
            {data.trendRepos.map((item) => (
              <button key={item.repo} onClick={() => open(item.repo)}>
                {item.repo} · {latest.get(item.repo)?.date || "—"} ·{" "}
                {Number.isFinite(latest.get(item.repo)?.growthPercent)
                  ? percent(latest.get(item.repo).growthPercent)
                  : "—"}
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
                paddingRight={135}
                animate={trendEntrance}
                data={data.trends}
                xField="time"
                yField="growthPercent"
                colorField="repo"
                scale={{
                  x: { type: "time", tickMethod: () => trendTicks },
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
                  lineDash: (series) =>
                    trendStyles[series[0]?.repo]?.dash || [],
                }}
                point={{
                  style: {
                    r: (datum) =>
                      latest.get(datum.repo)?.time === datum.time ? 2.8 : 0,
                  },
                  tooltip: false,
                  animate: trendEntrance
                    ? {
                        enter: { type: "fadeIn", duration: 150, delay: 750 },
                        update: false,
                        exit: false,
                      }
                    : false,
                }}
                label={{
                  text: (datum) =>
                    latest.get(datum.repo)?.time === datum.time
                      ? datum.repo.split("/").pop()
                      : "",
                  style: {
                    dx: 7,
                    textAlign: "left",
                    fontSize: 10,
                    fill: muted,
                  },
                  transform: [{ type: "overlapDodgeY" }],
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
                {t("dataSince")} {recordedDates[0]}{" "}
              </span>
            )}
            <Tooltip
              title={`${t("historyProvenance")} ${t("insightBaselineNote")}`}
            >
              <button className="chart-help" aria-label={t("historyDetails")}>
                ?
              </button>
            </Tooltip>
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
                  height={Math.max(150, categories.length * 27 + 30)}
                  paddingLeft={state.lang === "zh" ? 125 : 175}
                  paddingRight={40}
                  data={categories}
                  xField="label"
                  yField="count"
                  scale={{
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
                    y: false,
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
                  style={{
                    maxWidth: 14,
                    fill: (datum) =>
                      state.category === datum.id
                        ? dark
                          ? "#B3AAEA"
                          : "#4A3FBF"
                        : dark
                          ? "#80789E"
                          : "#B3AEC9",
                  }}
                  tooltip={{
                    title: "label",
                    items: [{ field: "count", name: t("repos") }],
                  }}
                  onReady={bind("categories")}
                />
              </div>
              <div className="chart-keyboard-controls category-filter-controls">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    data-chart-category={c.id}
                    onClick={() => category(c.id)}
                    aria-pressed={state.category === c.id}
                  >
                    <i style={{ background: dark ? "#80789E" : "#B3AEC9" }} />
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
                  height={220}
                  paddingRight={65}
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
                  label={{
                    text: (datum) => signed(datum.growth),
                    position: "right",
                    style: {
                      dx: 6,
                      fill: muted,
                      fontSize: 11,
                      textAlign: "left",
                    },
                  }}
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
              <div className="chart-keyboard-controls">
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
                    x: {
                      type: "log",
                      base: 10,
                      domain: scatterDomain,
                      tickMethod: () => scatterTicks,
                    },
                    y: { zero: true, nice: true },
                    color: { domain: catDomain, range: catRange },
                  }}
                  axis={{
                    x: { ...numericAxis, title: "Stars (log)", grid: false },
                    y: numericAxis,
                  }}
                  label={{
                    text: (datum) =>
                      datum.highlight ? datum.repo.split("/").pop() : "",
                    style: { dy: -10, fill: muted, fontSize: 10 },
                    transform: [{ type: "overlapHide" }],
                  }}
                  shapeField={() => "point"}
                  style={{
                    fill: (datum) => colors.categories[datum.category],
                    fillOpacity: (datum) => (datum.highlight ? 0.95 : 0.25),
                    stroke: (datum) => colors.categories[datum.category],
                    r: (datum) => (datum.highlight ? 4 : 2.5),
                    lineWidth: 0.5,
                  }}
                  tooltip={{
                    title: "repo",
                    items: [
                      (datum) => ({
                        name: t("categoryTooltip"),
                        value:
                          state.lang === "zh"
                            ? datum.categoryZh
                            : datum.categoryEn,
                      }),
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
              <div className="scatter-legend" aria-label={t("categoryLabel")}>
                {categories.map((item) => (
                  <span key={item.id}>
                    <i style={{ background: colors.categories[item.id] }} />
                    {item.label}
                  </span>
                ))}
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
