import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { filterItems, restoreState } from "../../src/domain.js";
const items = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
).items;
const narrowCount = String(
  filterItems(items, {
    ...restoreState(null, "", {}, items),
    query: "Imbad0202/academic-research-skills",
  }).length,
);

async function firstBarPoint(canvas) {
  return canvas.evaluate((element) => {
    const { data } = element
      .getContext("2d")
      .getImageData(0, 0, element.width, element.height);
    for (let y = 0; y < element.height; y++)
      for (let x = 0; x < element.width; x++) {
        const i = (y * element.width + x) * 4;
        if (
          data[i + 3] > 200 &&
          Math.abs(data[i] - 134) < 5 &&
          Math.abs(data[i + 1] - 97) < 5 &&
          Math.abs(data[i + 2] - 120) < 5
        )
          return {
            x: (x * element.clientWidth) / element.width + 5,
            y: (y * element.clientHeight) / element.height + 2,
          };
      }
    return null;
  });
}
test("chart clicks use current results after expanding an initial narrow search", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#q=Imbad0202%2Facademic-research-skills");
  await expect(page.getByTestId("insight-count")).toHaveText(narrowCount);
  await expect(
    page.getByTestId("insight-growth").locator("canvas"),
  ).toHaveCount(1);
  await page.getByRole("searchbox").clear();
  const canvas = page.getByTestId("insight-growth").locator("canvas");
  await canvas.scrollIntoViewIfNeeded();
  await expect.poll(() => firstBarPoint(canvas)).not.toBeNull();
  await canvas.click({ position: await firstBarPoint(canvas) });
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
  await page.goto("./");
  await expect(page.getByRole("searchbox")).toBeVisible();
  await page.waitForTimeout(400);
  expect(requests).toHaveLength(0);
  await page.getByRole("searchbox").fill("Imbad0202/academic-research-skills");
  await page.getByTestId("insights-viewport").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("insight-count")).toHaveText(narrowCount);
  await expect(page.getByTestId("insights").locator("canvas")).toHaveCount(1);
  await page
    .getByRole("button", { name: "展开其他 3 张图", exact: true })
    .click();
  await expect(page.getByTestId("insights").locator("canvas")).toHaveCount(4);
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
  await page.goto("./");
  await expect(page.getByTestId("insights").locator("canvas")).toHaveCount(1);
  await page
    .getByRole("button", { name: "展开其他 3 张图", exact: true })
    .click();
  await expect(page.getByTestId("insights").locator("canvas")).toHaveCount(4);
});
