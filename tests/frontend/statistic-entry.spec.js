import { test, expect } from "@playwright/test";
import { recentlyUpdatedCount } from "../../src/domain.js";
import { readFileSync } from "node:fs";
const items = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
).items;
const targets = [
  items.length,
  items.reduce((s, i) => s + i.stars, 0),
  items.reduce((s, i) => s + (i.star_delta_7d || 0), 0),
  recentlyUpdatedCount(
    items,
    JSON.parse(
      readFileSync(
        new URL("../../data/rankings.json", import.meta.url),
        "utf8",
      ),
    ).metadata.generated_at,
  ),
];
const readNumbers = (page) =>
  page
    .locator(".statistics .ant-statistic-content")
    .allTextContents()
    .then((texts) => texts.map((t) => Number(t.replace(/[^\d-]/g, ""))));
test("top statistics count up once to real totals and do not replay on filtering or language changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".statistics .ant-statistic-content")).toHaveCount(
    4,
  );
  const initial = await readNumbers(page);
  expect(initial[1]).toBeLessThan(targets[1]);
  await expect.poll(() => readNumbers(page)).toEqual(targets);
  await page.getByRole("button", { name: "读论文", exact: true }).click();
  expect(await readNumbers(page)).toEqual(targets);
  await page.getByText("EN", { exact: true }).click();
  expect(await readNumbers(page)).toEqual(targets);
});
test("reduced motion shows final statistic totals immediately", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".statistics .ant-statistic-content")).toHaveCount(
    4,
  );
  expect(await readNumbers(page)).toEqual(targets);
});
