import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const data = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
for (const view of ["table", "card"])
  test(`${view} starts with 30 and loads batches without limiting search`, async ({
    page,
  }) => {
    await page.goto(`./#view=${view}`);
    const rows = page.locator(
      view === "table" ? ".ant-table-row" : '[data-testid="repo-card"]',
    );
    await expect(rows).toHaveCount(Math.min(30, data.items.length));
    await page.getByTestId("load-more").click();
    await expect(rows).toHaveCount(Math.min(60, data.items.length));
    await page.getByRole("searchbox").fill(data.items.at(-1).repo);
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(data.items.at(-1).repo);
    await page.getByRole("searchbox").clear();
    await expect(rows).toHaveCount(30);
  });
test("cards emphasize metrics, explain actions and align installation footers", async ({
  page,
}) => {
  await page.goto("./#view=card");
  const cards = page.getByTestId("repo-card");
  await expect(cards).toHaveCount(30);
  const card = cards.first();
  await expect(card.locator(".card-key-metrics")).toContainText("Stars");
  await expect(card.locator(".card-key-metrics")).toContainText("近 7 日");
  await expect(card.locator("[data-compare]")).toContainText("对比");
  await expect(card.locator('[data-testid^="favorite-"]')).toContainText(
    "收藏",
  );
  await expect(card.locator("svg.mini-area-chart")).toHaveCount(0);
  await expect(card.locator("[data-install]")).not.toHaveClass(
    /ant-btn-primary/,
  );
  await expect(card.locator(".card-meta")).toContainText("最近更新");
  const context = card.locator(".installation-context");
  const full = await context.textContent();
  await expect(context).toHaveCSS("white-space", "nowrap");
  await expect
    .poll(async () => {
      const boxes = await cards
        .locator(".card-footer")
        .evaluateAll((es) =>
          es.slice(0, 3).map((e) => e.getBoundingClientRect()),
        );
      return (
        Math.max(...boxes.map((x) => x.bottom)) -
        Math.min(...boxes.map((x) => x.bottom))
      );
    })
    .toBeLessThan(2);
  await card.locator(".repo-name").focus();
  await card.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog").locator(".installation-context"),
  ).toHaveText(full);
  await expect(
    page.getByRole("dialog").locator(".installation-context"),
  ).not.toHaveCSS("white-space", "nowrap");
});
test("back to top appears only after one viewport and keeps filters", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#view=table&sort=updated");
  await expect(page.getByTestId("back-to-top")).not.toBeVisible();
  await page.evaluate(() =>
    scrollTo({ top: innerHeight + 200, behavior: "instant" }),
  );
  await expect(page.getByTestId("back-to-top")).toBeVisible();
  await page.getByTestId("back-to-top").click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page).toHaveURL(/sort=updated/);
  await expect(
    page.getByRole("link", { name: "返回榜单 ↑", exact: true }),
  ).toHaveCount(0);
});

test("sorting resets batches, while saving and switching view preserve loaded results", async ({
  page,
}) => {
  await page.goto("./#view=card");
  await page.getByTestId("load-more").click();
  await expect(page.getByTestId("repo-card")).toHaveCount(60);
  await page
    .getByTestId("repo-card")
    .first()
    .locator('[data-testid^="favorite-"]')
    .click();
  await expect(page.getByTestId("repo-card")).toHaveCount(60);
  await page
    .getByRole("radio", { name: "表格", exact: true })
    .locator("..")
    .click();
  await expect(page.locator(".ant-table-row")).toHaveCount(60);
  await page.locator("#sortSelect").click();
  await page.locator('.ant-select-item-option[title="最近更新"]').click();
  await expect(page.locator(".ant-table-row")).toHaveCount(30);
  while (await page.getByTestId("load-more").count())
    await page.getByTestId("load-more").click();
  await expect(page.locator(".ant-table-row")).toHaveCount(data.items.length);
  await expect(page.getByTestId("load-more")).toHaveCount(0);
});

test("drawer navigation reveals the next batch and keeps it after closing", async ({
  page,
}) => {
  const boundary = data.items.find((item) => item.rank === 30);
  await page.goto("./#view=table&repo=" + encodeURIComponent(boundary.repo));
  await expect(page.getByTestId("detail-position")).toHaveText(
    "30 / " + data.items.length,
  );
  await expect(page.locator(".ant-table-row")).toHaveCount(30);
  await page.getByTestId("detail-next").click();
  await expect(page.getByTestId("detail-position")).toHaveText(
    "31 / " + data.items.length,
  );
  await expect(page.locator(".ant-table-row")).toHaveCount(60);
  await page.locator(".ant-drawer-close").click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".ant-table-row")).toHaveCount(60);
});

test("mobile back to top stays clear of comparison controls and English copy exists", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#view=card&lang=en");
  const card = page.getByTestId("repo-card").first();
  await card.locator("[data-compare]").click();
  await page.evaluate(() =>
    scrollTo({ top: innerHeight + 300, behavior: "instant" }),
  );
  const button = page.getByTestId("back-to-top");
  await expect(button).toHaveAccessibleName("Back to top");
  await expect(button).toBeVisible();
  const top = await button.boundingBox();
  const tray = await page.getByTestId("compare-tray").boundingBox();
  expect(top.y + top.height).toBeLessThan(tray.y);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await button.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test("card actions expose their visible names and selected comparison state", async ({
  page,
}) => {
  await page.goto("./#view=card");
  const card = page.getByTestId("repo-card").first();
  const repo = data.items.find((item) => item.rank === 1).repo;
  await expect(
    card.getByRole("button", { name: "收藏 " + repo, exact: true }),
  ).toBeVisible();
  const compare = card.getByRole("button", {
    name: "对比 " + repo,
    exact: true,
  });
  const before = await compare.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  await compare.click();
  await expect(compare).toHaveAttribute("aria-pressed", "true");
  await expect(compare).not.toHaveCSS("background-color", before);
});
