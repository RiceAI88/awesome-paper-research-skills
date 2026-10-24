import { test, expect } from "@playwright/test";
async function paintedPixels(canvas) {
  return canvas.evaluate((element) => {
    const context = element.getContext("2d");
    const { data } = context.getImageData(0, 0, element.width, element.height);
    const colors = [
      "866178",
      "B47C7D",
      "C88D85",
      "A99AAB",
      "AAA09C",
      "C7B8B2",
    ].map((hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)));
    let count = 0;
    for (let i = 0; i < data.length; i += 4)
      if (
        data[i + 3] > 100 &&
        colors.some((c) => c.every((v, j) => Math.abs(v - data[i + j]) < 8))
      )
        count++;
    return count;
  });
}
test("charts animate their entrance and stay still after filtering", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./", { waitUntil: "domcontentloaded" });
  const canvas = page.getByTestId("insight-growth").locator("canvas");
  await expect(canvas).toHaveCount(1);
  await expect.poll(() => paintedPixels(canvas)).toBeGreaterThan(0);
  const initial = await paintedPixels(canvas);
  await page.waitForTimeout(1100);
  expect(await paintedPixels(canvas)).toBeGreaterThan(initial * 1.05);
  await page.locator('[data-chart-category="paper-writing"]').click();
  await expect(page.getByTestId("insight-count")).not.toHaveText("115");
  await page.waitForTimeout(150);
  const filtered = await paintedPixels(canvas);
  await page.waitForTimeout(200);
  expect(await paintedPixels(canvas)).toBe(filtered);
});
test("reduced motion skips chart entrance animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./", { waitUntil: "domcontentloaded" });
  const canvas = page.getByTestId("insight-growth").locator("canvas");
  await expect(canvas).toHaveCount(1);
  await expect.poll(() => paintedPixels(canvas)).toBeGreaterThan(0);
  const initial = await paintedPixels(canvas);
  await page.waitForTimeout(300);
  expect(await paintedPixels(canvas)).toBe(initial);
});
