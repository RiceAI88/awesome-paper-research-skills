export const WARM_PALETTE = [
  "#866178",
  "#B47C7D",
  "#C88D85",
  "#A99AAB",
  "#AAA09C",
  "#C7B8B2",
];
export function createColorMaps(items) {
  const ordered = [...items].sort(
    (a, b) => (b.stars || 0) - (a.stars || 0) || a.repo.localeCompare(b.repo),
  );
  const categoryOrder = [
    "general-research",
    "paper-writing",
    "deep-research",
    "discipline-specific",
    "literature-review",
    "experiment-reproducibility",
  ];
  const categories = [
    ...new Set(items.map((i) => i.category?.id || "other")),
  ].sort(
    (a, b) =>
      (categoryOrder.indexOf(a) < 0 ? 99 : categoryOrder.indexOf(a)) -
        (categoryOrder.indexOf(b) < 0 ? 99 : categoryOrder.indexOf(b)) ||
      a.localeCompare(b),
  );
  return {
    repos: Object.fromEntries(
      ordered.map((item, index) => [
        item.repo,
        WARM_PALETTE[index % WARM_PALETTE.length],
      ]),
    ),
    categories: Object.fromEntries(
      categories.map((id, index) => [
        id,
        WARM_PALETTE[index % WARM_PALETTE.length],
      ]),
    ),
  };
}
export function buildInsightData(
  items,
  history,
  generatedAt,
  days = 60,
  selectedTrends = null,
) {
  const anchor = Date.parse(String(generatedAt).slice(0, 10) + "T00:00:00Z");
  const cutoff = anchor - (days - 1) * 86400000;
  const categoryMap = new Map();
  for (const item of items) {
    const id = item.category?.id || "other";
    const current = categoryMap.get(id) || {
      id,
      zh: item.category?.zh || id,
      en: item.category?.en || id,
      count: 0,
    };
    current.count++;
    categoryMap.set(id, current);
  }
  const categories = [...categoryMap.values()].sort(
    (a, b) => b.count - a.count || a.id.localeCompare(b.id),
  );
  const candidates = selectedTrends?.length ? selectedTrends : items;
  const seriesByRepo = new Map(
    candidates.map((item) => {
      const byDate = new Map();
      for (const p of history?.series?.[item.repo] || []) {
        const timestamp = Date.parse(p.date + "T00:00:00Z");
        if (
          typeof p.date !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(p.date) ||
          !Number.isFinite(timestamp) ||
          new Date(timestamp).toISOString().slice(0, 10) !== p.date ||
          !Number.isFinite(p.stars) ||
          p.stars < 0 ||
          !Number.isFinite(anchor) ||
          timestamp < cutoff ||
          timestamp > anchor
        )
          continue;
        byDate.set(p.date, {
          repo: item.repo,
          date: p.date,
          time: timestamp,
          stars: p.stars,
        });
      }
      const snapshots = [...byDate.values()].sort((a, b) => a.time - b.time);
      const baseline = snapshots.find((point) => point.stars > 0);
      return [
        item.repo,
        snapshots.map((point) => ({
          ...point,
          baselineDate: baseline?.date || null,
          baselineStars: baseline?.stars ?? null,
          snapshotCount: snapshots.length,
          growthPercent:
            baseline && point.time >= baseline.time
              ? ((point.stars - baseline.stars) / baseline.stars) * 100
              : null,
        })),
      ];
    }),
  );
  // Rank measured growth before sparse series. Never substitute present-day Stars
  // for a missing historical observation or divide by a zero baseline.
  const score = (item) => {
    const points = seriesByRepo.get(item.repo);
    const measured = points.filter((point) =>
      Number.isFinite(point.growthPercent),
    );
    return {
      enough: measured.length >= 2,
      growth: measured.at(-1)?.growthPercent ?? -Infinity,
    };
  };
  const trendRepos = selectedTrends?.length
    ? [...selectedTrends]
    : [...items]
        .sort((a, b) => {
          const left = score(a),
            right = score(b);
          return (
            Number(right.enough) - Number(left.enough) ||
            (right.growth === left.growth ? 0 : right.growth - left.growth) ||
            a.repo.localeCompare(b.repo)
          );
        })
        .slice(0, 3);
  const trends = trendRepos.flatMap((item) => seriesByRepo.get(item.repo));
  const growth = [...items]
    .filter((i) => Number.isFinite(i.star_delta_7d) && i.star_delta_7d > 0)
    .sort(
      (a, b) =>
        b.star_delta_7d - a.star_delta_7d || a.repo.localeCompare(b.repo),
    )
    .slice(0, 5)
    .map((i) => ({
      ...i,
      growth: i.star_delta_7d,
      label: i.repo.split("/").pop(),
    }));
  const scatter = items
    .filter(
      (i) =>
        Number.isFinite(i.stars) &&
        i.stars > 0 &&
        Number.isFinite(i.star_delta_7d),
    )
    .map((i) => ({
      repo: i.repo,
      stars: i.stars,
      growth: i.star_delta_7d,
      category: i.category?.id || "other",
      categoryZh: i.category?.zh || "other",
      categoryEn: i.category?.en || "Other",
    }));
  const topScatter = new Set(
    [...scatter]
      .sort((a, b) => b.growth - a.growth || a.repo.localeCompare(b.repo))
      .slice(0, 3)
      .map((item) => item.repo),
  );
  for (const point of scatter) point.highlight = topScatter.has(point.repo);
  return { categories, trendRepos, trends, growth, scatter };
}
