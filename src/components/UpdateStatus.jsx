import React, { useEffect, useState } from "react";
import { Tag, Tooltip } from "antd";
import { classifyUpdateRun, UPDATE_RUNS_URL } from "../practical";
function timestamp(value, lang) {
  const time = new Date(value);
  return Number.isNaN(time.getTime())
    ? "—"
    : new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-GB", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(time);
}
export function UpdateStatus({ generatedAt, lang, t }) {
  const [status, setStatus] = useState({ kind: "checking" });
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), 8000);
    fetch(UPDATE_RUNS_URL, {
      signal: controller.signal,
      credentials: "omit",
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((response) => {
        if (!response.ok) throw Error("Status unavailable");
        return response.json();
      })
      .then((data) => {
        if (active)
          setStatus({
            ...classifyUpdateRun(data.workflow_runs?.[0], generatedAt),
            checkedAt: new Date().toISOString(),
          });
      })
      .catch(() => {
        if (active)
          setStatus({ kind: "unknown", checkedAt: new Date().toISOString() });
      })
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [generatedAt]);
  const labels = {
    checking: "updateChecking",
    success: "updateSuccess",
    failure: "updateFailure",
    running: "updateRunning",
    publishing: "updatePublishing",
    unknown: "updateUnknown",
  };
  const colors = {
    checking: "processing",
    success: "success",
    failure: "error",
    running: "processing",
    publishing: "warning",
  };
  return (
    <span className="update-status" data-testid="update-status">
      <span>
        {t("dataUpdated")}{" "}
        <time dateTime={generatedAt}>{timestamp(generatedAt, lang)}</time> UTC+8
      </span>
      <Tooltip
        title={
          status.checkedAt
            ? `${t("statusChecked")} ${timestamp(status.checkedAt, lang)} UTC+8 · ${t("statusPublicApi")}`
            : t("statusPublicApi")
        }
      >
        <Tag color={colors[status.kind]} data-status={status.kind}>
          {t(labels[status.kind])}
        </Tag>
      </Tooltip>
      {status.url && (
        <a href={status.url} target="_blank" rel="noreferrer">
          {t("viewRun")}
        </a>
      )}
      {status.checkedAt && (
        <small>
          {t("statusChecked")} {timestamp(status.checkedAt, lang)} UTC+8
        </small>
      )}
    </span>
  );
}
