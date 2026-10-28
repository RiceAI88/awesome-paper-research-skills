import React, { useEffect, useState } from "react";
import { Tooltip } from "antd";
import { classifyUpdateRun, UPDATE_RUNS_URL } from "../practical";
import { exactTimestamp, relativeTimestamp } from "../time";
export function UpdateStatus({
  generatedAt,
  collection,
  lang,
  t,
  compact = false,
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
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
  const partial = collection?.status === "partial";
  const precision = exactTimestamp(generatedAt, lang);
  return (
    <span className="update-status" data-testid="update-status">
      <Tooltip
        title={
          <span>
            {precision} · {t(labels[status.kind])}
            {partial && ` · ${t("collectionPartialHelp")}`}
            {status.checkedAt &&
              ` · ${t("statusChecked")} ${exactTimestamp(status.checkedAt, lang)}`}
            {status.url && (
              <>
                {" "}
                ·{" "}
                <a href={status.url} target="_blank" rel="noreferrer">
                  {t("viewRun")}
                </a>
              </>
            )}
          </span>
        }
      >
        <span className="update-status-summary" tabIndex={0}>
          <i
            className={`status-dot status-${partial ? "unknown" : status.kind}`}
            data-status={status.kind}
            aria-hidden="true"
          />
          <time dateTime={generatedAt} title={precision}>
            {t("dataUpdated")} {relativeTimestamp(generatedAt, lang, now)}
          </time>
          {partial && !compact && <span> · {t("collectionPartial")}</span>}
          <span className="sr-only">{t(labels[status.kind])}</span>
        </span>
      </Tooltip>
    </span>
  );
}
