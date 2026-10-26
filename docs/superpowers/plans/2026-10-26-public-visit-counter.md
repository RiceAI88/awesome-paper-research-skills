# Public visit counter

Approved in chat: show cumulative visits and visitors publicly in the footer. Keep it unobtrusive and asynchronous.

- Use the documented POST API of the open-source Busuanzi public instance. Project page totals, keyed by the canonical project URL, avoid mixing other GitHub Pages projects. Both language entries share that key.
- One request per document, no retries or events on filter/language updates. Local previews and WebDriver automation do not submit visits. No external JavaScript or new dependencies.
- Render validated integer totals, pending state or unavailable state; never substitute invented counts. Six-second request timeout. Third-party totals are reference estimates, not an exact count of people.
- Tests: provider requests mocked on a locally proxied production origin; verify scope, single counting, languages, failure and local exclusion. Full browser/unit checks and screenshot inspection before publishing.

Sources: https://github.com/soxft/busuanzi and https://s.apifox.cn/3915ad4e-4383-4e95-988a-fdad828dc194/api-203999144
