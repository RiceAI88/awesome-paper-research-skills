# Installation Guidance and Active Filters Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline; one final read-only review.

**Goal:** Make installation expectations accurate and active filters removable.
**Architecture:** Extend installationFor's normalized result with a mode; reuse common installation UI. Render ActiveFilters inside the ranking section and use existing update state/URL synchronization.
**Tech Stack:** React, Ant Design, Vite, Node tests, Playwright.
**Spec:** docs/superpowers/specs/2026-10-25-install-filters-design.md

## Global Constraints
- Preserve original descriptions, ranking rules, warm styling and reviewed command strings.
- Unknown installation records are unreviewed, not confirmed documentation-only projects.
- Clear only query, task, category, agent, favOnly; preserve other state.

## Review Focus
- Malformed/unreviewed installation metadata must not expose a command or manual classification.
- Multi-command installation must retain context, not promise website execution.
- Individual filter removal must preserve other conditions, including favorites.
- Clearing conditions must preserve sort/view and saved favorites.
- Mobile/English empty states must provide usable recovery with no horizontal overflow.

### Task 1: Installation guidance
**Files:** src/practical.js, src/components/PracticalInfo.jsx, config/editorial.json, src/i18n.js; tests/frontend/practical.test.js and installation-filters.spec.js.
**Interface:** installationFor(item, content) returns existing fields plus mode command/manual/docs.
- [x] Add failing Node cases for command/manual/unknown, invalid source or unreviewed metadata; run to confirm failure.
- [x] Normalize mode from reviewed command or explicit manual mode. Add bilingual status/context and project-doc fallback. Recheck existing source commands without rewriting them.
- [x] Run Node suite and browser tests for table/card/drawer status, source/date and command copying.

### Task 2: Active conditions and recovery
**Files:** new src/components/ActiveFilters.jsx, src/App.jsx, src/i18n.js, src/styles.css; tests/frontend/installation-filters.spec.js.
**Interface:** ActiveFilters({state,update,categories,t}) renders only active restrictive conditions and clear actions. Existing RepositoryViews empty state stays; bar provides recovery immediately above it.
- [x] Write failing browser cases: independent removal; empty-state clear preserves sort/view/favorites; English/mobile recovery.
- [x] Implement component and place after ranking header, adjacent to results/empty state. Use accessible named removal buttons and wrap on mobile.
- [x] Run build, Node/Python and full browser suite; inspect mobile/desktop screenshots.
- [x] One final read-only review; fix material findings with failing regression first. Release through the existing workflow and verify production after committing.

## Verification evidence
- Initial Node mode test failed (missing mode); all four new browser behavior tests failed before implementation, then passed.
- Node suite: 18 passed. Python suite: 34 passed. Build succeeded. Full browser regression: 38 passed.
- Visually checked mobile active conditions/empty recovery and desktop installation presentation; no horizontal overflow.
- Independent final read-only review found no blocking issues. Its suggestion to check mobile overflow before clearing is covered by an added assertion.
- Rechecked the five existing upstream README installation sources on 2026-10-25; four command strings preserved exactly, one manual configuration mode added explicitly. Unknown entries are not classified from descriptions.
- Release: fast-forward main, push, confirm CI/Pages, then run installation/filter and existing practical-information browser tests against production.
