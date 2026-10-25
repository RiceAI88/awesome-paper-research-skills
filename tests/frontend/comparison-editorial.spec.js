import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const data = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
const known = "Yuan1z0825/nature-skills";
const unknown = data.items.find(
  (item) =>
    !JSON.parse(
      readFileSync(
        new URL("../../config/installation-details.json", import.meta.url),
        "utf8",
      ),
    )[item.repo],
);
for (const lang of ["zh", "en"])
  test(`comparison includes practical fields, honest unknowns and maintenance in ${lang}`, async ({
    page,
  }) => {
    const stale = data.items.find((item) => item.stale);
    await page.addInitScript(
      (repos) => localStorage.setItem("ars-compare", JSON.stringify(repos)),
      [known, unknown.repo, stale.repo],
    );
    await page.goto(`./#lang=${lang}`);
    await page.getByTestId("open-compare").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator("[data-compare-field]")).toHaveCount(7);
    await expect(
      dialog.locator('[data-compare-field="installDependencies"]'),
    ).toContainText(lang === "zh" ? "Node.js 18+" : "Node.js 18+");
    await expect(
      dialog.locator('[data-compare-field="installDependencies"]'),
    ).toContainText(lang === "zh" ? "尚未核对" : "Not reviewed");
    await expect(
      dialog.locator('[data-compare-field="compareMaintenance"] .ant-tag-red'),
    ).toBeVisible();
    await expect(dialog.locator('svg[role="img"]')).toBeVisible();
    await expect(dialog).not.toContainText("platformLabel");
    await page.screenshot({
      path: `/tmp/aprs-comparison-${lang}.png`,
      fullPage: false,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    const scroll = dialog.locator(".comparison-scroll");
    expect(await scroll.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await scroll.evaluate((el) => (el.scrollLeft = el.scrollWidth));
    await page.screenshot({ path: `/tmp/aprs-comparison-mobile-${lang}.png` });
  });
test("curated documents expose current state and evidence without altering reviewed dates", async ({
  page,
}) => {
  const report = JSON.parse(
    readFileSync(
      new URL("../../data/editorial-status.json", import.meta.url),
      "utf8",
    ),
  );
  await page.goto("./");
  const card = page.locator(`[data-featured="${known}"]`);
  await expect(card.locator("[data-review-state]").first()).toHaveAttribute(
    "data-review-state",
    report.repos[known].needs_review ? "changed" : "current",
  );
  await card.locator("summary").click();
  if (report.repos[known].needs_review)
    await expect(card.getByRole("link", { name: /查看变更/ })).toHaveAttribute(
      "href",
      /github.com.*compare/,
    );
  const editorial = JSON.parse(
    readFileSync(
      new URL("../../config/editorial.json", import.meta.url),
      "utf8",
    ),
  );
  await expect(
    card.locator(
      `time[datetime="${editorial.featured.find((pick) => pick.repo === known).reviewed_at}"]`,
    ),
  ).toHaveCount(1);
});

test("comparison review snapshot preserves the actual installation document path and anchor", async ({
  page,
}) => {
  const editorial = JSON.parse(
    readFileSync(
      new URL("../../config/editorial.json", import.meta.url),
      "utf8",
    ),
  );
  const details = JSON.parse(
    readFileSync(
      new URL("../../config/installation-details.json", import.meta.url),
      "utf8",
    ),
  );
  const item = data.items.find(
    (item) =>
      details[item.repo]?.source_commit &&
      /\/INSTALL\.md/.test(
        editorial.installations[item.repo]?.source_url || "",
      ),
  );
  expect(item).toBeTruthy();
  await page.addInitScript(
    (repo) => localStorage.setItem("ars-compare", JSON.stringify([repo])),
    item.repo,
  );
  await page.goto("./");
  await page.getByTestId("open-compare").click();
  await expect(
    page.locator('[data-compare-field="docsChecked"] a'),
  ).toHaveAttribute(
    "href",
    editorial.installations[item.repo].source_url.replace(
      /\/blob\/[^/]+\//,
      `/blob/${details[item.repo].source_commit}/`,
    ),
  );
});
