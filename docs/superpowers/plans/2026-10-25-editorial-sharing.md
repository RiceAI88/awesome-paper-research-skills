# Editorial usefulness and sharing metadata

User approved follow-up items 2 and 4. Implement inline, with one final read-only review.

## Scope and acceptance
- Four existing curated picks: add concise audience and task outcome in Chinese/English, visible by default. Expanded recommendation retains documentation-based rationale, links to original README, and an individual review date. No claims of hands-on testing, no changes to repository descriptions, order or filtering.
- Keep current warm design. Refresh both language PNG sharing covers (1200x630) using the existing SVG generator, ensuring scheduled updates retain the warm palette and generate both languages. No new runtime dependency.
- Correct bilingual descriptions and reciprocal hreflang (including self/x-default); each canonical/og:url stays language-specific. Add image dimensions/type/alt and localized cover paths.
- Build JSON-LD ItemList from current data into HTML so it exists without JavaScript; provide a noscript top-20 repository link list with original descriptions. Escape external text; preserve frontend behavior.
- Normalize sitemap directory URLs to canonical trailing-slash form in generator and generated file. Do not alter ranking, RSS content or unrelated repository settings.

## Steps
- [x] Write failing browser checks for per-pick audience/task/evidence/date and filtering in both languages; failing no-JS metadata/structured-data/resource checks; Python tests for cover language/palette/XML escaping and canonical sitemap URLs.
- [x] Update editorial config/component/i18n and restrained spacing.
- [x] Update head metadata/build injection, cover generator/assets and scheduled asset tracking, canonical sitemap output.
- [x] Build and run Node/Python/full browser regressions. Inspect both cover PNGs and mobile/desktop picks. One final independent read-only review, then address material findings.
- [x] Commit, deploy using established main/Pages workflow; verify production metadata/images and editorial behavior. Actual social-app caches and search indexing remain controlled by those platforms.

## Verification evidence
- New tests observed failing first: four browser behaviors and two Python cover/sitemap checks; implementation then passed.
- Build succeeded; Node 18, Python 36, complete browser regression 42 passed.
- Visually inspected both 1200x630 PNGs, desktop four-column picks and mobile expanded recommendation evidence. Original repository descriptions preserved.
- Independent final read-only review found no material issues, including no-JS HTML, text escaping, bilingual metadata and scheduled cover regeneration.
- Release follows established main/Pages workflow, then production editorial/no-JS metadata/image checks. No claim of guaranteed platform cache refresh or indexing.
