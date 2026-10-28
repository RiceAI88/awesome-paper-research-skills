import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const { items } = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
test("repository descriptions match GitHub originals in both languages, cards and drawer", async ({
  page,
}) => {
  await page.goto("./#related=1&view=table");
  await expect(
    page.locator(".ant-table-row").first().locator(".practical-description p"),
  ).toHaveText(items[0].description);
  await page.locator(".ant-table-row").first().locator("td").first().click();
  await expect(
    page.getByRole("dialog").locator(".practical-description p"),
  ).toHaveText(items[0].description);
  await expect(page.getByRole("dialog").locator(".drawer-more")).not.toHaveAttribute("open");
  await page.keyboard.press("Escape");
  await page.goto("./#related=1&view=card");
  await page.getByTestId("repo-card").first().locator(".repo-title").click();
  await expect(page.getByRole("dialog").locator(".practical-description p")).toHaveText(items[0].description);
  await page.goto("./en/#related=1&view=table");
  await expect(
    page.locator(".ant-table-row").first().locator(".practical-description p"),
  ).toHaveText(items[0].description);
  await expect(page.locator(".summary-pending")).toHaveCount(0);
});
