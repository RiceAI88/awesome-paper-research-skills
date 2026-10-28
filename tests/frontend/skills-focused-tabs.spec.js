import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const data = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
const skills = data.items.filter((i) => i.repository_kind === "skill");
test("fresh scope, medals, original descriptions and related switch rerank together", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator('[data-task="all"]')).toContainText(
    String(skills.length),
  );
  await expect(page.getByTestId("include-related")).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await expect(page.locator("#categoryFilter")).toHaveCount(0);
  const cards = page.getByTestId("repo-card");
  await expect(cards.first().locator(".card-rank")).toHaveText("01");
  await expect(cards.first().locator(".card-rank")).toHaveClass(/medal-1/);
  await expect(cards.nth(1).locator(".card-rank")).toHaveClass(/medal-2/);
  await expect(cards.nth(2).locator(".card-rank")).toHaveClass(/medal-3/);
  await expect(cards.first().locator(".repo-title")).toContainText(
    skills[0].repo.split("/")[1],
  );
  await page.getByTestId("include-related").click();
  await expect(page.locator('[data-task="all"]')).toContainText(
    String(
      data.items.filter((i) => ["skill", "related"].includes(i.repository_kind))
        .length,
    ),
  );
  await expect(cards.first().locator(".repo-title")).toContainText(
    data.items[0].repo.split("/")[1],
  );
  await page.reload();
  await expect(page.getByTestId("include-related")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.getByTestId("include-related").click();
  await expect(cards.first().locator(".repo-title")).toContainText(
    skills[0].repo.split("/")[1],
  );
});
test("insights is a peer tab, lazy SVG charts share scene counts and filters", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  expect(requests.some((url) => /assets\/Insights-/.test(url))).toBe(false);
  await page.getByRole("tab", { name: "数据洞察", exact: true }).click();
  await expect(
    page.getByTestId("insights").locator(".plot-host svg"),
  ).toHaveCount(4);
  await expect(page.locator("#panel-ranking")).not.toBeVisible();
  const button = page.locator('[data-chart-category="write"]');
  await button.focus();
  await button.press("Enter");
  await expect(page.locator('[data-task="write"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page).toHaveURL(/task=write/);
  const count = await page
    .locator('[data-task="write"] .task-count')
    .textContent();
  await expect(page.getByTestId("insight-count")).toHaveText(count.trim());
  await page.reload();
  await expect(
    page.getByRole("tab", { name: "数据洞察", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("insights")).toBeVisible();
  expect(errors).toEqual([]);
});
test("daily and weekly restrictions remain visible and removable on the insights tab", async ({
  page,
}) => {
  await page.goto("./#section=insights&today=skill");
  await expect(page.getByTestId("active-filters")).toBeVisible();
  await expect(page.locator('[data-filter-key="todayOnly"]')).toBeVisible();
  await page.getByRole("button", { name: "清空筛选", exact: true }).click();
  await expect(page).not.toHaveURL(/today=/);
  await expect(page.getByTestId("insight-count")).toHaveText(
    String(skills.length),
  );
});
test("overview is collapsed and scenes remain clickable alongside sticky search", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("#data-overview")).not.toBeVisible();
  await page.getByRole("button", { name: "数据概览", exact: false }).click();
  await expect(page.locator("#data-overview")).toBeVisible();
  await page.getByRole("button", { name: "数据概览", exact: false }).click();
  await page.evaluate(() => scrollTo(0, 850));
  await expect(page.locator("#stickySearchInput")).toBeVisible();
  await expect(page.locator(".task-list")).toBeVisible();
  await page.locator('[data-task="write"]').click();
  await expect(page.locator('[data-task="write"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator("#stickySearchInput").fill("no-such-repo-123456");
  await expect(page.getByTestId("ranking-empty")).toBeVisible();
});
test("arrivals are a purple dot with tooltip, zero growth is a dash and 90-day status is factual", async ({
  page,
}) => {
  const now = "2026-10-28T03:00:00Z";
  await page.clock.setFixedTime(new Date(now));
  const item = {
    ...data.items[0],
    repository_kind: "skill",
    skills_count: 1,
    star_delta_7d: 0,
    first_seen_at: now,
    first_seen_is_baseline: false,
    last_push_date: "2026-07-01",
    stale: true,
  };
  await page.route("**/data/rankings.js*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.ACADEMIC_SKILLS_RANKINGS=${JSON.stringify({ metadata: { ...data.metadata, generated_at: now }, items: [item, { ...item, repo: "test/recent-skill", url: "https://github.com/test/recent-skill", last_push_date: "2026-10-20", first_seen_is_baseline: true }] })};`,
    }),
  );
  await page.goto("./");
  const card = page.getByTestId("repo-card").first();
  await expect(card.locator(".daily-new-badge")).toHaveCount(0);
  await expect(card.locator(".arrival-dot")).toHaveCount(1);
  await card.locator(".arrival-dot").focus();
  await expect(page.getByRole("tooltip")).toContainText("今日新收录");
  await expect(card.locator(".card-growth strong")).toHaveText("—");
  await expect(card.locator(".card-maintenance")).toHaveText("90 天未更新");
  await expect(card.locator(".ant-tag-red")).toHaveCount(0);
  const recent = page.getByTestId("repo-card").nth(1);
  await expect(recent.locator(".card-maintenance")).toHaveCount(0);
  await expect
    .poll(async () => {
      const top = (await card.locator(".card-info-footer").boundingBox()).y;
      return Math.abs(
        (await recent.locator(".card-info-footer").boundingBox()).y - top,
      );
    })
    .toBeLessThan(2);
});
for (const lang of ["zh", "en"])
  test(`320px ${lang} pinned controls and both tabs have no overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(`./#lang=${lang}`);
    await page.evaluate(() => scrollTo(0, 900));
    await expect(page.locator("#stickySearchInput")).toBeVisible();
    await expect(page.locator(".task-list")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(320);
    await page.evaluate(() => scrollTo(0, 0));
    await page.getByRole("tab").nth(1).click();
    await expect(page.getByTestId("insights")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(320);
  });
