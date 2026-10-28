import { test, expect } from "@playwright/test";
import { recentlyUpdatedCount, isNewThisWeek } from "../../src/domain.js";
import { readFileSync } from "node:fs";
const { items, metadata } = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
const expected = [
  String(items.length),
  String(
    items.filter((item) => isNewThisWeek(item, metadata.generated_at)).length,
  ),
  "+" +
    items
      .reduce((sum, item) => sum + (item.star_delta_7d || 0), 0)
      .toLocaleString("en-US"),
  `${recentlyUpdatedCount(items, metadata.generated_at)} / ${items.length}`,
];
for (const motion of ["reduce", "no-preference"])
  test(`compact statistics retain global totals with ${motion} motion`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto("./#related=1");
    await page.getByRole("button", {name:/数据概览/}).click();
    await expect(page.locator(".statistics strong")).toHaveText(expected);
    await page.getByRole("button", { name: "读论文", exact: true }).click();
    await expect(page.locator(".statistics strong")).toHaveText(expected);
    await page.getByText("EN", { exact: true }).click();
    await expect(page.locator(".statistics strong")).toHaveText(expected);
  });
