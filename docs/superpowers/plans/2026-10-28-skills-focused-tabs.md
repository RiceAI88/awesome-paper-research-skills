# Skills-focused ranking and insights

**Goal:** Apply the user's supplied two-tab layout without changing collection or original descriptions.
**Architecture:** Keep the React/Ant Design/Motion stack, use one scope and scene state for ranking and SVG insights. Lazy-load insights only on its tab.

- [x] Scope: default to repository_kind=skill, URL-share includeRelated and section; rerank scoped results, use current totals rather than sample counts. Test refresh, related-only arrivals and favorites.
- [x] Controls: remove category dropdown, keep scene tabs visible when pinned; reveal compact search on a separate row without replacing scenes. Test desktop and 320px.
- [x] Ranking: medals, a focusable purple arrival dot, neutral maintenance text, signed seven-day growth / gray dash for zero. Keep original descriptions and ads unchanged. Collapse aggregate stats.
- [x] Insights: peer tab, shared scene filtering, uniform scene bar chart, top growth first, clearer trend legends and time window. Test SVG rendering and scene click behavior.
- [x] Verify logic, build and browser regression suites; inspect both layouts and publish the verified revision.

Interpretation: item 8 refines item 3 for cards: dot only beside rank, full label on hover/focus. Other new badges abbreviate to 新. Stale wording reflects the existing 90-day data threshold; unknown age must not invent an exact date.

Verification: production build successful; 45 Node tests and 141 Playwright tests passed. Mobile initial-JS <250kB gate retained. Desktop, pinned toolbar and 320px layouts inspected; no browser errors. Independent review identified old scatter taxonomy and missing cross-tab active-filter controls; both fixed, with regression coverage. Insights now download only when selected, then load immediately even below the fold. New related-project scope is represented in shared URLs; catalog data and descriptions unchanged.
