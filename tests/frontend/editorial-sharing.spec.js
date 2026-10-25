import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const editorial = JSON.parse(
  readFileSync(new URL("../../config/editorial.json", import.meta.url), "utf8"),
);
const data = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
for (const lang of ["zh", "en"]) {
  test(`${lang} picks expose audience and task with individual documentation evidence`, async ({
    page,
  }) => {
    if (lang === "en") await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(lang === "en" ? "./en/" : "./");
    const picks = page.locator("[data-featured]");
    await expect(picks).toHaveCount(4);
    for (const pick of editorial.featured) {
      const card = page.locator(`[data-featured="${pick.repo}"]`);
      await expect(card.getByTestId("pick-audience")).toBeVisible();
      await expect(card.getByTestId("pick-outcome")).toBeVisible();
      await expect(card.getByTestId("pick-audience")).toContainText(
        pick[`audience_${lang}`],
      );
      await expect(card.getByTestId("pick-outcome")).toContainText(
        pick[`outcome_${lang}`],
      );
      await card.locator("summary").click();
      await expect(card.locator("time")).toHaveAttribute(
        "datetime",
        pick.reviewed_at,
      );
      await expect(
        card.getByRole("link", {
          name:
            lang === "zh" ? "查看推荐依据原文" : "Read recommendation source",
          exact: true,
        }),
      ).toHaveAttribute("href", pick.source_url);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("searchbox").fill("zsyggg/paper-craft-skills");
    await expect(picks).toHaveCount(1);
  });
}
test.describe("metadata works without running application JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const lang of ["zh", "en"])
    test(`${lang} canonical alternatives structured ranking and share image`, async ({
      page,
      request,
    }) => {
      await page.goto(lang === "en" ? "./en/" : "./");
      const root = "https://riceai88.github.io/awesome-paper-research-skills/";
      const canonical = root + (lang === "en" ? "en/" : "");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        canonical,
      );
      await expect(page.locator('link[hreflang="zh-CN"]')).toHaveAttribute(
        "href",
        root,
      );
      await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
        "href",
        root + "en/",
      );
      await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
        "href",
        root,
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        "content",
        canonical,
      );
      await expect(
        page.locator('meta[property="og:image:width"]'),
      ).toHaveAttribute("content", "1200");
      await expect(
        page.locator('meta[property="og:image:height"]'),
      ).toHaveAttribute("content", "630");
      const cover = "og-cover" + (lang === "en" ? "-en" : "") + ".png";
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        root + "assets/" + cover,
      );
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
        "content",
        root + "assets/" + cover,
      );
      const schema = JSON.parse(await page.locator("#ld-json").textContent());
      expect(schema.itemListElement).toHaveLength(20);
      expect(schema.itemListElement[0].name).toBe(data.items[0].repo);
      expect(schema.url).toBe(canonical);
      await expect(page.locator("noscript a")).toHaveCount(20);
      const image = await request.get("./assets/" + cover);
      expect(image.ok()).toBe(true);
      expect(image.headers()["content-type"]).toContain("image/png");
      const bytes = await image.body();
      expect(bytes.readUInt32BE(16)).toBe(1200);
      expect(bytes.readUInt32BE(20)).toBe(630);
    });
});
