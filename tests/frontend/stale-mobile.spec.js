import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const stale = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
).items.find((i) => i.stale);
test("neutral maintenance tag explains its rule on hover/focus without opening the repository", async ({
  page,
}) => {
  await page.goto("./#related=1&view=table&q=" + encodeURIComponent(stale.repo));
  const tag = page.locator(".ant-table-row").getByTestId("stale-tag");
  await tag.hover();
  await expect(page.getByRole("tooltip")).toContainText("30 天");
  await expect(page.getByRole("tooltip")).toContainText("7 天");
  await expect(page.getByRole("tooltip")).toContainText("不代表");
  await page.mouse.move(0, 0);
  await tag.focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await tag.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test.describe("mobile charts and touch", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  test("other charts are collapsed by default and preserve history/filter state when toggled", async ({
    page,
  }) => {
    await page.goto("./#related=1&view=table");
    await page.getByRole("tab", { name: "数据洞察", exact: true }).click();
    await expect(page.getByTestId("insight-growth")).toBeVisible();
    await expect(page.getByTestId("insight-trend")).toBeHidden();
    await expect(
      page.getByTestId("insights").locator(".plot-host svg"),
    ).toHaveCount(2);
    const expand = page.getByRole("button", {
      name: "展开其他 2 张图",
      exact: true,
    });
    await expect(expand).toHaveAttribute("aria-expanded", "false");
    const history = page.getByRole("combobox", { name: "历史窗口", exact: true });
    await history.click();
    await history.press("ArrowUp");
    await history.press("Enter");
    await expect(page.locator(".history-window")).toContainText("30 天");
    await expand.click();
    await expect(
      page.getByTestId("insights").locator(".plot-host svg"),
    ).toHaveCount(4);
    await page.locator('[data-chart-category="write"]').focus();
    await page.locator('[data-chart-category="write"]').press("Enter");
    await page
      .getByRole("button", { name: "收起其他图表", exact: true })
      .click();
    await expect(
      page.getByTestId("insights").locator(".plot-host svg"),
    ).toHaveCount(2);
    await expect(page.locator(".history-window")).toContainText("30 天");
    await expect(page).toHaveURL(/task=write/);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(
      page.getByTestId("insights").locator(".plot-host svg"),
    ).toHaveCount(4);
    await expect(page.locator(".mobile-chart-toggle")).toBeHidden();
  });
  test("cards omit the old stale badge", async ({page}) => {
    await page.goto("./#related=1&view=card&q="+encodeURIComponent(stale.repo));
    await expect(page.getByTestId("repo-card").getByTestId("stale-tag")).toHaveCount(0);
    await expect(page.getByTestId("repo-card").locator(".ant-tag-red")).toHaveCount(0);
  });
});
