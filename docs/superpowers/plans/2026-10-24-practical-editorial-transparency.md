# Practical ranking, editorial picks and transparency

Scope authorized by the user's three requirements, with local Chinese-summary maintenance explicitly selected.

## Acceptance and execution

- [x] Add a repository-keyed Chinese-summary registry tied to the original description. Keep raw data intact; changed or missing summaries fall back to the original with a pending label. Test fallback and search compatibility.
- [x] Move Chinese purpose, platform tags and installation/documentation actions ahead of stars/trends in table, cards and drawer. Copy only commands checked against project docs; otherwise link to installation instructions. Verify keyboard and nested button behavior.
- [x] Add four editorial picks with explicit task, recommendation reason, documentation source and review date. Preserve automated ranking; filter picks by current task/search and exclude absent repos. Test that stars sorting does not reorder picks.
- [x] Query the public GitHub Actions endpoint for the latest main-branch update run. Show success/failure/in-progress only from verified API results; handle unavailable API, no run and newer unpublished run distinctly. Show exact check time and a run link. Never expose a token or infer success from metadata timestamps.
- [x] Explain stars-first/tie-break ranking, trend windows, minimum threshold and upstream history provenance. Keep update algorithm and data collection unchanged.
- [x] Run unit/Python/build/browser tests, inspect desktop/mobile, review code, merge/deploy and verify production.

No paid translation service, backend, login or new ranking algorithm. Summaries, installation commands and reasons are editorial content derived from source descriptions or reviewed project READMEs, not claims of hands-on testing. New/changed descriptions are explicitly pending review.

Verification record: source-bound summary and update-state tests passed; 34 Python tests and 15 Node tests passed. Browser regression and production verification recorded in final deployment commit/run. Final independent review found no blocking issue.
