import { test, expect } from "@playwright/test";
import { matchesResearchTask, RESEARCH_TASKS } from "../../src/domain.js";
import { readFileSync } from "node:fs";
const items = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
).items;
const stale = items.find((item) => item.stale);
test("real charts render, filter by category, change window and open repository details", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./#related=1&view=table");
  await page.getByRole("tab", { name: "数据洞察", exact: true }).click();
  await expect(
    page.getByTestId("insights").locator(".plot-host svg"),
  ).toHaveCount(4);
  await expect(page.getByTestId("insight-count")).toHaveText(
    String(items.length),
  );
  await page.locator('[data-chart-category="write"]').focus();
  await page.locator('[data-chart-category="write"]').press("Enter");
  const writing = items.filter((i) => matchesResearchTask(i,RESEARCH_TASKS.find(t=>t.id==="write"))).length;
  await expect(page.locator(".ant-table-row")).toHaveCount(Math.min(30, writing));
  await expect(page.getByTestId("insight-count")).toHaveText(String(writing));
  await page.locator('[data-chart-category="write"]').focus();
  await page.locator('[data-chart-category="write"]').press("Enter");
  await expect(page.getByTestId("insight-count")).toHaveText(
    String(items.length),
  );
  await page.getByRole("combobox", { name: "历史窗口", exact: true }).click();
  await page.locator('.ant-select-item-option[title="30 天"]').click();
  await expect(page.locator(".history-window")).toContainText("30 天");
  await page.locator("[data-growth-repo]").first().focus();
  await page.locator("[data-growth-repo]").first().press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("searchbox").fill("no-match-insights-000");
  await expect(page.getByTestId("insight-count")).toHaveText("0");
  await expect(page.getByTestId("ranking-empty")).toHaveCount(1);
  expect(errors).toEqual([]);
});
test("missing historical data has an honest empty state and current charts still work", async ({
  page,
}) => {
  await page.route("**/data/history.js*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "window.ACADEMIC_SKILLS_HISTORY={series:{}};",
    }),
  );
  await page.goto("./#related=1&view=table");
  await page.getByRole("tab", { name: "数据洞察", exact: true }).click();
  await expect(page.getByTestId("insight-trend")).toContainText("暂无历史数据");
  await expect(
    page.getByTestId("insight-scatter").locator(".plot-host svg"),
  ).toHaveCount(1);
});
test("maintenance status uses neutral styling in table, cards and drawer", async ({
  page,
}) => {
  expect(stale).toBeTruthy();
  await page.goto("./#related=1&view=table&q=" + encodeURIComponent(stale.repo));
  await expect(page.locator(".ant-table-row")).toHaveCount(1);
  await expect(page.getByTestId("stale-tag")).not.toHaveClass(/ant-tag-red/);
  await page.locator(".ant-table-row").first().locator("td").first().click();
  await expect(page.getByRole("dialog").getByTestId("stale-tag")).not.toHaveClass(
    /ant-tag-red/,
  );
  await page.keyboard.press("Escape");
  await page.goto("./#related=1&view=card&q=" + encodeURIComponent(stale.repo));
  await expect(
    page.getByTestId("repo-card").getByTestId("stale-tag"),
  ).toHaveCount(0);
});
test("chart bundle failure leaves ranking usable", async ({ page }) => {
  await page.route("**/assets/Insights-*.js", (route) => route.abort());
  await page.goto("./#related=1&view=table");
  await page.getByRole("tab", { name: "数据洞察", exact: true }).click();
  await expect(page.locator(".chart-unavailable")).toBeVisible();
  await expect(page.locator(".ant-table-row")).toHaveCount(Math.min(30, items.length));
  await page.getByRole("searchbox").fill(items[0].repo);
  await expect(page.locator(".ant-table-row")).toHaveCount(1);
});

test("scatter has visible data marks and clicking a point opens details", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#related=1&view=table");
  await page.getByRole("tab", { name: "数据洞察", exact: true }).click();
  const marks = page
    .getByTestId("insight-scatter")
    .locator(".plot-host svg .element");
  await expect(marks).toHaveCount(items.length);
  await expect(marks.first()).toBeVisible();
  await marks.first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
