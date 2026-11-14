import { test, expect } from "./fixtures.js";

test("community QR sits beside the title and opens an accessible full image", async ({ page }) => {
  await page.goto("./");
  const card = page.getByRole("button", { name: "加入各专业科研 Skills 交流群，点击放大二维码" });
  await expect(card).toBeVisible();
  const cardBox = await card.boundingBox();
  const titleBox = await page.locator(".hero-copy").boundingBox();
  expect(cardBox.x).toBeGreaterThan(titleBox.x + titleBox.width - 1);
  await card.click();
  const dialog = page.getByRole("dialog", { name: "各专业科研 Skills 交流群" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("img")).toHaveJSProperty("naturalWidth", 450);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(card).toBeFocused();
});

test("mobile community card is below title without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  const card = page.getByRole("button", { name: "加入各专业科研 Skills 交流群，点击放大二维码" });
  await expect(card).toBeVisible();
  const cardBox = await card.boundingBox();
  const titleBox = await page.locator(".hero-copy").boundingBox();
  expect(cardBox.y).toBeGreaterThanOrEqual(titleBox.y + titleBox.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await card.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "关闭二维码" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("dialog close icon stays centered with a quiet hover style", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "加入各专业科研 Skills 交流群，点击放大二维码" }).click();
  const close = page.getByRole("button", { name: "关闭二维码" });
  const icon = close.locator("svg");
  await expect(icon).toBeVisible();
  const buttonBox = await close.boundingBox();
  const iconBox = await icon.boundingBox();
  expect(Math.abs(buttonBox.x + buttonBox.width / 2 - iconBox.x - iconBox.width / 2)).toBeLessThan(1);
  expect(Math.abs(buttonBox.y + buttonBox.height / 2 - iconBox.y - iconBox.height / 2)).toBeLessThan(1);
  await expect(close).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await close.hover();
  await close.click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
