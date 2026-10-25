# Mobile performance and top-20 installation verification

User approved completing both items. Preserve all existing descriptions, ranking/filter semantics, original commands when still supported, warm design and SVG charts/animations.

## Task 1 — measured first-load optimization
- [x] Record repeatable cold mobile baseline (390x844, DPR2, CPU4x, 1.6Mbps/150ms); measure paint, initial script bytes, main-thread work and first search response. Report local preview transport conditions; avoid claiming real-device equivalence.
- [x] Identify actual critical-path costs; lazy-load unused table/drawer/comparison UI and other justified heavy assets only as supported by baseline. Preserve list/card state, direct detail links, error recovery, keyboard and mobile charts. Do not add pagination or hide repositories.
- [x] Add request/interaction regression tests before implementing. Re-measure with the same protocol and keep before/after evidence.

## Task 2 — top-20 installation audit
- [x] Read first-party README/setup docs for the current first 20 items. Two independent documentation audit tasks write evidence JSON; root reviews before applying. No inference-based commands or claimed hands-on installation.
- [x] Add environment, prerequisites, review date and source links per record. Use manual/reference classification if no universal executable installation is documented. Keep 5 prior reviewed entries, correct any outdated command only against direct evidence.
- [x] Show environment/dependencies in details, with bilingual labels and supporting document links. Validate coverage/source records and browse all 20 details; unknown items remain unreviewed.

## Verification and release
- [x] Build; Node/Python/full browser regression; mobile/desktop visual check; one final read-only review. Fix material findings with a reproducing test.
- Release procedure: commit, deploy established main/Pages workflow and verify production, including request deferral and installation details. Report measured improvement and source limitations precisely.

## Evidence and decisions
- Before/after scripts: three cold runs under the same CDP mobile/CPU/network protocol. FCP median 3156→2612ms (-17.2%); initial scripts including data 388888→294309 bytes (-24.3%). Search response remained essentially unchanged. Full conditions and limitations are in docs/mobile-performance.md.
- Lazy requests and failed optional-chunk recovery observed failing before implementation; passed after. Application-only gzip budget excludes naturally growing daily data; full transfer totals remain reported separately.
- Ant Design Card imported Tabs/Skeleton despite being used only as a body container; Panel preserves existing visual selectors. FeedbackProvider retains message/useMessage under ConfigProvider without unused modal/notification providers.
- Twenty primary installation documents independently fetched at pinned SHA, with every copied command line verified as present. No upstream unreachable entry. Long environment/dependency data loads only with the drawer. No installation executed.
- New installation tests observed failing first, then passed for both languages across all twenty entries; reference directories and placeholder instructions expose no copy command. Node coverage is the dated audit snapshot, not a permanent promise about a daily changing top twenty.
- Final independent review found one test-maintenance issue: browser audit targets used the current top twenty. A simulated new #1 reproduced the missing-environment failure; switched to audited snapshot repos still present in catalog, and the same simulation passed. Source/data fixtures were restored in finally. No production behavior changed for this fix.
- Visual inspection: mobile/desktop warm panels retained; dark detail prerequisites readable, font stack unchanged, no mobile horizontal overflow.
- Node 20, Python 36, full browser 54 passed after implementation; final fix reverified with the complete suite before release.
