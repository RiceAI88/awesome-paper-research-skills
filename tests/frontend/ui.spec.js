import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { filterItems, restoreState } from "../../src/domain.js";
const rankingData = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
const expectedCount = rankingData.items.length;
const figureRepo = filterItems(rankingData.items, {
  ...restoreState(null, "", {}, rankingData.items),
  task: "figures",
})[0].repo;
const firstRepo = rankingData.items[0].repo;
test("Ant Design migration preserves task filtering, search and URL restoration", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator(".ant-input").first()).toBeVisible();
  await expect(page.locator(".ant-table-row")).toHaveCount(Math.min(30, expectedCount));
  await page.getByRole("button", { name: "科研绘图", exact: true }).click();
  const count = await page.locator(".ant-table-row").count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThan(expectedCount);
  await expect(page).toHaveURL(/task=figures/);
  await page.reload();
  await expect(page.locator(".ant-table-row")).toHaveCount(Math.min(30, count));
  await page.getByRole("searchbox").fill(figureRepo);
  await expect(page.locator(".ant-table-row")).toHaveCount(1);
  await page.getByRole("searchbox").fill("missing-skill-123456");
  await expect(page.getByTestId("ranking-empty")).toBeVisible();
  await page.getByRole("searchbox").clear();
  await page.getByRole("button", { name: "全部 Skills", exact: true }).click();
  await expect(page.locator(".ant-table-row")).toHaveCount(Math.min(30, expectedCount));
});
test("favorites persist, drawer copies commands and links restore detail", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./");
  await page.getByTestId(`favorite-${firstRepo}`).click();
  await page.reload();
  await expect(page.getByTestId(`favorite-${firstRepo}`)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator(".ant-table-row").first().locator("td").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "复制安装命令", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(`npx skills add ${firstRepo}`);
  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByTestId("favorites-only").click();
  await expect(page.locator(".ant-table-row")).toHaveCount(1);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出收藏", exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "ars-favorites.json",
  );
});
test("comparison has a three-repository limit and modal, empty selection has no tray", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.getByTestId("compare-tray")).toHaveCount(0);
  const buttons = page.locator("[data-compare]");
  for (let i = 0; i < 3; i++) await buttons.nth(i).click();
  await buttons.nth(3).click();
  await expect(page.getByText("对比列表已满（最多 3 个）")).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("ars-compare")).length,
    ),
  ).toBe(3);
  await page.getByTestId("open-compare").click();
  await expect(page.locator(".ant-modal")).toBeVisible();
  await expect(page.locator('.ant-modal svg[role="img"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".ant-modal")).not.toBeVisible();
  await page.getByTestId("clear-compare").click();
  await expect(page.getByTestId("compare-tray")).toHaveCount(0);
});
test("old preferences and hash links work, typing does not trigger global hotkeys", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "ars-favorites",
      JSON.stringify(["K-Dense-AI/scientific-agent-skills"]),
    );
    localStorage.setItem("ars-theme", "dark");
    localStorage.setItem("ars-lang", "en");
  });
  await page.goto("./#lang=zh&theme=light&task=figures");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(
    page.getByRole("button", { name: "科研绘图", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("searchbox").fill("tlvf");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await page.getByRole("searchbox").clear();
  await page.getByRole("searchbox").blur();
  await page.keyboard.press("t");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.keyboard.press("/");
  await expect(page.getByRole("searchbox")).toBeFocused();
});
test("corrupt storage and missing history do not break the app", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("ars-favorites", "bad-json");
    localStorage.setItem("ars-compare", "{}");
  });
  await page.route("**/data/history.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "window.ACADEMIC_SKILLS_HISTORY={series:{}};",
    }),
  );
  await page.goto("./");
  await expect(page.locator(".ant-table-row")).toHaveCount(Math.min(30, expectedCount));
  await page.locator("[data-compare]").first().click();
  await page.getByTestId("open-compare").click();
  await expect(
    page.locator(".ant-modal").getByText("暂无历史数据"),
  ).toBeVisible();
});
test("empty data presents a stable empty ranking", async ({ page }) => {
  await page.route("**/data/rankings.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "window.ACADEMIC_SKILLS_RANKINGS={metadata:{},items:[]};",
    }),
  );
  await page.goto("./");
  await expect(page.getByTestId("ranking-empty")).toBeVisible();
  await expect(page.getByRole("searchbox")).toBeVisible();
});
test("English entry and responsive layouts retain usable task shortcuts", async ({
  browser,
}) => {
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("./en/");
    await expect(
      page.getByRole("button", { name: "Create figures", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    if (width <= 760)
      await expect(page.getByTestId("repo-card").first()).toBeVisible();
    await page
      .getByRole("button", { name: "Create figures", exact: true })
      .click();
    await expect(page).toHaveURL(/task=figures/);
    expect(errors).toEqual([]);
    await context.close();
  }
});

test("skip link focuses the ranking without clearing shared filters", async ({
  page,
}) => {
  await page.goto("./#q=zotero&task=read&sort=stars");
  await expect(page.getByRole("searchbox")).toHaveValue("zotero");
  const count = await page.locator(".ant-table-row").count();
  await page.locator(".skip-link").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("searchbox")).toHaveValue("zotero");
  await expect(page).toHaveURL(/task=read/);
  await expect(page.locator(".ant-table-row")).toHaveCount(Math.min(30, count));
  await expect(page.locator("#main")).toBeFocused();
});
