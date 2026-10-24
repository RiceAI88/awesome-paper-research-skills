import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const stale = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
).items.find((i) => i.stale);
test("red stale tag explains its rule on hover/focus without opening the repository", async ({
  page,
}) => {
  await page.goto("./#q=" + encodeURIComponent(stale.repo));
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
    await page.goto("./");
    await page.getByTestId("insights-viewport").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("insight-trend")).toBeVisible();
    await expect(page.getByTestId("insight-categories")).toBeHidden();
    await expect(page.getByTestId("insights").locator("canvas")).toHaveCount(1);
    const expand = page.getByRole("button", {
      name: "展开其他 3 张图",
      exact: true,
    });
    await expect(expand).toHaveAttribute("aria-expanded", "false");
    await page.getByRole("combobox", { name: "历史窗口", exact: true }).click();
    await page.locator('.ant-select-item-option[title="30 天"]').click();
    await expand.click();
    await expect(page.getByTestId("insights").locator("canvas")).toHaveCount(4);
    await page.locator('[data-chart-category="paper-writing"]').click();
    await page
      .getByRole("button", { name: "收起其他图表", exact: true })
      .click();
    await expect(page.getByTestId("insights").locator("canvas")).toHaveCount(1);
    await expect(page.locator(".history-window")).toContainText("30 天");
    await expect(page).toHaveURL(/cat=paper-writing/);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByTestId("insights").locator("canvas")).toHaveCount(4);
    await expect(page.locator(".mobile-chart-toggle")).toBeHidden();
  });
  test("touching stale tag opens explanation without opening card details", async ({
    page,
  }) => {
    await page.goto("./#q=" + encodeURIComponent(stale.repo));
    const tag = page.getByTestId("repo-card").getByTestId("stale-tag");
    await tag.tap();
    await expect(page.getByRole("tooltip")).toContainText("30 天");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
