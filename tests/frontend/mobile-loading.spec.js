import { test, expect } from "@playwright/test";
test("mobile card entry does not download table, detail or comparison code until requested", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests = [];
  page.on("request", (r) => {
    if (/\/assets\/.*\.js/.test(r.url())) requests.push(r.url());
  });
  await page.goto("./");
  await expect(page.getByTestId("repo-card").first()).toBeVisible();
  expect(
    requests.some((url) =>
      /RepositoryTable-|RepositoryDrawer-|ComparisonDialog-/.test(url),
    ),
  ).toBe(false);
  await page.getByTestId("repo-card").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(requests.some((url) => /RepositoryDrawer-/.test(url))).toBe(true);
  await page.keyboard.press("Escape");
  await page.locator("[data-compare]").first().click();
  await page.getByTestId("open-compare").click();
  await expect(page.locator(".ant-modal")).toBeVisible();
  expect(requests.some((url) => /ComparisonDialog-/.test(url))).toBe(true);
  await page.keyboard.press("Escape");
  await page
    .getByRole("radio", { name: "表格", exact: true })
    .locator("..")
    .click();
  await expect(page.locator(".ant-table-row").first()).toBeVisible();
  expect(requests.some((url) => /RepositoryTable-/.test(url))).toBe(true);
});
test("direct detail URL loads the drawer and a failed optional chunk leaves ranking usable", async ({
  page,
}) => {
  await page.goto("./#repo=K-Dense-AI%2Fscientific-agent-skills");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.route("**/assets/ComparisonDialog-*.js", (r) => r.abort());
  await page.locator("[data-compare]").first().click();
  await page.getByTestId("open-compare").click();
  await expect(page.getByTestId("feature-unavailable")).toBeVisible();
  await page.getByRole("searchbox").fill("K-Dense-AI/scientific-agent-skills");
  await expect(page.locator(".ant-table-row")).toHaveCount(1);
});

test("mobile first-load application code stays below 250 kB compressed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.getByRole("searchbox")).toBeVisible();
  const bytes = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((e) => /\/assets\/.*\.js$/.test(e.name))
      .reduce((n, e) => n + e.encodedBodySize, 0),
  );
  expect(bytes).toBeGreaterThan(0);
  expect(bytes).toBeLessThan(250000);
});
