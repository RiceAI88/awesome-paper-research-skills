# Motion entrance and duplicate badge fix

User request: keep only the top new-entry badge in cards and apply React Motion Hero effects throughout the page.

## Scope and choices
Preserve layout, colors, filters and data. Default interpretation: layered hero entrance, once-per-entry section reveal and restrained card hover. Shared-element drawer morph is a separate possible interpretation asked asynchronously; proceed with the recommended entrance interpretation unless steered otherwise.

Use Motion React mini useAnimate with scoped native animations; respect reduced motion and leave content immediately visible in that mode. No transform on sticky filter/main table ancestors. Preserve existing semantic tags and direct-child selectors. No layout/reorder transforms, perpetual parallax, blur, scroll hijacking, or animation delays that block interaction.

## Steps and checks
- Reproduce duplicate card badge; suppress only status-only duplicate, retain table badge and red maintenance tag.
- Introduce a reusable semantic Reveal and Motion provider; hero/nav fade, viewport reveal for daily arrivals, cards, beginner paths, insights and footer/transparency. Stagger delay bounded per row and animate only once per mounted entry.
- Browser tests: actual hero movement and settle, hover, reduced-motion static content, no replay on locale changes, badge cardinality. Existing scrolling/search handoff, 30-item pagination, SVG charts, mobile 320px layouts and keyboard interactions must pass.
- Build, Node suite and full browser suite; independent review; deploy and verify live.

Validation-driven refinement: the declarative full feature bundle exceeded the existing 250kB first-load budget. Use the official React mini hook instead; subscribe to reduced-motion changes with useSyncExternalStore, and immediately show content when IntersectionObserver/WAAPI is unavailable. Keyboard focus completes entry animation. Transformed icon dimensions permit only 0.01px floating-point rounding tolerance, not visual misalignment.

## Completion evidence
- Duplicate card badge reproduced RED (2 badges), fixed to one top badge; table badge/red stale tag retained.
- Independent review found live reduced-motion preference changes were ignored by the installed library hook. Added RED→GREEN runtime switching test; provider subscribes through useSyncExternalStore.
- Missing IntersectionObserver/WAAPI falls back to immediate static content; keyboard focus completes entry without hiding controls.
- Reproduced commitStyles InvalidStateError when an animated element is hidden/replaced. Cancel old native animations rather than commit their styles; hidden-card regression RED→GREEN.
- Final validation: build passes, Node 43/43, browser 134/134 including 250kB initial-code budget, sticky search handoff, lazy charts, dialogs, pagination and 320px layouts.
