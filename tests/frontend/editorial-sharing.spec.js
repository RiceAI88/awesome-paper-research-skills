import { test, expect } from "./fixtures.js";
import { readFileSync } from "node:fs";
import { filterItems, restoreState } from "../../src/domain.js";
import { createHash } from "node:crypto";
const editorial = JSON.parse(
  readFileSync(new URL("../../config/editorial.json", import.meta.url), "utf8"),
);
const data = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
const defaultItems = filterItems(data.items, restoreState(null,"",{},data.items));
for (const lang of ["zh", "en"]) {
  test(`${lang} picks expose audience and task with individual documentation evidence`, async ({
    page,
  }) => {
    if (lang === "en") await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(lang === "en" ? "./en/" : "./");
    await page.locator("#beginner-paths").scrollIntoViewIfNeeded();
    const picks = page.locator("[data-featured]");
    await expect(picks).toHaveCount(4);
    for (const pick of editorial.featured) {
      const card = page.locator(`[data-featured="${pick.repo}"]`);
      await expect(card.getByTestId("pick-audience")).not.toBeVisible();
      await card.locator("summary").click();
      await expect(card.getByTestId("pick-audience")).toBeVisible();
      await expect(card.getByTestId("pick-outcome")).toBeVisible();
      await expect(card.getByTestId("pick-audience")).toContainText(
        pick[`audience_${lang}`],
      );
      await expect(card.getByTestId("pick-outcome")).toContainText(
        pick[`outcome_${lang}`],
      );
      await expect(card.locator(".editorial-evidence time")).toHaveAttribute(
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
      const brand=lang==="zh" ? "智一刻AI · 科研 Skills 导航" : "Zhiyike AI · Research Skills Directory";
      const title=lang==="zh" ? brand + "｜大学生与研究生科研工具" : brand;
      await expect(page).toHaveTitle(title);
      await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", brand);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content',lang==="zh"?/面向本科生与研究生，按专业和科研任务/:/undergraduate and postgraduate students by discipline and research task/);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content',title);
      await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content',title);
      const filename="og-cover" + (lang === "en" ? "-en" : "") + ".png";
      const version=createHash('sha256').update(readFileSync('dist/assets/'+filename)).digest('hex').slice(0,12);
      const cover=filename+'?v='+version;
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
      expect(schema.itemListElement.map(i=>i.name)).toEqual(defaultItems.slice(0,20).map(i=>i.repo));
      expect(schema.numberOfItems).toBe(defaultItems.length);
      expect(schema.url).toBe(canonical);
      expect(schema.name).toBe(brand);
      expect(schema.description).toMatch(lang === "zh" ? /本科生与研究生/ : /undergraduate and postgraduate students/);
      await expect(page.locator("noscript a")).toHaveCount(20);
      const image = await request.get("./assets/" + cover);
      expect(image.ok()).toBe(true);
      expect(image.headers()["content-type"]).toContain("image/png");
      const bytes = await image.body();
      expect(bytes.readUInt32BE(16)).toBe(1200);
      expect(bytes.readUInt32BE(20)).toBe(630);
    });
});

test("running application preserves the canonical default Skills structured list",async({page})=>{
 await page.goto('./#related=1');
 await expect(page.getByRole('searchbox')).toBeVisible();
 const schema=JSON.parse(await page.locator('#ld-json').textContent());
 expect(schema.itemListElement.map(i=>i.name)).toEqual(defaultItems.slice(0,20).map(i=>i.repo));
 expect(schema.numberOfItems).toBe(defaultItems.length);
});
