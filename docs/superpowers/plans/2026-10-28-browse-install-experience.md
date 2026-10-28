# Browse → judge → install Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Architecture:** Reuse installation evidence and copy handling across list, cards and drawer; retain the existing shared state and hash serialization.

**Tech Stack:** React, Ant Design, Motion, Playwright.

**Spec:** User’s 19-point screenshot review in this conversation (2026-10-28).

**Goal:** Resolve the user's 19 screenshot findings without changing descriptions, admission rules, or advertising destinations.

**Execution:** Implement directly in this session, using the user's numbered list as the approved specification. Existing React, Ant Design, Motion and Playwright only; no new dependencies.

## 1. Dense list and consistent cards — items 1–5, 12, 18–19
- [x] Add failing browser checks for scene overflow, 56–64px desktop rows, empty scenes, singular Skill, and copy availability.
- [x] Bound scene tags to one label plus a focusable +N tooltip; shorten heading to 场景.
- [x] Compact platform and installation cells; remove long contexts and trend plots from rows, retain details in the drawer. Add clickable Stars/7-day sort headings.
- [x] Share installation badges and copy controls between cards/list; always show save/compare. Place inactivity status inside the existing footer in place of file count.
- [x] Verify real clipboard success/failure, no command buttons for manual/reference/unknown installs, and keyboard access.

## 2. Installation-first drawer — items 6–11
- [x] Add checks for summary → platforms → adjacent copy/code → health order, one primary action, collapsed requirements/metadata, and relative review times with Shanghai tooltip.
- [x] Reuse installation evidence; move copy into code block header. Keep GitHub secondary and move Markdown/feedback into a native more menu.
- [x] Show Stars, seven-day delta, last push and license together; keep environments, dependencies, topics, forks, issues, creation date and other metrics in disclosures.
- [x] Improve main detail text size, contrast and line length; preserve navigation and copy error handling.

## 3. Scope, sorting and sponsorship — items 13–17
- [x] Add descending delta7 and first-seen newest sorts with URL restoration and tie handling; prefix dropdown labels with 排序 and expose two shortcuts.
- [x] Mark arrivals explicitly 全站, suppress redundant single-filter chips except empty-result recovery, and hide the duplicate visual ranking heading while preserving its accessible name.
- [x] Label top support card 广告 with separate visual treatment; insert the single inline sponsorship after two responsive grid rows / eight compact table entries, after the last result if fewer exist.
- [x] Verify combined filters, empty/single results, responsive grid changes, and no repeated ads after loading more.

## Completion
- [x] Update earlier tests whose expected presentation changes, retaining their functional coverage.
- [x] Build, Python/Node tests, full browser suite; inspect desktop/mobile, light/dark, Chinese/English screenshots.
- [ ] Commit, publish, verify deployment and targeted live behavior.

## Rulings
- Suppress redundant single visible filters; retain a standalone week restriction, and today restrictions in insights, because their source/reset control is otherwise hidden. Empty results retain recovery.
- Grid sponsorship follows two responsive rows. A compact list needs eight entries (equivalent to two desktop grid rows) before the ad so it no longer consumes the default first viewport. Short result sets place the one ad after the final entry.
- Keep the existing vector mini-area trend inside the compact Stars cell; constrain its displayed height to 16px so it does not inflate rows.
- Independent read-only review found English installation labels overlapping icons; use short translated labels, a width bound and ellipsis with full tooltip, and add desktop/mobile acceptance checks.

## Validation before integration
- Python: 95 passing; Node: 46 passing; Playwright: 166 passing.
- Desktop/mobile screenshots inspected; independent read-only review and focused follow-up found no remaining issue.
