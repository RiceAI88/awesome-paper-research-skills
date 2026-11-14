import React, { useMemo } from "react";
import { Button, Empty } from "antd";
import { filterItems, REPOSITORY_URL } from "../domain";
import { resets } from "./ActiveFilters";

const KEYWORDS = {
  zh: ["论文写作", "文献综述", "Zotero", "LaTeX", "科研绘图", "审稿"],
  en: ["paper writing", "literature review", "Zotero", "LaTeX", "figures", "peer review"],
};

const withoutFit = (s) => (s.sort === "fit" ? { sort: "rank" } : {});

// Empty result guidance: explains why nothing matched and offers one-click ways
// to widen the search, each labelled with the number of results it would yield.
export function EmptyResults({ items, state, update, t }) {
  const query = state.query.trim();
  const otherFilters = Object.keys(resets).some(
    (key) => key !== "query" && key !== "category" && state[key] !== resets[key],
  );
  const options = useMemo(() => {
    const count = (patch) => filterItems(items, { ...state, ...patch }).length;
    const list = [];
    if (!state.includeRelated) {
      const n = count({ includeRelated: true });
      if (n) list.push({ key: "related", label: t("emptyIncludeRelated"), n, patch: () => ({ includeRelated: true }) });
    }
    if (query && otherFilters) {
      const keep = count({ ...resets, query: state.query });
      if (keep) list.push({ key: "keep-query", label: t("emptyKeepQuery"), n: keep, patch: (s) => ({ ...resets, query: s.query, ...withoutFit(s) }) });
      const drop = count({ query: "" });
      if (drop) list.push({ key: "drop-query", label: t("emptyDropQuery"), n: drop, patch: () => ({ query: "" }) });
    }
    return list;
  }, [items, state, query, otherFilters, t]);
  const keywords = useMemo(() => {
    if (!query) return [];
    return (KEYWORDS[state.lang] || KEYWORDS.zh)
      .filter((word) => word.toLowerCase() !== query.toLowerCase())
      .map((word) => ({ word, n: filterItems(items, { ...state, query: word }).length }))
      .filter((entry) => entry.n > 0)
      .slice(0, 5);
  }, [items, state, query]);
  const title = query
    ? t("emptyQueryTitle").replace("{q}", query)
    : t("emptyFilterTitle");
  return (
    <div data-testid="ranking-empty" className="ranking-empty" role="status">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={<strong className="ranking-empty-title">{title}</strong>}
      />
      <p className="ranking-empty-hint">{t("emptyHint")}</p>
      <div className="ranking-empty-actions">
        {options.map((option) => (
          <Button
            key={option.key}
            data-empty-action={option.key}
            onClick={() => update((s) => ({ ...s, ...option.patch(s) }))}
          >
            {option.label}
            <span className="ranking-empty-count">{option.n}</span>
          </Button>
        ))}
        <Button
          type={options.length ? "default" : "primary"}
          data-empty-action="clear-all"
          onClick={() => update((s) => ({ ...s, ...resets, ...withoutFit(s) }))}
        >
          {t("emptyClearAll")}
        </Button>
      </div>
      {keywords.length > 0 && (
        <div className="ranking-empty-keywords">
          <span>{t("emptyTry")}</span>
          {keywords.map(({ word, n }) => (
            <Button
              key={word}
              size="small"
              type="text"
              data-empty-keyword={word}
              onClick={() => update((s) => ({ ...s, query: word }))}
            >
              {word}
              <span className="ranking-empty-count">{n}</span>
            </Button>
          ))}
        </div>
      )}
      <a
        className="ranking-empty-suggest"
        href={`${REPOSITORY_URL}/issues/new?template=recommend-repo.yml`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("emptySuggest")} ↗
      </a>
    </div>
  );
}
