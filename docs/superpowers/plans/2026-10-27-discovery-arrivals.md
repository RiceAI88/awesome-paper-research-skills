# Discovery and daily arrivals implementation plan

> Execute natively in this session; user has authorized implementation. Use TDD and a fresh final code review.

**Goal:** Broaden discovery without blindly admitting repositories, and make actual new Skills visible daily.
**Spec:** docs/superpowers/specs/2026-10-27-discovery-arrivals-design.md
**Stack:** Python standard library, React/Ant Design, Node tests, Playwright.

## Constraints and review focus
Preserve original descriptions, hard exclusions, stable first-seen identities and existing ranking order. Verify rate-limit/README failures, cached evidence invalidation, bibliography-only false positives, Beijing midnight, renamed/restored entries, unknown project types and empty/filter states. No fixed daily growth quota.

### Task 1: Discovery and evidence
- [x] Add failing Python tests for partitioned/updated search, README-only academic evidence, research guides without skills, unrelated references and verification budget/cache/failure.
- [x] Implement scripts/discovery.py and integrate collection/update_rankings.py; cache evidence in existing catalog and report verification coverage.
- [x] Preserve eligibility on temporary evidence failure; bound daily requests; verify candidate deferral and re-ranking use the same evidence.
- [x] Run Python suite; commit backend and collection methodology.

### Task 2: Today arrivals
- [x] Add failing first-seen, Node and browser tests for Beijing dates, stable identities, unknown types, today filter share/reset, empty and both languages.
- [x] Preserve first_seen_at for new observations; add isNewToday in domain.js, compact DailyArrivals component, state filter, card/table badges and translations/CSS.
- [x] Run Python, Node, relevant browser checks; review mobile visual layout.
- [x] Update docs; commit frontend, test, review combined change then merge and deploy. Run collection and verify actual published records and deployment.
