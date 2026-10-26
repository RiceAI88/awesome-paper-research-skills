import { test, expect } from "@playwright/test";

for (const [width, view] of [
  [1440, "table"],
  [390, "card"],
]) {
  test(`a single labeled ad stays separate from ranked entries at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`./#view=${view}`);
    const ad = page.getByTestId("zhi1ke-ad");
    await expect(ad).toHaveCount(1);
    await expect(ad).not.toContainText("广告");
    await expect(ad).toContainText("从一个题目，到一篇论文初稿。");
    const link = ad.getByRole("link", { name: /免费生成提纲/ });
    const url = new URL(await link.getAttribute("href"));
    expect(url.origin).toBe("https://zhi1ke.com");
    expect(url.searchParams.get("pic")).toBe("6PEB");
    await expect(link).toHaveAttribute("href", "https://zhi1ke.com?pic=6PEB");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /sponsored/);
    await expect(link).toHaveAttribute("rel", /noopener/);
    await expect(ad.locator("img")).toHaveJSProperty("complete", true);
    expect(
      await ad.locator("img").evaluate((e) => e.naturalWidth),
    ).toBeGreaterThan(0);
    const entries = page.locator(
      view === "table" ? ".ant-table-row" : '[data-testid="repo-card"]',
    );
    await expect(entries).toHaveCount(30);
    const positions = await page.evaluate(() => ({
      heading: document.querySelector(".ranking-header").getBoundingClientRect()
        .bottom,
      adTop: document
        .querySelector('[data-testid="zhi1ke-ad"]')
        .getBoundingClientRect().top,
      adBottom: document
        .querySelector('[data-testid="zhi1ke-ad"]')
        .getBoundingClientRect().bottom,
      first: document
        .querySelector('.ant-table-row, [data-testid="repo-card"]')
        .getBoundingClientRect().top,
    }));
    expect(positions.adTop).toBeGreaterThanOrEqual(positions.heading);
    if (view === "table") expect(positions.adBottom).toBeLessThanOrEqual(positions.first);
    else expect(positions.adTop).toBeGreaterThan(positions.first);
    await page
      .getByRole("searchbox")
      .fill("K-Dense-AI/scientific-agent-skills");
    await expect(entries).toHaveCount(1);
    await expect(ad).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("mobile English dark advertisement stays readable and does not repeat when loading more", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#view=card&lang=en&theme=dark");
  const ad = page.getByTestId("zhi1ke-ad");
  await expect(ad).not.toContainText("Advertisement");
  await expect(
    ad.getByRole("link", { name: /Generate a free outline/ }),
  ).toBeVisible();
  await page.getByTestId("load-more").click();
  await expect(page.getByTestId("repo-card")).toHaveCount(60);
  await expect(ad).toHaveCount(1);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
