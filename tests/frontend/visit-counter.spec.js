import { test, expect } from "@playwright/test";
const site = "https://riceai88.github.io/awesome-paper-research-skills/";
const api = "https://busuanzi.9420.ltd/api";
async function productionPage(page) {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "webdriver", { get: () => false }),
  );
  await page.route("https://riceai88.github.io/**", async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({
      url: `http://127.0.0.1:4173${url.pathname}${url.search}`,
    });
    await route.fulfill({ response });
  });
}
test("public totals count the project once and stay unchanged on filters and language", async ({
  page,
}) => {
  await productionPage(page);
  const requests = [];
  await page.route(api, async (route) => {
    requests.push(route.request());
    await route.fulfill({
      json: {
        success: true,
        data: { page_pv: 1234, page_uv: 567, site_pv: 99999, site_uv: 9999 },
      },
    });
  });
  await page.goto(site + "#view=card&q=paper");
  const counter = page.getByTestId("visit-counter");
  await expect(counter).toContainText("1,234");
  await expect(counter).toContainText("567");
  await expect(counter).not.toContainText("99,999");
  expect(requests).toHaveLength(1);
  expect(requests[0].method()).toBe("POST");
  expect(requests[0].headers()["x-bsz-referer"]).toBe(site);
  await page.locator("#searchInput").fill("zotero");
  await page.locator(".nav-actions").getByText("EN", { exact: true }).click();
  await expect(counter).toContainText("Visits");
  expect(requests).toHaveLength(1);
});
test("English entry uses the same project identity and fits mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await productionPage(page);
  await page.route(api, async (route) => {
    expect(route.request().headers()["x-bsz-referer"]).toBe(site);
    await route.fulfill({
      json: { success: true, data: { page_pv: 22, page_uv: 11 } },
    });
  });
  await page.goto(site + "en/");
  await expect(page.getByTestId("visit-counter")).toContainText("Visits 22");
  await page.locator("footer.site-footer").scrollIntoViewIfNeeded();
  await expect(page.locator(".back-to-top")).toBeVisible();
  await expect.poll(async () => {
    const counter = await page.getByTestId("visit-counter").boundingBox();
    const back = await page.locator(".back-to-top").boundingBox();
    return counter.y + counter.height < back.y - 8;
  }).toBe(true);
  await page.locator("[data-compare]").first().click();
  await page.locator("footer.site-footer").scrollIntoViewIfNeeded();
  await expect.poll(async () => {
    const counter = await page.getByTestId("visit-counter").boundingBox();
    const back = await page.locator(".back-to-top.above-comparison").boundingBox();
    return counter.y + counter.height < back.y - 8;
  }).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("failure never invents zero totals or prevents using the ranking", async ({
  page,
}) => {
  await productionPage(page);
  await page.route(api, (route) => route.abort());
  await page.goto(site + "#view=card");
  await expect(page.getByTestId("visit-counter")).toContainText(
    "访问统计暂不可用",
  );
  await expect(page.getByTestId("visit-counter")).not.toContainText("0 次");
  await expect(page.getByTestId("repo-card")).toHaveCount(30);
});
test("local previews do not submit visitor events", async ({ page }) => {
  let sent = 0;
  await page.route(api, (route) => {
    sent++;
    return route.abort();
  });
  await page.goto("./");
  await expect(page.getByRole("heading", { name: /今日榜单/ })).toBeVisible();
  await expect(page.getByTestId("visit-counter")).toHaveCount(0);
  expect(sent).toBe(0);
});
