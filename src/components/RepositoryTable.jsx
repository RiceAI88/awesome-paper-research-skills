import React, { useEffect } from "react";
import { Table } from "antd";
export default function RepositoryTable({ onReady, ...props }) {
  useEffect(() => {
    onReady?.("table");
  }, [onReady]);
  return <Table {...props} />;
}
