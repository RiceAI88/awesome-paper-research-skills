import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const content = JSON.parse(
  readFileSync(new URL("../../config/editorial.json", import.meta.url), "utf8"),
);
const data = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
test("installation expectations and original command source are visible in list and details", async ({
  page,
}) => {
  await page.goto("./#related=1&view=table&q=K-Dense-AI%2Fscientific-agent-skills");
  const row = page.locator(".ant-table-row");
  await expect(row.getByTestId("installation-mode")).toHaveText("命令安装");
  await row.locator("td").first().click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByTestId("installation-mode")).toHaveText("命令安装");
  await expect(drawer.locator(".install-command")).toHaveText(
    "npx skills add K-Dense-AI/scientific-agent-skills",
  );
  await expect(drawer).toContainText("2026-10-25");
  await expect(
    drawer.getByRole("link", { name: "安装说明", exact: true }),
  ).toHaveAttribute(
    "href",
    /K-Dense-AI\/scientific-agent-skills\/blob\/main\/README.md/,
  );
  await page.goto("./#related=1&view=table&q=OpenNSWM-Lab%2FFAROS");
  await expect(
    page.locator(".ant-table-row").getByTestId("installation-mode"),
  ).toHaveText("需手动配置");
  const unknown = data.items.find((i) => !content.installations[i.repo]);
  await page.goto("./#related=1&q=" + encodeURIComponent(unknown.repo) + "&view=card");
  const card = page.getByTestId("repo-card").filter({
    has: page.getByRole("button", {name: unknown.repo, exact: true}),
  });
  await card.locator(".repo-title").click();
  const compactDetails = page.getByRole("dialog");
  await expect(compactDetails.getByTestId("installation-mode")).toHaveText(
    "安装方式待核对",
  );
  await expect(
    compactDetails.getByRole("link", { name: "项目文档", exact: true }),
  ).toHaveAttribute("href", unknown.url + "#readme");
  await expect(compactDetails.locator("[data-install]")).toHaveCount(0);
});
test("each active restriction can be removed independently without changing other state", async ({
  page,
}) => {
  await page.goto(
    "./#related=1&q=impossible-query&task=read&cat=paper-writing&agent=codex&fav=1&sort=updated&view=card",
  );
  const bar = page.getByTestId("active-filters");
  await expect(bar.locator("[data-filter-key]")).toHaveCount(4);
  await bar.getByRole("button", { name: "移除：读论文", exact: true }).click();
  await expect(page).not.toHaveURL(/task=read/);
  await expect(page).not.toHaveURL(/cat=/);
  await expect(page).toHaveURL(/q=impossible-query/);
  await expect(page).toHaveURL(/fav=1/);
  await bar.getByRole("button", { name: "移除：Codex", exact: true }).click();
  await expect(page).not.toHaveURL(/agent=codex/);
  await bar
    .getByRole("button", { name: "移除：仅看收藏", exact: true })
    .click();
  await expect(page).not.toHaveURL(/fav=1/);
  await expect(bar.locator("[data-filter-key]")).toHaveCount(1);
  await expect(page).toHaveURL(/sort=updated/);
  await expect(page).toHaveURL(/view=card/);
});
test("empty results recover by clearing restrictions while preserving saved favorites and display settings", async ({
  page,
}) => {
  await page.goto("./#related=1&view=table");
  const favorite = page
    .locator(".ant-table-row")
    .first()
    .getByRole("button", { name: /^收藏 / });
  await favorite.click();
  await page.getByRole("searchbox").fill("no-results-xyz");
  await page.getByTestId("favorites-only").click();
  await expect(page.getByTestId("ranking-empty")).toBeVisible();
  const bar = page.getByTestId("active-filters");
  await expect(bar).toContainText("移除部分条件");
  await bar.getByRole("button", { name: "清空筛选", exact: true }).click();
  await expect(page.locator(".ant-table-row")).toHaveCount(Math.min(30, data.items.length));
  await expect(page.getByTestId("active-filters")).toHaveCount(0);
  await expect(favorite).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("favorites-only")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});
test("English mobile filters wrap and clear keeps sort and card view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    "./en/#related=1&q=long-search-query-without-results&agent=codex&task=read&sort=updated&view=card",
  );
  const bar = page.getByTestId("active-filters");
  await expect(bar).toContainText("Current filters");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await bar.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(page.getByTestId("repo-card")).toHaveCount(Math.min(30, data.items.length));
  await expect(page).toHaveURL(/sort=updated/);
  await expect(page).toHaveURL(/view=card/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
