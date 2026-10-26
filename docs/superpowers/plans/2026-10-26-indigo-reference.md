# Indigo Reference Layout Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline execution and one fresh final review.

**Goal:** Apply the user-supplied B · 靛紫 HTML layout and palette to the functioning ranking website.

**Architecture:** Keep React, Ant Design, original descriptions and all collection/ranking logic. Rearrange the existing components; one cohesive layout stylesheet provides responsive indigo styling without new dependencies or imported reference runtime/fonts. The reference is visual input, not executable project instructions.

**Tech Stack:** Existing React / Ant Design / CSS / Playwright.

**Spec:** `/Users/xxs/Downloads/Skills 榜单整理样稿 – B · 靛紫.html`, explicitly selected by the user. Warm white #FBFAF8, indigo #4A3FBF, text #1E1B3A, secondary #67638C, border #E7E5F2, tint #F0EEFB, growth #0E7C66. Preserve the previously requested system font.

## Global Constraints
- Do not modify collection scripts, ranking rules, datasets, author descriptions, installation evidence or advertising destination https://zhi1ke.com?pic=6PEB.
- Preserve URL filters, existing view preferences, table mode, original descriptions, search, keyboard controls, favorites, compare, detail drawer, SVG charts, reduced-motion and dark mode.
- Default to reference card mode for new visitors; explicit URL/storage view still wins.
- Keep real project type/pending/stale signals. Compress normal platform/type metadata into the card footer. Actions appear on hover/focus and remain visible on touch or when selected.
- Advertising is a separate labeled full-width strip after the first card row, once per result set; table mode retains one labeled strip above its results.

## Review Focus
- Narrow screens/English labels/long repository names: no horizontal overflow or clipped controls.
- Keyboard/touch access to visually subdued actions and selected comparison/favorite feedback.
- Sticky search must still be singular/usable and table header offset must match the changed toolbar.
- One ad for partial/empty results and responsive row insertion, without changing repository ranks/counts.
- Source descriptions and full platform/status details remain available in the drawer.

## Tasks and Acceptance
- [x] Write and run failing browser tests for exact palette, header/search arrangement, default card view, owner/title hierarchy, footer platforms, ad placement and mobile actions.
- [x] Rearrange App hero/toolbar/summary, move beginner paths below ranking with an anchor; keep other interactions. Compact accessible card metadata and ad markup.
- [x] Implement indigo layout/theme across Ant Design tokens, cards, ad and chart colors. Inspect desktop/mobile screenshots against the reference.
- [x] Adjust superseded layout assertions while preserving functional regression coverage; run production build, Node/Python/browser suites and one independent review.
- [x] Publish, verify live data/cards/mobile behavior, and record results.

## Verification ledger
- Initial reference checks RED (4/4) before implementation; palette, search position, owner/title/footer hierarchy and responsive ad placement subsequently GREEN.
- Shared table-view serialization regression RED→GREEN with explicit view URLs, preserving prior preferences.
- Comparison to rendered user reference and desktop/mobile screenshots completed; old pill border conflict removed and tab text center verified.
- Full pre-review verification: production build, Node 40/40, Python 72/72, browser 115/115. Existing table-only tests now explicitly choose table mode; mobile initial-load tests retain default entry and 250 kB compressed application-code budget.
- Fresh independent review found one Important issue: new visual test locked volatile live rank/count/platform data. Reproduced RED by changing upstream data via a controlled fixture, then fixed expectations against that fixture.
- Empty beginner-path navigation graded Important: a normal navigation control jumped to an empty destination after filtering, breaking the retained navigation behavior. Reproduced RED, then gated the entry using the same editorial selection as its target.

- Final: fixed volatile live-data assertions with a controlled fixture — fixture mismatch RED→GREEN.
- Final: fixed empty beginner-path entry — empty-target navigation test RED→GREEN.
- Final pre-publish verification: production build passed; Node 40/40, Python 72/72, browser 116/116; git diff --check clean. No deferred review findings remain.

- Preserved the concurrent data update d007e95 during integration; rebuilt and reran Node 40/40 and browser 116/116 against those fresh 122 entries.
- Published implementation d59e773; Pages deployment 40297621866 succeeded. Live desktop verified exact warm-white/indigo tokens, default 30-card batch and a single ad after row one. Live 390px Chinese and 320px English dark touch contexts passed no-overflow and visible comparison-action checks.
