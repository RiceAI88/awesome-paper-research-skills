import { test, expect } from "@playwright/test";

test("desktop section headings and actions share a compact aligned row", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  const header = page.locator(".ranking-header");
  await expect(header.locator("h2")).toBeVisible();
  const offset = await header.evaluate((el) => {
    const title = el.querySelector(".ranking-status-line").getBoundingClientRect();
    const actions = el.querySelector(":scope > .ant-space").getBoundingClientRect();
    return Math.abs(title.y + title.height / 2 - actions.y - actions.height / 2);
  });
  expect(offset).toBeLessThan(1);
  await page.getByRole("tab", { name: "数据洞察", exact: true }).click();
  const insights = page.getByTestId("insights");
  await expect(insights).toBeVisible();
  await expect(insights.locator(".insights-heading .related-scope-control")).toBeVisible();
  const geometry = await insights.locator(".insights-heading").evaluate((el) => {
    const rects = [el.querySelector("p"), el.querySelector(".related-scope-control"), el.querySelector(".history-window")].map((node) => node.getBoundingClientRect());
    const centers = rects.map((r) => r.y + r.height / 2);
    return { spread: Math.max(...centers) - Math.min(...centers), height: el.getBoundingClientRect().height };
  });
  expect(geometry.spread).toBeLessThan(1);
  expect(geometry.height).toBeLessThan(60);
});

test("section controls fit a narrow screen and retain scope switching", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.getByRole("tab", { name: "数据洞察", exact: true }).click();
  const toggle = page.getByTestId("insights").getByRole("switch");
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
