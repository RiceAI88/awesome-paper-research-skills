import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  App as AntApp,
  Button,
  Card,
  ConfigProvider,
  Input,
  Modal,
  Segmented,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
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
  DownloadOutlined,
  GithubOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import {
  AGENT_PLATFORMS,
  detectAgents,
  filterItems,
  FONT_FAMILY,
  persistState,
  REPOSITORY_URL,
  RESEARCH_TASKS,
  restoreState,
  serializeState,
} from "./domain";
import { translations } from "./i18n";
import { enrichItem } from "./practical";
import { EditorialPicks } from "./components/EditorialPicks";
import { UpdateStatus } from "./components/UpdateStatus";
import { DataTransparency } from "./components/DataTransparency";
import { RepositoryViews } from "./components/RepositoryViews";
import { RepositoryDrawer } from "./components/RepositoryDrawer";
import { AnimatedStatistic } from "./components/AnimatedStatistic";
import { ViewportInsights } from "./components/ViewportInsights";
import { ComparisonChart } from "./components/TrendCharts";

const dataset = window.ACADEMIC_SKILLS_RANKINGS || {};
const items = Array.isArray(dataset.items)
  ? dataset.items.map((item) => enrichItem(item))
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
  view: matchMedia("(max-width: 760px)").matches ? "card" : "table",
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
export default function App() {
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
          colorPrimary: state.theme === "dark" ? "#D4A4B9" : "#866178",
          colorLink: state.theme === "dark" ? "#D4A4B9" : "#866178",
          colorLinkHover: state.theme === "dark" ? "#E5C2D2" : "#6C4B60",
          colorLinkActive: state.theme === "dark" ? "#D4A4B9" : "#6C4B60",
          fontFamily: FONT_FAMILY,
          colorBgContainer: state.theme === "dark" ? "#201C1F" : "#FEFDFC",
          borderRadius: 4,
          colorBgLayout: state.theme === "dark" ? "#181517" : "#FEFDFC",
        },
        components: {
          Table: { headerBg: state.theme === "dark" ? "#241F23" : "#FEFDFC" },
        },
      }}
    >
      <AntApp>
        <Dashboard {...{ state, update }} />
      </AntApp>
    </ConfigProvider>
  );
}
function Dashboard({ state, update }) {
  const { message } = AntApp.useApp();
  const [compareOpen, setCompareOpen] = useState(false);
  const search = useRef(null);
  const t = (key) => translations[state.lang][key] || key;
  const fmt = (value) =>
    new Intl.NumberFormat(state.lang === "zh" ? "zh-CN" : "en-US").format(
      value || 0,
    );
  const visible = useMemo(() => filterItems(items, state), [state]);
  const selected = items.find((item) => item.repo === state.repo);
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
  const totalStars = items.reduce((sum, i) => sum + (i.stars || 0), 0),
    net7 = items.reduce((sum, i) => sum + (i.star_delta_7d || 0), 0);
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
        search.current?.focus();
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
  }, [compareOpen, state.repo, update]);
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
  const statistics = [
    [t("repos"), items.length],
    [t("statTotalStars"), totalStars],
    [t("statNet7d"), net7],
    [t("statCats"), categories.length],
  ];
  return (
    <div className="prs-page">
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
        <nav className="site-nav container" aria-label="Primary">
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
              />
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
              />
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
        </nav>
        <section className="hero container">
          <div className="hero-copy">
            <h1>
              {state.lang === "zh" ? (
                <>
                  论文科研 Skills <em>排行榜</em>
                </>
              ) : (
                <>
                  Paper Research <em>Skills</em>
                </>
              )}
            </h1>
            <p className="hero-subtitle">{t("heroSubtitle")}</p>
            <div className="masthead">
              <UpdateStatus
                generatedAt={dataset.metadata?.generated_at}
                lang={state.lang}
                t={t}
              />
            </div>
            <div className="discovery-controls">
              <label className="hero-search" htmlFor="searchInput">
                <span>{t("searchLabel")}</span>
                <Input
                  ref={search}
                  id="searchInput"
                  type="search"
                  size="large"
                  allowClear
                  prefix={<SearchOutlined aria-hidden="true" />}
                  placeholder={t("searchPlaceholder")}
                  value={state.query}
                  onChange={(e) =>
                    update((s) => ({ ...s, query: e.target.value }))
                  }
                />
              </label>
              <section
                className="task-navigation"
                aria-labelledby="taskHeading"
              >
                <div className="task-heading">
                  <h2 id="taskHeading">{t("taskHeading")}</h2>
                  <Button
                    type="link"
                    size="small"
                    aria-pressed={state.task === "all"}
                    onClick={() =>
                      update((s) => ({ ...s, task: "all", category: "all" }))
                    }
                  >
                    {t("taskAll")}
                  </Button>
                </div>
                <div className="task-list">
                  {RESEARCH_TASKS.map((task) => (
                    <Button
                      key={task.id}
                      type="text"
                      aria-pressed={state.task === task.id}
                      onClick={() =>
                        update((s) => ({
                          ...s,
                          task: task.id,
                          category: "all",
                        }))
                      }
                    >
                      {t(taskLabels[task.id])}
                    </Button>
                  ))}
                </div>
              </section>
            </div>
            <p className="hero-hint">
              {state.lang === "zh"
                ? "按 / 搜索 · t 主题 · l 语言 · v 视图"
                : "Press / to search · t theme · l language · v view"}
            </p>
          </div>
        </section>
        <section
          className="statistics container"
          aria-label="Aggregate statistics"
        >
          {statistics.map(([title, value], i) => (
            <Card
              key={i}
              size="small"
              className={i === 2 ? "growth-statistic" : ""}
            >
              <AnimatedStatistic
                title={title}
                value={value}
                prefix={i === 2 && value > 0 ? "+" : undefined}
                lang={state.lang}
              />
            </Card>
          ))}
        </section>
      </header>
      <main id="main" className="container" tabIndex={-1}>
        <section className="filters" aria-label="Ranking controls">
          <label htmlFor="categoryFilter">
            <span>{t("categoryLabel")}</span>
            <Select
              id="categoryFilter"
              value={state.category}
              onChange={(category) => update((s) => ({ ...s, category }))}
              options={[
                { value: "all", label: t("allCategories") },
                ...categories.map((c) => ({
                  value: c.id,
                  label: c[state.lang],
                })),
              ]}
            />
          </label>
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
                  label: t(
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
            {t("favoritesOnly")}{" "}
            <Tag variant="borderless">{state.favorites.length}</Tag>
          </Button>
        </section>
        <ViewportInsights
          items={visible}
          allItems={items}
          history={historyData}
          generatedAt={dataset.metadata?.generated_at}
          state={state}
          update={update}
          t={t}
        />
        <EditorialPicks items={visible} state={state} t={t} />
        <Card className="ranking-section" styles={{ body: { padding: 0 } }}>
          <div className="ranking-header">
            <div>
              <h2>
                {t("tableTitle")} <Tag>{fmt(visible.length)}</Tag>
              </h2>
              <p>{t("tableHint")}</p>
            </div>
            <Space wrap size={8}>
              <Button
                icon={<DownloadOutlined aria-hidden="true" />}
                onClick={exportFavorites}
              >
                {t("exportFav")}
              </Button>
              <Button href={localFile("data/rankings.json")}>
                {t("downloadJson")}
              </Button>
              <Button href={localFile("data/rankings.csv")}>
                {t("downloadCsv")}
              </Button>
            </Space>
          </div>
          <RepositoryViews
            {...{
              items: visible,
              state,
              update,
              toggleCompare,
              t,
              fmt,
              history: historyData,
            }}
          />
        </Card>
        <DataTransparency t={t} base={base} />
      </main>
      <footer className="site-footer container">
        <span>
          MIT ·{" "}
          <a href={REPOSITORY_URL}>RiceAI88/awesome-paper-research-skills</a> ·{" "}
          {state.lang === "zh" ? "基于" : "Based on"}{" "}
          <a href="https://github.com/kael-odin/awesome-academic-research-skills">
            kael-odin
          </a>
        </span>
        <span>{t("shortcuts")}</span>
      </footer>
      <RepositoryDrawer {...{ item: selected, state, update, t, fmt }} />
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
      <Modal
        title={t("compareTitle")}
        open={compareOpen}
        onCancel={() => setCompareOpen(false)}
        footer={null}
        width={720}
      >
        <p className="muted">{t("compareHint")}</p>
        <ComparisonChart repos={state.compare} history={historyData} t={t} />
      </Modal>
    </div>
  );
}
