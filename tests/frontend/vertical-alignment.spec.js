import { test, expect } from "@playwright/test";
for (const width of [1440, 390]) {
  test(`task text/count and one/two-line card titles are vertically centered at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("./#view=card");
    await expect(page.getByTestId("repo-card")).toHaveCount(30);
    const pills = await page
      .locator(".task-list button")
      .evaluateAll((elements) =>
        elements.map((element) => {
          const parent = element.getBoundingClientRect();
          return [...element.children].map((child) => {
            const box = child.getBoundingClientRect();
            return {
              height: box.height,
              offset: Math.abs(
                box.y + box.height / 2 - parent.y - parent.height / 2,
              ),
            };
          });
        }),
      );
    for (const spans of pills) {
      expect(
        Math.max(...spans.map((span) => span.height)) -
          Math.min(...spans.map((span) => span.height)),
      ).toBeLessThan(0.5);
      for (const span of spans) expect(span.offset).toBeLessThan(0.75);
    }
    const titles = await page
      .locator(".card-title-row")
      .evaluateAll((elements) =>
        elements.slice(0, 4).map((element) => {
          const parent = element.getBoundingClientRect();
          return [...element.children].map((child) => {
            const box = child.getBoundingClientRect();
            return Math.abs(
              box.y + box.height / 2 - parent.y - parent.height / 2,
            );
          });
        }),
      );
    for (const offsets of titles)
      for (const offset of offsets) expect(offset).toBeLessThan(0.75);
  });
}
