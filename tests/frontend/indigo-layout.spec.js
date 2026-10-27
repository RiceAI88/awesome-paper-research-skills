import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const data = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
async function fixtureCard(page) {
  const fixture = {
    ...data.items[0],
    repo: "example/paper-skill",
    url: "https://github.com/example/paper-skill",
    description: "Original research skill description.",
    skills_count: 17,
    skills_count_complete: true,
    agents: ["claude-code", "codex", "cursor", "gemini"],
  };
  await page.route("**/data/rankings.js*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.ACADEMIC_SKILLS_RANKINGS=${JSON.stringify({ metadata: data.metadata, items: [fixture] })};`,
    }),
  );
}

test("reference palette, right-hand search and default cards give a compact first screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1160 });
  await page.goto("./");
  await expect(page.getByTestId("repo-card")).toHaveCount(
    Math.min(30, data.items.length),
  );
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(251, 250, 248)",
  );
  const title = await page.locator("h1").boundingBox();
  const search = await page.locator("#searchInput").boundingBox();
  expect(search.x).toBeGreaterThan(title.x + title.width);
  expect(Math.abs(search.y - title.y)).toBeLessThan(80);
  const first = await page.getByTestId("repo-card").first().boundingBox();
  expect(first.y).toBeLessThan(430);
  await expect(page.locator(".task-list [aria-pressed=true]")).toHaveCSS(
    "border-bottom-color",
    "rgb(74, 63, 191)",
  );
  await expect(page.locator(".task-list [aria-pressed=true]")).toHaveCSS(
    "border-top-width",
    "0px",
  );
});

test("cards separate owner and project and put compact metadata on one aligned footer", async ({
  page,
}) => {
  await fixtureCard(page);
  await page.goto("./#view=card");
  const card = page.getByTestId("repo-card").first();
  await expect(card.locator(".repository-owner")).toHaveText("example");
  await expect(card.locator(".repo-title")).toHaveText("paper-skill");
  await expect(card.locator(".card-info-footer")).toContainText("17 skills");
  await expect(card.locator(".card-platforms")).toContainText("+");
  await expect(card.locator(".card-platforms .ant-tag")).toHaveCount(0);
  await card.hover();
  await expect(card.locator("[data-compare]")).toBeVisible();
  await card.locator("[data-compare]").click();
  await expect(page.getByTestId("compare-tray")).toBeVisible();
  await expect(card.locator("[data-compare]")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

for (const width of [1280, 390])
  test(`one full-width advertisement follows the first row at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1160 });
    await page.goto("./#view=card");
    const ad = page.getByTestId("zhi1ke-ad");
    const boxes = await page.getByTestId("repo-card").evaluateAll((es) =>
      es.slice(0, 5).map((e) => {
        const r = e.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      }),
    );
    const firstRow = boxes.filter((r) => Math.abs(r.top - boxes[0].top) < 2);
    const box = await ad.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(
      Math.max(...firstRow.map((r) => r.bottom)),
    );
    expect(box.y + box.height).toBeLessThanOrEqual(boxes[firstRow.length].top);
    await expect(ad).toHaveCSS("background-color", "rgb(240, 238, 251)");
    await expect(ad.getByRole("link")).toHaveAttribute(
      "href",
      "https://zhi1ke.com?pic=6PEB",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("filtered results without editorial picks do not offer an empty beginner path", async ({
  page,
}) => {
  await fixtureCard(page);
  await page.goto("./#view=card");
  await expect(page.getByTestId("repo-card")).toHaveCount(1);
  await expect(page.getByTestId("editorial-picks")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "新手路径", exact: true }),
  ).toHaveCount(0);
});
