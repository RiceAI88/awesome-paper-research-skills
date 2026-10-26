import { test, expect } from "@playwright/test";
for (const width of [1280, 390])
  test(`self-operated recharge ad follows item twelve once at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("./#view=card");
    const ad = page.getByTestId("gpt-recharge-ad");
    await expect(ad).toHaveCount(1);
    await expect(ad).toContainText("广告");
    await expect(ad).toContainText("自营 GPT / Codex 代充");
    await expect(ad).toContainText("可提供充值账单");
    const link = ad.getByRole("link", { name: /查看代充服务/ });
    await expect(link).toHaveAttribute("href", "https://catfk.com/shop/1991");
    await expect(link).toHaveAttribute("rel", /sponsored.*noopener/);
    await expect(link).toHaveAttribute("target", "_blank");
    const order = await ad.evaluate((e) => ({
      before: e.previousElementSibling?.getAttribute("data-testid"),
      next: e.nextElementSibling?.getAttribute("data-testid"),
      cardsBefore: [...e.parentElement.children]
        .slice(0, [...e.parentElement.children].indexOf(e))
        .filter((el) => el.getAttribute("data-testid") === "repo-card").length,
    }));
    expect(order).toEqual({
      before: "repo-card",
      next: "repo-card",
      cardsBefore: 12,
    });
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
  await expect(ad).toContainText("Billing records available");
  await expect(page.locator(".ant-table-row")).toHaveCount(30);
  expect(await ad.evaluate((e) => e.closest(".ant-table") === null)).toBe(true);
  await expect(ad.getByRole("link")).toHaveAttribute(
    "href",
    "https://catfk.com/shop/1991",
  );
});

test('English recharge advertisement fits a narrow dark mobile screen', async ({page}) => {
  await page.setViewportSize({width:320,height:844});
  await page.goto('./#view=card&lang=en&theme=dark');
  const ad=page.getByTestId('gpt-recharge-ad');
  await ad.scrollIntoViewIfNeeded();
  await expect(ad).toContainText('Billing records available');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
