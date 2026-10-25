# SVG chart rendering and mini area trends

User approved replacing four Canvas charts with SVG and chose mini area charts in ranking rows/cards.

- [x] Add regression proving each main chart renders vector shapes/text without a canvas, remains vector after a pixel-density change, and responds to resize. Add mini area cases: real chronological values, sparse dates, decreases, flat/one/no-point histories.
- [x] Install compatible @antv/g-svg and give each plot its own stable SVG renderer. Retain deferred loading, mobile expansion, once-only entrance animation, reduced motion, themes, current handlers and filtering.
- [x] Replace Sparkline output with small SVG filled areas and thin outline. Position actual dates proportionally, preserve decreases and gaps in observations, use subtle warm fill, pad edges to avoid clipping. Tooltip/accessibility reports observed start/end, not min-to-max. No fabricated samples, no spline smoothing or change to comparison chart.
- [x] Adapt Canvas-specific interaction/animation tests to assert real SVG output and click real vector marks. Run build, Node/Python/full browser suite; inspect normal/high-density charts and desktop/mobile area sparklines. One final read-only review.
- [x] Commit/deploy through established workflow; verify production SVG, area and key interactions/animations.

## Verification evidence
- New vector/mini-area browser tests: six failed before implementation, then passed.
- @ant-design/plots 2.6.8 recursively walks config; passing a live Renderer there caused a reproduced stack overflow on filtering. SvgPlot now uses Canvas.setRenderer in per-instance onReady, outside that traversal. Existing filtering/mobile tests caught the issue and passed after the fix.
- SVG element order is reused across data updates; the click regression locates the visually highest bar rather than assuming first DOM element is highest.
- Build successful; Node 18, Python 36 and full browser regression 48 passed. Manual hover checked real SVG scatter tooltip.
- Inspected retina main charts and table/card mini areas; no mobile overflow. New area tests cover nonuniform dates, declines, flat/single/missing history and actual observed start/end accessibility text.
- Independent final read-only review found no blocking issue; independently repeated mobile expansion/collapse four times and desktop hover without errors.
- Release via established main/Pages process, then rerun vector, animation, interaction and mobile tests against production.
