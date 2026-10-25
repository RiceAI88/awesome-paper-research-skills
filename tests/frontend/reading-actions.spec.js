import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const dataset = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);

for (const width of [1024, 1280, 1440]) {
  test(`table actions remain visible before and after horizontal scrolling at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("./#view=table");
    const row = page.locator(".ant-table-row").first();
    await expect(row).toBeVisible();
    for (const scroll of [0, 500]) {
      await page.locator(".ant-table-body").evaluate((element, x) => {
        element.scrollLeft = x;
      }, scroll);
      for (const button of await row
        .locator('[data-testid^="favorite-"], [data-compare]')
        .all()) {
        const visible = await button.evaluate((element) => {
          const box = element.getBoundingClientRect();
          const table = element
            .closest(".ant-table-body")
            .getBoundingClientRect();
          return (
            box.left >= table.left &&
            box.right <= table.right + 1 &&
            document
              .elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
              ?.closest("button") === element
          );
        });
        expect(visible).toBe(true);
      }
    }
  });
}

for (const width of [1440, 390]) {
  test(`original descriptions and readable controls at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("./#view=card");
    const card = page.getByTestId("repo-card").first();
    await expect(card.locator(".description-clamp")).toHaveText(
      dataset.items[0].description,
    );
    for (const selector of [".repo-title", ".description-clamp"]) {
      expect(
        await card
          .locator(selector)
          .evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
      ).toBeGreaterThanOrEqual(14);
    }
    for (const selector of [
      ".task-list button",
      ".filters > label > span",
      ".compact-statistics",
      ".editorial-preview",
    ]) {
      expect(
        await page
          .locator(selector)
          .first()
          .evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
      ).toBeGreaterThanOrEqual(13);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await card.boundingBox()).height).toBeLessThan(380);
  });

  test(`drawer can save, compare, navigate and report information at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("./#view=card");
    const card = page.getByTestId("repo-card").first();
    await card.locator(".repo-title").click();
    const drawer = page.getByRole("dialog");
    await drawer.getByRole("button", { name: /^收藏 / }).click();
    await expect(
      drawer.getByRole("button", { name: /^收藏 / }),
    ).toHaveAttribute("aria-pressed", "true");
    await drawer.getByRole("button", { name: /^对比 / }).click();
    await expect(
      drawer.getByRole("button", { name: /^对比 / }),
    ).toHaveAttribute("aria-pressed", "true");
    const feedback = drawer.getByRole("link", { name: "反馈信息问题" });
    await expect(feedback).toHaveAttribute("href", /issues\/new\?/);
    const href = await feedback.getAttribute("href");
    expect(decodeURIComponent(href)).toContain(dataset.items[0].repo);
    await expect(drawer).not.toContainText("推荐本仓库收录");
    await drawer.getByTestId("detail-next").click();
    await expect(
      drawer.getByRole("button", { name: /^收藏 / }),
    ).toHaveAttribute("aria-pressed", "false");
    await drawer.getByTestId("detail-previous").click();
    await expect(
      drawer.getByRole("button", { name: /^收藏 / }),
    ).toHaveAttribute("aria-pressed", "true");
    await drawer.locator(".ant-drawer-close").click();
    await expect(card.locator('[data-testid^="favorite-"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(card.locator("[data-compare]")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
}

test("drawer uses the existing three-item comparison limit", async ({
  page,
}) => {
  await page.goto("./#view=card");
  await page.getByTestId("repo-card").first().locator(".repo-title").click();
  const drawer = page.getByRole("dialog");
  for (let index = 0; index < 4; index++) {
    const compare = drawer.getByRole("button", { name: /^对比 / });
    await compare.click();
    await expect(compare).toHaveAttribute(
      "aria-pressed",
      index < 3 ? "true" : "false",
    );
    if (index < 3) await drawer.getByTestId("detail-next").click();
  }
  await expect(page.getByTestId("compare-tray")).toContainText("3/3");
  await expect(
    page.getByText("对比列表已满（最多 3 个）", { exact: true }),
  ).toBeVisible();
});
