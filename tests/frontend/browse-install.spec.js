import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const data = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
const commandRepo = "K-Dense-AI/scientific-agent-skills";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    window.__copied = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text) => window.__copied.push(text) },
    });
  });
});

test("dense table bounds scenes, omits empty tags and supports header sorting", async ({
  page,
}) => {
  await page.goto("./#view=table");
  const rows = page.locator(".ant-table-row");
  await expect(rows).toHaveCount(30);
  const heights = await rows.evaluateAll((nodes) =>
    nodes.slice(0, 8).map((node) => node.getBoundingClientRect().height),
  );
  expect(Math.max(...heights)).toBeLessThanOrEqual(64);
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(56);
  await expect(
    page.getByRole("columnheader", { name: "场景", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".scene-tags .ant-tag").filter({ hasText: /^—$/ }),
  ).toHaveCount(0);
  const multiple = rows.filter({
    hasText: "Auto-claude-code-research-in-sleep",
  });
  await expect(multiple.locator(".scene-overflow")).toContainText("+");
  expect(
    await multiple
      .locator(".scene-tags")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page
    .getByRole("button", { name: "按近 7 日增量排序", exact: true })
    .click();
  await expect(page).toHaveURL(/sort=delta7/);
  await page
    .getByRole("button", { name: "按 Stars 排序", exact: true })
    .click();
  await expect(page).toHaveURL(/sort=stars/);
});

test("cards expose install mode and copy, keep actions visible and maintenance inside footer", async ({
  page,
}) => {
  await page.goto("./#view=card");
  const card = page
    .getByTestId("repo-card")
    .filter({ hasText: commandRepo.split("/")[1] })
    .first();
  await expect(card.getByTestId("installation-mode")).toHaveText("命令安装");
  expect(
    await card
      .locator(".card-actions")
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe("1");
  await card.getByRole("button", { name: "复制安装命令", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => window.__copied.at(-1))).toContain(
    "npx skills add",
  );
  const stale = data.items.find(
    (item) =>
      item.repository_kind === "skill" &&
      Date.parse(data.metadata.generated_at) -
        Date.parse(item.last_push_date) >=
        90 * 86400000,
  );
  await page.getByRole("searchbox").fill(stale.repo);
  const footer = page.getByTestId("repo-card").locator(".card-info-footer");
  await expect(footer.locator(".card-maintenance")).toContainText(
    "90 天未更新",
  );
  await expect(footer.locator(".card-project-type")).toHaveCount(0);
  const single = data.items.find(
    (item) =>
      item.repository_kind === "skill" &&
      item.skills_count === 1 &&
      Date.parse(data.metadata.generated_at) - Date.parse(item.last_push_date) <
        90 * 86400000,
  );
  await page.getByRole("searchbox").fill(single.repo);
  await expect(page.locator(".card-project-type")).toHaveText("1 skill");
});

test("drawer prioritizes installation with adjacent copy and a single primary action", async ({
  page,
}) => {
  await page.goto("./#repo=" + encodeURIComponent(commandRepo));
  const drawer = page.getByRole("dialog");
  await expect(
    drawer.locator(".install-command-block [data-install]"),
  ).toBeVisible();
  const order = await drawer.evaluate((el) =>
    [
      ".practical-description",
      ".drawer-platforms",
      ".install-command-block",
      ".drawer-health",
    ].map((selector) => el.querySelector(selector).getBoundingClientRect().top),
  );
  expect(order).toEqual([...order].sort((a, b) => a - b));
  await expect(drawer.locator(".drawer-health")).toContainText("最近提交");
  await expect(drawer.locator(".drawer-health")).toContainText("许可证");
  await expect(drawer.locator(".ant-btn-primary")).toHaveCount(1);
  await expect(drawer.getByTestId("install-environment")).not.toBeVisible();
  await drawer.locator(".drawer-more > summary").click();
  await expect(drawer.getByTestId("install-environment")).toBeVisible();
  await drawer.locator(".install-command-block [data-install]").click();
  expect(await page.evaluate(() => window.__copied.at(-1))).toContain(
    commandRepo,
  );
  const more = drawer.locator(".drawer-more-actions");
  await more.locator("summary").click();
  await expect(
    more.getByRole("link", { name: "反馈信息问题" }),
  ).toHaveAttribute("href", /issues\/new/);
  await more.getByRole("button", { name: "复制为 Markdown" }).click();
  expect(await page.evaluate(() => window.__copied.at(-1))).toContain("| 1 |");
});

test("review time uses relative wording and a Shanghai precision tooltip", async ({
  page,
}) => {
  await page.goto("./#repo=" + encodeURIComponent("openags/paper-search-mcp"));
  const drawer = page.getByRole("dialog");
  await drawer.locator(".drawer-more > summary").click();
  const stamp = drawer.locator(".editorial-review-notice time");
  await expect(stamp).toHaveAttribute("title", /UTC\+8/);
  await expect(stamp).not.toContainText(/UTC|\d{2}:\d{2}:\d{2}/);
  await expect(stamp).toContainText("核对");
});

test("scope and sorting remain clear without duplicate single-filter chips", async ({
  page,
}) => {
  await page.goto("./#task=find");
  await expect(page.getByTestId("active-filters")).toHaveCount(0);
  await expect(page.getByTestId("daily-arrivals")).toContainText("全站");
  expect(
    await page
      .locator(".ranking-header h2")
      .evaluate((el) => getComputedStyle(el).position),
  ).toBe("absolute");
  await page.locator("#agentFilter").click();
  await page
    .locator(".ant-select-item-option")
    .filter({ hasText: /^Codex$/ })
    .click();
  await expect(
    page.getByTestId("active-filters").locator("[data-filter-key]"),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "上升最快", exact: true }).click();
  await expect(page).toHaveURL(/sort=delta7/);
  await page.getByRole("button", { name: "最新收录", exact: true }).click();
  await expect(page).toHaveURL(/sort=newest/);
  await page.reload();
  await expect(page).toHaveURL(/sort=newest/);
});

for (const [view, count] of [
  ["card", 8],
  ["table", 8],
])
  test(`${view} sponsorship follows two rows and support is labelled`, async ({
    page,
  }) => {
    await page.goto(`./#view=${view}`);
    await expect(page.getByTestId("gpt-recharge-ad")).toContainText("广告");
    const ad = page.getByTestId("zhi1ke-ad");
    await expect(ad).toHaveCount(1);
    const result = await page.evaluate((view) => {
      const ad = document
        .querySelector('[data-testid="zhi1ke-ad"]')
        .getBoundingClientRect();
      return [
        ...document.querySelectorAll(
          view === "card" ? '[data-testid="repo-card"]' : ".ant-table-row",
        ),
      ].filter((el) => el.getBoundingClientRect().bottom <= ad.top).length;
    }, view);
    expect(result).toBe(count);
    await page.getByTestId("load-more").click();
    await expect(ad).toHaveCount(1);
  });

for (const lang of ["zh", "en"])
  test(`mobile ${lang} drawer and controls stay usable in dark mode`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(
      `./#lang=${lang}&theme=dark&repo=${encodeURIComponent(commandRepo)}`,
    );
    await expect(
      page.getByRole("dialog").locator(".install-command-block [data-install]"),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .getByRole("dialog")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
  });

for (const width of [1440, 390])
  test(`English installation labels never overlap copy controls at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      "./#lang=en&view=table&q=" + encodeURIComponent(commandRepo),
    );
    const row = page.locator(".ant-table-row");
    await expect(row).toHaveCount(1);
    const geometry = await row
      .locator(".installation-inline")
      .evaluate((el) => {
        const tag = el.querySelector(".install-mode").getBoundingClientRect();
        const button = el
          .querySelector("[data-install]")
          .getBoundingClientRect();
        const status = el
          .querySelector(".installation-status")
          .getBoundingClientRect();
        return {
          tagRight: tag.right,
          buttonLeft: button.left,
          tagWidth: tag.width,
          statusWidth: status.width,
        };
      });
    expect(geometry.tagRight).toBeLessThanOrEqual(geometry.buttonLeft);
    expect(geometry.tagWidth).toBeLessThanOrEqual(geometry.statusWidth);
  });
