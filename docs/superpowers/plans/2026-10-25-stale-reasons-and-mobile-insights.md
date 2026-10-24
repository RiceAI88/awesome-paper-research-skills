# Stale reasons and mobile insights

User approved follow-up optimizations 3 and 4. Preserve warm design, original descriptions, ranking logic, existing red labels, viewport loading and one-time animations.

- [x] Add bilingual explanation to the shared stale badge: at least 30 days without a repository push and seven-day Stars delta <= 0; clarify that the signal does not confirm abandoned maintenance. Support mouse hover, keyboard focus and touch, without opening the repository row/drawer on tag interaction. Do not change the detector.
- [x] At widths <=760px, show the trend chart by default and allow expanding/collapsing category, growth and scatter charts. Keep history window/global filters and the trend chart mounted. Extra plots mount only while expanded. Desktop retains all four. Match the initial offscreen placeholder to mobile compact layout, retaining viewport-based bundle loading and unsupported-IntersectionObserver fallback.
- [x] Verify explanations and event isolation in table/cards/drawer, touch and keyboard access, responsive expansion/resizing, retained window/filters, network deferral, reduced motion and existing browser tests. Obtain one final read-only review. Deployment and production verification follow below.

## Verification evidence

- `npm test`: 17 passed; `python3 -m unittest discover -s tests -v`: 34 passed.
- `npm run build`: succeeded; full Playwright suite: 34 passed.
- New behavior tests first failed before implementation, then passed with viewport-loading regressions.
- Visual inspection at 390px and 1440px: mobile compact section 590px versus expanded 1921px; no horizontal overflow. Desktop keeps all four charts.
- Final independent read-only review found no important issues.

## Release

- Commit the scoped changes and fast-forward main; push to origin.
- Confirm CI and GitHub Pages deployment, then run the six stale/mobile and chart-optimization browser tests against production.
