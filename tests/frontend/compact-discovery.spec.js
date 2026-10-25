import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { isNewThisWeek, filterItems, restoreState } from "../../src/domain.js";
const dataset = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
test("compact first screen groups stats below controls and exposes visitor copy", async ({
  page,
}) => {
  await page.goto("./#view=card");
  await expect(page.getByRole("heading", { name: /今日榜单/ })).toBeVisible();
  const filterY = await page
    .locator(".filters")
    .evaluate((e) => e.getBoundingClientRect().bottom);
  const statsY = await page
    .locator(".statistics")
    .evaluate((e) => e.getBoundingClientRect().top);
  expect(statsY).toBeGreaterThanOrEqual(filterY - 2);
  expect(
    (await page.getByTestId("repo-card").first().boundingBox()).y,
  ).toBeLessThan(760);
  await expect(page.locator(".statistics")).toContainText(/近 30 天有更新.*\//);
  await expect(page.getByRole("button", { name: /本周新收录/ })).toBeVisible();
  await expect(page.locator(".task-count-note")).toContainText("多个场景");
  await expect(page.locator(".editorial-preview")).toHaveCount(4);
  await expect(page.locator(".editorial-review-notice:visible")).toHaveCount(0);
  await expect(page.locator(".ranking-header")).not.toContainText("精准过滤");
  await page.locator(".export-menu summary").click();
  await expect(
    page.getByRole("button", { name: "导出收藏", exact: true }),
  ).toBeDisabled();
});
test("compact cards open details via title and preserve an explicit external link", async ({
  page,
}) => {
  await page.goto("./#view=card");
  const card = page.getByTestId("repo-card").first();
  await expect(card.locator(".installation-actions")).toHaveCount(0);
  await expect(card.locator(".practical-description")).toHaveCount(1);
  await expect(card.locator(".card-meta")).toHaveCount(0);
  expect((await card.boundingBox()).height).toBeLessThan(380);
  await expect(card.locator(".repository-external")).toHaveAttribute(
    "target",
    "_blank",
  );
  await card.locator(".repo-title").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").locator(".installation-context"),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog").locator(".practical-description"),
  ).toBeVisible();
});
test("sticky search is unique when visible and supports changing a query from deep in ranking", async ({
  page,
}) => {
  await page.goto("./#view=card");
  await page.getByTestId("repo-card").nth(10).scrollIntoViewIfNeeded();
  const input = page.locator("#stickySearchInput");
  await expect(input).toBeVisible();
  await input.fill("zotero");
  await expect(input).toHaveValue("zotero");
  await expect(input).toBeFocused();
  await expect(page.getByRole("searchbox")).toHaveCount(1);
  await expect(page).toHaveURL(/q=zotero/);
  expect(await page.locator("#searchInput").count()).toBe(1);
  await expect(page.locator("#categoryFilter")).toBeVisible();
});

test("weekly newcomer shortcut filters true first entries and can be cleared", async ({
  page,
}) => {
  const expected = dataset.items.filter((item) =>
    isNewThisWeek(item, dataset.metadata.generated_at),
  );
  await page.goto("./#view=card");
  await expect(page.getByTestId("new-this-week")).toContainText(
    String(expected.length),
  );
  await page.getByTestId("new-this-week").click();
  await expect(page).toHaveURL(/new=1/);
  await expect(page.getByTestId("new-this-week")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByTestId("repo-card")).toHaveCount(
    Math.min(30, expected.length),
  );
  await page.locator('[data-filter-key="newOnly"]').click();
  await expect(page.getByTestId("repo-card")).toHaveCount(
    Math.min(30, dataset.items.length),
  );
});

test("relative status keeps a single dot and the correct Shanghai precision", async ({
  page,
}) => {
  await page.clock.setFixedTime(
    new Date(Date.parse(dataset.metadata.generated_at) + 3600000),
  );
  await page.goto("./");
  const status = page.getByTestId("update-status");
  await expect(status.locator(".status-dot")).toHaveCount(1);
  await expect(status.locator("time")).toContainText("1小时前");
  const exact = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(dataset.metadata.generated_at));
  await expect(status.locator("time")).toHaveAttribute(
    "title",
    new RegExp(exact + ".*UTC\\+8"),
  );
});

test("trend follows selected comparisons even after a narrower search", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#view=card");
  const repo = dataset.items[0].repo;
  await page.getByTestId("repo-card").first().locator("[data-compare]").click();
  await page.getByRole("searchbox").fill(dataset.items[1].repo);
  const narrowed = filterItems(
    dataset.items,
    restoreState(
      null,
      "#q=" + encodeURIComponent(dataset.items[1].repo),
      {},
      dataset.items,
    ),
  );
  await expect(page.getByTestId("repo-card")).toHaveCount(narrowed.length);
  await page.getByRole("link", { name: "数据洞察 ↓", exact: true }).click();
  const trend = page.getByTestId("insight-trend");
  await expect(trend.locator(".plot-host svg path.element")).toHaveCount(1);
  const source = trend.locator(".chart-keyboard-controls button");
  await expect(source).toHaveCount(1);
  await expect(source).toContainText(repo);
  await source.focus();
  await source.press("Enter");
  await expect(page.getByRole("dialog").locator(".drawer-repo")).toHaveText(
    repo,
  );
  await expect(page.getByTestId("detail-position")).toContainText(
    "当前项目不在筛选结果中",
  );
});

test("sticky search returns to hero after losing focus at the top and mobile hides all shortcut hints", async ({
  page,
}) => {
  await page.goto("./#view=card");
  await page.getByTestId("repo-card").nth(10).scrollIntoViewIfNeeded();
  await page.locator("#stickySearchInput").focus();
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.locator("h1").click();
  await expect(page.locator("#searchInput")).toBeVisible();
  await expect(page.locator("#stickySearchInput")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("footer").getByText(/^快捷键：/)).not.toBeVisible();
});

test("mobile first screen reaches a compact ranking card with task pills in one scrollable row", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#view=card");
  const pills = page.locator(".task-list");
  expect(await pills.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );
  expect(
    (await page.getByTestId("repo-card").first().boundingBox()).y,
  ).toBeLessThan(760);
  const metric = await page
    .getByTestId("repo-card")
    .first()
    .locator(".card-key-metrics")
    .boundingBox();
  expect(metric.y + metric.height).toBeLessThan(844);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
