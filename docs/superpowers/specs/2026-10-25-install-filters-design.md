# Accurate installation guidance and active filters

Implement the user's approved optimizations 1 and 3 in the existing warm Ant Design dashboard.

Installation: preserve author descriptions and existing reviewed commands exactly. Show command installation when a reviewed command exists, manual setup only when explicitly documented in editorial configuration, and installation method not yet reviewed for unknown entries. Unknown entries link to project docs, without suggesting that the repository cannot be installed. Show review date/source and execution context in details. Do not promise one-click execution; the website copies commands only. Recheck the five existing source READMEs; do not invent commands or mass-classify unreviewed repositories.

Filters: show a compact active-condition bar immediately above the ranking for query, task, category, platform and favorites-only. Each condition can be removed independently; clear all resets only those five fields, preserving sort, view, language, theme, saved favorites/comparison and detail state. Empty results offer removing each condition or clearing all. Do not reset conditions automatically. Keep URL synchronization and chart/editorial filtering.

Approach: reuse installationFor and the common InstallationActions; add one shared ActiveFilters component used in the ranking, including empty-state recovery. Explicit editorial mode avoids guessing from descriptions. No new dependencies or unrelated layout changes.
