import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const catalog = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
const audit = JSON.parse(
  readFileSync(new URL("../../config/editorial.json", import.meta.url), "utf8"),
).installation_audit;
const present = new Set(catalog.items.map((item) => item.repo));
// Audit coverage is a dated snapshot, independent of subsequent daily ranking changes.
const items = audit.repos
  .filter((repo) => present.has(repo))
  .map((repo) => ({ repo }));
for (const lang of ["zh", "en"])
  test(`${lang} reviewed top twenty detail entries show environments dependencies and source snapshots`, async ({
    page,
  }) => {
    for (const item of items) {
      await page.goto(
        (lang === "en" ? "./en/" : "./") +
          "#repo=" +
          encodeURIComponent(item.repo),
      );
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await dialog.locator(".drawer-more > summary").click();
      await expect(dialog.getByTestId("install-environment")).toBeVisible();
      await expect(dialog.getByTestId("install-dependencies")).toBeVisible();
      await expect(
        dialog.getByRole("link", {
          name:
            lang === "zh" ? "核验时的原文快照" : "Source snapshot at review",
          exact: true,
        }),
      ).toHaveAttribute("href", /\/blob\/[a-f0-9]{40}\//);
      await expect(dialog.getByTestId("installation-mode")).not.toHaveText(
        lang === "zh" ? "安装方式待核对" : "Installation not yet reviewed",
      );
    }
  });
test("reference navigation and placeholder-based install instructions do not expose copy commands", async ({
  page,
}) => {
  for (const repo of [
    "hoochanlon/hamuleite",
    "zLanqing/codex-claude-academic-skills",
  ]) {
    await page.goto("./#repo=" + encodeURIComponent(repo));
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("[data-install]")).toHaveCount(0);
    if (repo.includes("hamuleite"))
      await expect(dialog.getByTestId("installation-mode")).toHaveText(
        "资料导航",
      );
  }
});
