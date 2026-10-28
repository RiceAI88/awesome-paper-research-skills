import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const dataset = JSON.parse(readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"));

test("partial collection and cached repository data are visible without changing original descriptions", async ({ page }) => {
  const item = { ...dataset.items[0], refresh_status: "pending", skills_count: null, repository_kind: "unknown" };
  await page.route("**/data/rankings.js*", route => route.fulfill({ contentType: "application/javascript", body: `window.ACADEMIC_SKILLS_RANKINGS=${JSON.stringify({ metadata: { ...dataset.metadata, collection: { status: "partial" } }, items: [item] })};` }));
  await page.goto("./#view=table&repo="+encodeURIComponent(item.repo));
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByTestId("update-status").hover();
  await expect(page.getByRole("tooltip")).toContainText("部分");
  await page.goto("./#repo="+encodeURIComponent(item.repo));
  await expect(page.locator(".ant-table-row")).toHaveCount(0);
  const row = page.getByRole("dialog");
  await expect(row).toContainText("数据待核验");
  await expect(row).toContainText("类型待核验");
  await expect(row).toContainText(item.description);
});

test("complete zero-file inventory is labelled as a related project", async ({ page }) => {
  const item = { ...dataset.items[0], skills_count: 0, skills_count_complete: true, repository_kind: "related" };
  await page.route("**/data/rankings.js*", route => route.fulfill({ contentType: "application/javascript", body: `window.ACADEMIC_SKILLS_RANKINGS=${JSON.stringify({ metadata: dataset.metadata, items: [item] })};` }));
  await page.goto("./#view=card&related=1");
  await expect(page.getByTestId("repo-card")).toContainText("科研相关项目");
  await expect(page.getByTestId("repo-card")).not.toContainText("0 skills");
});
test('English partial collection status wraps within a 320px viewport', async ({page}) => {
  await page.setViewportSize({width:320,height:844});
  await page.clock.setFixedTime(new Date('2026-10-28T00:08:00Z'));
  await page.route('**/data/rankings.js*', route => route.fulfill({contentType:'application/javascript',body:`window.ACADEMIC_SKILLS_RANKINGS=${JSON.stringify({metadata:{...dataset.metadata,generated_at:'2026-10-28T00:00:00Z',collection:{status:'partial'}},items:dataset.items.slice(0,1)})};`}));
  await page.goto('./#lang=en&theme=dark');
  await page.getByTestId('update-status').hover();
  await expect(page.getByRole('tooltip')).toContainText(/unverified/i);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
