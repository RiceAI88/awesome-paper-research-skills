import { test, expect } from "@playwright/test";
test("all four charts stay vector when pixel density changes and resize correctly", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#view=table");
  await page.getByRole("link", { name: "数据洞察 ↓", exact: true }).click();
  const charts = page.locator(".plot-host");
  await expect(charts.locator("svg")).toHaveCount(4);
  await expect(charts.locator("canvas")).toHaveCount(0);
  await expect(
    page.getByTestId("insight-trend").locator(".plot-host svg text").first(),
  ).toBeVisible();
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 2,
    mobile: false,
  });
  await expect(charts.locator("svg")).toHaveCount(4);
  await page.setViewportSize({ width: 1100, height: 1000 });
  await expect(charts.locator("canvas")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("ranking mini trends use a filled vector area and an unclipped outline", async ({
  page,
}) => {
  await page.goto("./#view=table");
  const trend = page
    .locator(".ant-table-row")
    .first()
    .locator("svg.mini-area-chart");
  await expect(trend).toBeVisible();
  await expect(trend.locator("[data-area-fill]")).toHaveAttribute(
    "fill-opacity",
    "0.12",
  );
  await expect(trend.locator("polyline")).toHaveAttribute(
    "stroke-width",
    "1.6",
  );
  await expect(trend).toHaveAccessibleName(/Stars/);
});

test("mini areas preserve sparse dates, decreases, and observed start/end values", async ({
  page,
}) => {
  const repo = "K-Dense-AI/scientific-agent-skills";
  await page.route("**/data/history.js*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body:
        "window.ACADEMIC_SKILLS_HISTORY=" +
        JSON.stringify({
          series: {
            [repo]: [
              { date: "2026-08-05", stars: 20 },
              { date: "2026-08-01", stars: 30 },
              { date: "2026-08-02", stars: 10 },
            ],
          },
        }) +
        ";",
    }),
  );
  await page.goto("./#view=table&q=" + encodeURIComponent(repo));
  const chart = page.locator(".ant-table-row svg.mini-area-chart");
  await expect(chart.locator("polyline")).toHaveAttribute(
    "points",
    "3,3 26.5,25 97,14",
  );
  await expect(chart).toHaveAccessibleName(/30 → 20 Stars/);
});
for (const [name, series] of [
  ["empty", []],
  ["single", [{ date: "2026-08-01", stars: 10 }]],
  [
    "flat",
    [
      { date: "2026-08-01", stars: 10 },
      { date: "2026-08-02", stars: 10 },
    ],
  ],
]) {
  test(`mini trend ${name} history does not invent an area or show invalid coordinates`, async ({
    page,
  }) => {
    const repo = "K-Dense-AI/scientific-agent-skills";
    await page.route("**/data/history.js*", (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body:
          "window.ACADEMIC_SKILLS_HISTORY=" +
          JSON.stringify({ series: { [repo]: series } }) +
          ";",
      }),
    );
    await page.goto("./#view=table&q=" + encodeURIComponent(repo));
    const chart = page.locator(".ant-table-row svg.mini-area-chart");
    await expect(chart).toBeVisible();
    expect(await chart.getAttribute("aria-label")).not.toMatch(/NaN|Infinity/);
    if (name === "empty")
      await expect(chart.locator("line")).toHaveAttribute(
        "stroke-dasharray",
        "3 3",
      );
    if (name === "single") {
      await expect(chart.locator("circle")).toHaveAttribute("cx", "50");
      await expect(chart.locator("[data-area-fill]")).toHaveCount(0);
    }
    if (name === "flat")
      await expect(chart.locator("polyline")).toHaveAttribute(
        "points",
        "3,14 97,14",
      );
  });
}
