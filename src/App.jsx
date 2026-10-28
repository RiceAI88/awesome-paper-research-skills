import { Reveal } from "./components/SiteMotion";
import { DailyArrivals } from "./components/DailyArrivals";
import { RechargeAd } from "./components/RechargeAd";
import { BackToTop } from "./components/BackToTop";
import { VisitCounter } from "./components/VisitCounter";
import { SearchBox } from "./components/SearchBox";
import { Panel } from "./components/Panel";
import React, {
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  ConfigProvider,
  Segmented,
  Select,
  Space,
  Tag,
  Tooltip,
  theme,
} from "antd";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import {
  AppstoreOutlined,
  BarsOutlined,
  BulbOutlined,
  CalendarOutlined,
  CloseOutlined,
  GithubOutlined,
  StarFilled,
  StarOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import {
  AGENT_PLATFORMS,
  detectAgents,
  filterItems,
  taskCountsFor,
  recentlyUpdatedCount,
  isNewThisWeek,
  isNewToday,
  beijingDay,
  FONT_FAMILY,
  persistState,
  REPOSITORY_URL,
  RESEARCH_TASKS,
  restoreState,
  serializeState,
} from "./domain";
import { translations } from "./i18n";
import { enrichItem, editorialPicks } from "./practical";
import { EditorialPicks } from "./components/EditorialPicks";
import { UpdateStatus } from "./components/UpdateStatus";
import { DataTransparency } from "./components/DataTransparency";
import { ActiveFilters } from "./components/ActiveFilters";
import { RepositoryViews } from "./components/RepositoryViews";
import { FeedbackProvider, useFeedback } from "./components/FeedbackProvider";
import { DeferredFeature } from "./components/DeferredFeature";
const RepositoryDrawer = lazy(() =>
  import("./components/RepositoryDrawer").then((module) => ({
    default: module.RepositoryDrawer,
  })),
);
const ComparisonDialog = lazy(() => import("./components/ComparisonDialog"));
import { ViewportInsights } from "./components/ViewportInsights";

const dataset = window.ACADEMIC_SKILLS_RANKINGS || {};
const sourceItems = Array.isArray(dataset.items)
  ? dataset.items.map((item) => ({
      ...enrichItem(item),
      new_this_week: isNewThisWeek(item, dataset.metadata?.generated_at),
      inactive90:
        Number.isFinite(Date.parse(item.last_push_date)) &&
        Date.parse(dataset.metadata?.generated_at) -
          Date.parse(item.last_push_date + "T00:00:00Z") >=
          90 * 86400000,
    }))
  : [];
const historyData = window.ACADEMIC_SKILLS_HISTORY || { series: {} };
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}
const defaults = {
  lang: window.ARS_DEFAULT_LANG || "zh",
  theme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  view: "card",
};
const base = import.meta.env.BASE_URL;
const taskLabels = {
  find: "taskFind",
  read: "taskRead",
  write: "taskWrite",
  figures: "taskFigures",
  reproduce: "taskReproduce",
  review: "taskReview",
};
const localFile = (name) => base + name;
function ScopeSwitch({ checked, onChange, size, ...props }) {
  return (
    <button
      {...props}
      type="button"
      role="switch"
      aria-checked={checked}
      className="scope-switch"
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}
export default function App() {
  const items = sourceItems;
  const [state, update] = useState(() =>
    restoreState(storage, location.hash, defaults, items),
  );
  useEffect(() => {
    persistState(storage, state);
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
    document.title = `${state.lang === "zh" ? "论文科研 Skills 排行榜" : "Paper Research Skills Ranking"} · Awesome Paper Research Skills`;
    const hash = serializeState(state);
    if (location.hash !== hash)
      window.history.replaceState(
        null,
        "",
        location.pathname + location.search + hash,
      );
  }, [state]);
  useEffect(() => {
    const change = () =>
      update((previous) => ({
        ...restoreState(storage, location.hash, defaults, items),
        favorites: previous.favorites,
        compare: previous.compare,
      }));
    addEventListener("hashchange", change);
    return () => removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    const el = document.getElementById("ld-json");
    if (el)
      el.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Awesome Paper Research Skills",
        url: document.querySelector('link[rel="canonical"]')?.href,
        itemListElement: items.slice(0, 20).map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.repo,
          url: item.url,
        })),
      });
  }, []);
  return (
    <ConfigProvider
      locale={state.lang === "zh" ? zhCN : enUS}
      theme={{
        algorithm:
          state.theme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: state.theme === "dark" ? "#B3AAEA" : "#4A3FBF",
          colorLink: state.theme === "dark" ? "#B3AAEA" : "#4A3FBF",
          colorLinkHover: state.theme === "dark" ? "#D5D0F5" : "#372E9D",
          colorLinkActive: state.theme === "dark" ? "#B3AAEA" : "#372E9D",
          fontFamily: FONT_FAMILY,
          colorBgContainer: state.theme === "dark" ? "#211F32" : "#FFFFFF",
          borderRadius: 10,
          colorText: state.theme === "dark" ? "#EEECFA" : "#1E1B3A",
          colorTextSecondary: state.theme === "dark" ? "#B8B3D0" : "#67638C",
          colorBorder: state.theme === "dark" ? "#403B59" : "#E7E5F2",
          colorBgLayout: state.theme === "dark" ? "#171523" : "#FBFAF8",
        },
        components: {
          Table: { headerBg: state.theme === "dark" ? "#29263B" : "#FFFFFF" },
        },
      }}
    >
      <FeedbackProvider>
        <Dashboard {...{ state, update }} />
      </FeedbackProvider>
    </ConfigProvider>
  );
}
function Dashboard({ state, update }) {
  const [today, setToday] = useState(() => beijingDay());
  useEffect(() => {
    const sync = () => setToday(beijingDay());
    const timer = setInterval(sync, 60000);
    addEventListener("focus", sync);
    return () => {
      clearInterval(timer);
      removeEventListener("focus", sync);
    };
  }, []);
  const items = useMemo(
    () =>
      sourceItems.map((item) => ({
        ...item,
        new_today: isNewToday(item, today),
      })),
    [today],
  );
  const message = useFeedback();
  const [compareOpen, setCompareOpen] = useState(false);
  const [drawerRequested, setDrawerRequested] = useState(Boolean(state.repo));
  const [comparisonRequested, setComparisonRequested] = useState(false);
  useEffect(() => {
    if (state.repo) setDrawerRequested(true);
  }, [state.repo]);
  useEffect(() => {
    if (compareOpen) setComparisonRequested(true);
  }, [compareOpen]);
  const filterRef = useRef(null);
  const [filterHeight, setFilterHeight] = useState(0);
  useEffect(() => {
    const element = filterRef.current;
    const measure = () =>
      setFilterHeight(Math.ceil(element.getBoundingClientRect().height));
    measure();
    const observer =
      typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  const visible = useMemo(() => filterItems(items, state), [items, state]);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const scopeItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.repository_kind === "skill" ||
          (state.includeRelated && item.repository_kind === "related"),
      ),
    [items, state.includeRelated],
  );
  const relatedCount = items.filter(
    (item) => item.repository_kind === "related",
  ).length;
  const search = useRef(null);
  const stickySearch = useRef(null);
  const [stickySearchVisible, setStickySearchVisible] = useState(false);
  const syncStickySearch = useCallback(() => {
    const input = search.current?.input;
    const toolbar = filterRef.current;
    if (
      !input ||
      !toolbar ||
      document.activeElement?.id === "stickySearchInput"
    )
      return;
    const top = input.getBoundingClientRect().top;
    // Enter when the toolbar is pinned; return only after the original input is fully visible.
    setStickySearchVisible((showing) =>
      showing ? top < 8 : toolbar.getBoundingClientRect().top <= 0,
    );
  }, []);
  useEffect(() => {
    syncStickySearch();
    addEventListener("scroll", syncStickySearch, { passive: true });
    addEventListener("resize", syncStickySearch);
    return () => {
      removeEventListener("scroll", syncStickySearch);
      removeEventListener("resize", syncStickySearch);
    };
  }, [syncStickySearch]);

  const t = (key) => translations[state.lang][key] || key;
  const fmt = (value) =>
    new Intl.NumberFormat(state.lang === "zh" ? "zh-CN" : "en-US").format(
      value || 0,
    );
  const taskCounts = useMemo(
    () => taskCountsFor(items, state),
    [
      items,
      state.query,
      state.agent,
      state.favOnly,
      state.favorites,
      state.newOnly,
      state.todayOnly,
      state.includeRelated,
    ],
  );
  const selected =
    visible.find((item) => item.repo === state.repo) ||
    items.find((item) => item.repo === state.repo);
  const categories = useMemo(
    () =>
      [
        ...new Map(
          items.map((item) => [item.category.id, item.category]),
        ).values(),
      ].sort((a, b) => a.en.localeCompare(b.en)),
    [],
  );
  const platformIds = new Set(items.flatMap(detectAgents));
  const net7 = scopeItems.reduce((sum, i) => sum + (i.star_delta_7d || 0), 0);
  const toggleCompare = (repo) => {
    if (!state.compare.includes(repo) && state.compare.length >= 3) {
      message.info(t("compareFull"));
      return;
    }
    update((s) => ({
      ...s,
      compare: s.compare.includes(repo)
        ? s.compare.filter((r) => r !== repo)
        : [...s.compare, repo],
    }));
  };
  useEffect(() => {
    if (!state.compare.length) setCompareOpen(false);
  }, [state.compare]);
  useEffect(() => {
    const handler = (e) => {
      if (
        e.defaultPrevented ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        compareOpen ||
        state.repo
      )
        return;
      const target = e.target;
      if (
        target.isContentEditable ||
        target.closest('input,select,textarea,[role="combobox"],.ant-select')
      )
        return;
      if (e.key === "/") {
        e.preventDefault();
        (stickySearchVisible ? stickySearch.current : search.current)?.focus();
      }
      if (e.key === "t")
        update((s) => ({
          ...s,
          theme: s.theme === "light" ? "dark" : "light",
        }));
      if (e.key === "l")
        update((s) => ({ ...s, lang: s.lang === "zh" ? "en" : "zh" }));
      if (e.key === "v")
        update((s) => ({ ...s, view: s.view === "table" ? "card" : "table" }));
      if (e.key === "f") update((s) => ({ ...s, favOnly: !s.favOnly }));
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [compareOpen, state.repo, update, stickySearchVisible]);
  function exportFavorites() {
    const favorites = items
      .filter((i) => state.favorites.includes(i.repo))
      .map((i) => ({
        repo: i.repo,
        stars: i.stars,
        url: i.url,
        category: i.category.en,
      }));
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { exported_at: new Date().toISOString(), favorites },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "ars-favorites.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const recentCount = recentlyUpdatedCount(
    scopeItems,
    dataset.metadata?.generated_at,
  );
  const newcomers = scopeItems.filter((item) => item.new_this_week).length;
  return (
    <div
      className={`prs-page${stickySearchVisible ? " sticky-search-active" : ""}`}
    >
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById("main");
          main?.scrollIntoView();
          main?.focus({ preventScroll: true });
        }}
      >
        {t("skipToContent")}
      </a>
      <header className="site-header">
        <Reveal
          as="nav"
          kind="quiet"
          className="site-nav container"
          aria-label="Primary"
        >
          <a className="brand" href={base}>
            <span className="brand-mark">APRS</span>
            <span>Awesome Paper Research Skills</span>
          </a>
          <Space size={8} wrap className="nav-actions">
            <Segmented
              aria-label="Language"
              value={state.lang}
              options={[
                { label: "中文", value: "zh" },
                { label: "EN", value: "en" },
              ]}
              onChange={(lang) => update((s) => ({ ...s, lang }))}
            />
            <Tooltip title={t("reportsLink")}>
              <Button
                aria-label={t("reportsLink")}
                icon={<CalendarOutlined aria-hidden="true" />}
                href={localFile("reports/")}
              >
                {t("reportsLink")}
              </Button>
            </Tooltip>
            <Tooltip title={t("subscribeTitle")}>
              <Button
                href={localFile("feed.xml")}
                aria-label={t("subscribeTitle")}
              >
                RSS
              </Button>
            </Tooltip>
            <Tooltip title={state.lang === "zh" ? "切换主题" : "Toggle theme"}>
              <Button
                aria-label="Toggle theme"
                data-testid="theme-toggle"
                icon={<BulbOutlined aria-hidden="true" />}
                onClick={() =>
                  update((s) => ({
                    ...s,
                    theme: s.theme === "light" ? "dark" : "light",
                  }))
                }
              >
                {t("themeLabel")}
              </Button>
            </Tooltip>
            <Button
              icon={<GithubOutlined aria-hidden="true" />}
              href={REPOSITORY_URL}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </Button>
          </Space>
          <RechargeAd t={t} />
        </Reveal>
        <section className="hero container">
          <div className="hero-copy">
            <Reveal as="h1" kind="hero" tabIndex={-1}>
              {state.lang === "zh" ? (
                <>
                  论文科研 Skills <em>排行榜</em>
                </>
              ) : (
                <>
                  Paper Research <em>Skills</em>
                </>
              )}
            </Reveal>
            <Reveal as="p" kind="hero" order={1} className="hero-subtitle">
              {t("heroSubtitle")}
            </Reveal>
          </div>
          <div className="page-tabs" role="tablist" aria-label={t("pageViews")}>
            {["ranking", "insights"].map((section) => (
              <Button
                key={section}
                role="tab"
                id={`tab-${section}`}
                aria-selected={state.section === section}
                aria-controls={`panel-${section}`}
                tabIndex={state.section === section ? 0 : -1}
                onKeyDown={(event) => {
                  if (
                    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      event.key,
                    )
                  ) {
                    event.preventDefault();
                    const next =
                      event.key === "Home"
                        ? "ranking"
                        : event.key === "End"
                          ? "insights"
                          : section === "ranking"
                            ? "insights"
                            : "ranking";
                    update((s) => ({ ...s, section: next }));
                    document.getElementById(`tab-${next}`)?.focus();
                  }
                }}
                onClick={() => update((s) => ({ ...s, section }))}
              >
                {t(section === "ranking" ? "tableTitle" : "insightsTitle")}
              </Button>
            ))}
          </div>
          <SearchBox
            inactive={stickySearchVisible}
            inputRef={search}
            state={state}
            update={update}
            items={visible}
            taskOptions={RESEARCH_TASKS.map((task) => ({
              id: task.id,
              label: t(taskLabels[task.id]),
            }))}
            t={t}
          />
        </section>
      </header>
      <main
        id="main"
        className="container"
        tabIndex={-1}
        style={{
          "--ranking-filter-height": `${filterHeight + (stickySearchVisible ? 48 : 0)}px`,
        }}
      >
        <section
          ref={filterRef}
          className="filters"
          aria-label="Ranking controls"
        >
          <div className="sticky-search-slot">
            <SearchBox
              inactive={!stickySearchVisible}
              inputRef={stickySearch}
              state={state}
              update={update}
              items={visible}
              taskOptions={RESEARCH_TASKS.map((task) => ({
                id: task.id,
                label: t(taskLabels[task.id]),
              }))}
              t={t}
              onBlur={syncStickySearch}
              inputId="stickySearchInput"
              compact
            />
          </div>{" "}
          <section className="task-navigation" aria-labelledby="taskHeading">
            <h2 id="taskHeading" className="sr-only">
              {t("taskHeading")}
            </h2>
            <span className="sr-only" id="taskCountHint">
              {t("taskCountHint")}
            </span>
            <div className="task-list" title={t("taskCountHint")}>
              <Button
                type="default"
                data-task="all"
                aria-label={t("taskAll")}
                aria-pressed={state.task === "all"}
                aria-description={`${taskCounts.all} ${t("repos")}`}
                onClick={() =>
                  update((previous) => ({
                    ...previous,
                    task: "all",
                    category: "all",
                  }))
                }
              >
                {state.lang === "zh" ? "全部" : "All"}{" "}
                <span className="task-count" aria-hidden="true">
                  {taskCounts.all}
                </span>
              </Button>
              {RESEARCH_TASKS.map((task) => (
                <Button
                  key={task.id}
                  type="default"
                  data-task={task.id}
                  aria-label={t(taskLabels[task.id])}
                  aria-description={`${taskCounts[task.id]} ${t("repos")}`}
                  disabled={taskCounts[task.id] === 0 && state.task !== task.id}
                  aria-pressed={state.task === task.id}
                  onClick={() =>
                    update((s) => ({
                      ...s,
                      task: task.id,
                      category: "all",
                    }))
                  }
                >
                  {t(taskLabels[task.id])}{" "}
                  <span className="task-count" aria-hidden="true">
                    {taskCounts[task.id]}
                  </span>
                </Button>
              ))}
            </div>
            <p className="task-count-note sr-only">{t("taskCountNote")}</p>
          </section>
          <div className="filter-fields">
            <label htmlFor="agentFilter">
              <span>{t("agentLabel")}</span>
              <Select
                id="agentFilter"
                value={state.agent}
                onChange={(agent) => update((s) => ({ ...s, agent }))}
                options={[
                  { value: "all", label: t("allAgents") },
                  ...AGENT_PLATFORMS.filter((a) => platformIds.has(a.id)).map(
                    (a) => ({ value: a.id, label: a.label }),
                  ),
                ]}
              />
            </label>
            <label htmlFor="sortSelect">
              <span>{t("sortLabel")}</span>
              <Select
                id="sortSelect"
                value={state.sort}
                onChange={(sort) => update((s) => ({ ...s, sort }))}
                options={["rank", "trend", "stars", "updated", "delta30"].map(
                  (value, i) => ({
                    value,
                    label:
                      value === "rank"
                        ? "Stars"
                        : t(
                            [
                              "sortRank",
                              "sortTrend",
                              "sortStars",
                              "sortUpdated",
                              "sortDelta30",
                            ][i],
                          ),
                  }),
                )}
              />
            </label>
            <div className="view-controls">
              <Segmented
                aria-label="View"
                value={state.view}
                onChange={(view) => update((s) => ({ ...s, view }))}
                options={[
                  {
                    value: "table",
                    icon: <BarsOutlined aria-hidden="true" />,
                    label: <span className="sr-only">{t("viewTable")}</span>,
                  },
                  {
                    value: "card",
                    icon: <AppstoreOutlined aria-hidden="true" />,
                    label: <span className="sr-only">{t("viewCard")}</span>,
                  },
                ]}
              />
              <Button
                aria-label={t("favoritesOnly")}
                data-testid="favorites-only"
                icon={
                  state.favOnly ? (
                    <StarFilled aria-hidden="true" />
                  ) : (
                    <StarOutlined aria-hidden="true" />
                  )
                }
                type={state.favOnly ? "primary" : "default"}
                aria-pressed={state.favOnly}
                onClick={() => update((s) => ({ ...s, favOnly: !s.favOnly }))}
              >
                <span className="favorite-filter-label">
                  {t("favoritesOnly")}
                </span>{" "}
                <Tag variant="borderless">{state.favorites.length}</Tag>
              </Button>
            </div>
          </div>
        </section>

        <ActiveFilters
          {...{ state, update, categories, t }}
          empty={!visible.length}
        />
        <div
          id="panel-ranking"
          role="tabpanel"
          aria-labelledby="tab-ranking"
          hidden={state.section !== "ranking"}
        >
          <Panel
            id="rankings"
            tabIndex={-1}
            className="ranking-section"
            bodyStyle={{ padding: 0 }}
          >
            <div className="ranking-header">
              <div>
                <h2>
                  {t("tableTitle")}{" "}
                  {visible.length !== scopeItems.length && (
                    <Tag>{fmt(visible.length)}</Tag>
                  )}
                </h2>
                <div className="ranking-status-line">
                  <span>
                    {t(
                      {
                        rank: "rankByStars",
                        stars: "rankByStars",
                        trend: "sortTrend",
                        updated: "sortUpdated",
                        delta30: "sortDelta30",
                      }[state.sort],
                    )}
                  </span>
                  <span aria-hidden="true">·</span>
                  <UpdateStatus
                    generatedAt={dataset.metadata?.generated_at}
                    collection={dataset.metadata?.collection}
                    lang={state.lang}
                    t={t}
                    compact
                  />
                  <Button
                    type="link"
                    onClick={() => setOverviewOpen((value) => !value)}
                    aria-expanded={overviewOpen}
                    aria-controls="data-overview"
                  >
                    {t("dataOverview")} {overviewOpen ? "⌃" : "⌄"}
                  </Button>
                </div>
                <section
                  id="data-overview"
                  hidden={!overviewOpen}
                  className="statistics compact-statistics"
                  aria-label="Aggregate statistics"
                >
                  <span>
                    {t("repos")} <strong>{fmt(scopeItems.length)}</strong>
                  </span>
                  <Tooltip title={t("newWeekHelp")}>
                    <button
                      type="button"
                      data-testid="new-this-week"
                      aria-pressed={state.newOnly}
                      onClick={() =>
                        update((s) => ({ ...s, newOnly: !s.newOnly }))
                      }
                    >
                      {t("statNewWeek")} <strong>{fmt(newcomers)}</strong>
                    </button>
                  </Tooltip>
                  <span>
                    {t("statNet7d")}{" "}
                    <strong>
                      {net7 > 0 ? "+" : ""}
                      {fmt(net7)}
                    </strong>
                  </span>
                  <span>
                    {t("statRecentPush")}{" "}
                    <strong>
                      {fmt(recentCount)} / {fmt(scopeItems.length)}
                    </strong>
                  </span>
                  <a
                    href={localFile("docs/methodology.md")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("methodTitle")}
                  </a>
                </section>
              </div>
              <Space wrap size={8}>
                <label className="related-scope-control">
                  <ScopeSwitch
                    size="small"
                    data-testid="include-related"
                    checked={state.includeRelated}
                    aria-label={t("includeRelated")}
                    onChange={(includeRelated) =>
                      update((s) => ({
                        ...s,
                        includeRelated,
                        todayOnly:
                          !includeRelated && s.todayOnly === "related"
                            ? ""
                            : s.todayOnly,
                      }))
                    }
                  />
                  <span>
                    {t("includeRelated")} {relatedCount}
                  </span>
                </label>
                {editorialPicks(visible).length > 0 && (
                  <Button type="link" href="#beginner-paths">
                    {t("editorialTitle")}
                  </Button>
                )}
                <details className="export-menu">
                  <summary>{t("exportMenu")} ⌄</summary>
                  <div
                    className="export-options"
                    role="group"
                    aria-label={t("exportMenu")}
                  >
                    <button
                      type="button"
                      disabled={!state.favorites.length}
                      onClick={exportFavorites}
                    >
                      {t("exportFav")}
                    </button>
                    <a
                      download="rankings.json"
                      href={localFile("data/rankings.json")}
                    >
                      {t("downloadJson")}
                    </a>
                    <a
                      download="rankings.csv"
                      href={localFile("data/rankings.csv")}
                    >
                      {t("downloadCsv")}
                    </a>
                  </div>
                </details>
              </Space>
            </div>
            <DailyArrivals {...{ items, state, update, t }} />
            <RepositoryViews
              {...{
                items: visible,
                filterHeight: filterHeight + (stickySearchVisible ? 48 : 0),
                state,
                update,
                toggleCompare,
                t,
                fmt,
                history: historyData,
              }}
            />
          </Panel>
          <div id="beginner-paths">
            <EditorialPicks items={visible} state={state} t={t} />
          </div>
        </div>
        <div
          id="panel-insights"
          role="tabpanel"
          aria-labelledby="tab-insights"
          hidden={state.section !== "insights"}
        >
          {state.section === "insights" && (
            <>
              <label className="related-scope-control insights-scope-control">
                <ScopeSwitch
                  size="small"
                  checked={state.includeRelated}
                  aria-label={t("includeRelated")}
                  onChange={(includeRelated) =>
                    update((s) => ({
                      ...s,
                      includeRelated,
                      todayOnly:
                        !includeRelated && s.todayOnly === "related"
                          ? ""
                          : s.todayOnly,
                    }))
                  }
                />
                {t("includeRelated")} {relatedCount}
              </label>
              <ViewportInsights
                  items={visible}
                allItems={scopeItems}
                history={historyData}
                generatedAt={dataset.metadata?.generated_at}
                state={state}
                update={update}
                t={t}
              />
            </>
          )}
        </div>
        <DataTransparency t={t} base={base} />
      </main>
      <Reveal as="footer" className="site-footer container">
        <span>
          MIT ·{" "}
          <a href={REPOSITORY_URL}>RiceAI88/awesome-paper-research-skills</a> ·{" "}
          {state.lang === "zh" ? "基于" : "Based on"}{" "}
          <a href="https://github.com/kael-odin/awesome-academic-research-skills">
            kael-odin
          </a>
        </span>
        <span className="keyboard-hint">{t("shortcuts")}</span>
        <VisitCounter t={t} lang={state.lang} />
      </Reveal>
      {(selected || drawerRequested) && (
        <DeferredFeature t={t}>
          <RepositoryDrawer
            {...{
              item: selected,
              items: visible,
              state,
              update,
              toggleCompare,
              t,
              fmt,
            }}
          />
        </DeferredFeature>
      )}
      {state.compare.length > 0 && (
        <div className="compare-tray" data-testid="compare-tray">
          <strong>
            {t("compareTray")} ({state.compare.length}/3)
          </strong>
          <div className="compare-names">
            {state.compare.map((repo) => (
              <Tag key={repo} closable onClose={() => toggleCompare(repo)}>
                {repo.split("/").pop()}
              </Tag>
            ))}
          </div>
          <Tooltip title={t("compareTitle")}>
            <Button
              data-testid="open-compare"
              icon={<SwapOutlined aria-hidden="true" />}
              onClick={() => setCompareOpen(true)}
            />
          </Tooltip>
          <Tooltip title={t("compareClear")}>
            <Button
              data-testid="clear-compare"
              icon={<CloseOutlined aria-hidden="true" />}
              onClick={() => update((s) => ({ ...s, compare: [] }))}
            />
          </Tooltip>
        </div>
      )}
      <BackToTop
        label={t("backToTop")}
        comparisonOpen={state.compare.length > 0}
      />
      {(compareOpen || comparisonRequested) && (
        <DeferredFeature t={t}>
          <ComparisonDialog
            open={compareOpen}
            onClose={() => setCompareOpen(false)}
            repos={state.compare}
            items={items}
            lang={state.lang}
            history={historyData}
            t={t}
          />
        </DeferredFeature>
      )}
    </div>
  );
}
