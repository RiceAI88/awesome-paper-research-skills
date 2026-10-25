import { test, expect } from "@playwright/test";
async function paintedArea(svg) {
  return svg.evaluate((element) =>
    Array.from(element.querySelectorAll(".element")).reduce((area, mark) => {
      const box = mark.getBoundingClientRect();
      return (
        area + box.width * box.height * Number(getComputedStyle(mark).opacity)
      );
    }, 0),
  );
}
test("charts animate their entrance and stay still after filtering", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "数据洞察 ↓", exact: true }).click();
  const svg = page.getByTestId("insight-growth").locator(".plot-host svg");
  await expect(svg).toHaveCount(1);
  await expect.poll(() => paintedArea(svg)).toBeGreaterThan(0);
  const initial = await paintedArea(svg);
  await page.waitForTimeout(1100);
  expect(await paintedArea(svg)).toBeGreaterThan(initial * 1.05);
  await page.locator('[data-chart-category="paper-writing"]').focus();
  await page.locator('[data-chart-category="paper-writing"]').press("Enter");
  await expect(page.getByTestId("insight-count")).not.toHaveText("115");
  await page.waitForTimeout(150);
  const filtered = await paintedArea(svg);
  await page.waitForTimeout(200);
  expect(await paintedArea(svg)).toBe(filtered);
});
test("reduced motion skips chart entrance animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "数据洞察 ↓", exact: true }).click();
  const svg = page.getByTestId("insight-growth").locator(".plot-host svg");
  await expect(svg).toHaveCount(1);
  await expect.poll(() => paintedArea(svg)).toBeGreaterThan(0);
  const initial = await paintedArea(svg);
  await page.waitForTimeout(300);
  expect(await paintedArea(svg)).toBe(initial);
});
