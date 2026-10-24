# Warm Data Observatory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver the approved warm dashboard and four real-data charts, with red suspected-stale tags.
**Architecture:** Pure chart data helpers feed a lazy-loaded Ant Design Plots dashboard. Existing domain filtering/state and detail drawer remain the single interaction model. CSS/theme tokens implement the approved visual treatment.
**Tech Stack:** React, Vite, Ant Design, @ant-design/plots, Node tests, Playwright.
**Spec:** docs/superpowers/specs/2026-10-24-warm-data-observatory-design.md

## Global constraints
- Preserve original descriptions, ranking algorithm, local storage/hash behavior, existing editorial content and attribution.
- Use actual dated snapshots and stable repo/category color keys. No synthetic points or plots claiming scientific quality.
- Warm muted palette; suspected stale is a red Tag in table/card/drawer.

## Review focus
- Missing, invalid or differently spaced histories must not produce invented points or crashes.
- Stars at zero/negative cannot enter a logarithmic scale; growth zero/negative must remain visible.
- Empty filters and single-point series must have clear useful states.
- Charts must be responsive, keyboard-accessible through companion controls, support dark mode and not break ranking if chart rendering fails.
- Data-window selection must not misrepresent fixed seven-day growth or upstream history source.

## Tasks
- [x] Pure chart helpers: RED tests for category totals, growth ordering, stable colors, exact dated windowed history, negative growth and empty data; implement and verify.
- [x] Install pinned Plots dependency; implement lazy chart/error-boundary module, four visualizations, history window, accessible legends/links and existing state actions. Test real render, filtering/window, chart interaction and empty history.
- [x] Apply approved editorial warm styling, compact hero/statistics, unboxed editorial/ranking layout and matching favicon. Set stale badges red. Verify all existing browser flows and mobile/dark views.
- [x] Run build, Node/Python/browser checks and fresh whole-change review.

Release procedure: commit and fast-forward main, wait for CI/Pages and verify production with the browser suite.

## Execution evidence

- 17 Node tests and 34 Python tests pass. 22 browser tests pass, including red suspected-stale tags in table/cards/drawer, mobile resizing, filtering, missing history and chart bundle failure.
- Final review found an invisible scatter-mark issue. Root cause: the default hollow-point shape plus background-colored stroke hid the data. Regression test failed on invisible marks; explicitly filled category-colored points fixed it, and the test now checks colored canvas pixels and clicks a real point to open details. Full suite passes after the fix. Temporary chart inspection code removed.
- Desktop/mobile/light/dark inspected. Warm palette accepted by the user; statistics and charts use real values, with exact history date range shown.
