import React from "react";
import { Modal, Tag, Tooltip } from "antd";
import { ComparisonChart } from "./TrendCharts";
import { PlatformTags, InstallationActions } from "./PracticalInfo";
import { EditorialReviewNotice } from "./EditorialReviewNotice";
import {
  RESEARCH_TASKS,
  matchesResearchTask,
  safeExternalUrl,
} from "../domain";
import { installationFor } from "../practical";
import installationDetails from "../../config/installation-details.json";
const labels = {
  find: "taskFind",
  read: "taskRead",
  write: "taskWrite",
  figures: "taskFigures",
  reproduce: "taskReproduce",
  review: "taskReview",
};
export default function ComparisonDialog({
  open,
  onClose,
  repos,
  items = [],
  lang = "zh",
  history,
  t,
}) {
  const selected = repos
    .map((repo) => items.find((item) => item.repo === repo))
    .filter(Boolean);
  const rows = [
    [
      "compareTasks",
      (item) => {
        const tasks = RESEARCH_TASKS.filter((task) =>
          matchesResearchTask(item, task),
        );
        return tasks.length
          ? tasks.map((task) => <Tag key={task.id}>{t(labels[task.id])}</Tag>)
          : t("compareUnknown");
      },
    ],
    ["agentLabel", (item) => <PlatformTags item={item} t={t} />],
    [
      "installation",
      (item) => (
        <>
          <InstallationActions item={item} lang={lang} t={t} />
          <EditorialReviewNotice repo={item.repo} t={t} lang={lang} />
        </>
      ),
    ],
    [
      "installEnvironment",
      (item) =>
        installationDetails[item.repo]?.[`environment_${lang}`] ||
        t("compareUnknown"),
    ],
    [
      "installDependencies",
      (item) =>
        installationDetails[item.repo]?.[`dependencies_${lang}`] ||
        t("compareUnknown"),
    ],
    [
      "compareMaintenance",
      (item) => (
        <>
          <Tooltip title={t("staleReason")}>
            <Tag color={item.stale ? "red" : undefined}>
              {item.stale
                ? t("staleTag")
                : item.last_push_date
                  ? t("compareNotFlagged")
                  : t("compareUnknown")}
            </Tag>
          </Tooltip>
          <div className="muted">
            {t("compareLastPush")}: {item.last_push_date || "—"}
          </div>
        </>
      ),
    ],
    [
      "docsChecked",
      (item) => {
        const install = installationFor(item),
          commit = installationDetails[item.repo]?.source_commit;
        return install.reviewed_at ? (
          <>
            {install.reviewed_at}
            {/^[a-f0-9]{40}$/.test(commit || "") && (
              <div>
                <a
                  href={install.source_url.replace(
                    /\/blob\/[^/]+\//,
                    `/blob/${commit}/`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("installSnapshot")} ↗
                </a>
              </div>
            )}
          </>
        ) : (
          t("compareUnknown")
        );
      },
    ],
  ];
  return (
    <Modal
      title={t("compareTitle")}
      open={open}
      onCancel={onClose}
      footer={null}
      width={1080}
    >
      <p className="muted">{t("compareTasksHint")}</p>
      <div
        className="comparison-scroll"
        tabIndex={0}
        role="region"
        aria-label={t("compareTitle")}
      >
        <table
          className="comparison-matrix"
          style={{ minWidth: 150 + selected.length * 250 }}
        >
          <thead>
            <tr>
              <th scope="col">{t("compareTitle")}</th>
              {selected.map((item) => (
                <th scope="col" key={item.repo}>
                  <a
                    href={
                      safeExternalUrl(item.url) ||
                      `https://github.com/${item.repo}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.repo} ↗
                  </a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([key, render]) => (
              <tr key={key} data-compare-field={key}>
                <th scope="row">{t(key)}</th>
                {selected.map((item) => (
                  <td key={item.repo}>{render(item)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>{t("compareGrowth")}</h3>
      <p className="muted">{t("compareHint")}</p>
      <ComparisonChart repos={repos} history={history} t={t} />
    </Modal>
  );
}
