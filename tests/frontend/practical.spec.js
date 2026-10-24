import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const descriptions = JSON.parse(
  readFileSync(
    new URL("../../config/descriptions.zh.json", import.meta.url),
    "utf8",
  ),
);
const ranking = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
const api =
  "https://api.github.com/repos/RiceAI88/awesome-paper-research-skills/actions/workflows/update-rankings.yml/runs**";
test("practical information, editorial reasons and history provenance are visible", async ({
  page,
}) => {
  await page.route(api, (route) =>
    route.fulfill({ json: { workflow_runs: [] } }),
  );
  await page.goto("./");
  const row = page.locator(".ant-table-row").first();
  await expect(row).toContainText(
    descriptions.entries[ranking.items[0].repo].summary_zh,
  );
  await expect(row.getByText("Claude Code", { exact: true })).toBeVisible();
  await expect(
    row.getByRole("button", { name: "复制安装命令", exact: true }),
  ).toBeVisible();
  await expect(page.locator("[data-featured]")).toHaveCount(4);
  await expect(page.getByTestId("editorial-picks")).toContainText("推荐理由：");
  await expect(page.getByTestId("data-transparency")).toContainText(
    "此前的历史快照继承自原项目",
  );
  await expect(page.getByTestId("update-status")).toContainText("更新状态未知");
  await page
    .getByRole("searchbox")
    .fill("juliaError/econ-TopJournal-writing-Skill");
  await expect(page.locator(".ant-table-row")).toHaveCount(1);
  await expect(page.locator(".ant-table-row")).toContainText("中文简介待补充");
  await expect(
    page
      .locator(".ant-table-row")
      .getByRole("button", { name: "复制安装命令", exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .locator(".ant-table-row")
      .getByRole("link", { name: "安装说明", exact: true }),
  ).toHaveAttribute("href", /github.com/);
  await expect(page.getByTestId("editorial-picks")).toHaveCount(0);
  await page.getByRole("searchbox").fill("paper-craft");
  await expect(page.locator("[data-featured]")).toHaveCount(1);
});
for (const [name, run, kind] of [
  [
    "success",
    {
      status: "completed",
      conclusion: "success",
      run_started_at: "2026-10-24T00:00:00Z",
    },
    "success",
  ],
  ["failure", { status: "completed", conclusion: "failure" }, "failure"],
  ["running", { status: "in_progress" }, "running"],
  [
    "pending sync",
    {
      status: "completed",
      conclusion: "success",
      run_started_at: "2099-01-01T00:00:00Z",
    },
    "publishing",
  ],
  ["invalid", {}, "unknown"],
])
  test(`update status: ${name}`, async ({ page }) => {
    await page.route(api, (route) =>
      route.fulfill({
        json: {
          workflow_runs: [
            {
              id: 123,
              html_url:
                "https://github.com/RiceAI88/awesome-paper-research-skills/actions/runs/123",
              ...run,
            },
          ],
        },
      }),
    );
    await page.goto("./");
    await expect(page.locator(`[data-status="${kind}"]`)).toBeVisible();
    await expect(page.getByTestId("update-status")).toContainText("状态查询于");
  });
test("unavailable API does not report success", async ({ page }) => {
  await page.route(api, (route) =>
    route.fulfill({ status: 403, json: { message: "rate limited" } }),
  );
  await page.goto("./");
  await expect(page.locator('[data-status="unknown"]')).toBeVisible();
});
