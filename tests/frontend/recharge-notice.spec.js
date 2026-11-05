import { test, expect } from "./fixtures.js";

test.use({ showEntryNotice: true });

test("entry notice links to the shop and appears again after reload", async ({ page }) => {
  await page.goto("./");
  const dialog = page.getByRole("dialog", { name: "GPT 正规代充" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("可开发票");
  await expect(dialog.getByRole("link", { name: /查看代充服务/ })).toHaveAttribute("href", "https://catfk.com/shop/1991");
  await dialog.getByRole("button", { name: "继续浏览" }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(page.locator(".hero h1")).toBeVisible();
  await expect(dialog).toBeVisible();
});

test("notice ignores the old daily cap and closes on Escape on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("prs-recharge-notice-seen-v1", String(Date.now())));
  await page.goto("./");
  const dialog = page.getByRole("dialog", { name: "GPT 正规代充" });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});


test("close control has no outline frame when focused", async ({ page }) => {
  await page.goto("./");
  const close = page.getByRole("button", { name: "关闭代充提示" });
  await close.focus();
  await expect(close).toHaveCSS("outline-style", "none");
  await expect(close).toHaveCSS("border-top-width", "0px");
  await close.click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("tab", { name: "数据洞察", exact: true }).click();
  await expect(page.locator(".recharge-notice")).not.toBeVisible();
});
