# Reliable repository collection implementation plan

**Goal:** Keep eligible known repositories despite search truncation; preserve and label cached data on temporary errors, audit changes, and identify project types.

**Architecture:** Add a persistent public metadata catalog and collection report. Refresh known repositories independently, use search for discovery only, and apply the existing eligibility/ranking rules to confirmed metadata. Failed fetches retain previously eligible records as pending; an entirely unavailable collection must not replace the published dataset. Catalog entries do not receive seed privileges. Search coverage remains bounded and explicitly reported.

**Tech Stack:** Python standard library, existing React/Ant Design, GitHub Actions.

- [x] Write failing tests for search omission, 404/403/network failures, confirmed rejection, partial/incomplete search, all-request failure, aliases and change reasons.
- [x] Add catalog collection and diagnostics, bootstrap from historical snapshots/first-seen identities, and persist active/rejected/pending decisions. Keep exclusions authoritative and report rank-limit removals separately.
- [x] Integrate file inventory types and freshness fields. Save only confirmed star observations; fill missing same-day historical observations without overwriting earlier observations.
- [x] Add compact type/pending labels and partial-update status. Keep original descriptions, Stars ranking, advertising, and scheduling unchanged.
- [x] Commit catalog/report through the update workflow and upload diagnostics on failure. Update methodology documentation.
- [ ] Run Python, frontend and browser checks; independent review; publish and perform a live collection to restore eligible omitted repositories.

User choice: retain research Skills and related tools with explicit type labels. A SKILL.md filename proves file presence, not installation success or content quality. Zero files is only a confirmed related-project type after a complete tree scan. API errors and truncated zero-file trees remain unverified.


## Verification ledger

- Initial collection tests: missing module RED → 9/9 GREEN.
- Integration: failure guard, pending history exclusion, same-day recovery, type detection and exclusions; 67/67 Python tests, 39/39 Node tests, 109/109 existing browser checks and 2/2 new browser checks passed.
- Fresh independent review found canonical response priority and rejected candidate request growth. Both reproduced RED, then fixed.
- Repeated historical removals were graded Important because false daily changes consume the bounded audit log and can displace real events; reproduced RED, then fixed.
- Final: fixed canonical priority — both CanonicalPriorityTest rename cases RED→GREEN.
- Final: fixed rejected-candidate request growth — test_rejected_discovery_candidates_do_not_expand_daily_direct_fetches RED→GREEN.
- Final: fixed repeated removal events — test_confirmed_removal_is_not_repeated_from_historical_cache RED→GREEN. Full Python suite 71/71.

- Final verification before publish: Python 72/72, Node 39/39, browser 111/111, production build and git diff --check passed. Auxiliary cached metadata regression RED→GREEN. Local network collection was cancelled before writing data; production Actions will perform the authoritative collection.
