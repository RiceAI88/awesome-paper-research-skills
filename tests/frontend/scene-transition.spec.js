import { test, expect } from "@playwright/test";
async function aligned(page) {
  const line = page.locator(".task-selection-indicator");
  await expect
    .poll(async () => {
      const a = await line.boundingBox(),
        b = await page
          .locator('.task-list [aria-pressed="true"]')
          .boundingBox();
      return a && b
        ? Math.max(Math.abs(a.x - b.x), Math.abs(a.width - b.width))
        : 999;
    })
    .toBeLessThan(0.5);
}
test("scene underline slides smoothly and quiet hover does not change selection", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./");
  await aligned(page);
  const list = page.locator(".task-list"),
    line = page.locator(".task-selection-indicator");
  const before = (await line.boundingBox()).x;
  await page.locator('[data-task="read"]').hover();
  await expect(page.locator('[data-task="read"]')).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  expect((await line.boundingBox()).x).toBe(before);
  await list.evaluate((el) => {
    window.__scenePositions = [];
    const until = performance.now() + 700;
    const sample = () => {
      window.__scenePositions.push(
        new DOMMatrixReadOnly(
          getComputedStyle(
            el.querySelector(".task-selection-indicator"),
          ).transform,
        ).m41,
      );
      if (performance.now() < until) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.locator('[data-task="read"]').click();
  await expect
    .poll(() =>
      page.evaluate(
        () => new Set(window.__scenePositions.map((x) => Math.round(x))).size,
      ),
    )
    .toBeGreaterThan(3);
  await aligned(page);
  for (const task of ["write", "find", "figures"])
    await page.locator(`[data-task="${task}"]`).click();
  await aligned(page);
  await expect(page).toHaveURL(/task=figures/);
});
test("scene indicator stays aligned through language, counts, resizing and horizontal scroll", async ({
  page,
}) => {
  await page.goto("./#task=read");
  await aligned(page);
  await page.getByText("EN", { exact: true }).click();
  await aligned(page);
  await page.getByTestId("include-related").click();
  await aligned(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.locator('[data-task="review"]').click();
  await aligned(page);
  await page.locator(".task-list").evaluate((el) => (el.scrollLeft = 80));
  await aligned(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
  await page.evaluate(() => scrollTo(0, 900));
  await expect(page.locator("#stickySearchInput")).toBeVisible();
  await aligned(page);
});
test("reduced motion updates the scene indicator directly", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.locator('[data-task="read"]').click();
  await aligned(page);
  expect(
    await page
      .locator(".task-selection-indicator")
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
});
