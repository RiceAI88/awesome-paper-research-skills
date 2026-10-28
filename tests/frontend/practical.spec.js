import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
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
  await page.goto("./#related=1&view=table");
  const row = page.locator(".ant-table-row").filter({ hasText: "K-Dense-AI/scientific-agent-skills" });
  await expect(row).toContainText(ranking.items.find(item => item.repo === "K-Dense-AI/scientific-agent-skills").description);
  await expect(row.locator(".card-platforms")).toContainText("Claude Code");
  await expect(
    row.getByRole("button", { name: "复制安装命令", exact: true }),
  ).toBeVisible();
  await expect(page.locator("[data-featured]")).toHaveCount(4);
  await expect(page.getByTestId("editorial-picks")).toContainText("推荐理由：");
  await expect(page.getByTestId("data-transparency")).toContainText(
    "通过 GitHub API 每日自动采集",
  );
  await expect(page.getByTestId("update-status")).toContainText("更新状态未知");
  await page
    .getByRole("searchbox")
    .fill("juliaError/econ-TopJournal-writing-Skill");
  await expect(page.locator(".ant-table-row")).toHaveCount(1);
  await expect(page.locator(".summary-pending")).toHaveCount(0);
  await expect(
    page
      .locator(".ant-table-row")
      .getByRole("button", { name: "复制安装命令", exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .locator(".ant-table-row")
      .getByRole("link", { name: "项目文档", exact: true }),
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
    await page.goto("./#related=1&view=table");
    await expect(page.locator(`[data-status="${kind}"]`)).toHaveCount(1);
    await page.locator(".update-status-summary").hover();
    await expect(page.getByRole("tooltip")).toContainText("状态查询于");
    await expect(page.getByTestId("update-status").locator("time")).toHaveAttribute("title", /UTC\+8/);
  });
test("unavailable API does not report success", async ({ page }) => {
  await page.route(api, (route) =>
    route.fulfill({ status: 403, json: { message: "rate limited" } }),
  );
  await page.goto("./#related=1&view=table");
  await expect(page.locator('[data-status="unknown"]')).toHaveCount(1);
});
