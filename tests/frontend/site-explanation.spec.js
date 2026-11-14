import { test, expect } from "./fixtures.js";
test("full project name and concise ranking and data source explanation", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator(".brand")).toContainText(
    "科研 Skills 导航",
  );
  await expect(page.locator(".brand-mark")).toHaveText("APRS");
  const notes = page.getByTestId("data-transparency");
  await expect(notes.locator("p")).toHaveCount(2);
  await expect(notes).toContainText("Stars");
  await expect(notes).toContainText("GitHub API");
  await expect(notes).not.toContainText("历史数据来源");
  await expect(notes).not.toContainText("简介与精选依据");
  await expect(page.locator(".method-section")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
