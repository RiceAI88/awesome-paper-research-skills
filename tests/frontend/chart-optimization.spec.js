import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { filterItems, restoreState } from "../../src/domain.js";
const items = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
).items.filter((item) => ["skill", "related"].includes(item.repository_kind));
const narrowCount = String(
  filterItems(items, {
    ...restoreState(null, "#related=1", {}, items),
    query: "Imbad0202/academic-research-skills",
  }).length,
);

test("chart clicks use current results after expanding an initial narrow search", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#related=1&view=table&q=Imbad0202%2Facademic-research-skills");
  await page.getByRole("tab", { name: "数据洞察", exact: true }).click();
  await expect(page.getByTestId("insight-count")).toHaveText(narrowCount);
  await expect(
    page.getByTestId("insight-growth").locator(".plot-host svg"),
  ).toHaveCount(1);
  await page.getByRole("searchbox").clear();
  await expect(page.locator(".ant-table-row")).toHaveCount(Math.min(30, items.length));
  await page.getByRole("tab", { name: "数据洞察", exact: true }).click();
  await expect(page.getByTestId("insight-count")).toHaveText(
    String(items.length),
  );
  const marks = page
    .getByTestId("insight-growth")
    .locator(".plot-host svg .element");
  await expect(marks).toHaveCount(5);
  // G2 reuses SVG nodes; DOM order need not match the displayed bar order.
  const topIndex = await marks.evaluateAll(
    (elements) =>
      elements
        .map((element, index) => ({
          index,
          top: element.getBoundingClientRect().top,
        }))
        .sort((a, b) => a.top - b.top)[0].index,
  );
  await marks.nth(topIndex).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(
    "K-Dense-AI/scientific-agent-skills",
  );
});
test("offscreen charts defer download, then load once with the latest selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requests = [];
  page.on("request", (request) => {
    if (/\/assets\/Insights-[^/]+\.js/.test(request.url()))
      requests.push(request.url());
  });
  await page.goto("./#related=1&view=table");
  await expect(page.getByRole("searchbox")).toBeVisible();
  await page.waitForTimeout(400);
  expect(requests).toHaveLength(0);
  await page.getByRole("searchbox").fill("Imbad0202/academic-research-skills");
  await page.getByRole("tab", {name:"数据洞察",exact:true}).click();
  await expect(page.getByTestId("insight-count")).toHaveText(narrowCount);
  await expect(
    page.getByTestId("insights").locator(".plot-host svg"),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "展开其他 2 张图", exact: true })
    .click();
  await expect(
    page.getByTestId("insights").locator(".plot-host svg"),
  ).toHaveCount(4);
  expect(requests).toHaveLength(1);
  await page.getByRole("combobox", { name: "历史窗口", exact: true }).click();
  await page.locator('.ant-select-item-option[title="30 天"]').click();
  await page.getByRole("searchbox").scrollIntoViewIfNeeded();
  await page.getByTestId("insights-viewport").scrollIntoViewIfNeeded();
  await expect(page.locator(".history-window")).toContainText("30 天");
  expect(requests).toHaveLength(1);
});

test("browsers without IntersectionObserver still show functional charts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.addInitScript(() => {
    window.IntersectionObserver = undefined;
  });
  await page.goto("./#related=1&view=table&section=insights");
  await expect(
    page.getByTestId("insights").locator(".plot-host svg"),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "展开其他 2 张图", exact: true })
    .click();
  await expect(
    page.getByTestId("insights").locator(".plot-host svg"),
  ).toHaveCount(4);
});
