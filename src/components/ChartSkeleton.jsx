import React from "react";

export function ChartSkeleton({ height = 280, label }) {
  return (
    <div className="chart-skeleton" style={{ height }} role="status" aria-label={label}>
      <div className="chart-skeleton-bars" aria-hidden="true">
        {[82, 66, 54, 43, 31].map((width) => (
          <div className="chart-skeleton-row" key={width}>
            <span className="chart-skeleton-label" />
            <span className="chart-skeleton-bar" style={{ width: `${width}%` }} />
          </div>
        ))}
      </div>
      <span className="chart-skeleton-caption">{label}</span>
    </div>
  );
}
