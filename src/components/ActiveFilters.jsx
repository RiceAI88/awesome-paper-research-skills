import React from "react";
import { Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { AGENT_PLATFORMS } from "../domain";
const taskKeys = {
  find: "taskFind",
  read: "taskRead",
  write: "taskWrite",
  figures: "taskFigures",
  reproduce: "taskReproduce",
  review: "taskReview",
};
const resets = {
  query: "",
  task: "all",
  category: "all",
  agent: "all",
  favOnly: false,
  newOnly: false,
  todayOnly: "",
};
export function ActiveFilters({ state, update, t, empty }) {
  const conditions = [];
  if (state.query.trim())
    conditions.push(["query", t("filterSearch") + state.query.trim()]);
  if (state.task !== "all") conditions.push(["task", t(taskKeys[state.task])]);
  if (state.agent !== "all")
    conditions.push([
      "agent",
      AGENT_PLATFORMS.find((a) => a.id === state.agent)?.label || state.agent,
    ]);
  if (state.todayOnly)
    conditions.push([
      "todayOnly",
      t(state.todayOnly === "skill" ? "dailySkills" : "dailyRelated"),
    ]);
  if (state.newOnly) conditions.push(["newOnly", t("statNewWeek")]);
  if (state.favOnly) conditions.push(["favOnly", t("favoritesOnly")]);
  // Keep a reset for week filters and insight-only day filters whose source control is hidden.
  const needsReset =
    state.newOnly || (state.section === "insights" && state.todayOnly);
  if (!conditions.length || (conditions.length === 1 && !empty && !needsReset))
    return null;
  return (
    <section
      className="active-filters"
      data-testid="active-filters"
      aria-label={t("activeFilters")}
    >
      <div className="active-filter-list">
        <span className="muted">{t("activeFilters")}</span>
        {conditions.map(([key, label]) => (
          <Button
            key={key}
            size="small"
            className="active-filter-chip"
            data-filter-key={key}
            aria-label={t("removeFilter") + label}
            onClick={() => update((s) => ({ ...s, [key]: resets[key] }))}
          >
            <span className="active-filter-label">{label}</span>
            <CloseOutlined aria-hidden="true" />
          </Button>
        ))}
        <Button
          size="small"
          type="link"
          onClick={() => update((s) => ({ ...s, ...resets }))}
        >
          {t("clearFilters")}
        </Button>
      </div>
      {empty && <p className="muted">{t("relaxFilters")}</p>}
    </section>
  );
}
