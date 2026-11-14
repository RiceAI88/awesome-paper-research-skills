import { test, expect } from "./fixtures.js";

test("empty search shows guidance near the filters without promotions", async ({ page }) => {
  await page.goto("./#q=zzzqqq-no-match");
  const empty = page.getByTestId("ranking-empty");
  await expect(empty).toBeVisible();
  await expect(empty).toContainText("没有找到与「zzzqqq-no-match」相关的项目");
  await expect(page.getByTestId("zhi1ke-ad")).toHaveCount(0);
  await expect(page.getByTestId("daily-arrivals")).toHaveCount(0);
  // Guidance must start inside the first viewport on desktop.
  const box = await empty.boundingBox();
  expect(box.y).toBeLessThan(1000);
  const keyword = empty.locator("[data-empty-keyword]").first();
  await expect(keyword).toBeVisible();
  const word = await keyword.getAttribute("data-empty-keyword");
  await keyword.click();
  await expect(page.getByRole("searchbox").first()).toHaveValue(word);
  await expect(page.getByTestId("repo-card").first()).toBeVisible();
});

test("empty state offers to keep only the search term when other filters block results", async ({ page }) => {
  await page.goto("./#q=Zotero&fav=1");
  const empty = page.getByTestId("ranking-empty");
  await expect(empty).toContainText("没有找到与「Zotero」相关的项目");
  const keep = empty.locator('[data-empty-action="keep-query"]');
  await expect(keep).toBeVisible();
  await keep.click();
  await expect(page).not.toHaveURL(/fav=1/);
  await expect(page).toHaveURL(/q=Zotero/);
  await expect(page.getByTestId("repo-card").first()).toBeVisible();
});

test("clear-all action restores the full ranking", async ({ page }) => {
  await page.goto("./#q=zzzqqq-no-match");
  await page.getByTestId("ranking-empty").locator('[data-empty-action="clear-all"]').click();
  await expect(page.getByTestId("ranking-empty")).toHaveCount(0);
  await expect(page.getByRole("searchbox").first()).toHaveValue("");
  await expect(page.getByTestId("daily-arrivals")).toBeVisible();
});
