import { test, expect } from "@playwright/test";
for (const theme of ["light", "dark"])
  test(`task tabs show underline selection and keyboard focus (${theme})`, async ({
    page,
  }) => {
    await page.addInitScript(
      (value) => localStorage.setItem("ars-theme", value),
      theme,
    );
    await page.goto("./#task=read");
    const button = page.getByRole("button", { name: "找文献", exact: true });
    const selected = page.getByRole("button", { name: "读论文", exact: true });
    const before = await button.boundingBox();
    await button.hover();
    await button.evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations()
          .map((animation) => animation.finished.catch(() => {})),
      );
    });
    await expect(button).toHaveCSS("border-top-width", "0px");
    await expect(button).toHaveCSS("border-left-width", "0px");
    await expect(button).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const after = await button.boundingBox();
    expect(after.width).toBe(before.width);
    expect(after.height).toBe(before.height);
    await expect(selected).toHaveCSS("border-bottom-width", "2px");
    await page
      .getByRole("button", { name: "全部 Skills", exact: true })
      .focus();
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    await expect(button).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/task=find/);
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(button).toHaveCSS("border-bottom-width", "2px");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      )).toBe(true);
  });
