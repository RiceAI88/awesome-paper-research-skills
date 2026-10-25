import React from "react";
import { Modal } from "antd";
import { ComparisonChart } from "./TrendCharts";
export default function ComparisonDialog({ open, onClose, repos, history, t }) {
  return (
    <Modal
      title={t("compareTitle")}
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
    >
      <p className="muted">{t("compareHint")}</p>
      <ComparisonChart repos={repos} history={history} t={t} />
    </Modal>
  );
}
