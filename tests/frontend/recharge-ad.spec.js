import { test, expect } from "@playwright/test";
for (const width of [1280, 390])
  test(`small support card appears at the top once at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("./#view=card");
    const ad = page.getByTestId("gpt-recharge-ad");
    await expect(ad).toHaveCount(1);
    await expect(ad).toContainText("广告");
    await expect(ad).toContainText("自营 GPT / Codex 代充");
    await expect(ad).toContainText("有账单");
    const link = ad.getByRole("link", { name: /支持一下本站/ });
    await expect(link).toHaveAttribute("href", "https://catfk.com/shop/1991");
    await expect(link).toHaveAttribute("rel", /sponsored.*noopener/);
    await expect(link).toHaveAttribute("target", "_blank");
    expect(await ad.evaluate((e) => Boolean(e.closest(".site-header")))).toBe(
      true,
    );
    expect(
      await ad.evaluate((e) => Boolean(e.closest(".ranking-section"))),
    ).toBe(false);
    const box = await ad.boundingBox();
    expect(box.y).toBeLessThan((await page.locator("h1").boundingBox()).y);
    expect(box.width).toBeLessThanOrEqual(280);
    expect(box.height).toBeLessThanOrEqual(80);
    await expect(page.getByTestId("zhi1ke-ad")).toHaveCount(1);
    await page.getByTestId("load-more").click();
    await expect(page.getByTestId("repo-card")).toHaveCount(60);
    await expect(ad).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
test("English dark table retains the ad separately from repository rows", async ({
  page,
}) => {
  await page.goto("./#view=table&lang=en&theme=dark");
  const ad = page.getByTestId("gpt-recharge-ad");
  await expect(ad).toContainText("Advertisement");
  await expect(ad).toContainText("Billing records");
  await expect(page.locator(".ant-table-row")).toHaveCount(30);
  expect(await ad.evaluate((e) => e.closest(".ant-table") === null)).toBe(true);
  await expect(ad.getByRole("link")).toHaveAttribute(
    "href",
    "https://catfk.com/shop/1991",
  );
});

test("English recharge advertisement fits a narrow dark mobile screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("./#view=card&lang=en&theme=dark");
  const ad = page.getByTestId("gpt-recharge-ad");
  await ad.scrollIntoViewIfNeeded();
  await expect(ad).toContainText("Billing records");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
