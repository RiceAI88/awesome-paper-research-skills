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

## Completion evidence

- Fresh independent review found rename identity loss, perpetual README bypass, linked-directory false positives and failed-candidate starvation. Each reproduced RED, fixed, then GREEN.
- Live collection exposed ambiguous “科研” in a game and broad nonresearch primary purposes. Added real-world regressions and concrete academic-purpose checks; rechecked the collected catalog without repeating searches.
- Live collection hit the 150 display cap. Changed max_results=0 to retain all qualified entries, preserving 30-per-batch rendering. Positive configured limits remain supported.
- Reused 129 recently confirmed file inventories and checked 71 additional trees; final published dataset prepared with 200 entries (137 skill / 63 related), Beijing-day arrivals 29 skill / 47 related. All previously displayed 123 projects retained.
- Verification on the rebuilt real dataset: Python 92, Node 43, Playwright 129 passed. Both 320px English and 390px Chinese layouts checked; no horizontal page overflow.
- Historical date-only first-seen values are retained rather than assigned invented timestamps. Exact first_seen_at supports all new entries and stable renamed identities.
