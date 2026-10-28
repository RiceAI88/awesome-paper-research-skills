import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { filterItems, restoreState } from "../../src/domain.js";
const data = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
async function openRow(page, index) {
  await page.locator(".ant-table-row").first().waitFor();
  while (await page.locator(".ant-table-row").count() <= index) await page.getByTestId("load-more").click();
  const row = page.locator(".ant-table-row").nth(index);
  await row.scrollIntoViewIfNeeded();
  await row.locator("td").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
for (const width of [1440, 390])
  test(`filters and table headers remain available while scrolling at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./#related=1&view=table");
    const row = page.locator(".ant-table-row").nth(8);
    await row.scrollIntoViewIfNeeded();
    await expect
      .poll(async () =>
        Math.round((await page.locator(".filters").boundingBox()).y),
      )
      .toBe(await page.locator("#stickySearchInput").isVisible() ? 48 : 0);

    const header = page.locator(".ant-table-sticky-holder");
    await expect(header).toBeVisible();
    await expect
      .poll(async () => Math.round((await header.boundingBox()).y) - Math.ceil((await page.locator(".filters").boundingBox()).height) - Math.round((await page.locator(".filters").boundingBox()).y))
      .toBe(0);
    await expect(page.locator("#sortSelect")).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const body = page.locator(".ant-table-content, .ant-table-body").first();
    await body.evaluate((el) => (el.scrollLeft = el.scrollWidth));
    await expect
      .poll(() => header.evaluate((el) => el.scrollLeft))
      .toBe(await body.evaluate((el) => el.scrollLeft));
    await page.screenshot({ path: `/tmp/aprs-sticky-${width}.png` });
  });
test("drawer follows filtered sort, resets its content scroll and returns to the original row", async ({
  page,
}) => {
  const hash = "#view=table&sort=updated&cat=paper-writing";
  const ordered = filterItems(
    data.items,
    restoreState(null, hash, {}, data.items),
  );
  expect(ordered.length).toBeGreaterThan(3);
  await page.goto("./" + hash);
  await openRow(page, 2);
  const origin = page.locator(".ant-table-row").nth(2);
  const original = (await origin.boundingBox()).y;
  const drawer = page.getByRole("dialog");
  await expect(drawer.locator(".drawer-repo")).toHaveText(ordered[2].repo);
  await expect(page.getByTestId("detail-position")).toHaveText(
    `3 / ${ordered.length}`,
  );
  await page
    .locator(".ant-drawer-body")
    .evaluate((el) => (el.scrollTop = el.scrollHeight));
  await page.getByTestId("detail-next").click();
  await expect(drawer.locator(".drawer-repo")).toHaveText(ordered[3].repo);
  await expect
    .poll(() => page.locator(".ant-drawer-body").evaluate((el) => el.scrollTop))
    .toBe(0);
  await expect(page).toHaveURL(/task=write/);
  await page.getByTestId("detail-previous").click();
  await expect(drawer.locator(".drawer-repo")).toHaveText(ordered[2].repo);
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect
    .poll(async () => (await origin.boundingBox()).y)
    .toBeCloseTo(original, 0);
  await expect(page.locator(".ant-table-row").nth(2)).toBeFocused();
});
test("drawer navigation respects first, last, single and out-of-results shared entries", async ({
  page,
}) => {
  await page.goto("./#related=1&view=table");
  await openRow(page, 0);
  await expect(page.getByTestId("detail-previous")).toBeDisabled();
  await expect(page.getByTestId("detail-next")).toBeEnabled();
  await page.keyboard.press("Escape");
  await openRow(page, data.items.length - 1);
  await expect(page.getByTestId("detail-next")).toBeDisabled();
  await page.keyboard.press("Escape");
  const repo = data.items[0].repo;
  await page.goto(
    `./#related=1&q=${encodeURIComponent(repo)}&repo=${encodeURIComponent(repo)}`,
  );
  await expect(page.getByTestId("detail-position")).toHaveText("1 / 1");
  await expect(page.getByTestId("detail-next")).toBeDisabled();
  await expect(page.getByTestId("detail-previous")).toBeDisabled();
  await page.goto(`./#related=1&q=missing-repo-xyz&repo=${encodeURIComponent(repo)}`);
  await expect(page.getByTestId("detail-position")).toHaveText(
    "当前项目不在筛选结果中",
  );
  await expect(page.getByTestId("detail-next")).toBeDisabled();
});
test("mobile English card details can browse and close without moving the background", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#related=1&lang=en&view=card");
  const card = page.getByTestId("repo-card").nth(2);
  await card.scrollIntoViewIfNeeded();
  await card.click();
  const original = await page.evaluate(() => scrollY);
  await page.getByTestId("detail-next").click();
  await expect(page.getByTestId("detail-position")).toHaveText(
    `4 / ${data.items.length}`,
  );
  await expect(page.getByTestId("detail-previous")).toHaveAccessibleName(
    "Previous",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/aprs-browse-drawer-mobile.png" });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect
    .poll(async () => page.evaluate(() => scrollY))
    .toBeCloseTo(original, 0);
});
