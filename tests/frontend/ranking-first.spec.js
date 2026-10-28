import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { filterItems, restoreState, RESEARCH_TASKS, matchesResearchTask } from "../../src/domain.js";
const data = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
const reviewCount = filterItems(data.items, {
  ...restoreState(null, "#related=1", {}, data.items),
  task: "review",
}).length;
test("ranking precedes insights, beginner paths stay compact and normal status stays in details", async ({
  page,
}) => {
  await page.goto("./#related=1&view=table");
  await expect(page.locator(".ant-table-row")).toHaveCount(Math.min(30, data.items.length));
  await expect(page.getByRole("tab",{name:"今日榜单",exact:true})).toHaveAttribute("aria-selected","true");
  await expect(page.getByTestId("insights-viewport")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "新手路径", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".editorial-details[open]")).toHaveCount(0);
  await expect(
    page.locator('.editorial-section [data-review-state="current"]:visible'),
  ).toHaveCount(0);
  const summaries = await page
    .locator(".editorial-details summary")
    .allTextContents();
  expect(summaries.some((text) => text.includes("↗"))).toBe(false);
  const adHeight = (await page.getByTestId("zhi1ke-ad").boundingBox()).height + 14;
  expect(
    (await page.locator(".ant-table-row").first().boundingBox()).y,
  ).toBeLessThan(900 + adHeight);
  await page.locator(".editorial-details summary").first().click();
  await expect(page.getByTestId("pick-audience").first()).toBeVisible();
});
test("task pills show counts with All first; submission uses actual task matches and classification is secondary", async ({
  page,
}) => {
  await page.goto("./#related=1&view=table");
  const all = page.locator(".task-list button").first();
  await expect(all).toHaveAttribute("data-task", "all");
  await expect(all).toContainText(String(data.items.length));
  await expect(page.locator("#categoryFilter")).toHaveCount(0);
  await page.getByRole("button", { name: "投稿审稿", exact: true }).click();
  await expect(page.locator(".ant-table-row")).toHaveCount(Math.min(30, reviewCount));
  await expect(page.locator('[data-task="review"]')).toContainText(
    String(reviewCount),
  );
  await expect(page.locator('[data-task="review"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("#categoryFilter")).toHaveCount(0);

});
for (const lang of ["zh", "en"])
  test(`mobile path is one scrollable row and ${lang} page has no overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`./#related=1&lang=${lang}&view=card`);
    const grid = page.locator(".editorial-grid");
    expect(await grid.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );
    const ys = await page
      .locator(".editorial-card")
      .evaluateAll((els) =>
        els.map((el) => Math.round(el.getBoundingClientRect().y)),
      );
    expect(new Set(ys).size).toBe(1);
    expect(
      (await page.getByTestId("repo-card").first().boundingBox()).y,
    ).toBeLessThan(1300);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/aprs-ranking-first-${lang}.png`,
      fullPage: false,
    });
  });

test("insights shortcut waits for a delayed table and preserves filter URL", async ({
  page,
}) => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/assets/RepositoryTable-*.js", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("./#related=1&view=table&sort=updated", {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("tab", { name: "数据洞察", exact: true }).click();
  release();
  await expect(page.locator(".ant-table-row")).toHaveCount(Math.min(30, data.items.length));
  await expect(page.getByTestId("insights")).toBeVisible();
  await expect(page).toHaveURL(/sort=updated/);

});

test("growth lines have distinct strokes and dashes; category bars show counts and filter", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#related=1&view=table");
  await page.getByRole("tab", { name: "数据洞察", exact: true }).click();
  const trend = page.getByTestId("insight-trend");
  await expect(trend.locator("svg path.element")).toHaveCount(3);
  const styles = await trend.locator("svg path.element").evaluateAll((els) =>
    els.map((el) => [el.getAttribute("stroke"), el.getAttribute("stroke-dasharray") || "solid"]),
  );
  expect(new Set(styles.map((style) => style[0])).size).toBe(3);
  expect(new Set(styles.map((style) => style[1])).size).toBe(3);
  expect(await trend.locator("svg text").allTextContents()).toEqual(
    expect.arrayContaining([expect.stringContaining("%")]),
  );
  const counts = RESEARCH_TASKS.map(task => [task.id,data.items.filter(item=>matchesResearchTask(item,task)).length]).sort((a,b)=>b[1]-a[1]);
  const categories = page.getByTestId("insight-categories");
  await expect(categories.locator(".donut-center")).toHaveCount(0);
  await expect.poll(() => categories.locator("svg text").allTextContents()).toEqual(
    expect.arrayContaining(counts.map(([, count]) => String(count))),
  );
  const marks = categories.locator("svg .element");
  await expect(marks).toHaveCount(counts.length);
  const top = await marks.evaluateAll((els) => els.map((el, index) => ({
    index, y: el.getBoundingClientRect().y,
  })).sort((a, b) => a.y - b.y)[0].index);
  await marks.nth(top).click();
  await expect(page.locator(".ant-table-row")).toHaveCount(Math.min(30, counts[0][1]));
  await expect(page).toHaveURL(new RegExp("task=" + counts[0][0]));
});

test("empty table recovery waits for first real table before insight jump", async ({ page }) => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route("**/assets/RepositoryTable-*.js", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("./#related=1&view=table&q=zzzznoresults");
  await expect(page.locator(".ant-empty")).toBeVisible();
  await page.getByRole("searchbox").fill("");
  await page.getByRole("tab", { name: "数据洞察", exact: true }).click();
  release();
  await expect(page.locator(".ant-table-row")).toHaveCount(Math.min(30, data.items.length));
  await expect(page.getByTestId("insights")).toBeVisible();
});
