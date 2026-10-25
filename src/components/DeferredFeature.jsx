import React, { Suspense } from "react";
import { Button } from "antd";
import { ChartBoundary } from "./ChartBoundary";
export function DeferredFeature({ children, t }) {
  return (
    <ChartBoundary
      fallback={
        <span data-testid="feature-unavailable">
          {t("featureUnavailable")}{" "}
          <Button size="small" onClick={() => window.location.reload()}>
            {t("reloadPage")}
          </Button>
        </span>
      }
    >
      <Suspense
        fallback={
          <p role="status" className="muted">
            {t("featureLoading")}
          </p>
        }
      >
        {children}
      </Suspense>
    </ChartBoundary>
  );
}
