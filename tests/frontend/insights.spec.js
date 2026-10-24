import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const items = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
).items;
const stale = items.find((item) => item.stale);
test("real charts render, filter by category, change window and open repository details", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await expect(page.getByTestId("insights").locator("canvas")).toHaveCount(4);
  await expect(page.getByTestId("insight-count")).toHaveText(
    String(items.length),
  );
  await page.locator('[data-chart-category="paper-writing"]').click();
  const writing = items.filter((i) => i.category.id === "paper-writing").length;
  await expect(page.locator(".ant-table-row")).toHaveCount(writing);
  await expect(page.getByTestId("insight-count")).toHaveText(String(writing));
  await page.locator('[data-chart-category="paper-writing"]').click();
  await expect(page.getByTestId("insight-count")).toHaveText(
    String(items.length),
  );
  await page.getByRole("combobox", { name: "历史窗口", exact: true }).click();
  await page.locator('.ant-select-item-option[title="30 天"]').click();
  await expect(page.locator(".history-window")).toContainText("30 天");
  await page.locator("[data-growth-repo]").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("searchbox").fill("no-match-insights-000");
  await expect(page.getByTestId("insight-count")).toHaveText("0");
  await expect(page.getByTestId("ranking-empty")).toBeVisible();
  expect(errors).toEqual([]);
});
test("missing historical data has an honest empty state and current charts still work", async ({
  page,
}) => {
  await page.route("**/data/history.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "window.ACADEMIC_SKILLS_HISTORY={series:{}};",
    }),
  );
  await page.goto("./");
  await expect(page.getByTestId("insight-trend")).toContainText("暂无历史数据");
  await expect(
    page.getByTestId("insight-scatter").locator("canvas"),
  ).toHaveCount(1);
});
test("suspected stale repositories have red tags in table, cards and drawer", async ({
  page,
}) => {
  expect(stale).toBeTruthy();
  await page.goto("./#q=" + encodeURIComponent(stale.repo));
  await expect(page.locator(".ant-table-row")).toHaveCount(1);
  await expect(page.getByTestId("stale-tag")).toHaveClass(/ant-tag-red/);
  await page.locator(".ant-table-row").first().locator("td").first().click();
  await expect(page.getByRole("dialog").getByTestId("stale-tag")).toHaveClass(
    /ant-tag-red/,
  );
  await page.keyboard.press("Escape");
  await page.goto("./#view=card&q=" + encodeURIComponent(stale.repo));
  await expect(
    page.getByTestId("repo-card").getByTestId("stale-tag"),
  ).toHaveClass(/ant-tag-red/);
});
test("chart bundle failure leaves ranking usable", async ({ page }) => {
  await page.route("**/assets/Insights-*.js", (route) => route.abort());
  await page.goto("./");
  await expect(page.locator(".chart-unavailable")).toBeVisible();
  await expect(page.locator(".ant-table-row")).toHaveCount(items.length);
  await page.getByRole("searchbox").fill(items[0].repo);
  await expect(page.locator(".ant-table-row")).toHaveCount(1);
});

test("scatter has visible data marks and clicking a point opens details", async ({
  page,
}) => {
  await page.goto("./");
  const canvas = page.getByTestId("insight-scatter").locator("canvas");
  await expect(canvas).toBeVisible();
  async function coloredPoint() {
    return canvas.evaluate((element) => {
      const context = element.getContext("2d");
      if (!context) return null;
      const { data } = context.getImageData(
        0,
        0,
        element.width,
        element.height,
      );
      const palette = [
        "866178",
        "B47C7D",
        "C88D85",
        "A99AAB",
        "AAA09C",
        "C7B8B2",
      ].map((hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)));
      let found = null,
        count = 0;
      for (let y = 0; y < element.height; y++)
        for (let x = 0; x < element.width; x++) {
          const i = (y * element.width + x) * 4;
          if (
            data[i + 3] > 100 &&
            palette.some((rgb) =>
              rgb.every((v, j) => Math.abs(v - data[i + j]) < 10),
            )
          ) {
            count++;
            if (!found)
              found = {
                x: (x * element.clientWidth) / element.width,
                y: (y * element.clientHeight) / element.height,
              };
          }
        }
      return count > 100 ? found : null;
    });
  }
  await expect.poll(coloredPoint).not.toBeNull();
  const point = await coloredPoint();
  await canvas.click({ position: { x: point.x, y: point.y + 2 } });
  await expect(page.getByRole("dialog")).toBeVisible();
});
