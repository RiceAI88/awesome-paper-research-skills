import { test, expect } from "@playwright/test";
for (const width of [1440, 390]) {
  test(`task text/count are centered and owner/title rows have consistent baselines at ${width}px`, async ({
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
    const typography = await page
      .locator(".task-list button")
      .evaluateAll((elements) =>
        elements.map((element) =>
          [...element.children].map((child) => {
            const style = getComputedStyle(child);
            return `${style.fontSize}/${style.lineHeight}/${style.fontFamily}`;
          }),
        ),
      );
    for (const fonts of typography) expect(new Set(fonts).size).toBe(1);
    const actions = await page
      .locator(".card-top button")
      .evaluateAll((elements) =>
        elements.slice(0, 8).map((element) => {
          const icon = element.querySelector(".ant-btn-icon");
          const label = element.lastElementChild;
          return {
            iconHeight: icon.getBoundingClientRect().height,
            labelHeight: label.getBoundingClientRect().height,
            lineHeight: getComputedStyle(label).lineHeight,
          };
        }),
      );
    for (const action of actions) {
      expect(action.iconHeight).toBe(20);
      expect(action.labelHeight).toBe(20);
      expect(action.lineHeight).toBe("20px");
    }
    const titles = await page.locator(".card-title-row").evaluateAll(elements => elements.slice(0,4).map(element => {
      const parent=element.getBoundingClientRect();
      const owner=element.querySelector(".repository-owner").getBoundingClientRect();
      const title=element.querySelector(".repo-title").getBoundingClientRect();
      return {height:parent.height,ownerOffset:owner.top-parent.top,titleOffset:title.top-parent.top};
    }));
    expect(new Set(titles.map(r=>r.height)).size).toBe(1);
    expect(new Set(titles.map(r=>r.ownerOffset)).size).toBe(1);
    expect(new Set(titles.map(r=>r.titleOffset)).size).toBe(1);
  });
}
