# Chart events and viewport loading implementation plan

> Use superpowers:executing-plans for inline execution. User approved these two optimizations after a read-only audit.

## Scope and acceptance

- [x] Reproduce stale chart callbacks: enter through a narrow search URL, broaden results, click an actual newly appearing bar/scatter point, and expect the correct drawer. Keep click handlers reading current filtered data through a ref; preserve one-time entrance animations and existing filters.
- [x] Defer the Plots/Insights module until its reserved section intersects the viewport. Keep the section mounted once activated, reserve approximate layout space while loading, support missing IntersectionObserver, and retain chunk-failure isolation. Tall desktop views where charts are visible should load immediately; offscreen charts on short/mobile views should not download their chunk.
- [x] Verify request absence before intersection, one download after intersection, latest filter state on load, retained history-window state after scrolling away/back, and unchanged reduced-motion/animation behavior. Run build, logic, Python and browser tests; inspect mobile layout and obtain one final fresh review.
- [ ] Commit/deploy and verify production behavior. No changes to descriptions, ranking rules, stale labels or mobile chart collapsing.

Root cause of the click defect: onReady registers a handler once; its closure retains the initial filtered items. A viewport gate is required because React.lazy alone starts fetching as soon as its component renders, including offscreen sections.

## Verification evidence

- The corrected narrow-query fixture matches both the original and Codex companion repository. Running the actual canvas click regression against the old callback implementation fails at opening the drawer; the ref-based fix passes.
- 17 Node, 34 Python and 31 browser tests pass. New tests cover offscreen network absence, one request on visibility, current pre-load filters, retained history selection and missing-IntersectionObserver fallback.
- Mobile 390×600: graph requests 0 before scrolling, 1 after visibility; no horizontal overflow. Reserved placeholder 1837px versus rendered 1891px.
- Fresh read-only review found no blocking issues and independently reran the three added browser tests successfully.
