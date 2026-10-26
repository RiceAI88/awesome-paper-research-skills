import { test, expect } from "@playwright/test";

for (const [theme, color] of [
  ["light", "rgb(151, 145, 172)"],
  ["dark", "rgb(170, 164, 196)"],
]) {
  test(`search icon uses the softer theme color in ${theme} mode`, async ({
    page,
  }) => {
    await page.goto(`./#view=card&theme=${theme}`);
    await expect(
      page.locator(".hero > .hero-search .ant-input-prefix .anticon"),
    ).toHaveCSS("color", color);
  });
}
for (const width of [1280, 390])
  test(`scroll handoff preserves toolbar height and waits for the full original field at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./#view=card");
    await page.getByTestId("repo-card").first().waitFor();
    const original = page.locator("#searchInput");
    const initial = await original.evaluate(
      (e) => e.getBoundingClientRect().top + scrollY,
    );
    const toolbar = page.locator(".filters");
    const height = await toolbar.evaluate(
      (e) => e.getBoundingClientRect().height,
    );
    await page.evaluate(() => scrollTo({ top: 600, behavior: "instant" }));
    await expect(page.locator(".prs-page")).toHaveClass(/sticky-search-active/);
    expect(
      await toolbar.evaluate((e) => e.getBoundingClientRect().height),
    ).toBeCloseTo(height, 0);
    await page.evaluate(
      (top) => scrollTo({ top: top - 2, behavior: "instant" }),
      initial,
    );
    await expect(page.locator(".prs-page")).toHaveClass(/sticky-search-active/);
    await page.evaluate(
      (top) => scrollTo({ top: top - 12, behavior: "instant" }),
      initial,
    );
    await expect(page.locator(".prs-page")).not.toHaveClass(
      /sticky-search-active/,
    );
    await expect(original).toBeVisible();
    await expect(page.getByRole("searchbox")).toHaveCount(1);
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.keyboard.press("/");
    await expect(original).toBeFocused();
  });
