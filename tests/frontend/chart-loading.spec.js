import { test, expect } from "@playwright/test";

test("slow first chart download shows skeletons until plots render", async ({ page }) => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route(/\/assets\/Insights-[^/]+\.js$/, async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await page.getByRole("tab", { name: "数据洞察", exact: true }).click();
  await expect(page.getByTestId("insights-placeholder")).toBeVisible();
  await expect(page.locator('[data-testid="insights-placeholder"] .chart-skeleton')).toHaveCount(4);
  release();
  await expect(page.getByTestId("insights")).toBeVisible();
  await expect(page.getByTestId("insights-placeholder")).toHaveCount(0);
  const plots = page.locator(".chart-loading-host");
  await expect(plots).toHaveCount(4);
  await expect(page.locator('.chart-loading-host[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator(".plot-host svg")).toHaveCount(4);
});
