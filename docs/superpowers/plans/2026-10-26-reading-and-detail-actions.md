# Reading and detail actions implementation plan

**Goal:** Deliver the three UX improvements approved in chat, with readable typography and no extra dependencies.

**Architecture:** Keep the Ant Design table and drawer. Pin the table action column, reuse repository actions in the drawer, and reuse the original-description component in cards. Preserve descriptions verbatim and existing favorites/comparison state and limits.

**Tech Stack:** React, Ant Design, CSS, Playwright.

- [x] Add regression coverage for visible fixed table actions, drawer favorites/comparison synchronization, original card descriptions, and readable type at desktop/mobile widths. Observe failures.
- [x] Pin and label table actions; narrow the installation column and update the table scroll width consistently.
- [x] Reuse repository actions in the drawer footer; replace the redundant inclusion link with a repository-specific issue feedback link. Verify changes persist after closing/navigating and the three-item comparison limit still applies.
- [x] Restore up to two lines of original card description, reserving equal height within each row. Main text 14px, supporting text 13px, metadata/tags at least 12px. Preserve centered titles and pill contents.
- [x] Build, run browser tests, inspect desktop/mobile and dark/English layouts, check no horizontal page overflow and the first card remains accessible. Review the diff independently before integration.
- [ ] Commit, fast-forward main and publish using existing session authorization; verify deployment and live targeted checks.

## Execution record

- Approved scope: first three recommendations from the 2026-10-26 UX review and readability improvements. No changes to source data, descriptions, ranking, or charts.
- Font sizing is a scoped implementation choice: improve reading without scaling the whole page or adding a settings feature.
- RED: all six original regressions failed against the old build (hidden actions, missing descriptions and missing drawer actions).
- Ruling: retain Stars above descriptions in cards and trim mobile whitespace after enlarging type, preserving the existing first-screen metric visibility requirement.
- Ruling: the old row-center click test hit the copy-install button after column resizing; target the first cell instead to verify clicking a row background opens details. Buttons retain their independent actions.
- Validation: 37 unit tests and 102 browser tests passed. Desktop/mobile and dark/English screenshots checked. Independent review found no blocking issues. Table columns total 1180px and fit the 1180px desktop content area; narrower layouts retain fixed actions and horizontal scrolling.
- Final presentation refinement: table Stars and seven-day growth use separate readable lines; rerun the browser suite before publishing. Deployment and live verification are the final integration step.
