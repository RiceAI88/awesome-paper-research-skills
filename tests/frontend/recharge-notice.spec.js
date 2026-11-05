import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("entry notice links to the shop and stays dismissed after reload", async ({ page }) => {
  await page.goto("./");
  const dialog = page.getByRole("dialog", { name: "GPT 正规代充" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("可开发票");
  await expect(dialog.getByRole("link", { name: /查看代充服务/ })).toHaveAttribute("href", "https://catfk.com/shop/1991");
  await dialog.getByRole("button", { name: "继续浏览" }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(page.locator(".hero h1")).toBeVisible();
  await expect(dialog).not.toBeVisible();
});

test("notice returns after a day and closes on Escape on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("prs-recharge-notice-seen-v1", String(Date.now() - 25 * 3600000)));
  await page.goto("./");
  const dialog = page.getByRole("dialog", { name: "GPT 正规代充" });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});
